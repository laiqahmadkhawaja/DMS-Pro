<?php
/**
 * Recovery & Payments Controller
 */

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Permissions;
use App\Core\Request;
use App\Core\Response;
use PDO;

class RecoveryController {
    public function index(Request $request): void {
        Permissions::require('recovery', 'view');
        $db = Database::getConnection();

        // 1. Receivables overview
        $totals = $db->query("
            SELECT SUM(current_balance_paisa) as total_receivables_paisa,
                   COUNT(CASE WHEN current_balance_paisa > 0 THEN 1 END) as debtor_count
            FROM customers
        ")->fetch();

        // 2. Customers with outstanding balances
        $debtors = $db->query("
            SELECT id, code, shop_name, owner_name, phone, territory_route,
                   credit_limit_paisa, current_balance_paisa, payment_terms_days
            FROM customers
            WHERE current_balance_paisa > 0
            ORDER BY current_balance_paisa DESC
        ")->fetchAll();

        foreach ($debtors as &$d) {
            $d['credit_limit'] = (float)($d['credit_limit_paisa'] / 100);
            $d['current_balance'] = (float)($d['current_balance_paisa'] / 100);
        }

        // 3. Recent payment collection vouchers
        $payments = $db->query("
            SELECT p.*, c.shop_name, c.code as customer_code
            FROM payments p
            JOIN customers c ON p.customer_id = c.id
            ORDER BY p.payment_date DESC, p.created_at DESC
            LIMIT 50
        ")->fetchAll();

        foreach ($payments as &$pm) {
            $pm['amount'] = (float)($pm['amount_paisa'] / 100);
        }

        Response::json([
            'summary' => [
                'total_receivables' => (float)(($totals['total_receivables_paisa'] ?? 0) / 100),
                'debtor_count' => (int)($totals['debtor_count'] ?? 0)
            ],
            'debtors' => $debtors,
            'recent_payments' => $payments
        ]);
    }

    public function recordPayment(Request $request): void {
        Permissions::require('recovery', 'record_payment');
        $db = Database::getConnection();

        $customerId = trim($request->input('customer_id', ''));
        $amount = (float)$request->input('amount', 0);
        $method = trim($request->input('payment_method', 'Cash'));
        $refNo = trim($request->input('reference_number', ''));
        $notes = trim($request->input('notes', ''));
        $paymentDate = trim($request->input('payment_date', date('Y-m-d')));

        if (empty($customerId) || $amount <= 0) {
            Response::error('Customer and a valid payment collection amount are required.', 422);
        }

        $cust = $db->prepare("SELECT * FROM customers WHERE id = ?");
        $cust->execute([$customerId]);
        $customer = $cust->fetch();
        if (!$customer) {
            Response::error('Customer not found.', 404);
        }

        $amountPaisa = (int)round($amount * 100);
        $user = Auth::user();
        $paymentId = 'PAY-' . date('Ymd') . '-' . rand(1000, 9999);
        $paymentNum = $paymentId;

        $db->beginTransaction();
        try {
            // 1. Insert Payment
            $insPay = $db->prepare("
                INSERT INTO payments (id, payment_number, customer_id, customer_name, amount_paisa, payment_method, reference_number, notes, collected_by, collected_by_name, payment_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $insPay->execute([
                $paymentId, $paymentNum, $customer['id'], $customer['shop_name'], $amountPaisa,
                $method, $refNo, $notes, $user['uid'], $user['display_name'], $paymentDate
            ]);

            // 2. FIFO allocation across unpaid invoices
            $unpaidInvoices = $db->prepare("
                SELECT id, invoice_number, total_amount_paisa, paid_amount_paisa, balance_due_paisa
                FROM sales_invoices
                WHERE customer_id = ? AND balance_due_paisa > 0
                ORDER BY created_at ASC
            ");
            $unpaidInvoices->execute([$customerId]);
            $invoices = $unpaidInvoices->fetchAll();

            $remainingToAllocate = $amountPaisa;
            $insAlloc = $db->prepare("INSERT INTO payment_allocations (payment_id, invoice_id, invoice_number, allocated_amount_paisa) VALUES (?, ?, ?, ?)");
            $updInv = $db->prepare("
                UPDATE sales_invoices 
                SET paid_amount_paisa = paid_amount_paisa + ?, 
                    balance_due_paisa = balance_due_paisa - ?,
                    payment_status = ?
                WHERE id = ?
            ");

            foreach ($invoices as $inv) {
                if ($remainingToAllocate <= 0) break;

                $alloc = min($remainingToAllocate, (int)$inv['balance_due_paisa']);
                $newStatus = ($alloc >= (int)$inv['balance_due_paisa']) ? 'paid' : 'partial';
                $insAlloc->execute([$paymentId, $inv['id'], $inv['invoice_number'], $alloc]);
                $updInv->execute([$alloc, $alloc, $newStatus, $inv['id']]);

                $remainingToAllocate -= $alloc;
            }

            // 3. Update customer outstanding balance (Negative balance represents advance / customer credit)
            $db->prepare("UPDATE customers SET current_balance_paisa = current_balance_paisa - ? WHERE id = ?")
               ->execute([$amountPaisa, $customer['id']]);

            // 4. Create customer ledger entry
            $updatedCust = $db->query("SELECT current_balance_paisa FROM customers WHERE id = '{$customer['id']}'")->fetch();
            $newBal = $updatedCust['current_balance_paisa'];

            $db->prepare("
                INSERT INTO customer_ledger (customer_id, type, description, reference_id, debit_paisa, credit_paisa, balance_paisa, recorded_by)
                VALUES (?, 'PAYMENT', ?, ?, 0, ?, ?, ?)
            ")->execute([$customer['id'], "Payment Received ({$method}" . ($refNo ? " Ref: {$refNo}" : '') . ")", $paymentNum, $amountPaisa, $newBal, $user['display_name']]);

            $db->commit();
            Response::json(['payment_number' => $paymentNum, 'amount' => $amount], 201, 'Payment recorded and ledger updated.');
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Failed to record payment: ' . $e->getMessage(), 500);
        }
    }
}
