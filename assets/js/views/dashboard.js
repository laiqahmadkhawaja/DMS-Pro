/**
 * Dashboard View
 */

import { Api } from '../api.js';
import { Permissions } from '../permissions.js';

export const DashboardView = {
  async render(container) {
    container.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-main">Executive Overview</h1>
            <p class="text-xs sm:text-sm text-muted-custom">Real-time distribution performance, sales velocity, and inventory alerts.</p>
          </div>
          <div class="flex items-center gap-2">
            ${Permissions.can('order_create', 'create') ? `
              <a href="#order-create" class="btn btn-primary btn-sm sm:btn">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                <span>Book Order</span>
              </a>
            ` : ''}
          </div>
        </div>

        <!-- KPI Grid -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" id="kpi-cards-grid">
          <div class="card p-4 skeleton h-24"></div>
          <div class="card p-4 skeleton h-24"></div>
          <div class="card p-4 skeleton h-24"></div>
          <div class="card p-4 skeleton h-24"></div>
        </div>

        <!-- Expiry Watch & Near-Expiry Alert Banner -->
        <div id="dashboard-expiry-banner" class="hidden"></div>

        <!-- Velocity Chart & Category Breakdown -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- 7-Day Velocity -->
          <div class="card p-4 sm:p-5 lg:col-span-2">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-base font-bold text-main">7-Day Sales Velocity</h3>
                <p class="text-xs text-muted-custom">Daily completed and approved orders</p>
              </div>
              <span class="badge badge-info">Live Stream</span>
            </div>
            <div id="velocity-chart-container" class="h-56 flex items-center justify-center">
              <div class="skeleton w-full h-full"></div>
            </div>
          </div>

          <!-- Category Sales Breakdown -->
          <div class="card p-4 sm:p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-bold text-main">Sales by Category</h3>
              <span class="text-xs text-muted-custom">Volume</span>
            </div>
            <div id="category-breakdown-list" class="space-y-3">
              <div class="skeleton h-8 w-full"></div>
              <div class="skeleton h-8 w-full"></div>
              <div class="skeleton h-8 w-full"></div>
            </div>
          </div>
        </div>

        <!-- Recent Orders Table -->
        <div class="card overflow-hidden">
          <div class="p-4 sm:p-5 border-b border-custom flex items-center justify-between">
            <div>
              <h3 class="text-base font-bold text-main">Recent Dispatches & Orders</h3>
              <p class="text-xs text-muted-custom">Latest transactions across all assigned routes</p>
            </div>
            <a href="#orders" class="text-xs font-semibold text-primary hover:underline">View All &rarr;</a>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Territory</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th class="text-right">Action</th>
                </tr>
              </thead>
              <tbody id="recent-orders-tbody">
                <tr><td colspan="6" class="text-center py-6 text-muted-custom">Loading orders...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    try {
      const res = await Api.get('/reports/dashboard');
      if (res.success && res.data) {
        this.renderKpis(res.data.kpis);
        this.renderExpiryAlerts(res.data.kpis, res.data.near_expiry_products);
        this.renderVelocityChart(res.data.velocity);
        this.renderCategoryBreakdown(res.data.category_breakdown);
        this.renderRecentOrders(res.data.recent_orders);
      }
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    }
  },

  renderKpis(kpis) {
    const grid = document.getElementById('kpi-cards-grid');
    if (!grid) return;

    grid.innerHTML = `
      <div class="card p-4 card-hover">
        <div class="flex items-center justify-between text-muted-custom mb-1">
          <span class="text-xs font-semibold uppercase tracking-wider">Today's Sales</span>
          <span class="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </span>
        </div>
        <div class="text-xl sm:text-2xl font-bold text-main">Rs. ${kpis.sales_today.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div class="text-xs text-muted-custom mt-1">Month: Rs. ${kpis.sales_month.toLocaleString('en-US', { minimumFractionDigits: 0 })}</div>
      </div>

      <div class="card p-4 card-hover">
        <div class="flex items-center justify-between text-muted-custom mb-1">
          <span class="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
          <span class="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          </span>
        </div>
        <div class="text-xl sm:text-2xl font-bold text-main">${kpis.total_orders}</div>
        <div class="text-xs text-amber-500 font-semibold mt-1">${kpis.pending_dispatches} Pending Dispatches</div>
      </div>

      <div class="card p-4 card-hover">
        <div class="flex items-center justify-between text-muted-custom mb-1">
          <span class="text-xs font-semibold uppercase tracking-wider">Receivables</span>
          <span class="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          </span>
        </div>
        <div class="text-xl sm:text-2xl font-bold text-main">Rs. ${kpis.total_receivables.toLocaleString('en-US', { minimumFractionDigits: 0 })}</div>
        <div class="text-xs text-muted-custom mt-1"><a href="#recovery" class="hover:underline text-primary">Manage Recovery &rarr;</a></div>
      </div>

      <div class="card p-4 card-hover">
        <div class="flex items-center justify-between text-muted-custom mb-1">
          <span class="text-xs font-semibold uppercase tracking-wider">Stock Alerts</span>
          <span class="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </span>
        </div>
        <div class="text-xl sm:text-2xl font-bold text-main">${kpis.low_stock_alerts}</div>
        <div class="text-xs text-rose-500 font-semibold mt-1">Reorder Required</div>
      </div>
    `;
  },

  renderExpiryAlerts(kpis, nearExpiryProducts = []) {
    const banner = document.getElementById('dashboard-expiry-banner');
    if (!banner) return;

    const totalAlerts = (kpis.expired_alerts || 0) + (kpis.near_expiry_alerts || 0);
    if (totalAlerts === 0) {
      banner.className = 'hidden';
      banner.innerHTML = '';
      return;
    }

    const hasExpired = (kpis.expired_alerts || 0) > 0;
    const borderClass = hasExpired ? 'border-rose-400 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/30' : 'border-amber-400 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30';

    const itemsChips = (nearExpiryProducts || []).slice(0, 4).map(p => {
      const isExp = p.days_to_expiry < 0;
      return `
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${isExp ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800' : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800'}">
          <span class="font-bold">${p.sku}</span>: ${p.name.slice(0, 18)} (${isExp ? 'Expired ' + Math.abs(p.days_to_expiry) + 'd ago' : p.days_to_expiry + 'd left'}, ${p.current_stock} pcs)
        </span>
      `;
    }).join('');

    banner.className = `p-4 rounded-xl border ${borderClass} space-y-2.5`;
    banner.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="text-xl">⚠️</span>
          <div>
            <h4 class="text-sm font-bold text-main flex items-center gap-2">
              <span>Inventory Expiry Alert</span>
              ${hasExpired ? `<span class="badge badge-danger text-[10px] uppercase font-bold">${kpis.expired_alerts} Expired</span>` : ''}
              ${kpis.near_expiry_alerts > 0 ? `<span class="badge badge-warning text-[10px] uppercase font-bold">${kpis.near_expiry_alerts} Expiring &le;30d</span>` : ''}
            </h4>
            <p class="text-xs text-muted-custom">
              ${hasExpired ? `${kpis.expired_alerts} SKUs have expired and require warehouse clearance.` : ''}
              ${kpis.near_expiry_alerts > 0 ? `${kpis.near_expiry_alerts} SKUs are approaching expiry within 30 days.` : ''}
            </p>
          </div>
        </div>

        <a href="#products?expiry=alerts" class="btn btn-secondary btn-sm text-xs font-semibold whitespace-nowrap self-start sm:self-center">
          <span>Manage Expiry Batches &rarr;</span>
        </a>
      </div>

      ${itemsChips ? `
        <div class="flex items-center gap-2 flex-wrap pt-1 border-t border-custom/40">
          <span class="text-[11px] text-muted-custom font-medium">Urgent Watchlist:</span>
          ${itemsChips}
        </div>
      ` : ''}
    `;
  },

  renderVelocityChart(velocity) {
    const container = document.getElementById('velocity-chart-container');
    if (!container || !velocity || velocity.length === 0) return;

    const maxVal = Math.max(...velocity.map(v => v.amount), 1);
    const height = 180;
    const width = container.clientWidth || 500;
    const barWidth = Math.max(24, Math.floor(width / (velocity.length * 2)));

    const svgBars = velocity.map((v, idx) => {
      const barHeight = Math.max(6, Math.round((v.amount / maxVal) * 140));
      const x = Math.round((idx + 0.5) * (width / velocity.length) - (barWidth / 2));
      const y = height - barHeight - 20;

      return `
        <g class="cursor-pointer group">
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" fill="var(--primary)" class="transition-all duration-200 group-hover:brightness-110">
            <title>${v.date}: Rs. ${v.amount.toLocaleString()} (${v.orders} orders)</title>
          </rect>
          <text x="${x + barWidth / 2}" y="${height}" text-anchor="middle" font-size="10" fill="var(--text-muted)" font-weight="500">${v.date}</text>
          <text x="${x + barWidth / 2}" y="${y - 6}" text-anchor="middle" font-size="9" fill="var(--text-main)" font-weight="600">Rs. ${Math.round(v.amount / 1000)}k</text>
        </g>
      `;
    }).join('');

    container.innerHTML = `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" class="overflow-visible">
        ${svgBars}
      </svg>
    `;
  },

  renderCategoryBreakdown(categories) {
    const list = document.getElementById('category-breakdown-list');
    if (!list) return;

    if (!categories || categories.length === 0) {
      list.innerHTML = '<p class="text-xs text-muted-custom">No sales recorded yet.</p>';
      return;
    }

    const totalSales = categories.reduce((sum, c) => sum + c.total_sales, 0) || 1;

    list.innerHTML = categories.map(c => {
      const pct = Math.round((c.total_sales / totalSales) * 100);
      return `
        <div>
          <div class="flex items-center justify-between text-xs font-semibold mb-1">
            <span class="text-main">${c.category}</span>
            <span class="text-muted-custom">Rs. ${c.total_sales.toLocaleString()} (${pct}%)</span>
          </div>
          <div class="w-full h-2 rounded-full bg-muted-custom overflow-hidden">
            <div class="h-full bg-primary rounded-full transition-all duration-500" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderRecentOrders(orders) {
    const tbody = document.getElementById('recent-orders-tbody');
    if (!tbody) return;

    if (!orders || orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-6 text-muted-custom">No recent orders found.</td></tr>';
      return;
    }

    const statusBadge = (s) => {
      if (s === 'delivered') return '<span class="badge badge-success">Delivered</span>';
      if (s === 'dispatched') return '<span class="badge badge-info">Dispatched</span>';
      if (s === 'approved') return '<span class="badge badge-warning">Approved</span>';
      if (s === 'cancelled') return '<span class="badge badge-danger">Cancelled</span>';
      return '<span class="badge badge-muted">Submitted</span>';
    };

    tbody.innerHTML = orders.map(o => `
      <tr>
        <td class="font-mono font-bold text-xs text-primary">${o.order_number}</td>
        <td class="font-semibold text-main">${o.customer_name}</td>
        <td class="text-xs text-muted-custom">${o.route}</td>
        <td class="font-bold text-main">Rs. ${o.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td>${statusBadge(o.status)}</td>
        <td class="text-right">
          <a href="#orders?id=${o.id}" class="btn btn-secondary btn-sm">Inspect</a>
        </td>
      </tr>
    `).join('');
  }
};
