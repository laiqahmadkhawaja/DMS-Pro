/**
 * Customer Ledger & Statement View
 */

import { Api } from '../api.js';
import { Toast } from '../components/toast.js';
import { PdfShare } from '../utils/pdf-share.js';

export const CustomerLedgerView = {
  currentCustomer: null,
  entries: [],
  allCustomers: [],

  async render(container) {
    const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const custId = hashParams.get('id') || '';

    container.innerHTML = `
      <div class="space-y-4">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-main">Customer Financial Ledger</h1>
            <p class="text-xs sm:text-sm text-muted-custom">Detailed chronological statement of invoices, payments, and running balance.</p>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <button id="print-ledger-btn" class="btn btn-secondary btn-sm" disabled>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              <span>Print</span>
            </button>
            <button id="download-ledger-pdf-btn" class="btn btn-secondary btn-sm" disabled title="Download Official PDF Statement">
              <svg class="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <span>Download PDF</span>
            </button>
            <button id="share-ledger-whatsapp-btn" class="btn btn-secondary btn-sm text-emerald-600 dark:text-emerald-400" disabled title="Share Statement Directly to Customer WhatsApp">
              <svg class="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.697c.983.54 1.803.774 2.806.775l.004-.001c3.182 0 5.768-2.586 5.768-5.766.001-3.182-2.585-5.769-5.772-5.769zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.06-1.809-.427-1.464-.607-2.39-2.094-2.464-2.193-.074-.099-.606-.807-.606-1.54 0-.733.383-1.093.52-1.24.136-.148.3-.186.4-.186.1 0 .201.002.288.006.094.004.22-.036.344.262.129.312.441 1.077.479 1.156.038.079.063.172.012.273-.051.101-.077.164-.153.253-.075.088-.159.197-.227.265-.077.076-.157.159-.068.312.089.153.396.654.85 1.059.584.521 1.076.682 1.229.758.153.076.242.064.331-.039.09-.102.383-.447.485-.6.102-.153.204-.128.344-.077.14.051.892.42 1.045.497.153.076.255.115.293.178.038.064.038.371-.106.776z"/></svg>
              <span>Share WhatsApp</span>
            </button>
          </div>
        </div>

        <!-- Customer Picker Bar -->
        <div class="card p-3 sm:p-4">
          <div class="flex flex-col sm:flex-row items-center gap-3">
            <label class="form-label text-xs sm:whitespace-nowrap sm:mb-0">Select Client Account:</label>
            <select id="ledger-customer-select" class="form-select text-xs flex-1">
              <option value="">-- Choose Customer --</option>
            </select>
          </div>
        </div>

        <!-- Customer Profile Card -->
        <div id="ledger-customer-summary" class="hidden card p-4 bg-muted-custom"></div>

        <!-- Ledger Entries Table -->
        <div class="card overflow-hidden">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Transaction Type</th>
                  <th>Reference #</th>
                  <th>Description</th>
                  <th class="text-right">Debit (Invoice)</th>
                  <th class="text-right">Credit (Payment)</th>
                  <th class="text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody id="ledger-entries-tbody">
                <tr><td colspan="7" class="text-center py-8 text-muted-custom">Please select a customer above to load their ledger statement.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    await this.loadCustomerOptions(custId);
    this.bindEvents();
  },

  async loadCustomerOptions(preselectedId = '') {
    try {
      const res = await Api.get('/customers?active_only=1');
      this.allCustomers = res.data || [];

      const select = document.getElementById('ledger-customer-select');
      if (!select) return;

      select.innerHTML = '<option value="">-- Choose Customer --</option>' +
        this.allCustomers.map(c => `
          <option value="${c.id}" ${c.id === preselectedId ? 'selected' : ''}>
            ${c.shop_name} (${c.owner_name}) &bull; [${c.code}]
          </option>
        `).join('');

      if (preselectedId) {
        await this.loadLedger(preselectedId);
      }
    } catch (e) {
      Toast.error('Failed to load customers: ' + e.message);
    }
  },

  bindEvents() {
    document.getElementById('ledger-customer-select')?.addEventListener('change', async (e) => {
      const id = e.target.value;
      if (id) {
        window.location.hash = `#customer-ledger?id=${id}`;
        await this.loadLedger(id);
      }
    });

    document.getElementById('print-ledger-btn')?.addEventListener('click', () => {
      window.print();
    });

    document.getElementById('download-ledger-pdf-btn')?.addEventListener('click', () => {
      this.downloadPdfStatement();
    });

    document.getElementById('share-ledger-whatsapp-btn')?.addEventListener('click', () => {
      this.shareLedgerWhatsApp();
    });
  },

  async loadLedger(customerId) {
    try {
      const res = await Api.get(`/customers/${customerId}/ledger`);
      if (res.success && res.data) {
        this.currentCustomer = res.data.customer;
        this.entries = res.data.entries || [];
        this.renderCustomerSummary();
        this.renderEntriesTable();

        const printBtn = document.getElementById('print-ledger-btn');
        const pdfBtn = document.getElementById('download-ledger-pdf-btn');
        const shareBtn = document.getElementById('share-ledger-whatsapp-btn');
        if (printBtn) printBtn.disabled = false;
        if (pdfBtn) pdfBtn.disabled = false;
        if (shareBtn) shareBtn.disabled = false;
      }
    } catch (e) {
      Toast.error('Failed to fetch ledger: ' + e.message);
    }
  },

  downloadPdfStatement() {
    if (!this.currentCustomer) return;
    const c = this.currentCustomer;
    const dateStr = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const rowsHtml = this.entries.map(e => `
      <tr>
        <td style="border: 1px solid #e2e8f0; padding: 6px 8px; font-size: 11px;">${new Date(e.created_at).toLocaleDateString('en-GB')} ${new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px 8px; font-size: 11px; font-weight: bold;">${e.type}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px 8px; font-size: 11px; font-family: monospace;">${e.reference_id || '-'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px 8px; font-size: 11px;">${e.description || ''}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px 8px; font-size: 11px; text-align: right; color: ${e.debit > 0 ? '#b91c1c' : '#64748b'};">${e.debit > 0 ? 'Rs. ' + e.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px 8px; font-size: 11px; text-align: right; color: ${e.credit > 0 ? '#15803d' : '#64748b'};">${e.credit > 0 ? 'Rs. ' + e.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px 8px; font-size: 11px; text-align: right; font-weight: bold;">Rs. ${e.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join('');

    const html = `
      <div style="font-family: Arial, sans-serif; color: #1e293b; padding: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0284c7; padding-bottom: 8px; margin-bottom: 12px;">
          <div>
            <h1 style="margin: 0; font-size: 18px; color: #0f172a; text-transform: uppercase;">DMS Enterprise Distribution</h1>
            <p style="margin: 2px 0 0; font-size: 12px; color: #0284c7; font-weight: bold;">Official Customer Account Statement</p>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748b;">
            <div>Statement Date: <strong>${dateStr}</strong></div>
            <div>Account Code: <strong>${c.code}</strong></div>
          </div>
        </div>

        <!-- Customer Summary Box -->
        <div style="display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; margin-bottom: 14px; font-size: 11px;">
          <div>
            <div style="font-size: 13px; font-weight: bold; color: #0f172a;">${c.shop_name}</div>
            <div style="color: #64748b;">Proprietor: ${c.owner_name} &bull; Phone: ${c.phone || '-'}</div>
            <div style="color: #64748b;">Address: ${c.address || '-'} &bull; Route: ${c.territory_route || 'Standard'}</div>
          </div>
          <div style="text-align: right;">
            <div>Credit Limit: <strong>Rs. ${c.credit_limit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></div>
            <div style="font-size: 13px; font-weight: bold; color: #b91c1c; margin-top: 2px;">Outstanding Balance: Rs. ${c.current_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div style="color: #15803d; font-size: 10px;">Available Credit: Rs. ${c.available_credit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
          <thead>
            <tr>
              <th style="border: 1px solid #cbd5e1; padding: 6px 8px; background: #f1f5f9; font-size: 11px; text-align: left;">Date</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px 8px; background: #f1f5f9; font-size: 11px; text-align: left;">Type</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px 8px; background: #f1f5f9; font-size: 11px; text-align: left;">Ref #</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px 8px; background: #f1f5f9; font-size: 11px; text-align: left;">Description</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px 8px; background: #f1f5f9; font-size: 11px; text-align: right;">Debit (Rs.)</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px 8px; background: #f1f5f9; font-size: 11px; text-align: right;">Credit (Rs.)</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px 8px; background: #f1f5f9; font-size: 11px; text-align: right;">Balance (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="7" style="text-align: center; padding: 16px;">No transactions recorded.</td></tr>'}
          </tbody>
        </table>

        <div style="margin-top: 20px; border-top: 1px dashed #cbd5e1; padding-top: 8px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between;">
          <span>Official Distribution Financial Statement</span>
          <span>Thank you for your business!</span>
        </div>
      </div>
    `;

    PdfShare.downloadPdf(html, `Statement_${c.code}_${new Date().toISOString().split('T')[0]}.pdf`, 'a4');
  },

  shareLedgerWhatsApp() {
    if (!this.currentCustomer) return;
    const c = this.currentCustomer;
    const balanceRs = c.current_balance.toLocaleString('en-US', { minimumFractionDigits: 2 });
    const limitRs = c.credit_limit.toLocaleString('en-US', { minimumFractionDigits: 2 });
    const txCount = this.entries.length;

    const options = {
      phone: c.phone || '',
      customerName: c.shop_name,
      docType: 'Official Account Statement',
      refNumber: c.code,
      balanceDue: c.current_balance,
      date: new Date().toLocaleDateString('en-GB'),
      text: `🏛️ *CUSTOMER ACCOUNT STATEMENT*\n\nDear *${c.shop_name}* (${c.owner_name}),\nHere is your financial balance summary:\n\n*Account Code:* ${c.code}\n*Credit Limit:* Rs. ${limitRs}\n*Outstanding Balance:* Rs. ${balanceRs}\n*Total Transactions:* ${txCount}\n\nPlease contact distribution office for any reconciliation.\nThank you for your valued partnership.`
    };

    if (PdfShare.isMobile() && navigator.share) {
      PdfShare.shareNative(options);
    } else {
      PdfShare.shareViaWhatsApp(options);
    }
  },

  renderCustomerSummary() {
    const box = document.getElementById('ledger-customer-summary');
    if (!box || !this.currentCustomer) return;

    box.className = 'card p-4 border-custom';
    box.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <h3 class="text-base font-bold text-main">${this.currentCustomer.shop_name}</h3>
          <p class="text-muted-custom">Owner: ${this.currentCustomer.owner_name} &bull; Code: <span class="font-mono font-bold">${this.currentCustomer.code}</span> &bull; Tel: ${this.currentCustomer.phone || 'N/A'}</p>
        </div>
        <div class="flex items-center gap-4 text-right">
          <div>
            <span class="text-subtle-custom block">Credit Limit</span>
            <span class="font-bold text-main">Rs. ${this.currentCustomer.credit_limit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div>
            <span class="text-subtle-custom block">Outstanding Balance</span>
            <span class="font-bold text-base text-rose-600 dark:text-rose-400">Rs. ${this.currentCustomer.current_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    `;
  },

  renderEntriesTable() {
    const tbody = document.getElementById('ledger-entries-tbody');
    if (!tbody) return;

    if (this.entries.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-muted-custom">No financial ledger transactions recorded for this customer.</td></tr>';
      return;
    }

    tbody.innerHTML = this.entries.map(e => `
      <tr>
        <td class="text-xs text-muted-custom whitespace-nowrap">${new Date(e.created_at).toLocaleDateString('en-GB')} ${new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
        <td>
          <span class="badge ${e.type === 'INVOICE' ? 'badge-info' : 'badge-success'} text-xs font-mono">
            ${e.type}
          </span>
        </td>
        <td class="font-mono font-bold text-xs">
          ${(e.type === 'INVOICE' || (e.reference_id && e.reference_id.startsWith('INV-'))) ? `
            <button type="button" class="text-primary hover:underline font-mono font-bold open-ledger-inv-btn cursor-pointer inline-flex items-center gap-1" data-ref="${e.reference_id}">
              <span>${e.reference_id}</span>
              <svg class="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </button>
          ` : (e.reference_id || 'N/A')}
        </td>
        <td class="text-xs text-main">${e.description || ''}</td>
        <td class="text-right font-semibold text-xs ${e.debit > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-subtle-custom'}">
          ${e.debit > 0 ? `Rs. ${e.debit.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
        </td>
        <td class="text-right font-semibold text-xs ${e.credit > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-subtle-custom'}">
          ${e.credit > 0 ? `Rs. ${e.credit.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
        </td>
        <td class="text-right font-bold text-xs text-main">
          Rs. ${e.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.open-ledger-inv-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const ref = btn.getAttribute('data-ref');
        if (window.openInvoiceModal) {
          window.openInvoiceModal(ref);
        }
      });
    });
  }
};
