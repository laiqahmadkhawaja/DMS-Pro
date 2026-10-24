<?php
/**
 * Product Catalog Controller
 */

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Permissions;
use App\Core\Request;
use App\Core\Response;
use PDO;

class ProductController {
    public function index(Request $request): void {
        Permissions::require('products', 'view');
        $db = Database::getConnection();

        $category = trim($request->query('category', ''));
        $search = trim($request->query('q', ''));
        $activeOnly = $request->query('active_only', '1');

        $sql = "SELECT * FROM products WHERE 1=1";
        $params = [];

        if ($activeOnly === '1') {
            $sql .= " AND active = 1";
        }
        if (!empty($category)) {
            $sql .= " AND category = ?";
            $params[] = $category;
        }
        if (!empty($search)) {
            $sql .= " AND (name LIKE ? OR sku LIKE ? OR barcode LIKE ?)";
            $term = "%{$search}%";
            $params[] = $term;
            $params[] = $term;
            $params[] = $term;
        }

        $sql .= " ORDER BY name ASC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $products = $stmt->fetchAll();

        $todayStr = date('Y-m-d');
        $expiryFilter = trim($request->query('expiry', '')); // 'expired', 'near_expiry', 'alerts', 'good', ''

        // Convert paisa to rupees and compute expiry metrics
        $result = [];
        foreach ($products as &$p) {
            $p['cost_price'] = (float)($p['cost_price_paisa'] / 100);
            $p['selling_price'] = (float)($p['selling_price_paisa'] / 100);
            $p['is_low_stock'] = $p['current_stock'] <= $p['min_stock_level'];

            $exp = $p['expiry_date'] ?? null;
            if ($exp) {
                $days = (int)floor((strtotime($exp) - strtotime($todayStr)) / 86400);
                $p['days_to_expiry'] = $days;
                $p['is_expired'] = ($days < 0);
                $p['is_near_expiry'] = ($days >= 0 && $days <= 30);
                if ($days < 0) {
                    $p['expiry_status'] = 'expired';
                    $p['expiry_status_text'] = 'Expired ' . abs($days) . 'd ago';
                } elseif ($days <= 15) {
                    $p['expiry_status'] = 'critical';
                    $p['expiry_status_text'] = 'Expires in ' . $days . 'd';
                } elseif ($days <= 30) {
                    $p['expiry_status'] = 'warning';
                    $p['expiry_status_text'] = 'Expires in ' . $days . 'd';
                } else {
                    $p['expiry_status'] = 'good';
                    $p['expiry_status_text'] = 'Valid (' . $days . 'd)';
                }
            } else {
                $p['days_to_expiry'] = null;
                $p['is_expired'] = false;
                $p['is_near_expiry'] = false;
                $p['expiry_status'] = 'none';
                $p['expiry_status_text'] = 'No expiry';
            }

            if ($expiryFilter === 'expired' && !$p['is_expired']) continue;
            if ($expiryFilter === 'near_expiry' && !$p['is_near_expiry']) continue;
            if ($expiryFilter === 'alerts' && !$p['is_expired'] && !$p['is_near_expiry']) continue;
            if ($expiryFilter === 'good' && ($p['is_expired'] || $p['is_near_expiry'])) continue;

            $result[] = $p;
        }

        Response::json($result);
    }

    public function expiryAlerts(Request $request): void {
        Permissions::require('products', 'view');
        $db = Database::getConnection();

        $todayStr = date('Y-m-d');
        $stmt = $db->query("
            SELECT * FROM products 
            WHERE active = 1 AND expiry_date IS NOT NULL 
            ORDER BY expiry_date ASC
        ");
        $products = $stmt->fetchAll();

        $totalExpired = 0;
        $totalCritical = 0;
        $totalWarning = 0;
        $totalGood = 0;
        $alertItems = [];

        foreach ($products as &$p) {
            $p['cost_price'] = (float)($p['cost_price_paisa'] / 100);
            $p['selling_price'] = (float)($p['selling_price_paisa'] / 100);
            $exp = $p['expiry_date'];
            $days = (int)floor((strtotime($exp) - strtotime($todayStr)) / 86400);
            $p['days_to_expiry'] = $days;

            if ($days < 0) {
                $totalExpired++;
                $p['expiry_status'] = 'expired';
                $p['expiry_status_text'] = 'Expired ' . abs($days) . ' days ago';
                $alertItems[] = $p;
            } elseif ($days <= 15) {
                $totalCritical++;
                $p['expiry_status'] = 'critical';
                $p['expiry_status_text'] = 'Expires in ' . $days . ' days';
                $alertItems[] = $p;
            } elseif ($days <= 30) {
                $totalWarning++;
                $p['expiry_status'] = 'warning';
                $p['expiry_status_text'] = 'Expires in ' . $days . ' days';
                $alertItems[] = $p;
            } else {
                $totalGood++;
            }
        }

        Response::json([
            'summary' => [
                'total_monitored'   => count($products),
                'total_alerts'      => $totalExpired + $totalCritical + $totalWarning,
                'total_expired'     => $totalExpired,
                'total_near_expiry' => $totalCritical + $totalWarning,
                'total_critical'    => $totalCritical,
                'total_warning'     => $totalWarning,
                'total_good'        => $totalGood
            ],
            'alerts' => $alertItems
        ]);
    }

    public function store(Request $request): void {
        Permissions::require('products', 'create');
        $db = Database::getConnection();

        $name = trim($request->input('name', ''));
        $sku = strtoupper(trim($request->input('sku', '')));
        $category = trim($request->input('category', 'General'));
        $unit = trim($request->input('unit', 'unit'));
        $packSize = max(1, (int)$request->input('pack_size', 1));
        $costPrice = (float)$request->input('cost_price', 0);
        $sellingPrice = (float)$request->input('selling_price', 0);
        $stock = (int)$request->input('current_stock', 0);
        $minStock = max(1, (int)$request->input('min_stock_level', 10));

        if (empty($name) || empty($sku)) {
            Response::error('Product name and SKU are required.', 422);
        }

        // Check SKU uniqueness
        $check = $db->prepare("SELECT id FROM products WHERE sku = ?");
        $check->execute([$sku]);
        if ($check->fetch()) {
            Response::error("A product with SKU '{$sku}' already exists.", 422);
        }

        $id = 'PRD-' . rand(1000, 9999);
        $costPaisa = (int)round($costPrice * 100);
        $sellingPaisa = (int)round($sellingPrice * 100);
        $barcode = trim($request->input('barcode', ''));
        if (empty($barcode)) {
            $barcode = '896' . str_pad(rand(100000000, 999999999), 9, '0', STR_PAD_LEFT);
        }

        $expiryDate = trim($request->input('expiry_date', '')) ?: null;
        $batchNumber = trim($request->input('batch_number', '')) ?: null;

        $stmt = $db->prepare("
            INSERT INTO products (id, name, sku, barcode, category, unit, pack_size, cost_price_paisa, selling_price_paisa, current_stock, min_stock_level, expiry_date, batch_number, active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        ");
        $stmt->execute([$id, $name, $sku, $barcode, $category, $unit, $packSize, $costPaisa, $sellingPaisa, $stock, $minStock, $expiryDate, $batchNumber]);

        // If initial stock > 0, log movement
        if ($stock > 0) {
            $user = Auth::user();
            $db->prepare("
                INSERT INTO stock_movements (id, movement_id, product_id, product_name, movement_type, quantity_change, previous_stock, new_stock, notes, recorded_by)
                VALUES (?, ?, ?, ?, 'INITIAL', ?, 0, ?, 'Initial inventory stock balance', ?)
            ")->execute(['MOV-' . uniqid(), 'M-' . rand(10000, 99999), $id, $name, $stock, $stock, $user['display_name'] ?? 'Admin']);
        }

        Response::json(['id' => $id, 'sku' => $sku, 'name' => $name], 201, 'Product created successfully.');
    }

    public function update(Request $request, array $params): void {
        Permissions::require('products', 'edit');
        $id = $params['id'] ?? '';
        $db = Database::getConnection();

        $prod = $db->prepare("SELECT * FROM products WHERE id = ?");
        $prod->execute([$id]);
        $existing = $prod->fetch();
        if (!$existing) {
            Response::error('Product not found.', 404);
        }

        $name = trim($request->input('name', $existing['name']));
        $category = trim($request->input('category', $existing['category']));
        $unit = trim($request->input('unit', $existing['unit']));
        $packSize = max(1, (int)$request->input('pack_size', $existing['pack_size']));
        
        $costPrice = $request->input('cost_price');
        $costPaisa = $costPrice !== null ? (int)round((float)$costPrice * 100) : $existing['cost_price_paisa'];

        $sellingPrice = $request->input('selling_price');
        $sellingPaisa = $sellingPrice !== null ? (int)round((float)$sellingPrice * 100) : $existing['selling_price_paisa'];

        $minStock = max(1, (int)$request->input('min_stock_level', $existing['min_stock_level']));
        $active = $request->input('active', $existing['active']);
        $barcode = trim($request->input('barcode', $existing['barcode'] ?? ''));
        $expiryDate = $request->input('expiry_date') !== null ? (trim($request->input('expiry_date')) ?: null) : ($existing['expiry_date'] ?? null);
        $batchNumber = $request->input('batch_number') !== null ? (trim($request->input('batch_number')) ?: null) : ($existing['batch_number'] ?? null);

        $stmt = $db->prepare("
            UPDATE products 
            SET name = ?, barcode = ?, category = ?, unit = ?, pack_size = ?, cost_price_paisa = ?, selling_price_paisa = ?, min_stock_level = ?, expiry_date = ?, batch_number = ?, active = ?
            WHERE id = ?
        ");
        $stmt->execute([$name, $barcode, $category, $unit, $packSize, $costPaisa, $sellingPaisa, $minStock, $expiryDate, $batchNumber, (int)$active, $id]);

        Response::json(null, 200, 'Product updated successfully.');
    }

    public function scanBarcode(Request $request, array $params): void {
        Permissions::require('products', 'view');
        $code = trim($params['code'] ?? '');
        $db = Database::getConnection();

        $stmt = $db->prepare("SELECT * FROM products WHERE barcode = ? OR sku = ? OR id = ? LIMIT 1");
        $stmt->execute([$code, $code, $code]);
        $prod = $stmt->fetch();
        if (!$prod) {
            Response::error("No product found matching barcode or SKU '{$code}'.", 404);
        }

        $prod['cost_price'] = (float)($prod['cost_price_paisa'] / 100);
        $prod['selling_price'] = (float)($prod['selling_price_paisa'] / 100);
        $prod['is_low_stock'] = $prod['current_stock'] <= $prod['min_stock_level'];

        Response::json($prod);
    }

    public function adjustStock(Request $request, array $params): void {
        Permissions::require('products', 'adjust_stock');
        $id = $params['id'] ?? '';
        $db = Database::getConnection();

        $prod = $db->prepare("SELECT * FROM products WHERE id = ?");
        $prod->execute([$id]);
        $existing = $prod->fetch();
        if (!$existing) {
            Response::error('Product not found.', 404);
        }

        $newStock = (int)$request->input('new_stock', 0);
        $reason = trim($request->input('reason', 'Manual physical audit adjustment'));
        $user = Auth::user();

        $previous = $existing['current_stock'];
        $diff = $newStock - $previous;

        if ($diff === 0) {
            Response::json(null, 200, 'Stock count already matches.');
        }

        $db->beginTransaction();
        try {
            $db->prepare("UPDATE products SET current_stock = ? WHERE id = ?")->execute([$newStock, $id]);

            $db->prepare("
                INSERT INTO stock_movements (id, movement_id, product_id, product_name, movement_type, quantity_change, previous_stock, new_stock, notes, recorded_by)
                VALUES (?, ?, ?, ?, 'ADJUSTMENT', ?, ?, ?, ?, ?)
            ")->execute(['MOV-' . uniqid(), 'M-' . rand(10000, 99999), $id, $existing['name'], $diff, $previous, $newStock, $reason, $user['display_name'] ?? 'Admin']);

            $db->commit();
            Response::json(['new_stock' => $newStock, 'diff' => $diff], 200, 'Stock adjusted successfully.');
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Stock adjustment failed: ' . $e->getMessage(), 500);
        }
    }

    public function destroy(Request $request, array $params): void {
        Permissions::require('products', 'delete');
        $id = $params['id'] ?? '';
        $db = Database::getConnection();

        $prod = $db->prepare("SELECT active FROM products WHERE id = ?");
        $prod->execute([$id]);
        $existing = $prod->fetch();
        if (!$existing) {
            Response::error('Product not found.', 404);
        }

        $newActive = $existing['active'] ? 0 : 1;
        $db->prepare("UPDATE products SET active = ? WHERE id = ?")->execute([$newActive, $id]);

        $msg = $newActive ? 'Product activated.' : 'Product deactivated.';
        Response::json(['active' => $newActive], 200, $msg);
    }
}
