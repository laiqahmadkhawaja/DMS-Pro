/**
 * POS-Style Mobile-First Book Order View
 */

import { Api } from '../api.js';
import { Auth } from '../auth.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';
import { Barcode } from '../utils/barcode.js';

export const OrderCreateView = {
  products: [],
  customers: [],
  cart: {}, // { prodId: quantity }
  selectedCustomer: null,
  activeCategory: 'All',
  searchQuery: '',
  discountAmount: 0,
  taxRate: 5.0,
  bookerCanvas: null,
  bookerCtx: null,
  isDrawing: false,
  hasBookerSignature: false,

  async render(container) {
    this.cart = {};
    this.selectedCustomer = null;
    this.discountAmount = 0;
    this.hasBookerSignature = false;

    container.innerHTML = `
      <div class="space-y-4">
        <!-- Top Title & Customer Bar -->
        <div class="card p-4">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h1 class="text-xl font-bold text-main">Book New Order</h1>
              <p class="text-xs text-muted-custom">Select retail client, choose catalog items, and sign to place field order.</p>
            </div>
            <!-- Customer Picker -->
            <div class="w-full md:w-80">
              <label class="form-label text-xs">Customer / Retail Shop *</label>
              <select id="order-customer-select" class="form-select">
                <option value="">-- Choose Customer --</option>
              </select>
            </div>
          </div>
          <!-- Customer & Drop-off Location Card (Delivery Details Format) -->
          <div id="customer-details-card" class="hidden mt-3 p-4 rounded-xl border border-custom bg-muted-custom/30"></div>
          <div id="customer-credit-banner" class="hidden"></div>
        </div>

        <!-- Main Workspace: Catalog Grid + Live Cart Drawer -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          <!-- Catalog (2 cols on desktop) -->
          <div class="lg:col-span-2 space-y-3">
            <!-- Search & Category Filter Pills -->
            <div class="card p-3 flex flex-col sm:flex-row sm:items-center gap-2">
              <div class="relative flex-1">
                <input type="search" id="catalog-search-input" class="form-input pl-9" placeholder="Search product name, SKU, or barcode..." autocomplete="off">
                <svg class="w-4 h-4 text-subtle-custom absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
              <button id="pos-scan-barcode-btn" class="btn btn-secondary btn-sm flex items-center gap-1.5 whitespace-nowrap" title="Scan Barcode via Camera">
                <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
                <span>Scan Barcode</span>
              </button>
              <div class="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0" id="category-pills-bar">
                <button class="btn btn-primary btn-sm category-pill active" data-cat="All">All</button>
              </div>
            </div>

            <!-- Products Card Grid -->
            <div id="catalog-products-grid" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="card p-4 skeleton h-32"></div>
              <div class="card p-4 skeleton h-32"></div>
              <div class="card p-4 skeleton h-32"></div>
              <div class="card p-4 skeleton h-32"></div>
            </div>
          </div>

          <!-- Sticky Live Cart Sidebar -->
          <div class="card p-4 sticky top-4">
            <div class="flex items-center justify-between pb-3 border-b border-custom">
              <h3 class="text-base font-bold text-main">Order Summary</h3>
              <span id="cart-item-count-badge" class="badge badge-primary">0 items</span>
            </div>

            <div id="cart-lines-list" class="divide-y divide-custom my-3 max-h-56 overflow-y-auto">
              <p class="py-8 text-center text-xs text-muted-custom">Cart is empty. Tap products to add.</p>
            </div>

            <!-- Totals Breakdown -->
            <div class="space-y-2 pt-3 border-t border-custom text-xs">
              <div class="flex justify-between text-muted-custom">
                <span>Subtotal:</span>
                <span class="font-semibold text-main" id="cart-subtotal-text">Rs. 0.00</span>
              </div>
              <div class="flex justify-between text-muted-custom">
                <span id="cart-tax-label">GST Tax (${this.taxRate}%):</span>
                <span class="font-semibold text-main" id="cart-tax-text">Rs. 0.00</span>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-muted-custom">Discount (Rs.):</span>
                <input type="number" id="cart-discount-input" class="form-input text-right py-1 px-2 w-28 text-xs" value="0" min="0" step="10">
              </div>
              <div class="flex justify-between text-base font-bold text-main pt-2 border-t border-custom">
                <span>Grand Total:</span>
                <span class="text-primary" id="cart-grand-total">Rs. 0.00</span>
              </div>
            </div>

            <!-- Notes -->
            <div class="mt-3">
              <input type="text" id="order-notes-input" class="form-input text-xs" placeholder="Special delivery instructions or notes...">
            </div>

            <!-- Order Booker Digital Signature Pad -->
            <div class="mt-4 pt-3 border-t border-custom space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-main flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                  <span>Order Booker Signature *</span>
                </label>
                <span class="text-[10px] text-muted-custom">Sign before placing</span>
              </div>

              <div class="relative w-full h-28 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 overflow-hidden shadow-inner">
                <canvas id="booker-sig-canvas" class="w-full h-full cursor-crosshair block"></canvas>
                <div id="booker-sig-placeholder" class="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-xs text-slate-400">
                  <svg class="w-5 h-5 mb-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                  <span>✍️ Tap & sign order confirmation</span>
                </div>
              </div>

              <div class="flex items-center justify-between gap-2 pt-1">
                <button type="button" id="btn-clear-booker-sig" class="btn btn-secondary btn-sm text-[11px] py-1 px-2">
                  Clear
                </button>
                <button type="button" id="btn-use-profile-sig" class="btn btn-secondary btn-sm text-[11px] py-1 px-2 text-primary" title="Load your saved user profile signature">
                  Use Profile Signature
                </button>
              </div>
            </div>

            <!-- Submit Button -->
            <button id="submit-order-btn" class="btn btn-primary w-full mt-4" disabled>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              <span>Submit & Book Order</span>
            </button>
          </div>
        </div>
      </div>
    `;

    await this.loadInitialData();
    this.initBookerSignaturePad();
    this.bindEvents();
  },

  async loadInitialData() {
    try {
      const [prodRes, custRes, settingsRes] = await Promise.all([
        Api.get('/products?active_only=1'),
        Api.get('/customers?active_only=1'),
        Api.get('/settings/company').catch(() => null)
      ]);

      this.products = prodRes.data || [];
      this.customers = custRes.data || [];
      if (settingsRes && settingsRes.data && settingsRes.data.tax_rate !== undefined) {
        this.taxRate = parseFloat(settingsRes.data.tax_rate) || 5.0;
      }

      this.populateCustomersSelect();
      this.populateCategoryPills();
      this.renderProducts();
      this.updateCartCalculations();
    } catch (e) {
      Toast.error('Failed to load catalog or customers: ' + e.message);
    }
  },

  populateCustomersSelect() {
    const select = document.getElementById('order-customer-select');
    if (!select) return;

    select.innerHTML = '<option value="">-- Choose Retail Customer --</option>' +
      this.customers.map(c => `
        <option value="${c.id}" data-limit="${c.credit_limit}" data-bal="${c.current_balance}" data-route="${c.territory_route}">
          ${c.shop_name} (${c.owner_name}) — [${c.territory_route}]
        </option>
      `).join('');
  },

  populateCategoryPills() {
    const container = document.getElementById('category-pills-bar');
    if (!container) return;

    const categories = ['All', ...new Set(this.products.map(p => p.category))];
    container.innerHTML = categories.map(cat => `
      <button class="btn ${cat === this.activeCategory ? 'btn-primary' : 'btn-secondary'} btn-sm category-pill" data-cat="${cat}">
        ${cat}
      </button>
    `).join('');
  },

  bindEvents() {
    // Camera barcode scanner button
    document.getElementById('pos-scan-barcode-btn')?.addEventListener('click', () => {
      Barcode.openCameraScanner((scannedCode) => {
        this.handleBarcodeScan(scannedCode);
      });
    });

    // Hardware scanner burst listener
    if (this._onPosBarcodeScanned) {
      document.removeEventListener('dms:barcode-scanned', this._onPosBarcodeScanned);
    }
    this._onPosBarcodeScanned = (e) => {
      const code = e.detail?.code;
      if (code) {
        this.handleBarcodeScan(code);
      }
    };
    document.addEventListener('dms:barcode-scanned', this._onPosBarcodeScanned);

    // Category pills
    document.getElementById('category-pills-bar')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.category-pill');
      if (btn) {
        this.activeCategory = btn.getAttribute('data-cat');
        document.querySelectorAll('.category-pill').forEach(b => {
          b.className = 'btn btn-secondary btn-sm category-pill';
        });
        btn.className = 'btn btn-primary btn-sm category-pill';
        this.renderProducts();
      }
    });

    // Search input
    document.getElementById('catalog-search-input')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderProducts();
    });

    // Customer picker
    document.getElementById('order-customer-select')?.addEventListener('change', (e) => {
      const custId = e.target.value;
      this.selectedCustomer = this.customers.find(c => c.id === custId) || null;
      this.updateCustomerBanner();
      this.updateCartCalculations();
    });

    // Discount change
    document.getElementById('cart-discount-input')?.addEventListener('input', (e) => {
      this.discountAmount = Math.max(0, parseFloat(e.target.value) || 0);
      this.updateCartCalculations();
    });

    // Submit Order
    document.getElementById('submit-order-btn')?.addEventListener('click', () => {
      this.submitOrder();
    });
  },

  async handleBarcodeScan(code) {
    if (!code) return;
    const cleanCode = code.trim();

    // 1. Try local catalog match
    let product = this.products.find(p => 
      (p.barcode && p.barcode.toLowerCase() === cleanCode.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase() === cleanCode.toLowerCase()) ||
      p.id === cleanCode
    );

    // 2. If not found locally, query backend barcode API
    if (!product) {
      try {
        const res = await Api.get('/products/barcode/' + encodeURIComponent(cleanCode));
        if (res.success && res.data) {
          product = res.data;
          // Also add to local catalog if missing
          if (!this.products.find(p => p.id === product.id)) {
            this.products.push(product);
          }
        }
      } catch (err) {
        console.warn('Barcode lookup error:', err);
      }
    }

    if (!product) {
      Barcode.beep(false);
      Toast.error(`No product found for barcode: ${cleanCode}`);
      return;
    }

    const currentQty = this.cart[product.id] || 0;
    if (product.current_stock <= currentQty) {
      Barcode.beep(false);
      Toast.warning(`Insufficient stock for "${product.name}". (Available: ${product.current_stock})`);
      return;
    }

    // Success: add 1 unit
    this.cart[product.id] = currentQty + 1;
    Barcode.beep(true);
    Toast.success(`Added 1x "${product.name}" to cart (Qty: ${this.cart[product.id]})`);

    this.renderProducts();
    this.renderCartLines();
    this.updateCartCalculations();
  },

  renderProducts() {
    const grid = document.getElementById('catalog-products-grid');
    if (!grid) return;

    const filtered = this.products.filter(p => {
      const matchesCat = this.activeCategory === 'All' || p.category === this.activeCategory;
      const matchesSearch = !this.searchQuery || 
        p.name.toLowerCase().includes(this.searchQuery) || 
        p.sku.toLowerCase().includes(this.searchQuery) ||
        (p.barcode && p.barcode.toLowerCase().includes(this.searchQuery));
      return matchesCat && matchesSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="col-span-2 py-12 text-center text-sm text-muted-custom">No matching products found in this category.</div>';
      return;
    }

    grid.innerHTML = filtered.map(p => {
      const qtyInCart = this.cart[p.id] || 0;
      const isOutOfStock = p.current_stock <= 0;

      return `
        <div class="card p-3 sm:p-4 flex flex-col justify-between card-hover border-custom" id="prod-card-${p.id}">
          <div>
            <div class="flex items-start justify-between gap-2">
              <span class="badge badge-muted text-[10px] font-mono">${p.sku}</span>
              <span class="badge ${p.current_stock <= p.min_stock_level ? 'badge-danger' : 'badge-success'} text-[10px]">
                ${p.current_stock} in stock
              </span>
            </div>
            <h4 class="text-sm font-bold text-main mt-2 leading-snug">${p.name}</h4>
            <div class="flex items-center justify-between text-xs text-muted-custom mt-0.5">
              <span>${p.category} &bull; ${p.unit}</span>
              ${p.barcode ? `<span class="font-mono text-[10px] text-primary">${p.barcode}</span>` : ''}
            </div>
            ${p.expiry_date ? `
              <div class="mt-1.5 flex items-center justify-between text-[11px] pt-1 border-t border-custom/40">
                <span class="text-subtle-custom font-mono text-[10px]">Exp: ${new Date(p.expiry_date).toLocaleDateString('en-GB')}</span>
                <span class="badge ${p.is_expired ? 'badge-danger font-bold uppercase' : (p.is_near_expiry ? 'badge-warning font-semibold' : 'badge-muted')} text-[9px]">
                  ${p.expiry_status_text}
                </span>
              </div>
            ` : ''}
          </div>

          <div class="flex items-center justify-between mt-3 pt-3 border-t border-custom">
            <div>
              <div class="text-xs text-subtle-custom">Unit Rate</div>
              <div class="text-sm sm:text-base font-bold text-main">Rs. ${p.selling_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            </div>

            ${isOutOfStock ? `
              <span class="badge badge-danger text-xs">Out of Stock</span>
            ` : p.is_expired ? `
              <span class="badge badge-danger text-xs font-bold" title="Product has passed expiration date">Expired Lot</span>
            ` : `
              <div class="flex items-center gap-1.5">
                ${qtyInCart > 0 ? `
                  <button class="btn btn-secondary btn-sm p-1.5 catalog-minus-btn" data-id="${p.id}">&minus;</button>
                  <span class="w-7 text-center font-bold text-sm text-primary">${qtyInCart}</span>
                ` : ''}
                <button class="btn btn-primary btn-sm p-1.5 catalog-plus-btn" data-id="${p.id}" ${qtyInCart >= p.current_stock ? 'disabled' : ''}>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
                </button>
              </div>
            `}
          </div>
        </div>
      `;
    }).join('');

    // Attach click events
    grid.querySelectorAll('.catalog-plus-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.cart[id] = (this.cart[id] || 0) + 1;
        this.renderProducts();
        this.renderCartLines();
        this.updateCartCalculations();
      });
    });

    grid.querySelectorAll('.catalog-minus-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (this.cart[id] > 1) {
          this.cart[id]--;
        } else {
          delete this.cart[id];
        }
        this.renderProducts();
        this.renderCartLines();
        this.updateCartCalculations();
      });
    });
  },

  renderCartLines() {
    const list = document.getElementById('cart-lines-list');
    const badge = document.getElementById('cart-item-count-badge');
    if (!list) return;

    const cartEntries = Object.entries(this.cart);
    const totalItemUnits = cartEntries.reduce((sum, [, qty]) => sum + qty, 0);

    if (badge) badge.textContent = `${totalItemUnits} units`;

    if (cartEntries.length === 0) {
      list.innerHTML = '<p class="py-8 text-center text-xs text-muted-custom">Cart is empty. Tap products to add.</p>';
      return;
    }

    list.innerHTML = cartEntries.map(([pId, qty]) => {
      const p = this.products.find(item => item.id === pId);
      if (!p) return '';
      const lineTotal = p.selling_price * qty;

      return `
        <div class="py-2 flex items-center justify-between text-xs">
          <div class="flex-1 pr-2">
            <div class="font-bold text-main line-clamp-1">${p.name}</div>
            <div class="text-subtle-custom text-[11px]">${qty} &times; Rs. ${p.selling_price.toLocaleString()}</div>
          </div>
          <div class="text-right">
            <div class="font-bold text-main">Rs. ${lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <button class="text-danger hover:underline text-[11px] cart-remove-line-btn" data-id="${pId}">Remove</button>
          </div>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.cart-remove-line-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        delete this.cart[id];
        this.renderProducts();
        this.renderCartLines();
        this.updateCartCalculations();
      });
    });
  },

  updateCartCalculations() {
    let subtotal = 0;
    for (const [pId, qty] of Object.entries(this.cart)) {
      const p = this.products.find(item => item.id === pId);
      if (p) subtotal += p.selling_price * qty;
    }

    const tax = Math.round(subtotal * (this.taxRate / 100) * 100) / 100;
    const grandTotal = Math.max(0, subtotal + tax - this.discountAmount);

    const subtotalEl = document.getElementById('cart-subtotal-text');
    const taxLabelEl = document.getElementById('cart-tax-label');
    const taxEl = document.getElementById('cart-tax-text');
    const grandTotalEl = document.getElementById('cart-grand-total');
    const submitBtn = document.getElementById('submit-order-btn');

    if (taxLabelEl) taxLabelEl.textContent = `GST Tax (${this.taxRate}%):`;
    if (subtotalEl) subtotalEl.textContent = `Rs. ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (taxEl) taxEl.textContent = `Rs. ${tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (grandTotalEl) grandTotalEl.textContent = `Rs. ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    const hasItems = Object.keys(this.cart).length > 0;
    const hasCustomer = this.selectedCustomer !== null;

    if (submitBtn) {
      submitBtn.disabled = !hasItems || !hasCustomer;
    }

    this.updateCustomerBanner(grandTotal);
  },

  initBookerSignaturePad() {
    this.bookerCanvas = document.getElementById('booker-sig-canvas');
    if (!this.bookerCanvas) return;

    this.bookerCtx = this.bookerCanvas.getContext('2d');
    this.isDrawing = false;
    this.hasBookerSignature = false;

    const canvas = this.bookerCanvas;
    const ctx = this.bookerCtx;
    const placeholder = document.getElementById('booker-sig-placeholder');

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#0f172a';
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (e.touches && e.touches.length > 0) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top
        };
      }
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const startDraw = (e) => {
      e.preventDefault();
      this.isDrawing = true;
      this.hasBookerSignature = true;
      if (placeholder) placeholder.style.display = 'none';

      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };

    const stopDraw = () => {
      this.isDrawing = false;
    };

    // Touch events
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDraw);

    // Mouse events
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseleave', stopDraw);

    // Clear Canvas
    document.getElementById('btn-clear-booker-sig')?.addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.hasBookerSignature = false;
      if (placeholder) placeholder.style.display = 'flex';
    });

    // Use Saved Profile Signature
    document.getElementById('btn-use-profile-sig')?.addEventListener('click', () => {
      const user = Auth.getUser();
      if (user && user.signature && (user.signature.startsWith('data:image') || user.signature.includes('/uploads/'))) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 10, 10, canvas.width - 20, canvas.height - 20);
          this.hasBookerSignature = true;
          if (placeholder) placeholder.style.display = 'none';
          Toast.success(`Loaded saved signature for ${user.display_name || user.name || 'Booker'}`);
        };
        img.src = user.signature;
      } else {
        Toast.warning('No saved profile signature found for your account. Please draw your signature on the pad or upload one in Staff Users settings.');
      }
    });
    // Auto-load profile signature if user has one saved
    const currentUser = Auth.getUser();
    if (currentUser && currentUser.signature && (currentUser.signature.startsWith('data:image') || currentUser.signature.includes('/uploads/'))) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 10, 10, canvas.width - 20, canvas.height - 20);
        this.hasBookerSignature = true;
        if (placeholder) placeholder.style.display = 'none';
      };
      img.src = currentUser.signature;
    }
  },

  updateCustomerBanner(orderTotal = 0) {
    const card = document.getElementById('customer-details-card');
    const legacyBanner = document.getElementById('customer-credit-banner');
    if (!card) return;

    if (!this.selectedCustomer) {
      card.className = 'hidden';
      card.innerHTML = '';
      if (legacyBanner) {
        legacyBanner.className = 'hidden';
        legacyBanner.textContent = '';
      }
      return;
    }

    const c = this.selectedCustomer;
    const projected = c.current_balance + orderTotal;
    const isExceeded = projected > c.credit_limit;

    if (legacyBanner) {
      legacyBanner.className = 'hidden';
      legacyBanner.textContent = `Credit Limit: Rs. ${c.credit_limit.toLocaleString()} | Outstanding: Rs. ${c.current_balance.toLocaleString()} | Available: Rs. ${c.available_credit.toLocaleString()}`;
    }

    card.className = 'mt-3 p-4 rounded-xl border border-custom bg-muted-custom/30 space-y-3';
    card.innerHTML = `
      <div class="flex items-center justify-between pb-2 border-b border-custom">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full ${isExceeded ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}"></span>
          <h3 class="text-sm font-bold text-main">Customer & Drop-off Location</h3>
          <span class="badge badge-muted text-[10px] font-mono">${c.code}</span>
        </div>
        ${c.phone ? `
          <a href="tel:${c.phone}" class="btn btn-secondary btn-sm text-xs py-1 px-2.5 inline-flex items-center gap-1.5 text-primary">
            <svg class="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            <span>Call Customer</span>
          </a>
        ` : ''}
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <span class="text-subtle-custom block text-[11px]">Shop Name</span>
          <b class="text-main text-sm">${c.shop_name}</b>
        </div>
        <div>
          <span class="text-subtle-custom block text-[11px]">Contact Person / Owner</span>
          <b class="text-main">${c.owner_name || '-'}</b>
        </div>
        <div>
          <span class="text-subtle-custom block text-[11px]">Contact Phone</span>
          <span class="text-primary font-semibold font-mono">${c.phone || '-'}</span>
        </div>
        <div>
          <span class="text-subtle-custom block text-[11px]">Territory / Area Route</span>
          <span class="badge badge-primary text-[11px] font-medium">${c.territory_route || 'Standard'}</span>
        </div>
        <div class="col-span-2 sm:col-span-4">
          <span class="text-subtle-custom block text-[11px]">Full Delivery Address</span>
          <p class="text-main font-medium mt-0.5">${c.address || 'Standard retail delivery route'}</p>
        </div>
      </div>

      <!-- Financial Credit Limits Bar -->
      <div class="pt-2 border-t border-custom grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div class="p-2 rounded bg-base border border-custom">
          <span class="text-subtle-custom block text-[10px]">Credit Limit</span>
          <b class="text-main">Rs. ${c.credit_limit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</b>
        </div>
        <div class="p-2 rounded bg-base border border-custom">
          <span class="text-subtle-custom block text-[10px]">Current Outstanding</span>
          <b class="text-main">Rs. ${c.current_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</b>
        </div>
        <div class="p-2 rounded bg-base border border-custom">
          <span class="text-subtle-custom block text-[10px]">Available Credit</span>
          <b class="${c.available_credit > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}">Rs. ${c.available_credit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</b>
        </div>
        <div class="p-2 rounded border ${isExceeded ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900 text-rose-700 dark:text-rose-300' : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300'}">
          <span class="block text-[10px] font-semibold">Projected Balance</span>
          <b class="text-xs">Rs. ${projected.toLocaleString('en-US', { minimumFractionDigits: 2 })}</b>
          ${isExceeded ? '<span class="block text-[9px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-tight">Exceeds Credit Limit</span>' : '<span class="block text-[9px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">Within Credit Limit</span>'}
        </div>
      </div>
    `;
  },

  async submitOrder() {
    if (!this.selectedCustomer) {
      Toast.error('Please select a customer.');
      return;
    }

    const items = Object.entries(this.cart).map(([prodId, quantity]) => ({
      product_id: prodId,
      quantity
    }));

    if (items.length === 0) {
      Toast.error('Cart is empty.');
      return;
    }

    if (!this.hasBookerSignature) {
      Toast.error('Order Booker signature is required. Please sign on canvas before booking.');
      return;
    }

    let signatureDataUrl = '';
    if (this.bookerCanvas) {
      try {
        signatureDataUrl = this.bookerCanvas.toDataURL('image/png');
      } catch (e) {
        console.warn('Signature export error:', e);
      }
    }

    const notes = document.getElementById('order-notes-input')?.value || '';
    const submitBtn = document.getElementById('submit-order-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Submitting Order...</span>';
    }

    try {
      const res = await Api.post('/orders', {
        customer_id: this.selectedCustomer.id,
        items,
        discount: this.discountAmount,
        notes,
        booker_signature: signatureDataUrl
      });

      if (res.success) {
        Toast.success(`Order ${res.data.order_number} booked successfully!`);
        this.cart = {};
        this.hasBookerSignature = false;
        if (this.bookerCtx && this.bookerCanvas) {
          this.bookerCtx.clearRect(0, 0, this.bookerCanvas.width, this.bookerCanvas.height);
          const placeholder = document.getElementById('booker-sig-placeholder');
          if (placeholder) placeholder.style.display = 'flex';
        }

        this.renderProducts();
        this.renderCartLines();
        this.updateCartCalculations();

        // Show Success Modal with Link to Order
        Modal.open({
          title: 'Order Submitted Successfully',
          bodyHtml: `
            <div class="text-center py-4 space-y-3">
              <div class="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              </div>
              <h3 class="text-lg font-bold text-main">Order #${res.data.order_number}</h3>
              <p class="text-xs text-muted-custom">Your order has been recorded into the distribution queue with Order Booker signature.</p>
              <div class="p-3 bg-muted-custom rounded-lg text-sm font-bold text-main">
                Grand Total: Rs. ${res.data.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          `,
          footerHtml: `
            <button class="btn btn-secondary btn-sm" onclick="window.Modal.close()">Book Another</button>
            <a href="#orders?id=${res.data.order_id}" class="btn btn-primary btn-sm" onclick="window.Modal.close()">Track Order &rarr;</a>
          `
        });
      }
    } catch (err) {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Submit & Book Order</span>';
      }
    }
  }
};
