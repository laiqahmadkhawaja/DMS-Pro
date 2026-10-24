/**
 * Customer & Retail Account Directory View
 */

import { Api } from '../api.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';
import { Confirm } from '../components/confirm.js';
import { Permissions } from '../permissions.js';

export const CustomersView = {
  customers: [],
  territories: [],
  selectedRoute: '',
  searchQuery: '',

  async render(container) {
    container.innerHTML = `
      <div class="space-y-4">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-main">Customer Accounts & Retailers</h1>
            <p class="text-xs sm:text-sm text-muted-custom">Manage retail shop clients, territory routes, credit limits, and payment terms.</p>
          </div>
          <div class="flex items-center gap-2">
            ${Permissions.can('customers', 'create') ? `
              <button id="add-customer-modal-btn" class="btn btn-primary btn-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                <span>+ Register Customer</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Filter Controls -->
        <div class="card p-3 sm:p-4">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="relative w-full sm:w-80">
              <input type="search" id="customer-search-input" class="form-input pl-9 text-xs" placeholder="Search by shop name, owner, code, or phone..." autocomplete="off">
              <svg class="w-4 h-4 text-subtle-custom absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <div class="w-full sm:w-64">
              <select id="customer-route-filter" class="form-select text-xs">
                <option value="">All Territories & Routes</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Customer Table -->
        <div class="card overflow-hidden">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Shop & Owner</th>
                  <th>Territory Route</th>
                  <th>Contact Phone</th>
                  <th class="text-right">Credit Limit</th>
                  <th class="text-right">Outstanding</th>
                  <th class="text-center">Credit Status</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody id="customers-table-tbody">
                <tr><td colspan="8" class="text-center py-8 text-muted-custom">Loading customer directory...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    await this.loadInitialData();
    this.bindEvents();
  },

  async loadInitialData() {
    try {
      const [custRes, setRes] = await Promise.all([
        Api.get('/customers?active_only=0'),
        Api.get('/settings')
      ]);

      this.customers = custRes.data || [];
      this.territories = setRes.data?.territories || [];

      this.populateRouteFilter();
      this.renderTable();
    } catch (e) {
      Toast.error('Failed to load customers: ' + e.message);
    }
  },

  populateRouteFilter() {
    const select = document.getElementById('customer-route-filter');
    if (!select) return;

    select.innerHTML = '<option value="">All Territories & Routes</option>' +
      this.territories.map(t => `<option value="${t.name}">${t.name}</option>`).join('');
  },

  bindEvents() {
    document.getElementById('customer-search-input')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderTable();
    });

    document.getElementById('customer-route-filter')?.addEventListener('change', (e) => {
      this.selectedRoute = e.target.value;
      this.renderTable();
    });

    document.getElementById('add-customer-modal-btn')?.addEventListener('click', () => {
      this.openCustomerModal();
    });
  },

  renderTable() {
    const tbody = document.getElementById('customers-table-tbody');
    if (!tbody) return;

    const filtered = this.customers.filter(c => {
      const matchRoute = !this.selectedRoute || c.territory_route === this.selectedRoute;
      const matchSearch = !this.searchQuery || 
        c.shop_name.toLowerCase().includes(this.searchQuery) ||
        c.owner_name.toLowerCase().includes(this.searchQuery) ||
        c.code.toLowerCase().includes(this.searchQuery) ||
        (c.phone && c.phone.includes(this.searchQuery));
      return matchRoute && matchSearch;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-muted-custom">No matching customers found.</td></tr>';
      return;
    }

    const canEdit = Permissions.can('customers', 'edit');
    const canLedger = Permissions.can('customer_ledger', 'view');

    tbody.innerHTML = filtered.map(c => {
      const isExceeded = c.current_balance > c.credit_limit;
      const isWarning = c.credit_utilization_pct >= 85 && !isExceeded;

      return `
        <tr class="${!c.active ? 'opacity-50' : ''}">
          <td class="font-mono font-bold text-xs text-primary">${c.code}</td>
          <td>
            <div class="font-semibold text-main">${c.shop_name}</div>
            <div class="text-xs text-muted-custom">${c.owner_name}</div>
          </td>
          <td class="text-xs text-muted-custom">${c.territory_route}</td>
          <td class="text-xs">
            <a href="tel:${c.phone || ''}" class="text-primary hover:underline font-mono">${c.phone || 'N/A'}</a>
          </td>
          <td class="text-right text-xs text-muted-custom">Rs. ${c.credit_limit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td class="text-right font-bold ${c.current_balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-main'}">
            Rs. ${c.current_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </td>
          <td class="text-center">
            ${isExceeded 
              ? '<span class="badge badge-danger text-[10px]">Over Limit</span>' 
              : isWarning 
                ? `<span class="badge badge-warning text-[10px]">${c.credit_utilization_pct}% Used</span>`
                : '<span class="badge badge-success text-[10px]">Good</span>'}
          </td>
          <td class="text-right whitespace-nowrap">
            <div class="flex items-center justify-end gap-1">
              ${canLedger ? `
                <a href="#customer-ledger?id=${c.id}" class="btn btn-secondary btn-sm p-1.5" title="Account Ledger">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </a>
              ` : ''}
              ${canEdit ? `
                <button class="btn btn-secondary btn-sm p-1.5 edit-cust-btn" data-id="${c.id}" title="Edit Customer">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.edit-cust-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const cust = this.customers.find(c => c.id === id);
        if (cust) this.openCustomerModal(cust);
      });
    });
  },

  openCustomerModal(cust = null) {
    const isEdit = cust !== null;
    const routeOptions = this.territories.map(t => `
      <option value="${t.name}" ${cust?.territory_route === t.name ? 'selected' : ''}>${t.name}</option>
    `).join('');

    Modal.open({
      title: isEdit ? `Edit Customer: ${cust.shop_name}` : 'Register New Customer Account',
      size: 'md',
      bodyHtml: `
        <form id="customer-form" class="space-y-3">
          <div>
            <label class="form-label text-xs">Shop / Business Name *</label>
            <input type="text" id="m-cust-shop" class="form-input text-xs" required value="${cust?.shop_name || ''}" placeholder="e.g. Al-Madina Super Store">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="form-label text-xs">Owner / Contact Name *</label>
              <input type="text" id="m-cust-owner" class="form-input text-xs" required value="${cust?.owner_name || ''}" placeholder="e.g. Haji Muhammad Yaqoob">
            </div>
            <div>
              <label class="form-label text-xs">Phone Number</label>
              <input type="text" id="m-cust-phone" class="form-input text-xs" value="${cust?.phone || ''}" placeholder="e.g. +92 300 1234567">
            </div>
          </div>

          <div>
            <label class="form-label text-xs">Territory Route *</label>
            <select id="m-cust-route" class="form-select text-xs" required>
              ${routeOptions}
            </select>
          </div>

          <div>
            <label class="form-label text-xs">Shop Address</label>
            <input type="text" id="m-cust-address" class="form-input text-xs" value="${cust?.address || ''}" placeholder="e.g. Shop 12-14, Commercial Center">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="form-label text-xs">Credit Limit (Rs.)</label>
              <input type="number" id="m-cust-limit" class="form-input text-xs" value="${cust?.credit_limit || 50000}" step="1000">
            </div>
            <div>
              <label class="form-label text-xs">Payment Terms (Days)</label>
              <input type="number" id="m-cust-terms" class="form-input text-xs" value="${cust?.payment_terms_days || 15}" min="1">
            </div>
          </div>
        </form>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" onclick="window.Modal.close()">Cancel</button>
        <button class="btn btn-primary btn-sm" id="save-customer-btn">${isEdit ? 'Save Changes' : 'Register Customer'}</button>
      `,
      onOpen: (modalEl) => {
        modalEl.querySelector('#save-customer-btn')?.addEventListener('click', async () => {
          const shop_name = modalEl.querySelector('#m-cust-shop')?.value.trim();
          const owner_name = modalEl.querySelector('#m-cust-owner')?.value.trim();
          const phone = modalEl.querySelector('#m-cust-phone')?.value.trim();
          const territory_route = modalEl.querySelector('#m-cust-route')?.value;
          const address = modalEl.querySelector('#m-cust-address')?.value.trim();
          const credit_limit = parseFloat(modalEl.querySelector('#m-cust-limit')?.value) || 0;
          const payment_terms_days = parseInt(modalEl.querySelector('#m-cust-terms')?.value) || 15;

          if (!shop_name || !owner_name || !territory_route) {
            Toast.error('Please complete all required fields.');
            return;
          }

          try {
            if (isEdit) {
              await Api.put(`/customers/${cust.id}`, {
                shop_name, owner_name, phone, territory_route, address, credit_limit, payment_terms_days
              });
              Toast.success('Customer updated successfully!');
            } else {
              await Api.post('/customers', {
                shop_name, owner_name, phone, territory_route, address, credit_limit, payment_terms_days
              });
              Toast.success('Customer registered successfully!');
            }
            Modal.close();
            await this.loadInitialData();
          } catch (e) {
            console.error(e);
          }
        });
      }
    });
  }
};
