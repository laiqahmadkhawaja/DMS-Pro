/**
 * DMS Enterprise SPA Router & Application Orchestrator
 */

import { Theme } from './theme.js';
import { Auth } from './auth.js';
import { Api } from './api.js';
import { Permissions } from './permissions.js';
import { Toast } from './components/toast.js';
import { Modal } from './components/modal.js';

// Views
import { DashboardView } from './views/dashboard.js';
import { OrderCreateView } from './views/order-create.js';
import { OrdersView } from './views/orders.js';
import { DeliveryView } from './views/delivery.js';
import { DeliveryDetailsView } from './views/delivery-details.js';
import { ProductsView } from './views/products.js';
import { CustomersView } from './views/customers.js';
import { CustomerLedgerView } from './views/customer-ledger.js';
import { InventoryView } from './views/inventory.js';
import { RecoveryView } from './views/recovery.js';
import { ReportsView } from './views/reports.js';
import { RolesView } from './views/roles.js';
import { UsersView } from './views/users.js';
import { SettingsView } from './views/settings.js';
import { Barcode } from './utils/barcode.js';
import { DeliveryChallan } from './utils/delivery-challan.js';
import { PdfShare } from './utils/pdf-share.js';

// Expose globals for inline event handlers
window.Modal = Modal;
window.Toast = Toast;
window.Theme = Theme;
window.Auth = Auth;
window.OrdersView = OrdersView;
window.Barcode = Barcode;
window.DeliveryChallan = DeliveryChallan;
window.PdfShare = PdfShare;
window.openDeliveryChallanModal = (id) => DeliveryChallan.openModal(id);

// Initialize hardware barcode scanner globally
Barcode.initHardwareListener();

window.openInvoiceModal = async function(refId) {
  if (!refId) return;
  const match = String(refId).match(/(INV|ORD)-[0-9a-zA-Z-]+/i);
  const cleanId = match ? match[0] : String(refId).trim();

  try {
    const res = await Api.get(`/orders/${cleanId}/invoice`);
    if (!res.success || !res.data) {
      Toast.error('Invoice not found: ' + cleanId);
      return;
    }
    const { company, order, customer } = res.data;

    const itemsRows = (order.items || []).map((it, idx) => `
      <tr>
        <td class="text-center font-mono text-muted-custom">${idx + 1}</td>
        <td class="font-semibold text-main">${it.product_name}</td>
        <td class="text-center font-bold">${it.quantity}</td>
        <td class="text-right text-muted-custom">Rs. ${it.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td class="text-right font-bold text-main">Rs. ${it.line_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join('');

    const statusBadge = order.payment_status === 'paid' 
      ? '<span class="badge badge-success text-[10px] uppercase font-bold">PAID</span>'
      : (order.payment_status === 'partial' 
        ? '<span class="badge badge-warning text-[10px] uppercase font-bold">PARTIAL</span>'
        : '<span class="badge badge-danger text-[10px] uppercase font-bold">UNPAID</span>');

    Modal.open({
      title: `Invoice #${order.invoice_number || order.order_number}`,
      size: 'lg',
      bodyHtml: `
        <div class="space-y-4">
          <!-- Header Banner -->
          <div class="p-4 rounded-lg bg-surface border border-custom flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base font-bold text-main">${company.company_name || 'DMS Enterprise Distribution'}</h3>
                ${statusBadge}
              </div>
              <p class="text-xs text-muted-custom mt-0.5">${company.address || ''} &bull; Tel: ${company.phone || 'N/A'}</p>
            </div>
            <div class="text-right text-xs">
              <span class="text-subtle-custom block">Date:</span>
              <b class="text-main font-mono">${new Date(order.created_at).toLocaleDateString('en-GB')}</b>
              <span class="text-muted-custom block text-[11px]">Order #${order.order_number}</span>
            </div>
          </div>

          <!-- Customer Billed Info -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted-custom rounded-lg text-xs border border-custom">
            <div>
              <span class="text-subtle-custom block text-[11px]">Billed To:</span>
              <b class="text-main">${customer.shop_name}</b>
              <span class="text-muted-custom block text-[11px]">(${customer.owner_name})</span>
            </div>
            <div>
              <span class="text-subtle-custom block text-[11px]">Customer Code:</span>
              <b class="font-mono text-primary">${customer.code}</b>
            </div>
            <div>
              <span class="text-subtle-custom block text-[11px]">Territory Route:</span>
              <b class="text-main">${order.route || customer.territory_route}</b>
            </div>
            <div>
              <span class="text-subtle-custom block text-[11px]">Contact Phone:</span>
              <a href="tel:${customer.phone || ''}" class="text-primary font-semibold">${customer.phone || 'N/A'}</a>
            </div>
          </div>

          <!-- Items Table -->
          <div class="border border-custom rounded-lg overflow-hidden">
            <table class="data-table text-xs">
              <thead>
                <tr>
                  <th style="width: 5%;" class="text-center">#</th>
                  <th>Product Description</th>
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

          <!-- Financial Calculation Breakdown -->
          <div class="p-3 bg-muted-custom rounded-lg border border-custom flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs gap-2">
            <div class="text-muted-custom">
              Subtotal: <strong>Rs. ${order.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> &bull; Tax (GST): <strong>Rs. ${order.tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
              ${order.discount > 0 ? ` &bull; Discount: <strong class="text-rose-500">-Rs. ${order.discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>` : ''}
            </div>
            <div class="text-right">
              <span class="text-subtle-custom block text-[11px]">Total Invoice Amount:</span>
              <span class="text-lg font-bold text-primary">Rs. ${order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <!-- POD Signature seal if present -->
          ${order.pod_signature ? `
            <div class="p-3 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between gap-3 text-xs">
              <div>
                <b class="text-emerald-700 dark:text-emerald-400 block font-bold">✓ Signed Delivery Receipt</b>
                <span class="text-muted-custom text-[11px]">Received By: <strong>${order.received_by_name || 'Recipient'}</strong> ${order.received_by_relation ? '(' + order.received_by_relation + ')' : ''}</span>
              </div>
              <div class="h-14 border border-custom rounded bg-white p-1">
                <img src="${order.pod_signature}" alt="Customer Signature" class="max-h-full max-w-xs object-contain">
              </div>
            </div>
          ` : ''}
        </div>
      `,
      footerHtml: `
        <div class="flex items-center justify-between w-full flex-wrap gap-2">
          <button class="btn btn-secondary btn-sm" onclick="window.Modal.close()">Close</button>
          <div class="flex items-center gap-2 flex-wrap">
            <button type="button" class="btn btn-secondary btn-sm flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800" id="btn-whatsapp-invoice-share" title="Share via WhatsApp">
              <svg class="w-4 h-4 text-emerald-500 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
              <span>Share WhatsApp</span>
            </button>
            <button type="button" class="btn btn-secondary btn-sm flex items-center gap-1.5" id="btn-download-invoice-pdf" title="Download PDF">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              <span>Download PDF</span>
            </button>
            <button class="btn btn-primary btn-sm inline-flex items-center gap-1.5" id="btn-print-invoice-modal">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              <span>Print Tax Invoice</span>
            </button>
          </div>
        </div>
      `,
      onOpen: (modalEl) => {
        // Download PDF
        modalEl.querySelector('#btn-download-invoice-pdf')?.addEventListener('click', () => {
          const invContent = modalEl.querySelector('.modal-body')?.innerHTML || '';
          PdfShare.downloadPdf(invContent, `Invoice-${order.invoice_number || order.order_number}.pdf`, 'a4');
        });

        // WhatsApp Share
        modalEl.querySelector('#btn-whatsapp-invoice-share')?.addEventListener('click', () => {
          PdfShare.shareViaWhatsApp({
            docType: 'Sales Tax Invoice',
            refNumber: order.invoice_number || order.order_number,
            customerName: customer.shop_name,
            customerPhone: customer.phone,
            totalAmount: order.total,
            extraText: `Payment Status: ${order.payment_status.toUpperCase()}`
          });
        });

        modalEl.querySelector('#btn-print-invoice-modal')?.addEventListener('click', () => {
          if (OrdersView && OrdersView.printInvoice) {
            OrdersView.printInvoice(order.id);
          } else {
            window.print();
          }
        });
      }
    });
  } catch (err) {
    Toast.error('Failed to load invoice: ' + err.message);
  }
};


const App = {
  routes: {
    'dashboard': DashboardView,
    'order-create': OrderCreateView,
    'orders': OrdersView,
    'delivery': DeliveryView,
    'delivery-details': DeliveryDetailsView,
    'products': ProductsView,
    'customers': CustomersView,
    'customer-ledger': CustomerLedgerView,
    'inventory': InventoryView,
    'recovery': RecoveryView,
    'reports': ReportsView,
    'roles': RolesView,
    'users': UsersView,
    'settings': SettingsView
  },

  async init() {
    Theme.init();

    // Listen for 401 unauthenticated event
    window.addEventListener('dms:unauthenticated', () => {
      this.renderLogin();
    });

    // Check user session
    const user = await Auth.checkSession();
    if (!user) {
      this.renderLogin();
      return;
    }

    this.renderAppShell();
    this.initRouter();
  },

  renderLogin() {
    const root = document.getElementById('app-root');
    if (!root) return;

    root.innerHTML = `
      <div class="min-h-screen flex items-center justify-center p-4 bg-muted-custom">
        <div class="card p-6 sm:p-8 w-full max-w-md shadow-xl border-custom">
          <!-- Logo & Brand Header -->
          <div class="text-center mb-6">
            <div class="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center mx-auto shadow-md mb-3">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            </div>
            <h1 class="text-2xl font-bold text-main">DMS Enterprise</h1>
            <p class="text-xs text-muted-custom mt-1">Distribution Logistics & Wholesale Management</p>
          </div>

          <!-- Login Form -->
          <form id="login-form" class="space-y-4">
            <div>
              <label class="form-label text-xs">Email / Username</label>
              <input type="email" id="login-email" class="form-input text-sm" placeholder="laiq@company.com" required value="laiq@company.com">
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="form-label text-xs mb-0">Password</label>
                <span class="text-[11px] text-primary">Demo: Password123!</span>
              </div>
              <input type="password" id="login-password" class="form-input text-sm" placeholder="••••••••" required value="Password123!">
            </div>

            <!-- Role Quick Selection Helper for Instant Demo Testing -->
            <div class="p-3 bg-muted-custom rounded-lg text-xs space-y-1.5 border border-custom">
              <span class="text-[11px] font-bold text-muted-custom uppercase">1-Click Demo Profiles:</span>
              <div class="flex flex-wrap gap-1">
                <button type="button" class="btn btn-secondary btn-sm text-[10px] py-1 px-1.5 demo-role-btn" data-email="laiq@company.com">Super Admin</button>
                <button type="button" class="btn btn-secondary btn-sm text-[10px] py-1 px-1.5 demo-role-btn" data-email="operations@dms.com">Admin</button>
                <button type="button" class="btn btn-secondary btn-sm text-[10px] py-1 px-1.5 demo-role-btn" data-email="sales1@dms.com">Sales Rep</button>
                <button type="button" class="btn btn-secondary btn-sm text-[10px] py-1 px-1.5 demo-role-btn" data-email="driver1@dms.com">Driver</button>
                <button type="button" class="btn btn-secondary btn-sm text-[10px] py-1 px-1.5 demo-role-btn" data-email="recovery1@dms.com">Recovery</button>
              </div>
            </div>

            <button type="submit" id="login-submit-btn" class="btn btn-primary w-full py-2.5">
              <span>Sign In to DMS</span>
            </button>
          </form>

          <!-- Theme Toggle in Login View -->
          <div class="mt-6 pt-4 border-t border-custom flex items-center justify-between text-xs text-muted-custom">
            <span>Enterprise Core 2.0</span>
            <button type="button" class="p-1.5 rounded-lg border border-custom theme-toggle-btn">Theme</button>
          </div>
        </div>
      </div>
    `;

    // Demo role buttons
    root.querySelectorAll('.demo-role-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const email = btn.getAttribute('data-email');
        document.getElementById('login-email').value = email;
        document.getElementById('login-password').value = 'Password123!';
      });
    });

    // Theme toggle
    root.querySelector('.theme-toggle-btn')?.addEventListener('click', () => Theme.toggle());

    // Login submit
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const submitBtn = document.getElementById('login-submit-btn');

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Verifying credentials...</span>';

      try {
        await Auth.login(email, password);
        Toast.success('Welcome back!');
        this.renderAppShell();
        this.initRouter();
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Sign In to DMS</span>';
        Toast.error(err.message || 'Login failed.');
      }
    });
  },

  renderAppShell() {
    const user = Auth.getUser();
    const root = document.getElementById('app-root');
    if (!root) return;

    root.innerHTML = `
      <div class="min-h-screen flex flex-col bg-muted-custom">
        <!-- Top Sticky Header -->
        <header class="sticky top-0 z-30 h-14 bg-surface border-b border-custom px-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <!-- Mobile Drawer Button -->
            <button id="mobile-drawer-toggle-btn" class="md:hidden p-1.5 rounded-lg text-muted-custom hover:text-main hover:bg-muted-custom">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <a href="#dashboard" class="flex items-center gap-2 text-main font-bold text-base">
              <span class="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-mono text-sm shadow-sm font-bold">D</span>
              <span class="hidden sm:inline font-bold">DMS Enterprise</span>
            </a>
          </div>

          <div class="flex items-center gap-2">
            <!-- Dark / Light Theme Toggle -->
            <button class="btn btn-secondary btn-icon theme-toggle-btn" title="Toggle Theme"></button>

            <!-- User Status Chip -->
            <div class="flex items-center gap-2 pl-2 border-l border-custom">
              <div class="text-right hidden sm:block">
                <div class="text-xs font-bold text-main leading-tight">${user.display_name}</div>
                <div class="text-[10px] text-primary font-semibold uppercase">${user.role_name}</div>
              </div>
              <button id="user-logout-btn" class="btn btn-secondary btn-sm p-1.5" title="Sign Out">
                <svg class="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              </button>
            </div>
          </div>
        </header>

        <!-- Main Body: Desktop Sidebar + Content -->
        <div class="flex-1 flex overflow-hidden">
          <!-- Desktop Sidebar -->
          <aside class="hidden md:flex flex-col w-60 bg-surface border-r border-custom flex-shrink-0">
            <div class="p-3 space-y-6 overflow-y-auto flex-1 text-xs" id="desktop-sidebar-nav">
              ${this.getNavMenuHtml()}
            </div>
          </aside>

          <!-- Main Viewport -->
          <main class="flex-1 overflow-y-auto p-3 sm:p-5 pb-20 md:pb-6" id="app-view">
            <!-- Dynamic view loads here -->
          </main>
        </div>

        <!-- Mobile Bottom App Bar -->
        <nav class="mobile-bottom-nav">
          <a href="#dashboard" class="mobile-nav-item" data-route="dashboard">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            <span>Home</span>
          </a>
          <a href="#order-create" class="mobile-nav-item" data-route="order-create">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>Book</span>
          </a>
          <a href="#orders" class="mobile-nav-item" data-route="orders">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            <span>Orders</span>
          </a>
          <a href="#delivery" class="mobile-nav-item" data-route="delivery">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
            <span>Delivery</span>
          </a>
          <button type="button" class="mobile-nav-item" id="mobile-menu-drawer-btn">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"/></svg>
            <span>Menu</span>
          </button>
        </nav>

        <!-- Slide-over Mobile Touch Drawer -->
        <div id="mobile-drawer-overlay" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 hidden transition-opacity">
          <div class="fixed inset-y-0 left-0 w-72 bg-surface shadow-2xl p-4 flex flex-col justify-between overflow-y-auto">
            <div>
              <div class="flex items-center justify-between pb-3 border-b border-custom mb-3">
                <span class="font-bold text-main">DMS Navigation</span>
                <button id="close-mobile-drawer-btn" class="p-1 rounded text-muted-custom">&times;</button>
              </div>
              <div class="space-y-4 text-xs" id="mobile-drawer-nav">
                ${this.getNavMenuHtml()}
              </div>
            </div>
            <div class="pt-4 border-t border-custom">
              <button id="drawer-logout-btn" class="btn btn-secondary w-full text-xs text-rose-500">Sign Out</button>
            </div>
          </div>
        </div>
      </div>
    `;

    Theme.updateToggleIcons(Theme.isDark() ? 'dark' : 'light');

    // Attach listeners
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => Theme.toggle());
    });

    document.getElementById('user-logout-btn')?.addEventListener('click', () => Auth.logout());
    document.getElementById('drawer-logout-btn')?.addEventListener('click', () => Auth.logout());

    // Drawer toggles
    const drawerOverlay = document.getElementById('mobile-drawer-overlay');
    const openDrawer = () => drawerOverlay?.classList.remove('hidden');
    const closeDrawer = () => drawerOverlay?.classList.add('hidden');

    document.getElementById('mobile-drawer-toggle-btn')?.addEventListener('click', openDrawer);
    document.getElementById('mobile-menu-drawer-btn')?.addEventListener('click', openDrawer);
    document.getElementById('close-mobile-drawer-btn')?.addEventListener('click', closeDrawer);
    drawerOverlay?.addEventListener('click', (e) => {
      if (e.target === drawerOverlay) closeDrawer();
    });

    // Close drawer when any route link is tapped
    drawerOverlay?.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', closeDrawer);
    });
  },

  getNavMenuHtml() {
    return `
      <!-- Operations -->
      <div>
        <div class="text-[10px] font-bold text-subtle-custom uppercase tracking-wider mb-2">Operations</div>
        <div class="space-y-1">
          <a href="#dashboard" class="nav-link flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-main hover:bg-muted-custom transition-colors" data-route="dashboard">
            <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
            <span>Dashboard</span>
          </a>
          ${Permissions.can('order_create', 'view') ? `
            <a href="#order-create" class="nav-link flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-main hover:bg-muted-custom transition-colors" data-route="order-create">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              <span>Book Order</span>
            </a>
          ` : ''}
          ${Permissions.can('orders', 'view') ? `
            <a href="#orders" class="nav-link flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-main hover:bg-muted-custom transition-colors" data-route="orders">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
              <span>Order Tracking</span>
            </a>
          ` : ''}
          ${Permissions.can('delivery', 'view') ? `
            <a href="#delivery" class="nav-link flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-main hover:bg-muted-custom transition-colors" data-route="delivery">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
              <span>Deliveries</span>
            </a>
          ` : ''}
        </div>
      </div>

      <!-- Master Records -->
      <div>
        <div class="text-[10px] font-bold text-subtle-custom uppercase tracking-wider mb-2">Master Records</div>
        <div class="space-y-1">
          ${Permissions.can('products', 'view') ? `
            <a href="#products" class="nav-link flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-main hover:bg-muted-custom transition-colors" data-route="products">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
              <span>Product Catalog</span>
            </a>
          ` : ''}
          ${Permissions.can('customers', 'view') ? `
            <a href="#customers" class="nav-link flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-main hover:bg-muted-custom transition-colors" data-route="customers">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              <span>Customers</span>
            </a>
          ` : ''}
          ${Permissions.can('inventory', 'view') ? `
            <a href="#inventory" class="nav-link flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-main hover:bg-muted-custom transition-colors" data-route="inventory">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
              <span>Warehouse Inventory</span>
            </a>
          ` : ''}
        </div>
      </div>

      <!-- Finance & Accounts -->
      <div>
        <div class="text-[10px] font-bold text-subtle-custom uppercase tracking-wider mb-2">Finance & Accounts</div>
        <div class="space-y-1">
          ${Permissions.can('recovery', 'view') ? `
            <a href="#recovery" class="nav-link flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-main hover:bg-muted-custom transition-colors" data-route="recovery">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>Recovery & Payments</span>
            </a>
          ` : ''}
          ${Permissions.can('customer_ledger', 'view') ? `
            <a href="#customer-ledger" class="nav-link flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-main hover:bg-muted-custom transition-colors" data-route="customer-ledger">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <span>Customer Ledger</span>
            </a>
          ` : ''}
          ${Permissions.can('reports', 'view') ? `
            <a href="#reports" class="nav-link flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-main hover:bg-muted-custom transition-colors" data-route="reports">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
              <span>Reports & Audit</span>
            </a>
          ` : ''}
        </div>
      </div>

      <!-- Administration -->
      <div>
        <div class="text-[10px] font-bold text-subtle-custom uppercase tracking-wider mb-2">Administration</div>
        <div class="space-y-1">
          ${Permissions.can('roles', 'view') ? `
            <a href="#roles" class="nav-link flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-main hover:bg-muted-custom transition-colors" data-route="roles">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              <span>Roles & Permissions</span>
            </a>
          ` : ''}
          ${Permissions.can('users', 'view') ? `
            <a href="#users" class="nav-link flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-main hover:bg-muted-custom transition-colors" data-route="users">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
              <span>Users & Staff</span>
            </a>
          ` : ''}
          ${Permissions.can('settings', 'view') ? `
            <a href="#settings" class="nav-link flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-main hover:bg-muted-custom transition-colors" data-route="settings">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              <span>Company Settings</span>
            </a>
          ` : ''}
        </div>
      </div>
    `;
  },

  initRouter() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  },

  handleRoute() {
    const rawHash = window.location.hash.slice(1) || 'dashboard';
    const routeKey = rawHash.split('?')[0];

    const view = this.routes[routeKey] || this.routes['dashboard'];
    const container = document.getElementById('app-view');
    if (!container) return;

    // Update active nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      const match = link.getAttribute('data-route') === routeKey;
      link.className = `nav-link flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
        match ? 'bg-primary text-white shadow-sm' : 'text-main hover:bg-muted-custom'
      }`;
    });

    document.querySelectorAll('.mobile-nav-item').forEach(item => {
      const match = item.getAttribute('data-route') === routeKey;
      item.className = `mobile-nav-item ${match ? 'active text-primary' : ''}`;
    });

    // Render with smooth animation
    container.style.opacity = '0';
    container.style.transform = 'translateY(6px)';
    container.style.transition = 'opacity 0.15s ease-out, transform 0.15s ease-out';

    setTimeout(async () => {
      try {
        await view.render(container);
      } catch (err) {
        container.innerHTML = `<div class="card p-8 text-center text-rose-500">View error: ${err.message}</div>`;
      }
      container.style.opacity = '1';
      container.style.transform = 'translateY(0)';
    }, 50);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
