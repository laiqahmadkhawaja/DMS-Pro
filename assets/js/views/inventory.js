/**
 * Inventory & Stock Receipts (GRN) View
 */

import { Api } from '../api.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';
import { Permissions } from '../permissions.js';
import { Barcode } from '../utils/barcode.js';

export const InventoryView = {
  products: [],
  summary: null,
  searchQuery: '',

  async render(container) {
    container.innerHTML = `
      <div class="space-y-4">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-main">Warehouse Inventory & GRN</h1>
            <p class="text-xs sm:text-sm text-muted-custom">Stock holding valuations, reorder thresholds, and incoming goods receipts.</p>
          </div>
          <div class="flex items-center gap-2">
            ${Permissions.can('inventory', 'receive_stock') ? `
              <button id="receive-stock-modal-btn" class="btn btn-primary btn-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                <span>+ Receive GRN Stock</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Metric KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4" id="inventory-kpi-grid">
          <div class="card p-4 skeleton h-20"></div>
          <div class="card p-4 skeleton h-20"></div>
          <div class="card p-4 skeleton h-20"></div>
        </div>

        <!-- Stock Table -->
        <div class="card overflow-hidden">
          <div class="p-3 sm:p-4 border-b border-custom flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 class="text-sm font-bold text-main">Warehouse Stock Holdings</h3>
            <div class="flex items-center gap-2 w-full sm:w-auto">
              <div class="relative flex-1 sm:w-64">
                <input type="search" id="inventory-search-input" class="form-input pl-8 text-xs py-1.5" placeholder="Search SKU, name, barcode...">
                <svg class="w-3.5 h-3.5 text-subtle-custom absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
              <button id="inventory-scan-barcode-btn" class="btn btn-secondary btn-sm p-1.5" title="Scan Barcode via Camera">
                <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
              </button>
              <button id="view-movements-btn" class="btn btn-secondary btn-sm text-xs whitespace-nowrap">Movement Log</button>
            </div>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product Description</th>
                  <th>Category</th>
                  <th class="text-right">Unit Cost</th>
                  <th class="text-center">Stock on Hand</th>
                  <th class="text-right">Holding Value</th>
                  <th class="text-center">Status</th>
                </tr>
              </thead>
              <tbody id="inventory-table-tbody">
                <tr><td colspan="7" class="text-center py-8 text-muted-custom">Loading warehouse inventory...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    await this.loadInventory();
    this.bindEvents();
  },

  async loadInventory() {
    try {
      const res = await Api.get('/inventory');
      if (res.success && res.data) {
        this.products = res.data.products || [];
        this.summary = res.data.summary || {};
        this.renderKpis();
        this.renderTable();
      }
    } catch (e) {
      Toast.error('Failed to load inventory: ' + e.message);
    }
  },

  renderKpis() {
    const grid = document.getElementById('inventory-kpi-grid');
    if (!grid || !this.summary) return;

    grid.innerHTML = `
      <div class="card p-4">
        <span class="text-xs text-muted-custom uppercase font-semibold">Total Active SKUs</span>
        <div class="text-xl sm:text-2xl font-bold text-main mt-1">${this.summary.total_sku_count}</div>
      </div>
      <div class="card p-4">
        <span class="text-xs text-muted-custom uppercase font-semibold">Inventory Valuation (Cost)</span>
        <div class="text-xl sm:text-2xl font-bold text-primary mt-1">Rs. ${this.summary.total_valuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      </div>
      <div class="card p-4">
        <span class="text-xs text-muted-custom uppercase font-semibold">Reorder Alerts</span>
        <div class="text-xl sm:text-2xl font-bold ${this.summary.low_stock_count > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'} mt-1">
          ${this.summary.low_stock_count} SKUs
        </div>
      </div>
    `;
  },

  renderTable() {
    const tbody = document.getElementById('inventory-table-tbody');
    if (!tbody) return;

    const filtered = this.products.filter(p => {
      if (!this.searchQuery) return true;
      const q = this.searchQuery;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-muted-custom">No inventory records matching search criteria.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(p => {
      const isLow = p.current_stock <= p.min_stock_level;

      return `
        <tr>
          <td>
            <div class="font-mono font-bold text-xs text-primary">${p.sku}</div>
            ${p.barcode ? `<div class="font-mono text-[10px] text-muted-custom">${p.barcode}</div>` : ''}
          </td>
          <td class="font-semibold text-main">${p.name}</td>
          <td class="text-xs text-muted-custom">${p.category}</td>
          <td class="text-right text-xs text-muted-custom">Rs. ${p.cost_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td class="text-center font-bold ${isLow ? 'text-rose-600 dark:text-rose-400' : 'text-main'}">
            ${p.current_stock} ${p.unit}s
          </td>
          <td class="text-right font-bold text-main text-xs">Rs. ${p.stock_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td class="text-center">
            ${isLow ? '<span class="badge badge-danger text-[10px]">Reorder Alert</span>' : '<span class="badge badge-success text-[10px]">Optimal</span>'}
          </td>
        </tr>
      `;
    }).join('');
  },

  bindEvents() {
    document.getElementById('inventory-search-input')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderTable();
    });

    document.getElementById('inventory-scan-barcode-btn')?.addEventListener('click', () => {
      Barcode.openCameraScanner((scannedCode) => {
        const input = document.getElementById('inventory-search-input');
        if (input) {
          input.value = scannedCode;
          this.searchQuery = scannedCode.toLowerCase().trim();
          this.renderTable();
          Toast.success(`Scanned: ${scannedCode}`);
        }
      });
    });

    // Hardware burst listener
    if (this._onInvBarcodeScanned) {
      document.removeEventListener('dms:barcode-scanned', this._onInvBarcodeScanned);
    }
    this._onInvBarcodeScanned = (e) => {
      const code = e.detail?.code;
      if (code) {
        const input = document.getElementById('inventory-search-input');
        if (input) {
          input.value = code;
          this.searchQuery = code.toLowerCase().trim();
          this.renderTable();
          Toast.info(`Hardware Scanned: ${code}`);
        }
      }
    };
    document.addEventListener('dms:barcode-scanned', this._onInvBarcodeScanned);

    document.getElementById('receive-stock-modal-btn')?.addEventListener('click', () => {
      this.openReceiveStockModal();
    });

    document.getElementById('view-movements-btn')?.addEventListener('click', async () => {
      await this.openMovementsModal();
    });
  },

  openReceiveStockModal() {
    const prodOptions = this.products.map(p => `
      <option value="${p.id}" data-cost="${p.cost_price}">${p.name} (${p.sku})</option>
    `).join('');

    Modal.open({
      title: 'Receive Stock (Goods Received Note - GRN)',
      size: 'lg',
      bodyHtml: `
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="form-label text-xs">Supplier Name *</label>
              <input type="text" id="grn-supplier" class="form-input text-xs" placeholder="e.g. Nestle Pakistan Ltd">
            </div>
            <div>
              <label class="form-label text-xs">Supplier Invoice / Ref #</label>
              <input type="text" id="grn-ref" class="form-input text-xs" placeholder="e.g. NES-INV-8891">
            </div>
          </div>

          <!-- Product Picker & Quantity -->
          <div class="p-3 bg-muted-custom rounded-lg space-y-2">
            <h4 class="text-xs font-bold text-main">Add Incoming Product Line</h4>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
              <div class="sm:col-span-1">
                <label class="form-label text-[11px]">Product</label>
                <select id="grn-prod-select" class="form-select text-xs">
                  <option value="">-- Choose Product --</option>
                  ${prodOptions}
                </select>
              </div>
              <div>
                <label class="form-label text-[11px]">Quantity</label>
                <input type="number" id="grn-qty" class="form-input text-xs" value="10" min="1">
              </div>
              <div>
                <label class="form-label text-[11px]">Unit Cost (Rs.)</label>
                <input type="number" id="grn-cost" class="form-input text-xs" value="0" step="0.5">
              </div>
            </div>
            <button class="btn btn-secondary btn-sm w-full mt-2" id="grn-add-line-btn">+ Add to Receipt List</button>
          </div>

          <!-- Receipt Lines Table -->
          <div class="border border-custom rounded-lg overflow-hidden">
            <table class="data-table text-xs">
              <thead>
                <tr>
                  <th>Product</th>
                  <th class="text-center">Qty Received</th>
                  <th class="text-right">Unit Cost</th>
                  <th class="text-right">Total</th>
                  <th class="text-center">Action</th>
                </tr>
              </thead>
              <tbody id="grn-lines-tbody">
                <tr><td colspan="5" class="text-center py-4 text-muted-custom">No items added to receipt yet.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" onclick="window.Modal.close()">Cancel</button>
        <button class="btn btn-primary btn-sm" id="confirm-grn-btn">Post GRN Stock</button>
      `,
      onOpen: (modalEl) => {
        const lines = [];

        const prodSelect = modalEl.querySelector('#grn-prod-select');
        const qtyInput = modalEl.querySelector('#grn-qty');
        const costInput = modalEl.querySelector('#grn-cost');
        const linesTbody = modalEl.querySelector('#grn-lines-tbody');

        prodSelect?.addEventListener('change', () => {
          const selectedOption = prodSelect.options[prodSelect.selectedIndex];
          const defaultCost = selectedOption?.getAttribute('data-cost') || 0;
          if (costInput) costInput.value = defaultCost;
        });

        modalEl.querySelector('#grn-add-line-btn')?.addEventListener('click', () => {
          const pId = prodSelect.value;
          const qty = parseInt(qtyInput.value) || 0;
          const cost = parseFloat(costInput.value) || 0;

          if (!pId || qty <= 0) {
            Toast.error('Please select product and valid quantity.');
            return;
          }

          const prod = this.products.find(p => p.id === pId);
          lines.push({ product_id: pId, name: prod?.name || pId, quantity: qty, unit_cost: cost });
          renderLines();
        });

        const renderLines = () => {
          if (lines.length === 0) {
            linesTbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted-custom">No items added to receipt yet.</td></tr>';
            return;
          }

          linesTbody.innerHTML = lines.map((l, idx) => `
            <tr>
              <td class="font-bold text-main">${l.name}</td>
              <td class="text-center">${l.quantity}</td>
              <td class="text-right">Rs. ${l.unit_cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              <td class="text-right font-bold">Rs. ${(l.quantity * l.unit_cost).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              <td class="text-center">
                <button class="text-danger hover:underline text-xs remove-grn-line" data-idx="${idx}">Remove</button>
              </td>
            </tr>
          `).join('');

          linesTbody.querySelectorAll('.remove-grn-line').forEach(btn => {
            btn.addEventListener('click', () => {
              const idx = parseInt(btn.getAttribute('data-idx'));
              lines.splice(idx, 1);
              renderLines();
            });
          });
        };

        modalEl.querySelector('#confirm-grn-btn')?.addEventListener('click', async () => {
          const supplier = modalEl.querySelector('#grn-supplier')?.value.trim();
          const ref = modalEl.querySelector('#grn-ref')?.value.trim();

          if (!supplier || lines.length === 0) {
            Toast.error('Please enter supplier name and add at least 1 item line.');
            return;
          }

          try {
            const res = await Api.post('/inventory/receive', {
              supplier_name: supplier,
              reference_no: ref,
              items: lines
            });
            if (res.success) {
              Toast.success(`Stock Receipt ${res.data.receipt_number} posted successfully!`);
              Modal.close();
              await this.loadInventory();
            }
          } catch (e) {
            console.error(e);
          }
        });
      }
    });
  },

  async openMovementsModal() {
    try {
      const res = await Api.get('/inventory/movements');
      const movements = res.data || [];

      const rows = movements.map(m => `
        <tr>
          <td class="text-xs text-muted-custom whitespace-nowrap">${new Date(m.created_at).toLocaleDateString('en-GB')} ${new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
          <td class="font-bold text-xs text-main">${m.product_name}</td>
          <td>
            <span class="badge ${m.quantity_change > 0 ? 'badge-success' : 'badge-danger'} text-[10px] font-mono">
              ${m.movement_type}
            </span>
          </td>
          <td class="text-center font-bold text-xs ${m.quantity_change > 0 ? 'text-emerald-600' : 'text-rose-600'}">
            ${m.quantity_change > 0 ? '+' : ''}${m.quantity_change}
          </td>
          <td class="text-center text-xs">${m.new_stock}</td>
          <td class="text-xs text-muted-custom">${m.reference_id || ''}</td>
          <td class="text-xs text-subtle-custom">${m.recorded_by || 'System'}</td>
        </tr>
      `).join('');

      Modal.open({
        title: 'Inventory Stock Movement Audit Log',
        size: 'lg',
        bodyHtml: `
          <div class="border border-custom rounded-lg overflow-hidden max-h-96 overflow-y-auto">
            <table class="data-table text-xs">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Product</th>
                  <th>Movement Type</th>
                  <th class="text-center">Qty Change</th>
                  <th class="text-center">Balance</th>
                  <th>Reference</th>
                  <th>Staff</th>
                </tr>
              </thead>
              <tbody>
                ${rows || '<tr><td colspan="7" class="text-center py-6">No stock movements recorded.</td></tr>'}
              </tbody>
            </table>
          </div>
        `,
        footerHtml: `<button class="btn btn-secondary btn-sm" onclick="window.Modal.close()">Close</button>`
      });
    } catch (e) {
      Toast.error('Failed to load movements: ' + e.message);
    }
  }
};
