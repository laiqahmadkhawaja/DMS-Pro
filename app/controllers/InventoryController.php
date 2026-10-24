<?php
/**
 * Inventory & Stock Receipts Controller
 */

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Permissions;
use App\Core\Request;
use App\Core\Response;
use PDO;

class InventoryController {
    public function index(Request $request): void {
        Permissions::require('inventory', 'view');
        $db = Database::getConnection();

        $products = $db->query("
            SELECT p.*,
                   (SELECT COUNT(*) FROM order_items oi 
                    JOIN orders o ON oi.order_id = o.id 
                    WHERE oi.product_id = p.id AND o.status IN ('submitted', 'approved')) as pending_order_units
            FROM products p
            ORDER BY p.name ASC
        ")->fetchAll();

        $totalValuationPaisa = 0;
        $lowStockCount = 0;

        foreach ($products as &$p) {
            $p['cost_price'] = (float)($p['cost_price_paisa'] / 100);
            $p['selling_price'] = (float)($p['selling_price_paisa'] / 100);
            $p['stock_value'] = (float)(($p['cost_price_paisa'] * $p['current_stock']) / 100);
            $p['is_low_stock'] = $p['current_stock'] <= $p['min_stock_level'];

            $totalValuationPaisa += ($p['cost_price_paisa'] * $p['current_stock']);
            if ($p['is_low_stock']) {
                $lowStockCount++;
            }
        }

        Response::json([
            'summary' => [
                'total_sku_count' => count($products),
                'total_valuation' => (float)($totalValuationPaisa / 100),
                'low_stock_count' => $lowStockCount
            ],
            'products' => $products
        ]);
    }

    public function receiveStock(Request $request): void {
        Permissions::require('inventory', 'receive_stock');
        $db = Database::getConnection();

        $supplier = trim($request->input('supplier_name', ''));
        $refNo = trim($request->input('reference_no', ''));
        $items = $request->input('items', []);
        $notes = trim($request->input('notes', ''));

        if (empty($supplier) || empty($items) || !is_array($items)) {
            Response::error('Supplier name and at least 1 received product line are required.', 422);
        }

        $user = Auth::user();
        $receiptId = 'GRN-' . rand(10000, 99999);
        $receiptNum = $receiptId;

        $db->beginTransaction();
        try {
            $insReceipt = $db->prepare("
                INSERT INTO stock_receipts (id, receipt_number, supplier_name, reference_no, received_by, notes)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $insReceipt->execute([$receiptId, $receiptNum, $supplier, $refNo, $user['display_name'], $notes]);

            $insItem = $db->prepare("INSERT INTO stock_receipt_items (receipt_id, product_id, product_name, quantity_received, unit_cost_paisa) VALUES (?, ?, ?, ?, ?)");
            $updStock = $db->prepare("UPDATE products SET current_stock = current_stock + ? WHERE id = ?");
            $insMov = $db->prepare("
                INSERT INTO stock_movements (id, movement_id, product_id, product_name, movement_type, quantity_change, previous_stock, new_stock, reference_id, notes, recorded_by)
                VALUES (?, ?, ?, ?, 'GRN_RECEIPT', ?, ?, ?, ?, ?, ?)
            ");

            foreach ($items as $it) {
                $pId = $it['product_id'] ?? '';
                $qty = max(1, (int)($it['quantity'] ?? 1));
                $unitCost = (float)($it['unit_cost'] ?? 0);
                $unitCostPaisa = (int)round($unitCost * 100);

                $pRow = $db->query("SELECT name, current_stock FROM products WHERE id = '{$pId}'")->fetch();
                if (!$pRow) continue;

                $prev = (int)$pRow['current_stock'];
                $new = $prev + $qty;

                $insItem->execute([$receiptId, $pId, $pRow['name'], $qty, $unitCostPaisa]);
                $updStock->execute([$qty, $pId]);
                $insMov->execute([
                    'MOV-' . uniqid(), 'M-' . rand(10000, 99999), $pId, $pRow['name'],
                    $qty, $prev, $new, $receiptNum, "GRN from {$supplier} (Ref: {$refNo})", $user['display_name']
                ]);
            }

            $db->commit();
            Response::json(['receipt_number' => $receiptNum], 201, 'Goods Received Note logged and inventory updated.');
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Failed to log stock receipt: ' . $e->getMessage(), 500);
        }
    }

    public function movements(Request $request): void {
        Permissions::require('inventory', 'view');
        $db = Database::getConnection();

        $prodId = trim($request->query('product_id', ''));
        $sql = "SELECT * FROM stock_movements WHERE 1=1";
        $params = [];

        if (!empty($prodId)) {
            $sql .= " AND product_id = ?";
            $params[] = $prodId;
        }

        $sql .= " ORDER BY created_at DESC LIMIT 100";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $movements = $stmt->fetchAll();

        Response::json($movements);
    }
}
