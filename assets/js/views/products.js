/**
 * Product Catalog Management View
 */

import { Api } from '../api.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';
import { Confirm } from '../components/confirm.js';
import { Permissions } from '../permissions.js';
import { Barcode } from '../utils/barcode.js';

export const ProductsView = {
  products: [],
  activeCategory: 'All',
  activeExpiryFilter: 'all', // 'all', 'alerts', 'near_expiry', 'expired', 'good'
  searchQuery: '',

  async render(container) {
    const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    this.activeExpiryFilter = hashParams.get('expiry') || 'all';

    container.innerHTML = `
      <div class="space-y-4">
        <!-- Action Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-main">Product Master Catalog</h1>
            <p class="text-xs sm:text-sm text-muted-custom">Manage wholesale FMCG inventory SKUs, batch codes, expiry tracking, and retail rates.</p>
          </div>
          <div class="flex items-center gap-2">
            <button id="products-scan-barcode-btn" class="btn btn-secondary btn-sm flex items-center gap-1.5" title="Scan Barcode / SKU via Camera">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
              <span>Scan Barcode</span>
            </button>
            ${Permissions.can('products', 'create') ? `
              <button id="add-product-modal-btn" class="btn btn-primary btn-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                <span>+ Add Product</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Expiry Alerts KPI Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3" id="expiry-kpi-grid">
          <div class="card p-3 border-custom card-hover cursor-pointer expiry-filter-btn" data-filter="all">
            <div class="flex items-center justify-between text-muted-custom">
              <span class="text-xs font-semibold uppercase">Total SKUs</span>
              <span class="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600">📦</span>
            </div>
            <div class="text-xl font-bold text-main mt-1" id="kpi-total-products">-</div>
            <div class="text-[11px] text-muted-custom mt-0.5">Active Catalog</div>
          </div>

          <div class="card p-3 border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 card-hover cursor-pointer expiry-filter-btn" data-filter="expired">
            <div class="flex items-center justify-between text-rose-700 dark:text-rose-400">
              <span class="text-xs font-semibold uppercase">Expired Stock</span>
              <span class="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600">🚫</span>
            </div>
            <div class="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1" id="kpi-expired-count">-</div>
            <div class="text-[11px] text-rose-600/80 mt-0.5 font-medium">Clearance Required</div>
          </div>

          <div class="card p-3 border-amber-300 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 card-hover cursor-pointer expiry-filter-btn" data-filter="near_expiry">
            <div class="flex items-center justify-between text-amber-700 dark:text-amber-400">
              <span class="text-xs font-semibold uppercase">Near Expiry (&le;30d)</span>
              <span class="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600">⏳</span>
            </div>
            <div class="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1" id="kpi-near-expiry-count">-</div>
            <div class="text-[11px] text-amber-600/80 mt-0.5 font-medium">Priority Dispatch</div>
          </div>

          <div class="card p-3 border-emerald-300 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 card-hover cursor-pointer expiry-filter-btn" data-filter="good">
            <div class="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
              <span class="text-xs font-semibold uppercase">Safe Stock (&gt;30d)</span>
              <span class="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600">✓</span>
            </div>
            <div class="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1" id="kpi-good-count">-</div>
            <div class="text-[11px] text-emerald-600/80 mt-0.5 font-medium">Valid Shelf Life</div>
          </div>
        </div>

        <!-- Filter Controls -->
        <div class="card p-3 sm:p-4 space-y-3">
          <div class="flex flex-col md:flex-row items-center justify-between gap-3">
            <div class="relative w-full md:w-80">
              <input type="search" id="product-search-input" class="form-input pl-9 text-xs" placeholder="Search by SKU, product name, batch, or barcode..." autocomplete="off">
              <svg class="w-4 h-4 text-subtle-custom absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            
            <!-- Expiry Filter Quick Pills -->
            <div class="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto" id="expiry-status-pills">
              <button class="btn btn-primary btn-sm expiry-pill" data-filter="all">All Products</button>
              <button class="btn btn-secondary btn-sm expiry-pill text-rose-600 dark:text-rose-400" data-filter="expired">🚫 Expired</button>
              <button class="btn btn-secondary btn-sm expiry-pill text-amber-600 dark:text-amber-400" data-filter="near_expiry">⏳ Near Expiry (&le;30d)</button>
              <button class="btn btn-secondary btn-sm expiry-pill text-emerald-600 dark:text-emerald-400" data-filter="good">✓ Valid</button>
            </div>
          </div>

          <!-- Category Pills Row -->
          <div class="flex items-center gap-1 overflow-x-auto pt-2 border-t border-custom pb-1 md:pb-0" id="product-category-pills">
            <button class="btn btn-primary btn-sm prod-cat-pill active" data-cat="All">All Categories</button>
          </div>
        </div>

        <!-- Products Table -->
        <div class="card overflow-hidden">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>SKU & Barcode</th>
                  <th>Product Description</th>
                  <th>Category</th>
                  <th>Unit / Pack</th>
                  <th>Expiry & Batch</th>
                  <th class="text-right">Cost Price</th>
                  <th class="text-right">Selling Rate</th>
                  <th class="text-center">Stock Level</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody id="products-table-tbody">
                <tr><td colspan="9" class="text-center py-8 text-muted-custom">Loading product records...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    await this.loadProducts();
    this.bindEvents();
  },

  async loadProducts() {
    try {
      const res = await Api.get('/products?active_only=0');
      this.products = res.data || [];
      this.updateExpiryKpis();
      this.populateCategoryPills();
      this.renderTable();
    } catch (e) {
      Toast.error('Failed to load products: ' + e.message);
    }
  },

  updateExpiryKpis() {
    let expired = 0;
    let nearExpiry = 0;
    let good = 0;

    this.products.forEach(p => {
      if (p.is_expired) expired++;
      else if (p.is_near_expiry) nearExpiry++;
      else good++;
    });

    const totalEl = document.getElementById('kpi-total-products');
    const expEl = document.getElementById('kpi-expired-count');
    const nearEl = document.getElementById('kpi-near-expiry-count');
    const goodEl = document.getElementById('kpi-good-count');

    if (totalEl) totalEl.textContent = this.products.length;
    if (expEl) expEl.textContent = expired;
    if (nearEl) nearEl.textContent = nearExpiry;
    if (goodEl) goodEl.textContent = good;
  },

  populateCategoryPills() {
    const container = document.getElementById('product-category-pills');
    if (!container) return;

    const categories = ['All', ...new Set(this.products.map(p => p.category))];
    container.innerHTML = categories.map(cat => `
      <button class="btn ${cat === this.activeCategory ? 'btn-primary' : 'btn-secondary'} btn-sm prod-cat-pill" data-cat="${cat}">
        ${cat}
      </button>
    `).join('');
  },

  bindEvents() {
    document.getElementById('products-scan-barcode-btn')?.addEventListener('click', () => {
      Barcode.openCameraScanner((scannedCode) => {
        const searchInput = document.getElementById('product-search-input');
        if (searchInput) {
          searchInput.value = scannedCode;
          this.searchQuery = scannedCode.toLowerCase().trim();
          this.renderTable();
          Toast.success(`Scanned: ${scannedCode}`);
        }
      });
    });

    // Hardware burst listener
    if (this._onBarcodeScanned) {
      document.removeEventListener('dms:barcode-scanned', this._onBarcodeScanned);
    }
    this._onBarcodeScanned = (e) => {
      const code = e.detail?.code;
      if (!code) return;
      const searchInput = document.getElementById('product-search-input');
      if (searchInput) {
        searchInput.value = code;
        this.searchQuery = code.toLowerCase().trim();
        this.renderTable();
        Toast.info(`Hardware Scanned: ${code}`);
      }
    };
    document.addEventListener('dms:barcode-scanned', this._onBarcodeScanned);

    document.getElementById('product-search-input')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderTable();
    });

    // Category pills
    document.getElementById('product-category-pills')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.prod-cat-pill');
      if (btn) {
        this.activeCategory = btn.getAttribute('data-cat');
        document.querySelectorAll('.prod-cat-pill').forEach(b => {
          b.className = 'btn btn-secondary btn-sm prod-cat-pill';
        });
        btn.className = 'btn btn-primary btn-sm prod-cat-pill';
        this.renderTable();
      }
    });

    // Expiry filter pills
    document.getElementById('expiry-status-pills')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.expiry-pill');
      if (btn) {
        this.activeExpiryFilter = btn.getAttribute('data-filter');
        document.querySelectorAll('.expiry-pill').forEach(b => {
          b.className = b.className.replace('btn-primary', 'btn-secondary');
        });
        btn.className = 'btn btn-primary btn-sm expiry-pill';
        this.renderTable();
      }
    });

    // Expiry KPI card clicks
    document.querySelectorAll('.expiry-filter-btn').forEach(card => {
      card.addEventListener('click', () => {
        const filter = card.getAttribute('data-filter');
        this.activeExpiryFilter = filter;
        document.querySelectorAll('.expiry-pill').forEach(b => {
          if (b.getAttribute('data-filter') === filter) {
            b.className = 'btn btn-primary btn-sm expiry-pill';
          } else {
            b.className = b.className.replace('btn-primary', 'btn-secondary');
          }
        });
        this.renderTable();
      });
    });

    document.getElementById('add-product-modal-btn')?.addEventListener('click', () => {
      this.openProductModal();
    });
  },

  renderTable() {
    const tbody = document.getElementById('products-table-tbody');
    if (!tbody) return;

    const filtered = this.products.filter(p => {
      const matchCat = this.activeCategory === 'All' || p.category === this.activeCategory;
      const matchSearch = !this.searchQuery || 
        p.name.toLowerCase().includes(this.searchQuery) ||
        p.sku.toLowerCase().includes(this.searchQuery) ||
        (p.batch_number && p.batch_number.toLowerCase().includes(this.searchQuery)) ||
        (p.barcode && p.barcode.toLowerCase().includes(this.searchQuery));

      let matchExpiry = true;
      if (this.activeExpiryFilter === 'expired') matchExpiry = p.is_expired;
      else if (this.activeExpiryFilter === 'near_expiry') matchExpiry = p.is_near_expiry;
      else if (this.activeExpiryFilter === 'alerts') matchExpiry = (p.is_expired || p.is_near_expiry);
      else if (this.activeExpiryFilter === 'good') matchExpiry = (!p.is_expired && !p.is_near_expiry);

      return matchCat && matchSearch && matchExpiry;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center py-8 text-muted-custom">No products found matching criteria.</td></tr>';
      return;
    }

    const canEdit = Permissions.can('products', 'edit');
    const canAdjust = Permissions.can('products', 'adjust_stock');

    tbody.innerHTML = filtered.map(p => {
      const isLow = p.current_stock <= p.min_stock_level;

      return `
        <tr class="${!p.active ? 'opacity-50' : ''}" id="prod-row-${p.id}">
          <td class="whitespace-nowrap">
            <div class="font-mono font-bold text-xs text-primary">${p.sku}</div>
            <div class="text-[10px] text-muted-custom font-mono mt-0.5 tracking-wider">${p.barcode || '—'}</div>
          </td>
          <td>
            <div class="font-semibold text-main">${p.name}</div>
            ${!p.active ? '<span class="badge badge-danger text-[10px]">Inactive</span>' : ''}
          </td>
          <td><span class="badge badge-muted text-xs">${p.category}</span></td>
          <td class="text-xs text-muted-custom">${p.unit} (Pack: ${p.pack_size})</td>
          <td>
            ${p.expiry_date ? `
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-xs font-semibold text-main whitespace-nowrap">${new Date(p.expiry_date).toLocaleDateString('en-GB')}</span>
                <span class="badge ${p.is_expired ? 'badge-danger font-bold uppercase' : (p.days_to_expiry <= 15 ? 'badge-danger font-bold' : (p.is_near_expiry ? 'badge-warning font-semibold' : 'badge-success'))} text-[10px]">
                  ${p.expiry_status_text || 'Valid'}
                </span>
              </div>
              <div class="text-[10px] text-muted-custom font-mono mt-0.5">${p.batch_number || 'No batch'}</div>
            ` : `
              <span class="text-muted-custom text-xs">No Expiry</span>
            `}
          </td>
          <td class="text-right text-xs text-muted-custom">Rs. ${p.cost_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td class="text-right font-bold text-main">Rs. ${p.selling_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td class="text-center">
            <span class="badge ${isLow ? 'badge-danger' : 'badge-success'} text-xs font-bold">
              ${p.current_stock}
            </span>
          </td>
          <td class="text-right whitespace-nowrap">
            <div class="flex items-center justify-end gap-1">
              <button class="btn btn-secondary btn-sm p-1.5 print-barcode-btn" data-id="${p.id}" title="Print Barcode Label">
                <svg class="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              </button>
              ${canAdjust ? `
                <button class="btn btn-secondary btn-sm p-1.5 adjust-stock-btn" data-id="${p.id}" title="Audit Stock">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
                </button>
              ` : ''}
              ${canEdit ? `
                <button class="btn btn-secondary btn-sm p-1.5 edit-prod-btn" data-id="${p.id}" title="Edit Product">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.print-barcode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const prod = this.products.find(p => p.id === id);
        if (prod) Barcode.openLabelPrinter(prod);
      });
    });

    tbody.querySelectorAll('.edit-prod-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const prod = this.products.find(p => p.id === id);
        if (prod) this.openProductModal(prod);
      });
    });

    tbody.querySelectorAll('.adjust-stock-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const prod = this.products.find(p => p.id === id);
        if (prod) this.openStockAdjustModal(prod);
      });
    });
  },

  openProductModal(prod = null) {
    const isEdit = prod !== null;

    Modal.open({
      title: isEdit ? `Edit Product: ${prod.name}` : 'Add New Product',
      size: 'md',
      bodyHtml: `
        <form id="product-form" class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="form-label text-xs">SKU Code *</label>
              <input type="text" id="m-prod-sku" class="form-input text-xs uppercase" required value="${prod?.sku || ''}" ${isEdit ? 'disabled' : ''} placeholder="e.g. BEV-001">
            </div>
            <div>
              <div class="flex items-center justify-between">
                <label class="form-label text-xs">Barcode (EAN/Code 128)</label>
                <button type="button" id="btn-autogen-barcode" class="text-[11px] text-primary hover:underline font-medium">⚡ Auto-Gen</button>
              </div>
              <input type="text" id="m-prod-barcode" class="form-input text-xs font-mono" value="${prod?.barcode || ''}" placeholder="12-digit barcode or custom">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="form-label text-xs">Category *</label>
              <input type="text" id="m-prod-category" class="form-input text-xs" required value="${prod?.category || 'Beverages'}" placeholder="e.g. Beverages, Snacks">
            </div>
            <div>
              <label class="form-label text-xs">Unit</label>
              <input type="text" id="m-prod-unit" class="form-input text-xs" value="${prod?.unit || 'unit'}" placeholder="case, tray, box, carton">
            </div>
          </div>

          <div>
            <label class="form-label text-xs">Product Full Name *</label>
            <input type="text" id="m-prod-name" class="form-input text-xs" required value="${prod?.name || ''}" placeholder="e.g. Nestle Pure Life 1.5L (Case of 6)">
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="form-label text-xs">Pack Size</label>
              <input type="number" id="m-prod-pack" class="form-input text-xs" value="${prod?.pack_size || 1}" min="1">
            </div>
            <div>
              <label class="form-label text-xs">Cost Price (Rs.) *</label>
              <input type="number" id="m-prod-cost" class="form-input text-xs" step="0.5" required value="${prod?.cost_price || 0}">
            </div>
            <div>
              <label class="form-label text-xs">Selling Rate (Rs.) *</label>
              <input type="number" id="m-prod-price" class="form-input text-xs font-bold text-primary" step="0.5" required value="${prod?.selling_price || 0}">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="form-label text-xs">Current Stock</label>
              <input type="number" id="m-prod-stock" class="form-input text-xs" value="${prod?.current_stock || 0}" ${isEdit ? 'disabled' : ''}>
            </div>
            <div>
              <label class="form-label text-xs">Min Reorder Level</label>
              <input type="number" id="m-prod-min" class="form-input text-xs" value="${prod?.min_stock_level || 10}">
            </div>
          </div>

          <!-- Batch & Expiry Date -->
          <div class="grid grid-cols-2 gap-3 pt-2 border-t border-custom">
            <div>
              <label class="form-label text-xs">Batch / Lot Number</label>
              <input type="text" id="m-prod-batch" class="form-input text-xs font-mono uppercase" value="${prod?.batch_number || ''}" placeholder="e.g. BATCH-A01-26">
            </div>
            <div>
              <label class="form-label text-xs">Expiry Date</label>
              <input type="date" id="m-prod-expiry" class="form-input text-xs" value="${prod?.expiry_date || ''}">
            </div>
          </div>
        </form>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" onclick="window.Modal.close()">Cancel</button>
        <button class="btn btn-primary btn-sm" id="save-product-btn">${isEdit ? 'Save Changes' : 'Create Product'}</button>
      `,
      onOpen: (modalEl) => {
        modalEl.querySelector('#btn-autogen-barcode')?.addEventListener('click', () => {
          const barcodeInput = modalEl.querySelector('#m-prod-barcode');
          if (barcodeInput) {
            const rand = Math.floor(100000000 + Math.random() * 900000000);
            barcodeInput.value = '896' + String(rand);
            Toast.info('Generated new barcode.');
          }
        });

        modalEl.querySelector('#save-product-btn')?.addEventListener('click', async () => {
          const sku = modalEl.querySelector('#m-prod-sku')?.value.trim();
          const barcode = modalEl.querySelector('#m-prod-barcode')?.value.trim();
          const name = modalEl.querySelector('#m-prod-name')?.value.trim();
          const category = modalEl.querySelector('#m-prod-category')?.value.trim();
          const unit = modalEl.querySelector('#m-prod-unit')?.value.trim();
          const packSize = parseInt(modalEl.querySelector('#m-prod-pack')?.value) || 1;
          const costPrice = parseFloat(modalEl.querySelector('#m-prod-cost')?.value) || 0;
          const sellingPrice = parseFloat(modalEl.querySelector('#m-prod-price')?.value) || 0;
          const currentStock = parseInt(modalEl.querySelector('#m-prod-stock')?.value) || 0;
          const minStock = parseInt(modalEl.querySelector('#m-prod-min')?.value) || 10;
          const batchNumber = modalEl.querySelector('#m-prod-batch')?.value.trim() || null;
          const expiryDate = modalEl.querySelector('#m-prod-expiry')?.value.trim() || null;

          if (!name || (!isEdit && !sku)) {
            Toast.error('Please complete required fields.');
            return;
          }

          try {
            if (isEdit) {
              await Api.put(`/products/${prod.id}`, {
                name, barcode, category, unit, pack_size: packSize, cost_price: costPrice, selling_price: sellingPrice, min_stock_level: minStock, batch_number: batchNumber, expiry_date: expiryDate
              });
              Toast.success('Product updated successfully!');
            } else {
              await Api.post('/products', {
                sku, barcode, name, category, unit, pack_size: packSize, cost_price: costPrice, selling_price: sellingPrice, current_stock: currentStock, min_stock_level: minStock, batch_number: batchNumber, expiry_date: expiryDate
              });
              Toast.success('Product created successfully!');
            }
            Modal.close();
            await this.loadProducts();
          } catch (e) {
            console.error(e);
          }
        });
      }
    });
  },

  openStockAdjustModal(prod) {
    Modal.open({
      title: `Stock Audit Correction: ${prod.name}`,
      bodyHtml: `
        <div class="space-y-3">
          <div class="p-3 bg-muted-custom rounded-lg text-xs flex justify-between">
            <span>Current Physical Balance:</span>
            <strong class="text-main">${prod.current_stock} units</strong>
          </div>
          <div>
            <label class="form-label text-xs">New Verified Stock Count *</label>
            <input type="number" id="adjust-new-stock" class="form-input text-xs" value="${prod.current_stock}" min="0">
          </div>
          <div>
            <label class="form-label text-xs">Correction Reason / Audit Note</label>
            <input type="text" id="adjust-reason" class="form-input text-xs" placeholder="e.g. Physical stock take count correction, damaged goods write-off">
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" onclick="window.Modal.close()">Cancel</button>
        <button class="btn btn-warning btn-sm" id="confirm-stock-adjust-btn">Confirm Adjustment</button>
      `,
      onOpen: (modalEl) => {
        modalEl.querySelector('#confirm-stock-adjust-btn')?.addEventListener('click', async () => {
          const newStock = parseInt(modalEl.querySelector('#adjust-new-stock')?.value);
          const reason = modalEl.querySelector('#adjust-reason')?.value || 'Stock take audit correction';

          if (isNaN(newStock) || newStock < 0) {
            Toast.error('Invalid stock quantity.');
            return;
          }

          try {
            const res = await Api.post(`/products/${prod.id}/adjust-stock`, {
              new_stock: newStock,
              reason
            });
            if (res.success) {
              Toast.success('Stock adjusted successfully!');
              Modal.close();
              await this.loadProducts();
            }
          } catch (e) {
            console.error(e);
          }
        });
      }
    });
  }
};
