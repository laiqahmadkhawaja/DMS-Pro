<?php
/**
 * Analytics & Reports Controller
 */

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Permissions;
use App\Core\Request;
use App\Core\Response;
use PDO;

class ReportController {
    public function dashboard(Request $request): void {
        Permissions::require('dashboard', 'view');
        $db = Database::getConnection();

        // 1. KPI Summaries
        $salesToday = $db->query("SELECT COALESCE(SUM(total_paisa), 0) FROM orders WHERE DATE(created_at) = CURRENT_DATE AND status != 'cancelled'")->fetchColumn();
        $salesMonth = $db->query("SELECT COALESCE(SUM(total_paisa), 0) FROM orders WHERE MONTH(created_at) = MONTH(CURRENT_DATE) AND YEAR(created_at) = YEAR(CURRENT_DATE) AND status != 'cancelled'")->fetchColumn();
        $ordersCount = $db->query("SELECT COUNT(*) FROM orders WHERE status != 'cancelled'")->fetchColumn();
        $pendingDispatches = $db->query("SELECT COUNT(*) FROM orders WHERE status IN ('submitted', 'approved')")->fetchColumn();
        $receivables = $db->query("SELECT COALESCE(SUM(current_balance_paisa), 0) FROM customers")->fetchColumn();
        $lowStock = $db->query("SELECT COUNT(*) FROM products WHERE current_stock <= min_stock_level AND active = 1")->fetchColumn();

        // Expiry alerts
        $nearExpiryCount = (int)$db->query("
            SELECT COUNT(*) FROM products 
            WHERE active = 1 AND expiry_date IS NOT NULL 
              AND expiry_date >= CURRENT_DATE 
              AND expiry_date <= DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY)
        ")->fetchColumn();

        $expiredCount = (int)$db->query("
            SELECT COUNT(*) FROM products 
            WHERE active = 1 AND expiry_date IS NOT NULL 
              AND expiry_date < CURRENT_DATE
        ")->fetchColumn();

        $nearExpiryProducts = $db->query("
            SELECT id, name, sku, category, current_stock, expiry_date, batch_number,
                   DATEDIFF(expiry_date, CURRENT_DATE) as days_to_expiry
            FROM products
            WHERE active = 1 AND expiry_date IS NOT NULL AND expiry_date <= DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY)
            ORDER BY expiry_date ASC
            LIMIT 5
        ")->fetchAll(PDO::FETCH_ASSOC);

        // 2. 7-Day Velocity Data
        $velocityQuery = $db->query("
            SELECT DATE(created_at) as order_date, 
                   COUNT(*) as order_count, 
                   COALESCE(SUM(total_paisa), 0) as total_paisa
            FROM orders
            WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 6 DAY) AND status != 'cancelled'
            GROUP BY DATE(created_at)
            ORDER BY order_date ASC
        ")->fetchAll();

        // Format 7 days even if 0 orders on some days
        $velocity = [];
        for ($i = 6; $i >= 0; $i--) {
            $d = date('Y-m-d', strtotime("-{$i} days"));
            $match = null;
            foreach ($velocityQuery as $vq) {
                if ($vq['order_date'] === $d) {
                    $match = $vq;
                    break;
                }
            }
            $velocity[] = [
                'date' => date('d M', strtotime($d)),
                'raw_date' => $d,
                'orders' => $match ? (int)$match['order_count'] : 0,
                'amount' => $match ? (float)($match['total_paisa'] / 100) : 0
            ];
        }

        // 3. Category Sales Breakdown
        $categoryBreakdown = $db->query("
            SELECT p.category, 
                   SUM(oi.quantity) as total_units_sold, 
                   SUM(oi.line_total_paisa) as total_sales_paisa
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status != 'cancelled'
            GROUP BY p.category
            ORDER BY total_sales_paisa DESC
        ")->fetchAll();

        foreach ($categoryBreakdown as &$cb) {
            $cb['total_sales'] = (float)($cb['total_sales_paisa'] / 100);
        }

        // 4. Recent Activities / Orders
        $recentOrders = $db->query("
            SELECT id, order_number, customer_name, route, status, total_paisa, created_at
            FROM orders
            ORDER BY created_at DESC
            LIMIT 6
        ")->fetchAll();

        foreach ($recentOrders as &$ro) {
            $ro['total'] = (float)($ro['total_paisa'] / 100);
        }

        Response::json([
            'kpis' => [
                'sales_today'         => (float)($salesToday / 100),
                'sales_month'         => (float)($salesMonth / 100),
                'total_orders'        => (int)$ordersCount,
                'pending_dispatches'  => (int)$pendingDispatches,
                'total_receivables'   => (float)($receivables / 100),
                'low_stock_alerts'    => (int)$lowStock,
                'near_expiry_alerts'  => $nearExpiryCount,
                'expired_alerts'      => $expiredCount
            ],
            'velocity'             => $velocity,
            'category_breakdown'   => $categoryBreakdown,
            'recent_orders'        => $recentOrders,
            'near_expiry_products' => $nearExpiryProducts
        ]);
    }

    public function sales(Request $request): void {
        Permissions::require('reports', 'view');
        $db = Database::getConnection();

        $from = $request->query('from', date('Y-m-01'));
        $to = $request->query('to', date('Y-m-d'));

        $stmt = $db->prepare("
            SELECT o.id, o.order_number, o.created_at, o.customer_name, o.route, o.status,
                   o.order_taker_name, o.subtotal_paisa, o.tax_paisa, o.discount_paisa, o.total_paisa
            FROM orders o
            WHERE DATE(o.created_at) BETWEEN ? AND ? AND o.status != 'cancelled'
            ORDER BY o.created_at DESC
        ");
        $stmt->execute([$from, $to]);
        $orders = $stmt->fetchAll();

        $totalSalesPaisa = 0;
        foreach ($orders as &$o) {
            $o['total'] = (float)($o['total_paisa'] / 100);
            $totalSalesPaisa += $o['total_paisa'];
        }

        Response::json([
            'date_range' => ['from' => $from, 'to' => $to],
            'total_sales' => (float)($totalSalesPaisa / 100),
            'order_count' => count($orders),
            'orders' => $orders
        ]);
    }

    public function suite(Request $request): void {
        Permissions::require('reports', 'view');
        $db = Database::getConnection();

        // 1. Orders with items and sales invoice numbers
        $orders = $db->query("
            SELECT o.id, o.order_number, o.customer_id, o.customer_name, o.customer_code,
                   o.route, o.status, o.payment_terms, o.subtotal_paisa, o.tax_paisa, o.discount_paisa,
                   o.total_paisa, o.created_at, o.order_taker_name,
                   si.invoice_number, si.payment_status, si.balance_due_paisa
            FROM orders o
            LEFT JOIN sales_invoices si ON si.order_id = o.id
            ORDER BY o.created_at DESC
        ")->fetchAll();

        // Fetch all order items mapped by order_id
        $itemsStmt = $db->query("
            SELECT oi.order_id, oi.product_id, oi.product_name, oi.quantity, oi.delivered_quantity,
                   oi.unit_price_paisa, oi.line_total_paisa, p.sku, p.category
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
        ");
        $itemsByOrder = [];
        while ($row = $itemsStmt->fetch()) {
            $row['unit_price'] = (float)($row['unit_price_paisa'] / 100);
            $row['line_total'] = (float)($row['line_total_paisa'] / 100);
            $itemsByOrder[$row['order_id']][] = $row;
        }

        foreach ($orders as &$o) {
            $o['total'] = (float)($o['total_paisa'] / 100);
            $o['subtotal'] = (float)($o['subtotal_paisa'] / 100);
            $o['invoice_number'] = $o['invoice_number'] ?: ('INV-' . substr($o['order_number'], 4));
            $o['items'] = $itemsByOrder[$o['id']] ?? [];
        }

        // 2. Products
        $products = $db->query("
            SELECT id, name, sku, category, current_stock, min_stock_level,
                   cost_price_paisa, selling_price_paisa, expiry_date, batch_number, active
            FROM products
            ORDER BY name ASC
        ")->fetchAll();
        $todayStr = date('Y-m-d');
        foreach ($products as &$p) {
            $p['cost_price'] = (float)($p['cost_price_paisa'] / 100);
            $p['selling_price'] = (float)($p['selling_price_paisa'] / 100);
            if (!empty($p['expiry_date'])) {
                $days = (int)floor((strtotime($p['expiry_date']) - strtotime($todayStr)) / 86400);
                $p['days_to_expiry'] = $days;
                $p['is_expired'] = ($days < 0);
                $p['is_near_expiry'] = ($days >= 0 && $days <= 30);
            }
        }

        // 3. Customers
        $customers = $db->query("
            SELECT id, shop_name, owner_name, code, phone, territory_route,
                   credit_limit_paisa, current_balance_paisa, created_at
            FROM customers
            ORDER BY shop_name ASC
        ")->fetchAll();
        foreach ($customers as &$c) {
            $c['credit_limit'] = (float)($c['credit_limit_paisa'] / 100);
            $c['current_balance'] = (float)($c['current_balance_paisa'] / 100);
        }

        // 4. Payments
        $payments = $db->query("
            SELECT id, payment_number, customer_id, customer_name, amount_paisa,
                   payment_method, reference_number, collected_by_name, payment_date, created_at
            FROM payments
            ORDER BY payment_date DESC, created_at DESC
        ")->fetchAll();
        foreach ($payments as &$pay) {
            $pay['amount'] = (float)($pay['amount_paisa'] / 100);
        }

        // 5. Stock movements
        $movements = $db->query("
            SELECT id, movement_id, product_id, product_name, movement_type,
                   quantity_change, previous_stock, new_stock, reference_id, recorded_by, created_at
            FROM stock_movements
            ORDER BY created_at DESC
        ")->fetchAll();

        Response::json([
            'orders'    => $orders,
            'products'  => $products,
            'customers' => $customers,
            'payments'  => $payments,
            'movements' => $movements
        ]);
    }
}
