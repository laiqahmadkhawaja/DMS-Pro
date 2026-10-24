/**
 * Delivery Details & Proof of Delivery (POD) Execution Controller
 * Matches the reference system layout with on-site payment collection,
 * touch signature canvas, item delivery steppers, and sticky action bar.
 */

import { Api } from '../api.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';
import { Confirm } from '../components/confirm.js';
import { Permissions } from '../permissions.js';
import { DeliveryChallan } from '../utils/delivery-challan.js';
import { PdfShare } from '../utils/pdf-share.js';

export const DeliveryDetailsView = {
  order: null,
  canvas: null,
  ctx: null,
  isDrawing: false,
  hasSignature: false,
  deliveredQuantities: {},

  async render(container) {
    const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const orderId = hashParams.get('id') || '';

    if (!orderId) {
      container.innerHTML = `
        <div class="card p-8 text-center space-y-3">
          <h2 class="text-base font-bold text-main">No Order Selected</h2>
          <p class="text-xs text-muted-custom">Please select an assigned delivery from the run-sheet.</p>
          <a href="#delivery" class="btn btn-primary btn-sm inline-flex">Go to Deliveries</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="space-y-4 pb-20">
        <!-- Top Navigation & Status -->
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div>
            <a href="#delivery" class="text-xs text-muted-custom hover:text-primary mb-1 inline-flex items-center gap-1 font-semibold no-print">
              &larr; Back to Deliveries
            </a>
            <h1 class="text-xl sm:text-2xl font-bold text-main" id="order-title">Delivery Details</h1>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" class="btn btn-secondary btn-sm flex items-center gap-1.5" id="top-btn-challan">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <span>Delivery Challan</span>
            </button>
            <div id="order-status-badge-container"></div>
          </div>
        </div>

        <div id="deliv-main-grid">
          <div class="card p-8 skeleton h-72"></div>
        </div>
      </div>
    `;

    await this.loadOrder(orderId);
  },

  async loadOrder(orderId) {
    try {
      const res = await Api.get(`/orders/${orderId}`);
      if (!res.success || !res.data) {
        Toast.error('Order not found in database.');
        return;
      }

      this.order = res.data;
      this.deliveredQuantities = {};
      (this.order.items || []).forEach(it => {
        this.deliveredQuantities[it.product_id] = it.delivered_quantity !== null && it.delivered_quantity !== undefined 
          ? it.delivered_quantity 
          : it.quantity;
      });

      this.renderOrderDetails();
    } catch (e) {
      Toast.error('Failed to retrieve delivery information: ' + e.message);
    }
  },

  renderOrderDetails() {
    const o = this.order;
    const titleEl = document.getElementById('order-title');
    const badgeEl = document.getElementById('order-status-badge-container');
    const gridEl = document.getElementById('deliv-main-grid');

    if (!gridEl || !o) return;

    if (titleEl) titleEl.textContent = `Order #${o.order_number}`;

    const isFinalized = ['delivered', 'partially_delivered', 'delivery_failed', 'undelivered'].includes(o.status);

    if (badgeEl) {
      badgeEl.innerHTML = this.getStatusBadgeHtml(o.status);
    }

    // Customer info details
    const cust = o.customer || {};
    const shopName = o.customer_name || cust.shop_name || '-';
    const contactPerson = cust.owner_name || cust.contact_person || '-';
    const contactPhone = o.customer_phone || cust.phone || '-';
    const territoryRoute = o.route || cust.territory_route || '-';
    const fullAddress = o.customer_address || cust.address || 'Standard retail delivery route';

    // Financials
    const grandTotal = o.total || 0;
    const amountDue = isFinalized && o.status === 'delivered' ? 0 : grandTotal;

    gridEl.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <!-- Left Column: Customer & Item Verification (7 cols on lg) -->
        <div class="lg:col-span-7 space-y-4">
          <!-- Customer & Drop-off Location Card -->
          <div class="card p-4 sm:p-5 space-y-3">
            <div class="flex items-center justify-between pb-2 border-b border-custom">
              <h3 class="text-sm sm:text-base font-bold text-main">Customer & Drop-off Location</h3>
              ${contactPhone !== '-' ? `
                <a href="tel:${contactPhone}" class="btn btn-secondary btn-sm text-xs py-1 px-2.5 inline-flex items-center gap-1.5 text-primary">
                  <svg class="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  <span>Call Customer</span>
                </a>
              ` : ''}
            </div>

            <div class="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span class="text-subtle-custom block text-[11px]">Shop Name</span>
                <b class="text-main text-sm">${shopName}</b>
              </div>
              <div>
                <span class="text-subtle-custom block text-[11px]">Contact Person</span>
                <b class="text-main">${contactPerson}</b>
              </div>
              <div>
                <span class="text-subtle-custom block text-[11px]">Contact Phone</span>
                <span class="text-primary font-semibold">${contactPhone}</span>
              </div>
              <div>
                <span class="text-subtle-custom block text-[11px]">Territory / Area</span>
                <span class="text-main">${territoryRoute}</span>
              </div>
              <div class="col-span-2">
                <span class="text-subtle-custom block text-[11px]">Full Address</span>
                <p class="text-main font-medium mt-0.5">${fullAddress}</p>
              </div>
            </div>
          </div>

          <!-- Delivery Items Checklist Card -->
          <div class="card p-4 sm:p-5 space-y-3">
            <div class="flex items-center justify-between pb-2 border-b border-custom">
              <h3 class="text-sm sm:text-base font-bold text-main">Delivery Items Checklist</h3>
              <span class="badge badge-primary text-[11px] font-bold">${(o.items || []).length} Products</span>
            </div>

            <p class="text-xs text-muted-custom">
              Verify goods delivered to client. If partial quantity accepted, adjust delivered units below:
            </p>

            <div class="divide-y divide-custom" id="delivery-items-checklist">
              ${this.renderItemsChecklistHtml(o.items || [], isFinalized)}
            </div>
          </div>
        </div>

        <!-- Right Column: Payment Collection & Proof of Delivery (5 cols on lg) -->
        <div class="lg:col-span-5 space-y-4">
          <!-- On-Site Payment Collection Card -->
          <div class="card p-4 sm:p-5 space-y-3">
            <h3 class="text-sm sm:text-base font-bold text-main border-b border-custom pb-2">On-Site Payment Collection</h3>

            <!-- Amount Highlight Box -->
            <div class="flex items-center justify-between p-3 rounded-lg bg-muted-custom">
              <div>
                <span class="text-[11px] text-muted-custom block font-medium">Order Total</span>
                <b class="text-sm text-main">Rs. ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</b>
              </div>
              <div class="text-right">
                <span class="text-[11px] text-muted-custom block font-medium">Amount Due</span>
                <span class="text-lg sm:text-xl font-bold text-primary">Rs. ${amountDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div>
              <label class="form-label text-xs font-semibold">Amount Collected (PKR)</label>
              <input type="number" min="0" step="1" id="col-amount" class="form-input text-base font-bold" 
                     value="${isFinalized ? 0 : grandTotal}" ${isFinalized ? 'disabled' : ''} placeholder="0">
              <span class="text-[11px] text-subtle-custom mt-1 block">Enter 0 if on credit or deferred collection.</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="form-label text-xs font-semibold">Payment Method</label>
                <select id="col-method" class="form-select text-xs" ${isFinalized ? 'disabled' : ''}>
                  <option value="Cash">Cash</option>
                  <option value="Mobile Wallet (JazzCash / EasyPaisa / Raast)">Mobile Wallet (JazzCash / EasyPaisa / Raast)</option>
                  <option value="Direct Bank Transfer">Direct Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label class="form-label text-xs font-semibold">Ref / Transaction #</label>
                <input type="text" id="col-ref" class="form-input text-xs" placeholder="Slip or TID #" ${isFinalized ? 'disabled' : ''}>
              </div>
            </div>
          </div>

          <!-- Proof of Delivery (POD) & Signature Card -->
          <div class="card p-4 sm:p-5 space-y-3">
            <h3 class="text-sm sm:text-base font-bold text-main border-b border-custom pb-2">Proof of Delivery (POD)</h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="form-label text-xs font-semibold">Received By Name *</label>
                <input type="text" id="pod-name" class="form-input text-xs" placeholder="Recipient's full name" 
                       value="${o.received_by_name || ''}" ${isFinalized ? 'disabled' : ''} required>
              </div>
              <div>
                <label class="form-label text-xs font-semibold">Relation / Designation</label>
                <input type="text" id="pod-relation" class="form-input text-xs" placeholder="Owner / Manager / Staff" 
                       value="${o.received_by_relation || ''}" ${isFinalized ? 'disabled' : ''}>
              </div>
            </div>

            <!-- Recipient Touch Signature Box -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="form-label text-xs font-semibold mb-0">Recipient Touch Signature</label>
                ${!isFinalized ? `
                  <button type="button" class="text-rose-500 hover:text-rose-600 text-xs font-bold" id="btn-clear-sig">
                    Clear Canvas
                  </button>
                ` : ''}
              </div>

              ${isFinalized && o.pod_signature ? `
                <div class="border border-custom rounded-lg bg-white p-2 flex items-center justify-center h-40 overflow-hidden shadow-inner">
                  <img src="${o.pod_signature}" alt="Customer Signature" class="max-h-full max-w-full object-contain">
                </div>
              ` : `
                <div class="sig-canvas-box h-44 overflow-hidden relative">
                  <canvas id="sig-canvas" class="w-full h-full cursor-crosshair block"></canvas>
                  <div class="sig-placeholder absolute inset-0 flex items-center justify-center pointer-events-none text-subtle-custom text-xs" id="sig-placeholder">
                    ✍️ Sign inside this box
                  </div>
                </div>
              `}
            </div>

            <div>
              <label class="form-label text-xs font-semibold">Delivery Notes / Remarks</label>
              <textarea id="pod-notes" class="form-textarea text-xs" rows="2" 
                        placeholder="Driver notes or package conditions..." ${isFinalized ? 'disabled' : ''}>${o.pod_notes || ''}</textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Sticky Actions Bar -->
      <div class="sticky-actions-bar">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div id="enroute-action-container">
            ${o.status === 'dispatched' ? `
              <button type="button" class="btn btn-secondary btn-sm" id="btn-enroute-toggle">
                🚚 Mark Out for Delivery (En Route)
              </button>
            ` : ''}
          </div>
          <div class="flex items-center gap-2 flex-wrap ml-auto">
            <button type="button" class="btn btn-secondary btn-sm flex items-center gap-1.5" id="btn-print-challan">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <span>Delivery Challan (A4 / Thermal)</span>
            </button>
            ${!isFinalized ? `
              <button type="button" class="btn btn-secondary btn-sm text-rose-500 hover:text-rose-600 border-rose-300 dark:border-rose-800" id="btn-report-failed">
                ✕ Report Failed Delivery
              </button>
              <button type="button" class="btn btn-primary btn-sm" id="btn-confirm-delivery">
                ✓ Confirm Delivery
              </button>
            ` : `
              <a href="#delivery" class="btn btn-primary btn-sm">
                Return to Deliveries
              </a>
            `}
          </div>
        </div>
      </div>
    `;

    // Challan listeners
    document.getElementById('top-btn-challan')?.addEventListener('click', () => {
      DeliveryChallan.openModal(o.id);
    });
    document.getElementById('btn-print-challan')?.addEventListener('click', () => {
      DeliveryChallan.openModal(o.id);
    });

    if (!isFinalized) {
      this.initSignaturePad();
      this.bindActions();
    }
  },

  renderItemsChecklistHtml(items, isFinalized) {
    if (!items || items.length === 0) {
      return `<p class="text-xs text-muted-custom py-3 text-center">No item lines found in this order.</p>`;
    }

    return items.map((it) => {
      const ordQty = Number(it.quantity) || 1;
      const curDelivered = this.deliveredQuantities[it.product_id] !== undefined 
        ? this.deliveredQuantities[it.product_id] 
        : ordQty;
      const unitPrice = (it.unit_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

      return `
        <div class="py-2.5 flex items-center justify-between gap-2 item-check-row" data-product-id="${it.product_id}">
          <div class="flex-1 min-w-0 pr-2">
            <div class="font-bold text-xs text-main truncate">${it.product_name}</div>
            <div class="text-[11px] text-muted-custom">
              SKU: ${it.sku || it.product_sku || '-'} &bull; Rs. ${unitPrice} / unit
            </div>
          </div>
          <div class="delv-stepper">
            <span class="text-[11px] text-subtle-custom mr-1 font-mono">Ord: ${ordQty}</span>
            ${!isFinalized ? `
              <button type="button" class="btn btn-secondary btn-sm p-1 stepper-minus text-xs" data-id="${it.product_id}" data-max="${ordQty}">-</button>
              <input type="number" min="0" max="${ordQty}" class="form-input text-xs stepper-val" data-id="${it.product_id}" value="${curDelivered}" readonly>
              <button type="button" class="btn btn-secondary btn-sm p-1 stepper-plus text-xs" data-id="${it.product_id}" data-max="${ordQty}">+</button>
            ` : `
              <span class="badge badge-success text-xs font-mono font-bold">${curDelivered} Delivered</span>
            `}
          </div>
        </div>
      `;
    }).join('');
  },

  initSignaturePad() {
    this.canvas = document.getElementById('sig-canvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.isDrawing = false;
    this.hasSignature = false;

    const canvas = this.canvas;
    const ctx = this.ctx;
    const placeholder = document.getElementById('sig-placeholder');

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0f172a';
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
      this.hasSignature = true;
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
    document.getElementById('btn-clear-sig')?.addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.hasSignature = false;
      if (placeholder) placeholder.style.display = 'flex';
    });
  },

  bindActions() {
    // Steppers binding
    document.querySelectorAll('.stepper-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const pId = btn.getAttribute('data-id');
        const input = document.querySelector(`input.stepper-val[data-id="${pId}"]`);
        let val = parseInt(input.value, 10) || 0;
        if (val > 0) {
          val--;
          input.value = val;
          this.deliveredQuantities[pId] = val;
        }
      });
    });

    document.querySelectorAll('.stepper-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const pId = btn.getAttribute('data-id');
        const max = parseInt(btn.getAttribute('data-max'), 10) || 9999;
        const input = document.querySelector(`input.stepper-val[data-id="${pId}"]`);
        let val = parseInt(input.value, 10) || 0;
        if (val < max) {
          val++;
          input.value = val;
          this.deliveredQuantities[pId] = val;
        }
      });
    });

    // Mark Out for Delivery (En Route)
    document.getElementById('btn-enroute-toggle')?.addEventListener('click', async () => {
      await this.markOutForDelivery();
    });

    // Confirm Delivery
    document.getElementById('btn-confirm-delivery')?.addEventListener('click', async () => {
      await this.handleConfirmDelivery();
    });

    // Report Failed Delivery
    document.getElementById('btn-report-failed')?.addEventListener('click', () => {
      this.handleReportFailed();
    });
  },

  async markOutForDelivery() {
    try {
      const res = await Api.post(`/orders/${this.order.id}/status`, {
        status: 'out_for_delivery',
        notes: 'Driver acknowledged and started route'
      });

      if (res.success) {
        Toast.success('Delivery marked En Route!');
        await this.loadOrder(this.order.id);
      }
    } catch (err) {
      Toast.error('Failed to update status: ' + err.message);
    }
  },

  async handleConfirmDelivery() {
    const recipientName = document.getElementById('pod-name')?.value.trim();
    const relation = document.getElementById('pod-relation')?.value.trim() || '';
    const notes = document.getElementById('pod-notes')?.value.trim() || '';
    const colAmountVal = parseFloat(document.getElementById('col-amount')?.value) || 0;
    const colMethod = document.getElementById('col-method')?.value || 'Cash';
    const colRef = document.getElementById('col-ref')?.value.trim() || '';

    if (!recipientName) {
      Toast.error('Please enter the Received By Name for Proof of Delivery.');
      document.getElementById('pod-name')?.focus();
      return;
    }

    // Calculate delivered totals
    const items = this.order.items || [];
    let totalOrderedUnits = 0;
    let totalDeliveredUnits = 0;

    const deliveredItemsList = items.map(item => {
      const ordQty = Number(item.quantity) || 0;
      const delQty = this.deliveredQuantities[item.product_id] !== undefined 
        ? this.deliveredQuantities[item.product_id] 
        : ordQty;
      totalOrderedUnits += ordQty;
      totalDeliveredUnits += delQty;
      return {
        product_id: item.product_id,
        name: item.product_name || '',
        quantity: ordQty,
        delivered_quantity: delQty,
        unit_price: item.unit_price || 0
      };
    });

    if (totalDeliveredUnits === 0) {
      Toast.warning('Total delivered units is 0. Please use "Report Failed Delivery" instead.');
      return;
    }

    const isPartial = totalDeliveredUnits < totalOrderedUnits;
    const newStatus = isPartial ? 'partially_delivered' : 'delivered';

    if (!this.hasSignature) {
      const proceed = await Confirm.ask({
        title: 'No Digital Signature Captured',
        message: 'Recipient has not drawn a signature on canvas. Confirm delivery without touch signature?',
        confirmText: 'Yes, Confirm Delivery'
      });
      if (!proceed) return;
    }

    let signatureDataUrl = null;
    if (this.hasSignature && this.canvas) {
      try {
        signatureDataUrl = this.canvas.toDataURL('image/png');
      } catch (e) {
        console.warn('Canvas export error:', e);
      }
    }

    const confirmBtn = document.getElementById('btn-confirm-delivery');
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<span>Saving Proof of Delivery...</span>';
    }

    try {
      const res = await Api.post(`/orders/${this.order.id}/status`, {
        status: newStatus,
        received_by_name: recipientName,
        received_by_relation: relation,
        pod_signature: signatureDataUrl,
        pod_notes: notes,
        cod_collected: colAmountVal,
        payment_method: colMethod,
        reference_number: colRef,
        delivered_items: deliveredItemsList,
        notes: `Delivery finalized as ${newStatus.toUpperCase()}. Received by: ${recipientName} (${relation || 'Authorized'})`
      });

      if (res.success) {
        Toast.success(`Delivery successfully recorded as ${newStatus.toUpperCase()}!`);
        this.showCompletionReceiptModal({
          orderNumber: this.order.order_number,
          customerName: this.order.customer_name,
          recipientName,
          status: newStatus,
          collectedAmount: colAmountVal,
          paymentMethod: colMethod
        });
      }
    } catch (err) {
      Toast.error('Failed to complete delivery: ' + err.message);
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<span>✓ Confirm Delivery</span>';
      }
    }
  },

  handleReportFailed() {
    Modal.open({
      title: 'Report Delivery Failure',
      size: 'sm',
      bodyHtml: `
        <div class="space-y-3">
          <p class="text-xs text-muted-custom">Please select the specific reason why this delivery could not be completed:</p>
          <div>
            <label class="form-label text-xs font-semibold">Failure Reason *</label>
            <select id="fail-reason-select" class="form-select text-xs">
              <option value="Customer Closed / Unavailable">Customer Closed / Unavailable</option>
              <option value="Customer Refused Delivery">Customer Refused Delivery / Rejected</option>
              <option value="Payment Dispute / Cash Unavailable">Payment Dispute / Cash Unavailable</option>
              <option value="Damaged Goods in Transit">Damaged Goods in Transit</option>
              <option value="Incorrect Address / Location Not Found">Incorrect Address / Location Not Found</option>
              <option value="Other Reason">Other Reason</option>
            </select>
          </div>
          <div>
            <label class="form-label text-xs font-semibold">Detailed Notes</label>
            <textarea id="fail-notes" class="form-textarea text-xs" rows="2" placeholder="Provide extra details..."></textarea>
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" onclick="window.Modal.close()">Cancel</button>
        <button class="btn btn-danger btn-sm" id="confirm-fail-btn">Confirm Failure</button>
      `,
      onOpen: (modalEl) => {
        modalEl.querySelector('#confirm-fail-btn')?.addEventListener('click', async () => {
          const reason = modalEl.querySelector('#fail-reason-select')?.value;
          const notes = modalEl.querySelector('#fail-notes')?.value.trim();
          const combinedNotes = `[${reason}] ${notes || ''}`.trim();

          try {
            const res = await Api.post(`/orders/${this.order.id}/status`, {
              status: 'delivery_failed',
              undelivered_reason: reason,
              notes: combinedNotes
            });

            if (res.success) {
              Toast.warning('Delivery reported as failed.');
              Modal.close();
              window.location.hash = '#delivery';
            }
          } catch (e) {
            Toast.error('Error recording failure: ' + e.message);
          }
        });
      }
    });
  },

  showCompletionReceiptModal({ orderNumber, customerName, recipientName, status, collectedAmount, paymentMethod }) {
    Modal.open({
      title: 'Delivery Proof Slip',
      size: 'sm',
      bodyHtml: `
        <div class="space-y-4">
          <div class="text-center py-2">
            <div class="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold mb-2">
              ✓
            </div>
            <h3 class="text-base font-bold text-main">Delivery Recorded</h3>
            <p class="text-xs text-muted-custom">Order #${orderNumber} finalized.</p>
          </div>

          <div class="card p-3 space-y-2 text-xs border-custom bg-muted-custom">
            <div class="flex justify-between">
              <span class="text-muted-custom">Customer:</span>
              <b class="text-main">${customerName || '-'}</b>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-custom">Recipient:</span>
              <b class="text-main">${recipientName}</b>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-custom">Result:</span>
              <span class="badge ${status === 'delivered' ? 'badge-success' : 'badge-warning'} uppercase font-bold text-[10px]">${status}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-custom">Collection:</span>
              <b class="text-primary">Rs. ${collectedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${paymentMethod})</b>
            </div>
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" id="btn-print-slip">Print</button>
        <button class="btn btn-secondary btn-sm" id="btn-pdf-slip" title="Download POD Slip PDF">
          <svg class="w-3.5 h-3.5 text-rose-600 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>Download PDF
        </button>
        <button class="btn btn-secondary btn-sm text-emerald-600 dark:text-emerald-400" id="btn-share-slip" title="Direct WhatsApp Delivery Confirmation">
          <svg class="w-3.5 h-3.5 text-emerald-500 inline mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.697c.983.54 1.803.774 2.806.775l.004-.001c3.182 0 5.768-2.586 5.768-5.766.001-3.182-2.585-5.769-5.772-5.769zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.06-1.809-.427-1.464-.607-2.39-2.094-2.464-2.193-.074-.099-.606-.807-.606-1.54 0-.733.383-1.093.52-1.24.136-.148.3-.186.4-.186.1 0 .201.002.288.006.094.004.22-.036.344.262.129.312.441 1.077.479 1.156.038.079.063.172.012.273-.051.101-.077.164-.153.253-.075.088-.159.197-.227.265-.077.076-.157.159-.068.312.089.153.396.654.85 1.059.584.521 1.076.682 1.229.758.153.076.242.064.331-.039.09-.102.383-.447.485-.6.102-.153.204-.128.344-.077.14.051.892.42 1.045.497.153.076.255.115.293.178.038.064.038.371-.106.776z"/></svg>Share WhatsApp
        </button>
        <button class="btn btn-primary btn-sm" id="btn-done-slip">Return to Deliveries</button>
      `,
      onOpen: (modalEl) => {
        modalEl.querySelector('#btn-print-slip')?.addEventListener('click', () => {
          window.print();
        });

        modalEl.querySelector('#btn-pdf-slip')?.addEventListener('click', () => {
          const podHtml = `
            <div style="font-family: Arial, sans-serif; padding: 16px; border: 1px solid #cbd5e1; border-radius: 8px;">
              <h2 style="margin: 0 0 6px; font-size: 16px; color: #0f172a;">PROOF OF DELIVERY RECEIPT (POD)</h2>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 12px;">Order Ref: <strong>#${orderNumber}</strong> &bull; Status: <strong>${status.toUpperCase()}</strong></div>
              <div style="border-top: 1px dashed #cbd5e1; padding-top: 10px; font-size: 12px; line-height: 1.6;">
                <div>Customer / Shop: <strong>${customerName || '-'}</strong></div>
                <div>Received By: <strong>${recipientName}</strong></div>
                <div>COD Collection: <strong>Rs. ${collectedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${paymentMethod})</strong></div>
                <div>Completed Date: <strong>${new Date().toLocaleString()}</strong></div>
              </div>
            </div>
          `;
          PdfShare.downloadPdf(podHtml, `POD_${orderNumber}.pdf`, 'thermal');
        });

        modalEl.querySelector('#btn-share-slip')?.addEventListener('click', () => {
          const options = {
            phone: this.order?.customer_phone || '',
            customerName: customerName,
            docType: 'Proof of Delivery (POD)',
            refNumber: orderNumber,
            date: new Date().toLocaleDateString('en-GB'),
            balanceDue: collectedAmount,
            text: `🚚 *PROOF OF DELIVERY (POD)*\n\nOrder *#${orderNumber}* was successfully marked *${status.toUpperCase()}*.\n\n*Customer:* ${customerName}\n*Received By:* ${recipientName}\n*Amount Collected:* Rs. ${collectedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${paymentMethod})\n*Date:* ${new Date().toLocaleString()}\n\nThank you for choosing DMS Distribution!`
          };

          if (PdfShare.isMobile() && navigator.share) {
            PdfShare.shareNative(options);
          } else {
            PdfShare.shareViaWhatsApp(options);
          }
        });

        modalEl.querySelector('#btn-done-slip')?.addEventListener('click', () => {
          Modal.close();
          window.location.hash = '#delivery';
        });
      }
    });
  },

  getStatusBadgeHtml(status) {
    switch (status) {
      case 'dispatched':
        return `<span class="badge badge-info text-xs font-bold uppercase">📦 Dispatched / Ready</span>`;
      case 'out_for_delivery':
        return `<span class="badge badge-primary text-xs font-bold uppercase">🚚 Out for Delivery</span>`;
      case 'delivered':
        return `<span class="badge badge-success text-xs font-bold uppercase">✓ Delivered</span>`;
      case 'partially_delivered':
        return `<span class="badge badge-warning text-xs font-bold uppercase">⚠️ Partially Delivered</span>`;
      case 'delivery_failed':
      case 'undelivered':
        return `<span class="badge badge-danger text-xs font-bold uppercase">✕ Delivery Failed</span>`;
      default:
        return `<span class="badge badge-secondary text-xs font-bold uppercase">${status || 'Unknown'}</span>`;
    }
  }
};
