/**
 * Delivery Driver & Logistics Dashboard View
 */

import { Api } from '../api.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';
import { Confirm } from '../components/confirm.js';
import { Auth } from '../auth.js';

export const DeliveryView = {
  orders: [],

  async render(container) {
    const user = Auth.getUser();

    container.innerHTML = `
      <div class="space-y-4">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-main">Fleet Delivery Run-Sheet</h1>
            <p class="text-xs sm:text-sm text-muted-custom">Dispatched shipments, retail delivery stops, and Cash on Delivery collection.</p>
          </div>
          <div class="flex items-center gap-2">
            <button id="refresh-deliveries-btn" class="btn btn-secondary btn-sm">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <!-- Metric Badges -->
        <div class="grid grid-cols-3 gap-3" id="delivery-stats-bar">
          <div class="card p-3 text-center">
            <span class="text-xs text-muted-custom">Assigned Deliveries</span>
            <div class="text-xl font-bold text-primary" id="stat-total-dispatches">0</div>
          </div>
          <div class="card p-3 text-center">
            <span class="text-xs text-muted-custom">Delivered Today</span>
            <div class="text-xl font-bold text-emerald-600" id="stat-completed-dispatches">0</div>
          </div>
          <div class="card p-3 text-center">
            <span class="text-xs text-muted-custom">COD Value (Rs.)</span>
            <div class="text-xl font-bold text-main" id="stat-cod-amount">Rs. 0</div>
          </div>
        </div>

        <!-- Delivery Stops Grid (Mobile Touch Cards) -->
        <div id="delivery-stops-container" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="card p-4 skeleton h-40"></div>
          <div class="card p-4 skeleton h-40"></div>
        </div>
      </div>
    `;

    await this.loadDeliveries();
    document.getElementById('refresh-deliveries-btn')?.addEventListener('click', () => this.loadDeliveries());
  },

  async loadDeliveries() {
    try {
      const [pendingRes, allRes] = await Promise.all([
        Api.get('/orders?status=dispatched,out_for_delivery'),
        Api.get('/orders')
      ]);

      this.orders = pendingRes.data || [];
      const allOrders = allRes.data || [];
      const deliveredToday = allOrders.filter(o => o.status === 'delivered' || o.status === 'partially_delivered').length;

      this.renderDeliveries(deliveredToday);
    } catch (e) {
      Toast.error('Failed to load dispatches: ' + e.message);
    }
  },

  renderDeliveries(deliveredToday = 0) {
    const container = document.getElementById('delivery-stops-container');
    const totalEl = document.getElementById('stat-total-dispatches');
    const completedEl = document.getElementById('stat-completed-dispatches');
    const codEl = document.getElementById('stat-cod-amount');

    if (!container) return;

    const totalCod = this.orders.reduce((sum, o) => sum + o.total, 0);

    if (totalEl) totalEl.textContent = this.orders.length;
    if (completedEl) completedEl.textContent = deliveredToday;
    if (codEl) codEl.textContent = `Rs. ${totalCod.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    if (this.orders.length === 0) {
      container.innerHTML = `
        <div class="col-span-2 card p-12 text-center text-muted-custom space-y-2">
          <div class="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          </div>
          <h3 class="text-base font-bold text-main">No Pending Dispatches</h3>
          <p class="text-xs">All assigned shipments have been delivered or there are no new orders dispatched today.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.orders.map((o, idx) => `
      <div class="card p-4 flex flex-col justify-between card-hover border-custom">
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="badge badge-primary font-mono text-xs">Stop #${idx + 1} &bull; ${o.order_number}</span>
            <span class="badge ${o.status === 'out_for_delivery' ? 'badge-primary' : 'badge-info'} text-xs font-semibold uppercase">${o.status === 'out_for_delivery' ? '🚚 En Route' : '📦 Dispatched'}</span>
          </div>

          <div>
            <h4 class="text-base font-bold text-main">${o.customer_name}</h4>
            <div class="text-xs text-muted-custom flex items-center gap-1.5 mt-0.5">
              <svg class="w-3.5 h-3.5 text-subtle-custom" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              <span>${o.customer_address || o.route}</span>
            </div>
          </div>

          <div class="p-2.5 bg-muted-custom rounded-lg flex items-center justify-between text-xs">
            <div>
              <span class="text-subtle-custom block">Contact Phone:</span>
              <a href="tel:${o.customer_phone || ''}" class="font-bold text-primary flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                <span>${o.customer_phone || 'Call Customer'}</span>
              </a>
            </div>
            <div class="text-right">
              <span class="text-subtle-custom block">Payable (COD):</span>
              <span class="font-bold text-base text-main">Rs. ${o.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 mt-4 pt-3 border-t border-custom">
          <a href="#delivery-details?id=${o.id}" class="btn btn-secondary btn-sm flex-1 text-center">
            View Details
          </a>
          <a href="#delivery-details?id=${o.id}" class="btn btn-success btn-sm flex-1 text-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
            <span>Sign & Deliver</span>
          </a>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.view-delivery-detail-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        window.location.hash = `#orders?id=${id}`;
      });
    });

    container.querySelectorAll('.confirm-delivery-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const order = this.orders.find(o => o.id === id);
        if (!order) return;

        const ok = await Confirm.ask({
          title: 'Confirm Client Delivery',
          message: `Confirm that shipment for <strong>${order.customer_name}</strong> has been handed over? Invoice of Rs. ${order.total.toLocaleString()} will be posted.`,
          confirmText: 'Confirm Delivered'
        });

        if (ok) {
          try {
            const res = await Api.post(`/orders/${id}/status`, {
              status: 'delivered',
              notes: 'Delivered by fleet driver'
            });
            if (res.success) {
              Toast.success('Delivery marked as successfully completed!');
              await this.loadDeliveries();
            }
          } catch (e) {
            console.error(e);
          }
        }
      });
    });
  }
};
