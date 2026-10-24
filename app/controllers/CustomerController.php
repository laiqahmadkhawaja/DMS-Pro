<?php
/**
 * Customer & Retail Account Controller
 */

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Permissions;
use App\Core\Request;
use App\Core\Response;
use PDO;

class CustomerController {
    public function index(Request $request): void {
        Permissions::require('customers', 'view');
        $db = Database::getConnection();

        $route = trim($request->query('route', ''));
        $search = trim($request->query('q', ''));
        $activeOnly = $request->query('active_only', '1');

        $sql = "SELECT * FROM customers WHERE 1=1";
        $params = [];

        if ($activeOnly === '1') {
            $sql .= " AND active = 1";
        }
        if (!empty($route)) {
            $sql .= " AND territory_route = ?";
            $params[] = $route;
        }
        if (!empty($search)) {
            $sql .= " AND (shop_name LIKE ? OR owner_name LIKE ? OR code LIKE ? OR phone LIKE ?)";
            $term = "%{$search}%";
            $params[] = $term;
            $params[] = $term;
            $params[] = $term;
            $params[] = $term;
        }

        $sql .= " ORDER BY shop_name ASC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $customers = $stmt->fetchAll();

        foreach ($customers as &$c) {
            $c['credit_limit'] = (float)($c['credit_limit_paisa'] / 100);
            $c['current_balance'] = (float)($c['current_balance_paisa'] / 100);
            $c['available_credit'] = max(0, $c['credit_limit'] - $c['current_balance']);
            $c['credit_utilization_pct'] = $c['credit_limit'] > 0 ? round(($c['current_balance'] / $c['credit_limit']) * 100, 1) : 0;
            $c['is_credit_warning'] = $c['credit_utilization_pct'] >= 90;
        }

        Response::json($customers);
    }

    public function store(Request $request): void {
        Permissions::require('customers', 'create');
        $db = Database::getConnection();

        $shop = trim($request->input('shop_name', ''));
        $owner = trim($request->input('owner_name', ''));
        $phone = trim($request->input('phone', ''));
        $address = trim($request->input('address', ''));
        $route = trim($request->input('territory_route', 'North Route (Commercial)'));
        $limit = (float)$request->input('credit_limit', 50000);
        $terms = (int)$request->input('payment_terms_days', 15);

        if (empty($shop) || empty($owner)) {
            Response::error('Shop name and owner contact name are required.', 422);
        }

        $id = 'CUST-' . rand(1000, 9999);
        $code = 'RET-' . strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $route), 0, 1)) . rand(100, 999);
        $limitPaisa = (int)round($limit * 100);

        $user = Auth::user();

        $stmt = $db->prepare("
            INSERT INTO customers (id, code, shop_name, owner_name, phone, address, territory_route, assigned_sales_rep_id, credit_limit_paisa, current_balance_paisa, payment_terms_days, active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 1)
        ");
        $stmt->execute([$id, $code, $shop, $owner, $phone, $address, $route, $user['uid'] ?? null, $limitPaisa, $terms]);

        Response::json(['id' => $id, 'code' => $code, 'shop_name' => $shop], 201, 'Customer onboarded successfully.');
    }

    public function update(Request $request, array $params): void {
        Permissions::require('customers', 'edit');
        $id = $params['id'] ?? '';
        $db = Database::getConnection();

        $cust = $db->prepare("SELECT * FROM customers WHERE id = ?");
        $cust->execute([$id]);
        $existing = $cust->fetch();
        if (!$existing) {
            Response::error('Customer not found.', 404);
        }

        $shop = trim($request->input('shop_name', $existing['shop_name']));
        $owner = trim($request->input('owner_name', $existing['owner_name']));
        $phone = trim($request->input('phone', $existing['phone']));
        $address = trim($request->input('address', $existing['address']));
        $route = trim($request->input('territory_route', $existing['territory_route']));
        $terms = (int)$request->input('payment_terms_days', $existing['payment_terms_days']);
        $active = $request->input('active', $existing['active']);

        $limitInput = $request->input('credit_limit');
        $limitPaisa = $limitInput !== null ? (int)round((float)$limitInput * 100) : $existing['credit_limit_paisa'];

        $stmt = $db->prepare("
            UPDATE customers 
            SET shop_name = ?, owner_name = ?, phone = ?, address = ?, territory_route = ?, credit_limit_paisa = ?, payment_terms_days = ?, active = ?
            WHERE id = ?
        ");
        $stmt->execute([$shop, $owner, $phone, $address, $route, $limitPaisa, $terms, (int)$active, $id]);

        Response::json(null, 200, 'Customer details updated successfully.');
    }

    public function ledger(Request $request, array $params): void {
        Permissions::require('customer_ledger', 'view');
        $id = $params['id'] ?? '';
        $db = Database::getConnection();

        $cust = $db->prepare("SELECT * FROM customers WHERE id = ?");
        $cust->execute([$id]);
        $customer = $cust->fetch();
        if (!$customer) {
            Response::error('Customer not found.', 404);
        }

        $stmt = $db->prepare("
            SELECT * FROM customer_ledger 
            WHERE customer_id = ? 
            ORDER BY created_at ASC, id ASC
        ");
        $stmt->execute([$id]);
        $entries = $stmt->fetchAll();

        foreach ($entries as &$e) {
            $e['debit'] = (float)($e['debit_paisa'] / 100);
            $e['credit'] = (float)($e['credit_paisa'] / 100);
            $e['balance'] = (float)($e['balance_paisa'] / 100);
        }

        Response::json([
            'customer' => [
                'id' => $customer['id'],
                'code' => $customer['code'],
                'shop_name' => $customer['shop_name'],
                'owner_name' => $customer['owner_name'],
                'phone' => $customer['phone'],
                'address' => $customer['address'] ?? '',
                'territory_route' => $customer['territory_route'] ?? '',
                'current_balance' => (float)($customer['current_balance_paisa'] / 100),
                'credit_limit' => (float)($customer['credit_limit_paisa'] / 100),
                'available_credit' => max(0, (float)($customer['credit_limit_paisa'] - $customer['current_balance_paisa']) / 100),
            ],
            'entries'  => $entries
        ]);
    }

    public function destroy(Request $request, array $params): void {
        Permissions::require('customers', 'delete');
        $id = $params['id'] ?? '';
        $db = Database::getConnection();

        $cust = $db->prepare("SELECT active FROM customers WHERE id = ?");
        $cust->execute([$id]);
        $existing = $cust->fetch();
        if (!$existing) {
            Response::error('Customer not found.', 404);
        }

        $newActive = $existing['active'] ? 0 : 1;
        $db->prepare("UPDATE customers SET active = ? WHERE id = ?")->execute([$newActive, $id]);

        $msg = $newActive ? 'Customer activated.' : 'Customer archived.';
        Response::json(['active' => $newActive], 200, $msg);
    }
}
