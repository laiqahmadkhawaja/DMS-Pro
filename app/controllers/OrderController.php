<?php
/**
 * Order Lifecycle & Booking Controller
 */

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Permissions;
use App\Core\Request;
use App\Core\Response;
use App\Core\FileStorage;
use PDO;

class OrderController {
    public function index(Request $request): void {
        Permissions::require('orders', 'view');
        $db = Database::getConnection();

        $status = trim($request->query('status', ''));
        $route = trim($request->query('route', ''));
        $search = trim($request->query('q', ''));
        $driverId = trim($request->query('driver_id', ''));

        // If logged-in user is a delivery driver, default filter to their dispatches
        $user = Auth::user();
        if (($user['role_slug'] ?? '') === 'delivery_man' && empty($driverId)) {
            $driverId = $user['uid'];
        }

        $sql = "SELECT o.*, 
                       (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
                FROM orders o WHERE 1=1";
        $params = [];

        if (!empty($status)) {
            if (strpos($status, ',') !== false) {
                $statusList = array_map('trim', explode(',', $status));
                $inClause = implode(',', array_fill(0, count($statusList), '?'));
                $sql .= " AND o.status IN ($inClause)";
                foreach ($statusList as $st) {
                    $params[] = $st;
                }
            } else {
                $sql .= " AND o.status = ?";
                $params[] = $status;
            }
        }
        if (!empty($route)) {
            $sql .= " AND o.route = ?";
            $params[] = $route;
        }
        if (!empty($driverId)) {
            $sql .= " AND o.assigned_delivery_driver_id = ?";
            $params[] = $driverId;
        }
        if (!empty($search)) {
            $sql .= " AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_code LIKE ?)";
            $term = "%{$search}%";
            $params[] = $term;
            $params[] = $term;
            $params[] = $term;
        }

        $sql .= " ORDER BY o.created_at DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $orders = $stmt->fetchAll();

        foreach ($orders as &$o) {
            $o['total'] = (float)($o['total_paisa'] / 100);
            $o['subtotal'] = (float)($o['subtotal_paisa'] / 100);
            $o['tax'] = (float)($o['tax_paisa'] / 100);
            $o['discount'] = (float)($o['discount_paisa'] / 100);
        }

        Response::json($orders);
    }

    public function show(Request $request, array $params): void {
        Permissions::require('orders', 'view');
        $id = $params['id'] ?? '';
        $db = Database::getConnection();

        $stmt = $db->prepare("
            SELECT o.* 
            FROM orders o
            LEFT JOIN sales_invoices si ON si.order_id = o.id
            WHERE o.id = ? 
               OR o.order_number = ? 
               OR si.invoice_number = ? 
               OR si.id = ? 
               OR o.id = REPLACE(?, 'INV-', 'ORD-')
               OR o.order_number = REPLACE(?, 'INV-', 'ORD-')
            LIMIT 1
        ");
        $stmt->execute([$id, $id, $id, $id, $id, $id]);
        $order = $stmt->fetch();
        if (!$order) {
            Response::error('Order not found.', 404);
        }

        $order['total'] = (float)($order['total_paisa'] / 100);
        $order['subtotal'] = (float)($order['subtotal_paisa'] / 100);
        $order['tax'] = (float)($order['tax_paisa'] / 100);
        $order['discount'] = (float)($order['discount_paisa'] / 100);

        // Fetch Items
        $itemStmt = $db->prepare("
            SELECT oi.*, p.sku as product_sku
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        ");
        $itemStmt->execute([$order['id']]);
        $items = $itemStmt->fetchAll();
        foreach ($items as &$it) {
            $it['unit_price'] = (float)($it['unit_price_paisa'] / 100);
            $it['line_total'] = (float)($it['line_total_paisa'] / 100);
            $it['sku'] = $it['product_sku'] ?? '';
        }
        $order['items'] = $items;

        // Fetch Audit Events
        $eventStmt = $db->prepare("SELECT * FROM order_events WHERE order_id = ? ORDER BY created_at ASC");
        $eventStmt->execute([$order['id']]);
        $order['events'] = $eventStmt->fetchAll();

        // Customer info
        $custStmt = $db->prepare("SELECT * FROM customers WHERE id = ?");
        $custStmt->execute([$order['customer_id']]);
        $order['customer'] = $custStmt->fetch();

        Response::json($order);
    }

    public function store(Request $request): void {
        Permissions::require('order_create', 'create');
        $db = Database::getConnection();

        $customerId = trim($request->input('customer_id', ''));
        $items = $request->input('items', []);
        $notes = trim($request->input('notes', ''));
        $discountAmount = (float)$request->input('discount', 0);
        $bookerSignature = trim($request->input('booker_signature', $request->input('order_taker_signature', '')));

        if (empty($customerId)) {
            Response::error('Customer is required.', 422);
        }
        if (empty($items) || !is_array($items)) {
            Response::error('Cart is empty. Please add at least 1 product line.', 422);
        }

        // Fetch customer
        $custStmt = $db->prepare("SELECT * FROM customers WHERE id = ? AND active = 1");
        $custStmt->execute([$customerId]);
        $customer = $custStmt->fetch();
        if (!$customer) {
            Response::error('Selected customer does not exist or is inactive.', 422);
        }

        // Validate items and compute totals
        $subtotalPaisa = 0;
        $orderLines = [];

        foreach ($items as $item) {
            $prodId = $item['product_id'] ?? '';
            $qty = max(1, (int)($item['quantity'] ?? 1));

            $pStmt = $db->prepare("SELECT * FROM products WHERE id = ? AND active = 1");
            $pStmt->execute([$prodId]);
            $product = $pStmt->fetch();

            if (!$product) {
                Response::error("Product '{$prodId}' not found.", 422);
            }

            if ($product['current_stock'] < $qty) {
                Response::error("Insufficient stock for '{$product['name']}'. In stock: {$product['current_stock']}.", 422);
            }

            $lineTotalPaisa = $product['selling_price_paisa'] * $qty;
            $subtotalPaisa += $lineTotalPaisa;

            $orderLines[] = [
                'product_id' => $product['id'],
                'name' => $product['name'],
                'quantity' => $qty,
                'unit_price_paisa' => $product['selling_price_paisa'],
                'line_total_paisa' => $lineTotalPaisa
            ];
        }

        // Company tax setting
        $taxRate = 5.0; // default 5%
        $taxStmt = $db->query("SELECT setting_value FROM company_settings WHERE setting_key = 'tax_rate'");
        if ($row = $taxStmt->fetch()) {
            $taxRate = (float)$row['setting_value'];
        }

        $taxPaisa = (int)round(($subtotalPaisa * $taxRate) / 100);
        $discountPaisa = (int)round($discountAmount * 100);
        $totalPaisa = max(0, $subtotalPaisa + $taxPaisa - $discountPaisa);

        // Credit limit check
        $projectedBalance = $customer['current_balance_paisa'] + $totalPaisa;
        if ($projectedBalance > $customer['credit_limit_paisa']) {
            // Check if user has override_credit permission
            if (!Permissions::can('customers', 'override_credit')) {
                $limitRs = number_format($customer['credit_limit_paisa'] / 100, 2);
                $currRs = number_format($customer['current_balance_paisa'] / 100, 2);
                $orderRs = number_format($totalPaisa / 100, 2);
                Response::error("Order exceeds customer credit limit! Credit Limit: Rs. {$limitRs}, Outstanding: Rs. {$currRs}, Order: Rs. {$orderRs}. Manager override required.", 422);
            }
        }

        $user = Auth::user();
        $orderId = 'ORD-' . date('Ymd') . '-' . rand(1000, 9999);
        $orderNum = $orderId;

        if (empty($bookerSignature)) {
            $bookerSignature = $db->query("SELECT signature FROM users WHERE uid = '{$user['uid']}'")->fetchColumn() ?: '';
        }
        $bookerSigPath = FileStorage::saveBase64Image($bookerSignature, 'signatures/bookers', 'booker_' . $orderNum);

        $db->beginTransaction();
        try {
            // 1. Insert Order
            $insOrder = $db->prepare("
                INSERT INTO orders (id, order_number, customer_id, customer_name, customer_code, customer_phone, customer_address, order_taker_id, order_taker_name, order_taker_signature, route, status, subtotal_paisa, tax_paisa, discount_paisa, total_paisa, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?, ?, ?, ?)
            ");
            $insOrder->execute([
                $orderId, $orderNum, $customer['id'], $customer['shop_name'], $customer['code'],
                $customer['phone'], $customer['address'], $user['uid'], $user['display_name'], $bookerSigPath,
                $customer['territory_route'], $subtotalPaisa, $taxPaisa, $discountPaisa, $totalPaisa, $notes
            ]);

            // 2. Insert Items & Reserve/Deduct Stock
            $insItem = $db->prepare("INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price_paisa, line_total_paisa) VALUES (?, ?, ?, ?, ?, ?)");
            $updStock = $db->prepare("UPDATE products SET current_stock = current_stock - ? WHERE id = ?");
            $insMov = $db->prepare("
                INSERT INTO stock_movements (id, movement_id, product_id, product_name, movement_type, quantity_change, previous_stock, new_stock, reference_id, recorded_by)
                VALUES (?, ?, ?, ?, 'DISPATCH_ALLOC', ?, ?, ?, ?, ?)
            ");

            foreach ($orderLines as $line) {
                $insItem->execute([$orderId, $line['product_id'], $line['name'], $line['quantity'], $line['unit_price_paisa'], $line['line_total_paisa']]);
                
                // Deduct stock
                $pRow = $db->query("SELECT current_stock FROM products WHERE id = '{$line['product_id']}'")->fetch();
                $prev = (int)$pRow['current_stock'];
                $updStock->execute([$line['quantity'], $line['product_id']]);
                $insMov->execute(['MOV-' . uniqid(), 'M-' . rand(10000, 99999), $line['product_id'], $line['name'], -$line['quantity'], $prev, $prev - $line['quantity'], $orderNum, $user['display_name']]);
            }

            // 3. Insert Initial Event
            $db->prepare("
                INSERT INTO order_events (order_id, action, from_status, to_status, note, user_id, user_name)
                VALUES (?, 'ORDER_SUBMITTED', NULL, 'submitted', 'Order placed via digital catalog', ?, ?)
            ")->execute([$orderId, $user['uid'], $user['display_name']]);

            $db->commit();
            Response::json(['order_id' => $orderId, 'order_number' => $orderNum, 'total' => $totalPaisa / 100], 201, 'Order booked successfully.');
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Failed to create order: ' . $e->getMessage(), 500);
        }
    }

    public function updateStatus(Request $request, array $params): void {
        $id = $params['id'] ?? '';
        $newStatus = strtolower(trim($request->input('status', '')));
        $notes = trim($request->input('notes', ''));
        $driverId = $request->input('driver_id');

        $db = Database::getConnection();
        $orderStmt = $db->prepare("SELECT * FROM orders WHERE id = ? OR order_number = ?");
        $orderStmt->execute([$id, $id]);
        $order = $orderStmt->fetch();
        if (!$order) {
            Response::error('Order not found.', 404);
        }

        $user = Auth::user();
        $currentStatus = $order['status'];

        $receivedByName = trim($request->input('received_by_name', ''));
        $receivedByRelation = trim($request->input('received_by_relation', ''));
        $podSignature = $request->input('pod_signature', null);
        $podNotes = trim($request->input('pod_notes', ''));
        $undeliveredReason = trim($request->input('undelivered_reason', ''));
        $codCollected = (float)$request->input('cod_collected', 0);

        // Enforce granular action permissions based on target status
        if ($newStatus === 'approved') {
            Permissions::require('orders', 'approve');
        } elseif ($newStatus === 'dispatched') {
            Permissions::require('orders', 'dispatch');
        } elseif ($newStatus === 'out_for_delivery') {
            if (!Permissions::can('orders', 'deliver') && !Permissions::can('delivery', 'confirm_delivery') && !Permissions::can('delivery', 'view')) {
                Response::error('Forbidden: You do not have permission to start delivery route.', 403);
            }
        } elseif ($newStatus === 'delivered' || $newStatus === 'partially_delivered') {
            // Either delivery role or order deliver permission
            if (!Permissions::can('orders', 'deliver') && !Permissions::can('delivery', 'confirm_delivery')) {
                Response::error('Forbidden: You do not have permission to confirm deliveries.', 403);
            }
        } elseif ($newStatus === 'cancelled' || $newStatus === 'undelivered' || $newStatus === 'delivery_failed') {
            if (!Permissions::can('orders', 'cancel') && !Permissions::can('delivery', 'confirm_delivery') && !Permissions::can('delivery', 'view')) {
                Response::error('Forbidden: You do not have permission to report failed delivery.', 403);
            }
        } else {
            Response::error("Invalid status transition to '{$newStatus}'.", 422);
        }

        $paymentMethod = trim($request->input('payment_method', 'Cash'));
        $refNumber = trim($request->input('reference_number', $request->input('col_ref', '')));
        $deliveredItems = $request->input('delivered_items', []);

        $db->beginTransaction();
        try {
            $updFields = ['status = ?'];
            $updValues = [$newStatus];

            if ($newStatus === 'dispatched') {
                $updFields[] = 'dispatched_at = NOW()';
                $updFields[] = 'dispatcher_id = ?';
                $updValues[] = $user['uid'];
                $updFields[] = 'dispatcher_name = ?';
                $updValues[] = $user['display_name'];
                
                $dispSig = $db->query("SELECT signature FROM users WHERE uid = '{$user['uid']}'")->fetchColumn();
                if (!empty($dispSig)) {
                    $dispSigPath = FileStorage::saveBase64Image($dispSig, 'signatures/dispatchers', 'disp_' . $order['order_number']);
                    $updFields[] = 'dispatcher_signature = ?';
                    $updValues[] = $dispSigPath;
                }

                if (!empty($driverId)) {
                    $updFields[] = 'assigned_delivery_driver_id = ?';
                    $updValues[] = $driverId;
                    $dRow = $db->query("SELECT display_name, signature FROM users WHERE uid = '{$driverId}'")->fetch(\PDO::FETCH_ASSOC);
                    if ($dRow) {
                        $updFields[] = 'driver_name = ?';
                        $updValues[] = $dRow['display_name'];
                        if (!empty($dRow['signature'])) {
                            $driverSigPath = FileStorage::saveBase64Image($dRow['signature'], 'signatures/drivers', 'driver_' . $order['order_number']);
                            $updFields[] = 'driver_signature = ?';
                            $updValues[] = $driverSigPath;
                        }
                    }
                }
            } elseif ($newStatus === 'out_for_delivery') {
                if (empty($order['dispatched_at'])) {
                    $updFields[] = 'dispatched_at = NOW()';
                }
            } elseif ($newStatus === 'delivered' || $newStatus === 'partially_delivered') {
                $updFields[] = 'delivered_at = NOW()';
                
                if (!empty($receivedByName)) {
                    $updFields[] = 'received_by_name = ?';
                    $updValues[] = $receivedByName;
                }
                if (!empty($receivedByRelation)) {
                    $updFields[] = 'received_by_relation = ?';
                    $updValues[] = $receivedByRelation;
                }
                if (!empty($podSignature)) {
                    $podSigPath = FileStorage::saveBase64Image($podSignature, 'signatures/pod', 'pod_' . $order['order_number']);
                    $updFields[] = 'pod_signature = ?';
                    $updValues[] = $podSigPath;
                }
                if (!empty($podNotes)) {
                    $updFields[] = 'pod_notes = ?';
                    $updValues[] = $podNotes;
                }

                // If driver name or signature not yet attached, capture from current delivering user or assigned driver
                if (empty($order['driver_name']) || empty($order['driver_signature'])) {
                    $delivUserUid = ($user['role_slug'] ?? '') === 'delivery_man' ? $user['uid'] : ($order['assigned_delivery_driver_id'] ?: $user['uid']);
                    $dRow = $db->query("SELECT display_name, signature FROM users WHERE uid = '{$delivUserUid}'")->fetch(\PDO::FETCH_ASSOC);
                    if ($dRow) {
                        $updFields[] = 'driver_name = ?';
                        $updValues[] = $dRow['display_name'];
                        if (!empty($dRow['signature'])) {
                            $driverSigPath = FileStorage::saveBase64Image($dRow['signature'], 'signatures/drivers', 'driver_' . $order['order_number']);
                            $updFields[] = 'driver_signature = ?';
                            $updValues[] = $driverSigPath;
                        }
                    }
                }

                // If delivered_items provided, update order_items delivered_quantity and restore unaccepted stock
                if (!empty($deliveredItems) && is_array($deliveredItems)) {
                    $updDeliv = $db->prepare("UPDATE order_items SET delivered_quantity = ? WHERE order_id = ? AND product_id = ?");
                    $updRestoreStock = $db->prepare("UPDATE products SET current_stock = current_stock + ? WHERE id = ?");
                    foreach ($deliveredItems as $dit) {
                        $pId = $dit['product_id'] ?? $dit['productId'] ?? '';
                        $delQty = isset($dit['delivered_quantity']) ? (int)$dit['delivered_quantity'] : (int)($dit['deliveredQuantity'] ?? 0);
                        $ordQty = isset($dit['quantity']) ? (int)$dit['quantity'] : (int)($dit['orderedQuantity'] ?? 0);
                        if (!empty($pId)) {
                            $updDeliv->execute([$delQty, $order['id'], $pId]);
                            // If partial quantity was accepted, restore remaining rejected units to inventory
                            if ($ordQty > $delQty) {
                                $returnedQty = $ordQty - $delQty;
                                $updRestoreStock->execute([$returnedQty, $pId]);
                            }
                        }
                    }
                }

                // Automatically generate Invoice & update Customer Ledger + Balance
                $invId = 'INV-' . substr($order['order_number'], 4);
                $codPaisa = (int)round($codCollected * 100);
                $paidPaisa = min($order['total_paisa'], $codPaisa);
                $balDuePaisa = max(0, $order['total_paisa'] - $paidPaisa);
                $payStatus = $balDuePaisa === 0 ? 'paid' : ($paidPaisa > 0 ? 'partial' : 'unpaid');

                $insInv = $db->prepare("
                    INSERT INTO sales_invoices (id, invoice_number, order_id, customer_id, customer_name, total_amount_paisa, paid_amount_paisa, balance_due_paisa, payment_status, due_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(CURRENT_DATE, INTERVAL 15 DAY))
                    ON DUPLICATE KEY UPDATE balance_due_paisa = VALUES(balance_due_paisa)
                ");
                $insInv->execute([$invId, $invId, $order['id'], $order['customer_id'], $order['customer_name'], $order['total_paisa'], $paidPaisa, $balDuePaisa, $payStatus]);

                // Update customer balance: invoice adds debit, cash collected reduces it
                $netBalanceChange = $order['total_paisa'] - $paidPaisa;
                if ($netBalanceChange > 0) {
                    $db->prepare("UPDATE customers SET current_balance_paisa = current_balance_paisa + ? WHERE id = ?")
                       ->execute([$netBalanceChange, $order['customer_id']]);
                }

                // Create customer ledger invoice record
                $cust = $db->query("SELECT current_balance_paisa FROM customers WHERE id = '{$order['customer_id']}'")->fetch();
                $newBal = $cust['current_balance_paisa'];

                $db->prepare("
                    INSERT INTO customer_ledger (customer_id, type, description, reference_id, debit_paisa, credit_paisa, balance_paisa, recorded_by)
                    VALUES (?, 'INVOICE', ?, ?, ?, 0, ?, ?)
                ")->execute([$order['customer_id'], "Invoice {$invId} for delivered order {$order['order_number']}" . ($receivedByName ? " (Received by: {$receivedByName})" : ''), $invId, $order['total_paisa'], $newBal, $user['display_name']]);

                // If COD cash was collected on spot, log payment and payment allocation
                if ($paidPaisa > 0) {
                    $payId = 'PAY-' . date('Ymd') . '-' . rand(1000, 9999);
                    $db->prepare("
                        INSERT INTO payments (id, payment_number, customer_id, customer_name, amount_paisa, payment_method, reference_number, notes, collected_by, collected_by_name, payment_date)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE)
                    ")->execute([$payId, $payId, $order['customer_id'], $order['customer_name'], $paidPaisa, $paymentMethod, $refNumber ?: "COD-{$order['order_number']}", "COD received by {$user['display_name']}", $user['uid'], $user['display_name']]);

                    $db->prepare("
                        INSERT INTO payment_allocations (payment_id, invoice_id, invoice_number, allocated_amount_paisa)
                        VALUES (?, ?, ?, ?)
                    ")->execute([$payId, $invId, $invId, $paidPaisa]);

                    $db->prepare("
                        INSERT INTO customer_ledger (customer_id, type, description, reference_id, debit_paisa, credit_paisa, balance_paisa, recorded_by)
                        VALUES (?, 'PAYMENT', ?, ?, 0, ?, ?, ?)
                    ")->execute([$order['customer_id'], "Payment ({$paymentMethod}) for order {$order['order_number']}", $payId, $paidPaisa, $newBal, $user['display_name']]);

                    // Also record into delivery_collections
                    $colId = 'COL-' . uniqid();
                    $db->prepare("
                        INSERT INTO delivery_collections (id, order_id, driver_id, customer_id, amount_paisa, payment_method, reference_number, notes)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ")->execute([$colId, $order['id'], $user['uid'], $order['customer_id'], $paidPaisa, $paymentMethod, $refNumber, $notes ?: 'On-site collection']);
                }
            } elseif ($newStatus === 'cancelled' || $newStatus === 'undelivered' || $newStatus === 'delivery_failed') {
                if (!empty($undeliveredReason)) {
                    $updFields[] = 'undelivered_reason = ?';
                    $updValues[] = $undeliveredReason;
                }
                // Restore reserved stock back to products
                $items = $db->query("SELECT product_id, quantity FROM order_items WHERE order_id = '{$order['id']}'")->fetchAll();
                foreach ($items as $it) {
                    $db->prepare("UPDATE products SET current_stock = current_stock + ? WHERE id = ?")->execute([$it['quantity'], $it['product_id']]);
                }
            }

            $updValues[] = $order['id'];
            $sql = "UPDATE orders SET " . implode(', ', $updFields) . " WHERE id = ?";
            $stmt = $db->prepare($sql);
            $stmt->execute($updValues);

            // Log Order Event
            $db->prepare("
                INSERT INTO order_events (order_id, action, from_status, to_status, note, user_id, user_name)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ")->execute([$order['id'], strtoupper("STATUS_{$newStatus}"), $currentStatus, $newStatus, $notes ?: "Order marked as {$newStatus}", $user['uid'], $user['display_name']]);

            $db->commit();
            Response::json(['order_id' => $order['id'], 'from_status' => $currentStatus, 'to_status' => $newStatus], 200, "Order successfully updated to {$newStatus}.");
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Failed to update order status: ' . $e->getMessage(), 500);
        }
    }

    public function invoice(Request $request, array $params): void {
        Permissions::require('orders', 'print_invoice');
        $id = $params['id'] ?? '';
        $db = Database::getConnection();

        $stmt = $db->prepare("
            SELECT o.* 
            FROM orders o
            LEFT JOIN sales_invoices si ON si.order_id = o.id
            WHERE o.id = ? 
               OR o.order_number = ? 
               OR si.invoice_number = ? 
               OR si.id = ? 
               OR o.id = REPLACE(?, 'INV-', 'ORD-')
               OR o.order_number = REPLACE(?, 'INV-', 'ORD-')
            LIMIT 1
        ");
        $stmt->execute([$id, $id, $id, $id, $id, $id]);
        $order = $stmt->fetch();
        if (!$order) {
            Response::error('Order not found.', 404);
        }

        // Fetch company settings
        $settings = $db->query("SELECT setting_key, setting_value FROM company_settings")->fetchAll(PDO::FETCH_KEY_PAIR);

        // Fetch order items
        $items = $db->query("SELECT * FROM order_items WHERE order_id = '{$order['id']}'")->fetchAll();
        foreach ($items as &$it) {
            $it['unit_price'] = (float)($it['unit_price_paisa'] / 100);
            $it['line_total'] = (float)($it['line_total_paisa'] / 100);
        }

        // Customer details
        $customer = $db->query("SELECT * FROM customers WHERE id = '{$order['customer_id']}'")->fetch();

        // Check if sales invoice exists
        $invStmt = $db->prepare("SELECT * FROM sales_invoices WHERE order_id = ? LIMIT 1");
        $invStmt->execute([$order['id']]);
        $invRecord = $invStmt->fetch();
        $invNumber = $invRecord ? $invRecord['invoice_number'] : ('INV-' . substr($order['order_number'], 4));
        $payStatus = $invRecord ? $invRecord['payment_status'] : ($order['status'] === 'delivered' ? 'paid' : 'unpaid');
        $balDue = $invRecord ? (float)($invRecord['balance_due_paisa'] / 100) : (float)($order['total_paisa'] / 100);

        Response::json([
            'company' => $settings,
            'order'   => [
                'id'           => $order['id'],
                'order_number' => $order['order_number'],
                'invoice_number' => $invNumber,
                'payment_status' => $payStatus,
                'balance_due'  => $balDue,
                'created_at'   => $order['created_at'],
                'status'       => $order['status'],
                'route'        => $order['route'],
                'subtotal'     => (float)($order['subtotal_paisa'] / 100),
                'tax'          => (float)($order['tax_paisa'] / 100),
                'discount'     => (float)($order['discount_paisa'] / 100),
                'total'        => (float)($order['total_paisa'] / 100),
                'items'        => $items,
                'received_by_name' => $order['received_by_name'],
                'received_by_relation' => $order['received_by_relation'],
                'pod_signature' => $order['pod_signature'],
                'delivered_at' => $order['delivered_at'],
                'order_taker_id' => $order['order_taker_id'] ?? null,
                'order_taker_name' => $order['order_taker_name'] ?? null,
                'order_taker_signature' => $order['order_taker_signature'] ?? null,
                'dispatcher_id' => $order['dispatcher_id'] ?? null,
                'dispatcher_name' => $order['dispatcher_name'] ?? null,
                'dispatcher_signature' => $order['dispatcher_signature'] ?? null,
                'driver_name' => $order['driver_name'] ?? null,
                'driver_signature' => $order['driver_signature'] ?? null,
                'dispatched_at' => $order['dispatched_at'] ?? null
            ],
            'customer' => $customer
        ]);
    }
}
