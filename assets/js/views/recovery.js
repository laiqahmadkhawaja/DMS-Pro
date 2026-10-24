/**
 * Recovery & Field Collections View
 */

import { Api } from '../api.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';
import { Permissions } from '../permissions.js';

export const RecoveryView = {
  debtors: [],
  recentPayments: [],
  summary: null,

  async render(container) {
    container.innerHTML = `
      <div class="space-y-4">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-main">Receivables & Debt Recovery</h1>
            <p class="text-xs sm:text-sm text-muted-custom">Monitor overdue client balances, record field cash collections, and track payment vouchers.</p>
          </div>
          <div class="flex items-center gap-2">
            ${Permissions.can('recovery', 'record_payment') ? `
              <button id="record-payment-modal-btn" class="btn btn-primary btn-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                <span>+ Collect Payment</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Metric KPI Banner -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4" id="recovery-kpis-grid">
          <div class="card p-4 skeleton h-20"></div>
          <div class="card p-4 skeleton h-20"></div>
        </div>

        <!-- Main Debtor & Payment Tables -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- Debtors with Outstanding Balances -->
          <div class="card overflow-hidden">
            <div class="p-4 border-b border-custom">
              <h3 class="text-sm font-bold text-main">Retail Accounts with Overdue Balances</h3>
            </div>
            <div class="table-responsive">
              <table class="data-table text-xs">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Route</th>
                    <th class="text-right">Balance Due</th>
                    <th class="text-right">Action</th>
                  </tr>
                </thead>
                <tbody id="debtors-table-tbody">
                  <tr><td colspan="4" class="text-center py-6 text-muted-custom">Loading debtors...</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Recent Payment Vouchers -->
          <div class="card overflow-hidden">
            <div class="p-4 border-b border-custom">
              <h3 class="text-sm font-bold text-main">Recent Collection Vouchers</h3>
            </div>
            <div class="table-responsive">
              <table class="data-table text-xs">
                <thead>
                  <tr>
                    <th>Voucher #</th>
                    <th>Customer</th>
                    <th>Method</th>
                    <th class="text-right">Amount</th>
                    <th>Collected By</th>
                  </tr>
                </thead>
                <tbody id="payments-table-tbody">
                  <tr><td colspan="5" class="text-center py-6 text-muted-custom">Loading payments...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    await this.loadRecoveryData();
    this.bindEvents();
  },

  async loadRecoveryData() {
    try {
      const res = await Api.get('/recovery');
      if (res.success && res.data) {
        this.debtors = res.data.debtors || [];
        this.recentPayments = res.data.recent_payments || [];
        this.summary = res.data.summary || {};
        this.renderKpis();
        this.renderDebtors();
        this.renderPayments();
      }
    } catch (e) {
      Toast.error('Failed to load recovery: ' + e.message);
    }
  },

  renderKpis() {
    const grid = document.getElementById('recovery-kpis-grid');
    if (!grid || !this.summary) return;

    grid.innerHTML = `
      <div class="card p-4">
        <span class="text-xs text-muted-custom uppercase font-semibold">Total Outstanding Receivables</span>
        <div class="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
          Rs. ${this.summary.total_receivables.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
      </div>
      <div class="card p-4">
        <span class="text-xs text-muted-custom uppercase font-semibold">Debtor Accounts</span>
        <div class="text-2xl font-bold text-main mt-1">${this.summary.debtor_count} Retail Stores</div>
      </div>
    `;
  },

  renderDebtors() {
    const tbody = document.getElementById('debtors-table-tbody');
    if (!tbody) return;

    if (this.debtors.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center py-6 text-emerald-600 font-semibold">No overdue customer accounts! All balances are cleared.</td></tr>';
      return;
    }

    tbody.innerHTML = this.debtors.map(d => `
      <tr>
        <td>
          <div class="font-bold text-main">${d.shop_name}</div>
          <div class="text-[11px] text-muted-custom">${d.owner_name} &bull; ${d.code}</div>
        </td>
        <td class="text-xs text-muted-custom">${d.territory_route}</td>
        <td class="text-right font-bold text-rose-600 dark:text-rose-400">
          Rs. ${d.current_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </td>
        <td class="text-right whitespace-nowrap">
          <button class="btn btn-primary btn-sm p-1.5 quick-collect-btn" data-id="${d.id}" data-name="${d.shop_name}" data-bal="${d.current_balance}" title="Collect Payment">
            Collect
          </button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.quick-collect-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        const bal = parseFloat(btn.getAttribute('data-bal'));
        this.openPaymentModal(id, name, bal);
      });
    });
  },

  renderPayments() {
    const tbody = document.getElementById('payments-table-tbody');
    if (!tbody) return;

    if (this.recentPayments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center py-6 text-muted-custom">No payment collection vouchers recorded yet.</td></tr>';
      return;
    }

    tbody.innerHTML = this.recentPayments.map(p => `
      <tr>
        <td class="font-mono font-bold text-xs text-primary">${p.payment_number}</td>
        <td>
          <div class="font-semibold text-main">${p.customer_name}</div>
          <div class="text-[10px] text-subtle-custom">${new Date(p.payment_date).toLocaleDateString('en-GB')}</div>
        </td>
        <td><span class="badge badge-muted text-[10px]">${p.payment_method}</span></td>
        <td class="text-right font-bold text-emerald-600 dark:text-emerald-400">
          Rs. ${p.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </td>
        <td class="text-xs text-muted-custom">${p.collected_by_name || 'Staff'}</td>
      </tr>
    `).join('');
  },

  bindEvents() {
    document.getElementById('record-payment-modal-btn')?.addEventListener('click', () => {
      this.openPaymentModal();
    });
  },

  openPaymentModal(preselectedId = '', preselectedName = '', defaultAmount = 0) {
    const custOptions = this.debtors.map(d => `
      <option value="${d.id}" data-bal="${d.current_balance}" ${d.id === preselectedId ? 'selected' : ''}>
        ${d.shop_name} (Due: Rs. ${d.current_balance.toLocaleString()})
      </option>
    `).join('');

    Modal.open({
      title: 'Record Debt Collection Payment',
      size: 'md',
      bodyHtml: `
        <div class="space-y-3">
          <div>
            <label class="form-label text-xs">Customer Account *</label>
            <select id="pay-customer-select" class="form-select text-xs">
              <option value="">-- Choose Customer --</option>
              ${custOptions}
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="form-label text-xs">Amount Collected (Rs.) *</label>
              <input type="number" id="pay-amount" class="form-input text-xs font-bold text-emerald-600" value="${defaultAmount || ''}" step="100" min="1" placeholder="Rs. 0.00">
            </div>
            <div>
              <label class="form-label text-xs">Payment Method *</label>
              <select id="pay-method" class="form-select text-xs">
                <option value="Cash">Cash</option>
                <option value="Cheque">Bank Cheque</option>
                <option value="Online / Bank Transfer">Online / Bank Transfer</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="form-label text-xs">Reference / Cheque #</label>
              <input type="text" id="pay-ref" class="form-input text-xs" placeholder="e.g. CHQ-449102">
            </div>
            <div>
              <label class="form-label text-xs">Collection Date</label>
              <input type="date" id="pay-date" class="form-input text-xs" value="${new Date().toISOString().split('T')[0]}">
            </div>
          </div>

          <div>
            <label class="form-label text-xs">Notes / Remarks</label>
            <input type="text" id="pay-notes" class="form-input text-xs" placeholder="Payment receipt remarks...">
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" onclick="window.Modal.close()">Cancel</button>
        <button class="btn btn-primary btn-sm" id="confirm-payment-btn">Record Voucher</button>
      `,
      onOpen: (modalEl) => {
        const select = modalEl.querySelector('#pay-customer-select');
        const amtInput = modalEl.querySelector('#pay-amount');

        select?.addEventListener('change', () => {
          const opt = select.options[select.selectedIndex];
          const due = opt?.getAttribute('data-bal');
          if (due && !amtInput.value) {
            amtInput.value = due;
          }
        });

        modalEl.querySelector('#confirm-payment-btn')?.addEventListener('click', async () => {
          const customerId = select.value;
          const amount = parseFloat(amtInput.value) || 0;
          const method = modalEl.querySelector('#pay-method')?.value;
          const refNo = modalEl.querySelector('#pay-ref')?.value.trim();
          const pDate = modalEl.querySelector('#pay-date')?.value;
          const notes = modalEl.querySelector('#pay-notes')?.value.trim();

          if (!customerId || amount <= 0) {
            Toast.error('Please choose a customer and enter valid payment amount.');
            return;
          }

          try {
            const res = await Api.post('/recovery/payments', {
              customer_id: customerId,
              amount,
              payment_method: method,
              reference_number: refNo,
              payment_date: pDate,
              notes
            });

            if (res.success) {
              Toast.success(`Payment voucher ${res.data.payment_number} recorded successfully!`);
              Modal.close();
              await this.loadRecoveryData();
            }
          } catch (e) {
            console.error(e);
          }
        });
      }
    });
  }
};
