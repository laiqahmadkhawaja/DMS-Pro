/**
 * Orders & Dispatch Pipeline View
 */

import { Api } from '../api.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';
import { Confirm } from '../components/confirm.js';
import { Permissions } from '../permissions.js';
import { DeliveryChallan } from '../utils/delivery-challan.js';

export const OrdersView = {
  orders: [],
  drivers: [],
  currentFilter: '',
  searchQuery: '',

  async render(container) {
    container.innerHTML = `
      <div class="space-y-4">
        <!-- Action Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-main">Order Tracking & Logistics</h1>
            <p class="text-xs sm:text-sm text-muted-custom">Manage order lifecycle from submission through warehouse approval and fleet delivery.</p>
          </div>
          <div class="flex items-center gap-2">
            ${Permissions.can('order_create', 'create') ? `
              <a href="#order-create" class="btn btn-primary btn-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                <span>+ Book Order</span>
              </a>
            ` : ''}
          </div>
        </div>

        <!-- Filter Controls -->
        <div class="card p-3 sm:p-4">
          <div class="flex flex-col md:flex-row items-center justify-between gap-3">
            <!-- Search -->
            <div class="relative w-full md:w-80">
              <input type="search" id="order-search-input" class="form-input pl-9 text-xs" placeholder="Search order #, customer, or code..." autocomplete="off">
              <svg class="w-4 h-4 text-subtle-custom absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>

            <!-- Status Tabs -->
            <div class="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0" id="order-status-tabs">
              <button class="btn btn-primary btn-sm order-tab active" data-status="">All</button>
              <button class="btn btn-secondary btn-sm order-tab" data-status="submitted">Submitted</button>
              <button class="btn btn-secondary btn-sm order-tab" data-status="approved">Approved</button>
              <button class="btn btn-secondary btn-sm order-tab" data-status="dispatched">Dispatched</button>
              <button class="btn btn-secondary btn-sm order-tab" data-status="delivered">Delivered</button>
              <button class="btn btn-secondary btn-sm order-tab" data-status="cancelled">Cancelled</button>
            </div>
          </div>
        </div>

        <!-- Orders Table / Mobile Cards -->
        <div class="card overflow-hidden">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date & Time</th>
                  <th>Customer / Shop</th>
                  <th>Route</th>
                  <th>Sales Rep</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody id="orders-table-tbody">
                <tr><td colspan="8" class="text-center py-8 text-muted-custom">Loading orders...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    await this.loadInitialData();
    this.bindEvents();

    // Check if URL has ?id=ORD-... to auto-open inspector modal
    const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const autoId = hashParams.get('id');
    if (autoId) {
      this.openOrderModal(autoId);
    }
  },

  async loadInitialData() {
    try {
      const [orderRes, userRes] = await Promise.all([
        Api.get('/orders'),
        Api.get('/users')
      ]);

      this.orders = orderRes.data || [];
      const users = userRes.data || [];
      this.drivers = users.filter(u => u.role_slug === 'delivery_man' && u.active);

      this.renderTable();
    } catch (e) {
      Toast.error('Failed to load orders: ' + e.message);
    }
  },

  bindEvents() {
    document.getElementById('order-search-input')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderTable();
    });

    document.getElementById('order-status-tabs')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.order-tab');
      if (btn) {
        this.currentFilter = btn.getAttribute('data-status');
        document.querySelectorAll('.order-tab').forEach(b => {
          b.className = 'btn btn-secondary btn-sm order-tab';
        });
        btn.className = 'btn btn-primary btn-sm order-tab';
        this.renderTable();
      }
    });
  },

  renderTable() {
    const tbody = document.getElementById('orders-table-tbody');
    if (!tbody) return;

    const filtered = this.orders.filter(o => {
      const matchStatus = !this.currentFilter || o.status === this.currentFilter;
      const matchSearch = !this.searchQuery || 
        o.order_number.toLowerCase().includes(this.searchQuery) ||
        o.customer_name.toLowerCase().includes(this.searchQuery) ||
        (o.customer_code && o.customer_code.toLowerCase().includes(this.searchQuery)) ||
        o.route.toLowerCase().includes(this.searchQuery);
      return matchStatus && matchSearch;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-muted-custom">No matching orders found.</td></tr>';
      return;
    }

    const statusBadge = (s) => {
      if (s === 'delivered') return '<span class="badge badge-success">Delivered</span>';
      if (s === 'dispatched') return '<span class="badge badge-info">Dispatched</span>';
      if (s === 'approved') return '<span class="badge badge-warning">Approved</span>';
      if (s === 'cancelled') return '<span class="badge badge-danger">Cancelled</span>';
      return '<span class="badge badge-muted">Submitted</span>';
    };

    tbody.innerHTML = filtered.map(o => `
      <tr>
        <td>
          <button type="button" class="font-mono font-bold text-xs text-primary hover:underline inspect-order-btn" data-id="${o.id}">
            ${o.order_number}
          </button>
        </td>
        <td class="text-xs text-muted-custom whitespace-nowrap">${new Date(o.created_at).toLocaleDateString('en-GB')} ${new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
        <td>
          <div class="font-semibold text-main">${o.customer_name}</div>
          <div class="text-[11px] text-subtle-custom font-mono">${o.customer_code || ''}</div>
        </td>
        <td class="text-xs text-muted-custom">${o.route}</td>
        <td class="text-xs text-main">${o.order_taker_name}</td>
        <td class="font-bold text-main whitespace-nowrap">Rs. ${o.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td>${statusBadge(o.status)}</td>
        <td class="text-right whitespace-nowrap">
          <button class="btn btn-secondary btn-sm inspect-order-btn" data-id="${o.id}">
            Inspect
          </button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.inspect-order-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.openOrderModal(id);
      });
    });
  },

  async openOrderModal(orderId) {
    try {
      const res = await Api.get(`/orders/${orderId}`);
      if (!res.success || !res.data) return;
      const order = res.data;

      const canApprove = Permissions.can('orders', 'approve') && order.status === 'submitted';
      const canDispatch = Permissions.can('orders', 'dispatch') && (order.status === 'approved' || order.status === 'submitted');
      const canDeliver = (Permissions.can('orders', 'deliver') || Permissions.can('delivery', 'confirm_delivery')) && (order.status === 'dispatched' || order.status === 'out_for_delivery');
      const canCancel = Permissions.can('orders', 'cancel') && order.status !== 'cancelled' && order.status !== 'delivered';

      const itemsRows = order.items.map(it => `
        <tr>
          <td class="font-medium text-main">${it.product_name}</td>
          <td class="text-center font-bold">${it.quantity}</td>
          <td class="text-right">Rs. ${it.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td class="text-right font-bold text-main">Rs. ${it.line_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        </tr>
      `).join('');

      const eventsLog = order.events.map(ev => `
        <div class="flex items-start gap-2 text-xs py-1.5 border-b border-custom last:border-0">
          <span class="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></span>
          <div class="flex-1">
            <span class="font-bold text-main">${ev.action}</span>
            <span class="text-muted-custom">(${ev.user_name || 'System'})</span>
            <div class="text-[11px] text-muted-custom">${ev.note || ''}</div>
          </div>
          <span class="text-[10px] text-subtle-custom whitespace-nowrap">${new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      `).join('');

      Modal.open({
        title: `Order #${order.order_number}`,
        size: 'lg',
        bodyHtml: `
          <div class="space-y-4">
            <!-- Customer & Route Metadata Header -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-muted-custom rounded-lg text-xs">
              <div>
                <span class="text-subtle-custom block">Customer:</span>
                <span class="font-bold text-main">${order.customer_name}</span>
              </div>
              <div>
                <span class="text-subtle-custom block">Territory Route:</span>
                <span class="font-bold text-main">${order.route}</span>
              </div>
              <div>
                <span class="text-subtle-custom block">Phone:</span>
                <a href="tel:${order.customer_phone || ''}" class="font-bold text-primary">${order.customer_phone || 'N/A'}</a>
              </div>
              <div>
                <span class="text-subtle-custom block">Current Status:</span>
                <span class="badge badge-primary font-bold uppercase text-[10px]">${order.status}</span>
              </div>
            </div>

            <!-- Items Table -->
            <div class="border border-custom rounded-lg overflow-hidden">
              <table class="data-table text-xs">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th class="text-center">Qty</th>
                    <th class="text-right">Unit Rate</th>
                    <th class="text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>
            </div>

            <!-- Financials Summary -->
            <div class="p-3 bg-surface-elevated border border-custom rounded-lg flex flex-col sm:flex-row justify-between items-end sm:items-center text-xs gap-2">
              <div class="text-muted-custom">
                Subtotal: <strong>Rs. ${order.subtotal.toLocaleString()}</strong> &bull; Tax (5%): <strong>Rs. ${order.tax.toLocaleString()}</strong> &bull; Discount: <strong>Rs. ${order.discount.toLocaleString()}</strong>
              </div>
              <div class="text-base font-bold text-main">
                Grand Total: <span class="text-primary">Rs. ${order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <!-- Verified POD if Delivered -->
            ${order.status === 'delivered' ? `
              <div class="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg space-y-2 text-xs">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider text-[11px]">✓ Verified Proof of Delivery (POD)</span>
                  <span class="text-muted-custom font-mono">${order.delivered_at ? new Date(order.delivered_at).toLocaleDateString('en-GB') : 'Recorded'}</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <span class="text-subtle-custom block">Received By Name:</span>
                    <strong class="text-main">${order.received_by_name || 'Authorized Recipient'}</strong>
                  </div>
                  <div>
                    <span class="text-subtle-custom block">Relation / Designation:</span>
                    <strong class="text-main">${order.received_by_relation || 'Staff / Owner'}</strong>
                  </div>
                </div>
                ${order.pod_signature ? `
                  <div>
                    <span class="text-subtle-custom block mb-1">Recipient Digital Signature:</span>
                    <div class="border border-custom rounded bg-white p-1 inline-block h-20 shadow-inner">
                      <img src="${order.pod_signature}" alt="Customer Signature" class="max-h-full max-w-xs object-contain">
                    </div>
                  </div>
                ` : ''}
                <div class="flex items-center justify-between pt-2 border-t border-emerald-200 dark:border-emerald-800">
                  <span class="text-[11px] text-muted-custom font-medium">Digital Receipt & Signature on file</span>
                  <button type="button" class="btn btn-secondary btn-sm text-xs py-1 px-2.5 inline-flex items-center gap-1 text-primary view-challan-from-pod-btn">
                    <svg class="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    <span>View Delivery Challan</span>
                  </button>
                </div>
              </div>
            ` : ''}

            <!-- Audit Trail -->
            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-muted-custom mb-2">Workflow Audit Timeline</h4>
              <div class="p-3 bg-muted-custom rounded-lg max-h-36 overflow-y-auto">
                ${eventsLog || '<p class="text-xs text-muted-custom">No audit events recorded.</p>'}
              </div>
            </div>
          </div>
        `,
        footerHtml: `
          <button class="btn btn-secondary btn-sm flex items-center gap-1.5" id="modal-print-challan-btn">
            <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <span>Delivery Challan</span>
          </button>
          <button class="btn btn-secondary btn-sm flex items-center gap-1.5" id="modal-print-invoice-btn">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            <span>Tax Invoice</span>
          </button>
          ${canCancel ? `<button class="btn btn-danger btn-sm" id="modal-cancel-order-btn">Cancel Order</button>` : ''}
          ${canApprove ? `<button class="btn btn-warning btn-sm" id="modal-approve-order-btn">Approve Order</button>` : ''}
          ${canDispatch ? `<button class="btn btn-primary btn-sm" id="modal-dispatch-order-btn">Dispatch to Driver</button>` : ''}
          ${canDeliver ? `<a href="#delivery-details?id=${order.id}" class="btn btn-success btn-sm inline-flex items-center gap-1" onclick="window.Modal.close()"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg><span>Sign & Deliver (POD)</span></a>` : ''}
        `,
        onOpen: (modalEl) => {
          // Challan handlers
          modalEl.querySelector('#modal-print-challan-btn')?.addEventListener('click', () => {
            DeliveryChallan.openModal(order.id);
          });
          modalEl.querySelector('.view-challan-from-pod-btn')?.addEventListener('click', () => {
            DeliveryChallan.openModal(order.id);
          });

          // Print invoice handler
          modalEl.querySelector('#modal-print-invoice-btn')?.addEventListener('click', () => {
            if (window.openInvoiceModal) {
              window.openInvoiceModal(order.id);
            } else {
              this.printInvoice(order.id);
            }
          });

          // Cancel handler
          modalEl.querySelector('#modal-cancel-order-btn')?.addEventListener('click', async () => {
            const ok = await Confirm.ask({
              title: 'Cancel Order',
              message: `Are you sure you want to cancel order ${order.order_number}? Allocated stock will be restored.`,
              isDanger: true,
              confirmText: 'Yes, Cancel Order'
            });
            if (ok) {
              await this.updateOrderStatus(order.id, 'cancelled', 'Cancelled by user');
              Modal.close();
            }
          });

          // Approve handler
          modalEl.querySelector('#modal-approve-order-btn')?.addEventListener('click', async () => {
            await this.updateOrderStatus(order.id, 'approved', 'Approved for warehouse picking');
            Modal.close();
          });

          // Dispatch handler
          modalEl.querySelector('#modal-dispatch-order-btn')?.addEventListener('click', async () => {
            this.openDispatchPrompt(order);
          });

          // Deliver handler
          modalEl.querySelector('#modal-deliver-order-btn')?.addEventListener('click', async () => {
            const ok = await Confirm.ask({
              title: 'Confirm Delivery',
              message: `Confirm that ${order.order_number} has been received by ${order.customer_name}? An invoice will be posted to the customer ledger.`,
              confirmText: 'Confirm Delivered'
            });
            if (ok) {
              await this.updateOrderStatus(order.id, 'delivered', 'Delivery confirmed and receipt verified');
              Modal.close();
            }
          });
        }
      });
    } catch (e) {
      Toast.error('Failed to load order details: ' + e.message);
    }
  },

  openDispatchPrompt(order) {
    const driverOptions = this.drivers.map(d => `
      <option value="${d.uid}">${d.display_name} (${d.territory_route})</option>
    `).join('');

    Modal.open({
      title: `Dispatch Order #${order.order_number}`,
      bodyHtml: `
        <div class="space-y-3">
          <p class="text-xs text-muted-custom">Assign a fleet driver to deliver this shipment to <strong>${order.customer_name}</strong>.</p>
          <div>
            <label class="form-label text-xs">Assign Driver *</label>
            <select id="dispatch-driver-select" class="form-select">
              <option value="">-- Choose Driver --</option>
              ${driverOptions}
            </select>
          </div>
          <div>
            <label class="form-label text-xs">Dispatch Notes / Gate Pass #</label>
            <input type="text" id="dispatch-notes-input" class="form-input text-xs" placeholder="e.g. Vehicle # LE-204, Gate Pass # GP-109">
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" onclick="window.Modal.close()">Cancel</button>
        <button class="btn btn-primary btn-sm" id="confirm-dispatch-btn">Dispatch Now</button>
      `,
      onOpen: (modalEl) => {
        modalEl.querySelector('#confirm-dispatch-btn')?.addEventListener('click', async () => {
          const driverId = modalEl.querySelector('#dispatch-driver-select')?.value;
          const notes = modalEl.querySelector('#dispatch-notes-input')?.value || 'Dispatched';
          if (!driverId) {
            Toast.error('Please assign a driver.');
            return;
          }
          await this.updateOrderStatus(order.id, 'dispatched', notes, driverId);
          Modal.close();
        });
      }
    });
  },

  async updateOrderStatus(orderId, status, notes = '', driverId = null) {
    try {
      const res = await Api.post(`/orders/${orderId}/status`, {
        status,
        notes,
        driver_id: driverId
      });
      if (res.success) {
        Toast.success(res.message || `Order updated to ${status}.`);
        await this.loadInitialData();
      }
    } catch (e) {
      console.error(e);
    }
  },

  async printInvoice(orderId) {
    try {
      const res = await Api.get(`/orders/${orderId}/invoice`);
      if (!res.success) return;

      const { company, order, customer } = res.data;

      const printWin = window.open('', '_blank');
      if (!printWin) {
        Toast.error('Popup blocked. Please allow popups to print invoices.');
        return;
      }

      const rows = order.items.map((it, idx) => `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td>${it.product_name}</td>
          <td style="text-align:center;">${it.quantity}</td>
          <td style="text-align:right;">Rs. ${it.unit_price.toFixed(2)}</td>
          <td style="text-align:right;font-weight:bold;">Rs. ${it.line_total.toFixed(2)}</td>
        </tr>
      `).join('');

      printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice - ${order.order_number}</title>
          <link rel="stylesheet" href="${(window.__DMS_CONFIG__?.basePath || '')}/assets/css/print.css">
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ccc; padding: 8px; font-size: 11px; }
            th { background: #f5f5f5; text-align: left; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h2 style="margin:0;color:#2563eb;">${company.company_name || 'Apex Distribution Logistics Ltd'}</h2>
              <p style="margin:3px 0;font-size:11px;color:#555;">${company.tagline || ''}</p>
              <p style="margin:3px 0;font-size:11px;">${company.address || ''} | Tel: ${company.phone || ''}</p>
            </div>
            <div style="text-align:right;">
              <h3 style="margin:0;">SALES TAX INVOICE</h3>
              <p style="margin:3px 0;font-weight:bold;">Invoice #: ${order.order_number}</p>
              <p style="margin:3px 0;">Date: ${new Date(order.created_at).toLocaleDateString('en-GB')}</p>
            </div>
          </div>

          <div style="margin-top:15px;display:flex;justify-content:space-between;background:#fafafa;padding:10px;border:1px solid #eee;">
            <div>
              <strong>Billed To:</strong><br>
              <strong>${customer.shop_name}</strong> (${customer.owner_name})<br>
              Route: ${customer.territory_route}<br>
              Contact: ${customer.phone || 'N/A'}<br>
              Address: ${customer.address || 'N/A'}
            </div>
            <div style="text-align:right;">
              Payment Terms: Cash on Delivery<br>
              Assigned Route: ${order.route}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:5%;">#</th>
                <th style="width:55%;">Product Description</th>
                <th style="width:10%;text-align:center;">Qty</th>
                <th style="width:15%;text-align:right;">Rate</th>
                <th style="width:15%;text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" style="text-align:right;font-weight:bold;">Subtotal:</td>
                <td style="text-align:right;font-weight:bold;">Rs. ${order.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="4" style="text-align:right;font-weight:bold;">GST Tax (5%):</td>
                <td style="text-align:right;font-weight:bold;">Rs. ${order.tax.toFixed(2)}</td>
              </tr>
              ${order.discount > 0 ? `
              <tr>
                <td colspan="4" style="text-align:right;font-weight:bold;">Discount:</td>
                <td style="text-align:right;font-weight:bold;">- Rs. ${order.discount.toFixed(2)}</td>
              </tr>` : ''}
              <tr>
                <td colspan="4" style="text-align:right;font-weight:bold;font-size:13px;background:#f0f0f0;">Grand Total Payable:</td>
                <td style="text-align:right;font-weight:bold;font-size:13px;background:#f0f0f0;color:#2563eb;">Rs. ${order.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <div class="print-signatures" style="margin-top:50px;display:flex;justify-content:space-between;">
            <div style="border-top:1px dashed #666;width:180px;text-align:center;padding-top:5px;font-size:10px;">
              Prepared By (Sales)
            </div>
            <div style="border-top:1px dashed #666;width:180px;text-align:center;padding-top:5px;font-size:10px;">
              Delivered By (Driver)
            </div>
            <div style="border-top:1px dashed #666;width:200px;text-align:center;padding-top:5px;font-size:10px;">
              ${order.pod_signature ? `<img src="${order.pod_signature}" style="max-height:45px;display:block;margin:0 auto 3px;" alt="Signature">` : ''}
              Customer Stamp & Signature<br>
              ${order.received_by_name ? `<strong>Received By: ${order.received_by_name} ${order.received_by_relation ? '(' + order.received_by_relation + ')' : ''}</strong>` : ''}
            </div>
          </div>

          <div style="margin-top:30px;text-align:center;font-size:10px;color:#777;border-top:1px solid #ddd;padding-top:8px;">
            ${company.receipt_footer || 'Thank you for your business!'}
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
        </html>
      `);
      printWin.document.close();
    } catch (e) {
      Toast.error('Invoice print failed: ' + e.message);
    }
  }
};
