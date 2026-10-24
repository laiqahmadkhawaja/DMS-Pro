/**
 * DMS Enterprise Delivery Challan Engine
 * Supports Standard A4 Sheets & 80mm Thermal Receipt Rolls
 * with Live Interactive Preview & Dedicated Clutter-Free Print Popups.
 */

import { Api } from '../api.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';
import { Barcode } from './barcode.js';
import { PdfShare } from './pdf-share.js';

export const DeliveryChallan = {
  currentLayout: 'a4', // 'a4' | 'thermal'
  currentData: null,

  /**
   * Opens the Delivery Challan Modal with Live A4 / Thermal switcher
   */
  async openModal(orderId) {
    if (!orderId) return;
    const match = String(orderId).match(/(ORD|INV)-[0-9a-zA-Z-]+/i);
    const cleanId = match ? match[0] : String(orderId).trim();

    try {
      const res = await Api.get(`/orders/${cleanId}/invoice`);
      if (!res.success || !res.data) {
        Toast.error('Failed to load delivery challan data.');
        return;
      }

      this.currentData = res.data;
      this.currentLayout = 'a4';
      this.showChallanModal();
    } catch (e) {
      Toast.error('Error loading challan: ' + e.message);
    }
  },

  showChallanModal() {
    const { order, customer, company } = this.currentData;
    const challanNumber = 'DC-' + order.order_number.replace(/^ORD-/, '');

    Modal.open({
      title: `Delivery Challan: #${challanNumber}`,
      size: 'xl',
      bodyHtml: `
        <div class="space-y-4">
          <!-- Format Switcher & Controls Bar -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-muted-custom rounded-lg border border-custom">
            <div>
              <span class="text-xs font-bold text-main block">Document Format:</span>
              <p class="text-[11px] text-muted-custom">Switch between standard commercial A4 and 80mm portable thermal roll.</p>
            </div>
            <div class="flex items-center gap-1.5 bg-surface p-1 rounded-lg border border-custom" id="challan-format-toggle-bar">
              <button type="button" class="btn btn-sm ${this.currentLayout === 'a4' ? 'btn-primary' : 'btn-secondary'} challan-format-btn" data-layout="a4">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                <span>Standard A4 Sheet</span>
              </button>
              <button type="button" class="btn btn-sm ${this.currentLayout === 'thermal' ? 'btn-primary' : 'btn-secondary'} challan-format-btn" data-layout="thermal">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                <span>Thermal Roll (80mm)</span>
              </button>
            </div>
          </div>

          <!-- Live Preview Canvas -->
          <div class="challan-preview-viewport bg-slate-200 dark:bg-slate-900/80 p-4 sm:p-6 rounded-lg overflow-x-auto max-h-[65vh] flex justify-center border border-custom">
            <div id="challan-live-preview-container" class="transition-all duration-200">
              ${this.getPreviewHtml()}
            </div>
          </div>
        </div>
      `,
      footerHtml: `
        <div class="flex items-center justify-between w-full flex-wrap gap-2">
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.Modal.close()">Close</button>
          <div class="flex items-center gap-2 flex-wrap">
            <button type="button" class="btn btn-secondary btn-sm flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800" id="btn-whatsapp-challan-share" title="Share via WhatsApp / Native Share">
              <svg class="w-4 h-4 text-emerald-500 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
              <span>Share WhatsApp</span>
            </button>
            <button type="button" class="btn btn-secondary btn-sm flex items-center gap-1.5" id="btn-download-challan-pdf" title="Download PDF">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              <span>Download PDF</span>
            </button>
            <button type="button" class="btn btn-primary btn-sm flex items-center gap-1.5" id="btn-print-challan-action">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              <span id="print-challan-btn-text">Print A4 Delivery Challan</span>
            </button>
          </div>
        </div>
      `,
      onOpen: (modalEl) => {
        // Toggle format
        modalEl.querySelectorAll('.challan-format-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const layout = btn.getAttribute('data-layout');
            if (layout === this.currentLayout) return;
            this.currentLayout = layout;

            modalEl.querySelectorAll('.challan-format-btn').forEach(b => {
              b.className = `btn btn-sm ${b.getAttribute('data-layout') === layout ? 'btn-primary' : 'btn-secondary'} challan-format-btn`;
            });

            const btnText = modalEl.querySelector('#print-challan-btn-text');
            if (btnText) {
              btnText.textContent = layout === 'a4' ? 'Print A4 Delivery Challan' : 'Print Thermal 80mm Slip';
            }

            const previewContainer = modalEl.querySelector('#challan-live-preview-container');
            if (previewContainer) {
              previewContainer.innerHTML = this.getPreviewHtml();
            }
          });
        });

        // Download PDF action
        modalEl.querySelector('#btn-download-challan-pdf')?.addEventListener('click', () => {
          const filename = `Delivery-Challan-${challanNumber}.pdf`;
          PdfShare.downloadPdf(this.getPreviewHtml(), filename, this.currentLayout);
        });

        // WhatsApp / Share action
        modalEl.querySelector('#btn-whatsapp-challan-share')?.addEventListener('click', () => {
          PdfShare.shareViaWhatsApp({
            docType: 'Delivery Challan & POD',
            refNumber: challanNumber,
            customerName: customer?.shop_name || order.customer_name,
            customerPhone: customer?.phone || order.customer_phone,
            totalAmount: order.total,
            extraText: `Delivered to: ${order.received_by_name || 'Customer'}`
          });
        });

        // Print action
        modalEl.querySelector('#btn-print-challan-action')?.addEventListener('click', () => {
          this.printDocument();
        });
      }
    });
  },

  getPreviewHtml() {
    const { order, customer, company } = this.currentData;
    const barcodeSvg = Barcode.generateCode128Svg('DC-' + order.order_number, {
      height: 38,
      barWidth: 1.4,
      showText: true
    });

    if (this.currentLayout === 'thermal') {
      return this.renderThermalHtml(order, customer, company, barcodeSvg);
    }
    return this.renderA4Html(order, customer, company, barcodeSvg);
  },

  /**
   * Renders professional commercial A4 B2B Delivery Challan
   */
  renderA4Html(order, customer, company, barcodeSvg) {
    const items = order.items || [];
    const challanNum = 'DC-' + order.order_number.replace(/^ORD-/, '');
    const createdDate = new Date(order.created_at).toLocaleDateString('en-GB');
    const deliveryDate = order.delivered_at 
      ? new Date(order.delivered_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
      : 'In Transit / Pending Handover';

    const companyName = company?.company_name || 'Apex Distribution Logistics (Pvt) Ltd.';
    const companyPhone = company?.support_phone || '+92 42 35889900';
    const companyEmail = company?.billing_email || 'dispatch@apex.dms';
    const companyAddress = company?.central_warehouse || 'Plot 48, Commercial Logistics Park, Multan Road, Lahore';
    const ntnStrn = company?.ntn_number ? `NTN: ${company.ntn_number}` : 'NTN: 8945201-7 | STRN: 327787612345';

    let totalDeliveredUnits = 0;
    const itemRows = items.map((it, idx) => {
      const delivQty = it.delivered_quantity !== null && it.delivered_quantity !== undefined 
        ? it.delivered_quantity 
        : it.quantity;
      totalDeliveredUnits += delivQty;
      const lineTotal = delivQty * it.unit_price;

      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 7px 10px; text-align: center; color: #64748b; font-size: 11px;">${idx + 1}</td>
          <td style="padding: 7px 10px;">
            <div style="font-weight: 700; color: #0f172a; font-size: 12px;">${it.product_name}</div>
            <div style="font-size: 10px; color: #64748b; font-family: monospace;">SKU: ${it.sku || it.product_sku || '-'}</div>
          </td>
          <td style="padding: 7px 10px; text-align: center; font-size: 11px; color: #475569;">${it.quantity}</td>
          <td style="padding: 7px 10px; text-align: center; font-weight: 700; color: #0f172a; font-size: 12px; background: #f8fafc;">
            ${delivQty}
          </td>
          <td style="padding: 7px 10px; text-align: right; color: #475569; font-size: 11px;">
            Rs. ${it.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </td>
          <td style="padding: 7px 10px; text-align: right; font-weight: 700; color: #0f172a; font-size: 12px;">
            Rs. ${lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div class="challan-paper-a4 shadow-xl text-slate-900 bg-white" style="width: 210mm; min-height: 297mm; padding: 16mm 18mm; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; margin: 0 auto; line-height: 1.4;">
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 12px; border-bottom: 2px solid #0f172a;">
          <div style="max-width: 60%;">
            <div style="display: flex; items-center; gap: 8px;">
              <div style="background: #2563eb; color: #fff; font-weight: 900; font-size: 16px; width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-family: monospace;">A</div>
              <div>
                <h1 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">${companyName}</h1>
                <div style="font-size: 10px; color: #64748b; font-weight: 600;">Wholesale FMCG Distribution & Cold-Chain Logistics</div>
              </div>
            </div>
            <div style="margin-top: 8px; font-size: 10px; color: #475569; line-height: 1.35;">
              <div>${companyAddress}</div>
              <div>Tel: ${companyPhone} &bull; Email: ${companyEmail}</div>
              <div style="font-family: monospace; font-weight: 600; color: #334155;">${ntnStrn}</div>
            </div>
          </div>

          <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end;">
            <div style="background: #0f172a; color: #ffffff; padding: 4px 12px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px; display: inline-block;">
              DELIVERY CHALLAN
            </div>
            <div style="margin-top: 6px;">
              ${barcodeSvg}
            </div>
            <div style="font-size: 10px; font-family: monospace; font-weight: 700; color: #0f172a; margin-top: 2px;">
              Ref: ${challanNum}
            </div>
          </div>
        </div>

        <!-- Meta Info Grid -->
        <div style="display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 14px; margin: 14px 0;">
          <!-- Consignee Details -->
          <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px; background: #f8fafc;">
            <div style="font-size: 10px; font-weight: 800; color: #2563eb; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">Consignee / Customer Details</div>
            <div style="font-size: 14px; font-weight: 800; color: #0f172a;">${customer?.shop_name || order.customer_name || 'Retail Client'}</div>
            <div style="font-size: 11px; color: #334155; margin-top: 2px;">
              <strong>Owner / Contact:</strong> ${customer?.owner_name || customer?.contact_person || 'Store Manager'}
            </div>
            <div style="font-size: 11px; color: #334155;">
              <strong>Contact Phone:</strong> ${customer?.phone || order.customer_phone || '-'}
            </div>
            <div style="font-size: 11px; color: #334155; margin-top: 2px;">
              <strong>Delivery Address:</strong> ${customer?.address || order.customer_address || 'Standard retail delivery route'}
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 3px; font-family: monospace;">
              Territory Route: <strong>${order.route || customer?.territory_route || 'North Logistics Ring'}</strong> &bull; Code: <strong>${customer?.code || '-'}</strong>
            </div>
          </div>

          <!-- Dispatch & Tracking Meta -->
          <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px; background: #ffffff;">
            <div style="font-size: 10px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">Dispatch & Order Record</div>
            <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
              <tr>
                <td style="color: #64748b; padding: 2px 0;">Challan No:</td>
                <td style="font-weight: 700; text-align: right; font-family: monospace;">${challanNum}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 2px 0;">Sales Order #:</td>
                <td style="font-weight: 700; text-align: right; font-family: monospace;">${order.order_number}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 2px 0;">Invoice Ref:</td>
                <td style="font-weight: 700; text-align: right; font-family: monospace;">${order.invoice_number || 'INV-' + order.order_number.replace(/^ORD-/, '')}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 2px 0;">Order Date:</td>
                <td style="text-align: right;">${createdDate}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 2px 0;">Delivery Status:</td>
                <td style="text-align: right; font-weight: 700; color: ${order.status === 'delivered' ? '#16a34a' : '#2563eb'}; text-transform: uppercase;">
                  ${order.status}
                </td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 2px 0;">Handover Time:</td>
                <td style="text-align: right; font-weight: 600; font-size: 10px;">${deliveryDate}</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Delivered Goods Table -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
          <thead>
            <tr style="background: #0f172a; color: #ffffff; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
              <th style="padding: 8px 10px; width: 30px; text-align: center;">#</th>
              <th style="padding: 8px 10px; text-align: left;">Delivered Product Description</th>
              <th style="padding: 8px 10px; width: 65px; text-align: center;">Ordered</th>
              <th style="padding: 8px 10px; width: 75px; text-align: center; background: #1e293b;">Delivered</th>
              <th style="padding: 8px 10px; width: 95px; text-align: right;">Unit Rate</th>
              <th style="padding: 8px 10px; width: 105px; text-align: right;">Total (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
          <tfoot>
            <tr style="background: #f1f5f9; font-weight: 700; border-top: 2px solid #cbd5e1;">
              <td colspan="3" style="padding: 8px 10px; text-align: right; font-size: 11px; text-transform: uppercase;">
                Consignment Totals:
              </td>
              <td style="padding: 8px 10px; text-align: center; font-size: 13px; font-weight: 800; color: #0f172a;">
                ${totalDeliveredUnits}
              </td>
              <td style="padding: 8px 10px; text-align: right; font-size: 11px; color: #475569;">
                Gross Value:
              </td>
              <td style="padding: 8px 10px; text-align: right; font-size: 13px; font-weight: 800; color: #0f172a;">
                Rs. ${order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>

        <!-- Settlement & Terms Row -->
        <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 14px; margin-top: 14px;">
          <!-- Special Notes & Carrier Declaration -->
          <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; font-size: 10px; color: #475569; background: #fafafa;">
            <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px; text-transform: uppercase;">Carrier Handover Declaration:</div>
            <p style="margin: 0 0 4px 0;">1. Goods received in full sound condition, seal verified and free from visible transit breakages.</p>
            <p style="margin: 0 0 4px 0;">2. Any discrepancies or returnable claims must be countersigned by logistics driver within 24 hours.</p>
            <div style="font-weight: 600; color: #334155;">Delivery Remarks: <span style="font-weight: normal;">${order.pod_notes || 'All merchandise inspected and accepted in good order.'}</span></div>
          </div>

          <!-- On-site Cash / Settlement Summary -->
          <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; font-size: 11px; background: #f8fafc;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #64748b;">Invoice Net Total:</span>
              <strong style="color: #0f172a;">Rs. ${order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #64748b;">COD Collected:</span>
              <strong style="color: #16a34a;">Rs. ${order.status === 'delivered' ? order.total.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 4px; border-top: 1px solid #cbd5e1; font-weight: 800;">
              <span>Receivable Balance:</span>
              <span style="color: #2563eb;">Rs. ${order.status === 'delivered' ? '0.00' : order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <!-- Triple Verification Signatures Section -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1.3fr; gap: 14px; margin-top: 24px; padding-top: 12px; border-top: 1px dashed #94a3b8;">
          <!-- Warehouse Storekeeper / Dispatcher -->
          <div style="text-align: center; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; background: #fafafa;">
            <div style="height: 44px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
              ${order.dispatcher_signature ? `
                <img src="${order.dispatcher_signature}" alt="Dispatcher Signature" style="max-height: 40px; max-width: 100%; object-contain: contain;">
              ` : `
                <div style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 18px; color: #334155; opacity: 0.85;">${order.dispatcher_name || 'Rashid Minhas'}</div>
              `}
            </div>
            <div style="border-top: 1px solid #cbd5e1; padding-top: 3px; font-size: 10px; font-weight: 700; color: #0f172a; text-transform: uppercase;">
              ${order.dispatcher_name || 'Rashid Minhas (Warehouse Head)'}
            </div>
            <div style="font-size: 9px; color: #64748b;">Store Dispatcher &bull; Verified & Dispatched</div>
          </div>

          <!-- Driver / Carrier -->
          <div style="text-align: center; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; background: #fafafa;">
            <div style="height: 44px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
              ${order.driver_signature ? `
                <img src="${order.driver_signature}" alt="Driver Signature" style="max-height: 40px; max-width: 100%; object-contain: contain;">
              ` : `
                <div style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 18px; color: #334155; opacity: 0.85;">${order.driver_name || 'Kamran Akmal'}</div>
              `}
            </div>
            <div style="border-top: 1px solid #cbd5e1; padding-top: 3px; font-size: 10px; font-weight: 700; color: #0f172a; text-transform: uppercase;">
              ${order.driver_name || 'Kamran Akmal (Fleet Driver)'}
            </div>
            <div style="font-size: 9px; color: #64748b;">Fleet Delivery Rep &bull; Carrier Acceptance</div>
          </div>

          <!-- Recipient Verified POD Signature -->
          <div style="border: 1px solid #94a3b8; border-radius: 6px; padding: 6px 10px; background: #ffffff; text-align: center;">
            <div style="font-size: 10px; font-weight: 800; color: #16a34a; text-transform: uppercase; margin-bottom: 2px;">
              ✓ Recipient Verification (POD)
            </div>
            <div style="height: 44px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
              ${order.pod_signature ? `
                <img src="${order.pod_signature}" alt="Customer Signature" style="max-height: 40px; max-width: 100%; object-contain: contain;">
              ` : `
                <span style="font-size: 10px; color: #94a3b8; font-style: italic;">Signature on Glass Recorded</span>
              `}
            </div>
            <div style="border-top: 1px solid #cbd5e1; padding-top: 2px; font-size: 10px; font-weight: 700; color: #0f172a;">
              ${order.received_by_name || 'Customer Authorized Signatory'}
            </div>
            <div style="font-size: 9px; color: #64748b;">
              ${order.received_by_relation || 'Authorized Shop Representative'} &bull; ${createdDate}
            </div>
          </div>
        </div>

      </div>
    `;
  },

  /**
   * Renders high-speed 80mm POS Slip Delivery Challan
   */
  renderThermalHtml(order, customer, company, barcodeSvg) {
    const items = order.items || [];
    const challanNum = 'DC-' + order.order_number.replace(/^ORD-/, '');
    const createdDate = new Date(order.created_at).toLocaleDateString('en-GB');
    const createdTime = new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const companyName = company?.company_name || 'Apex Distribution Logistics';
    const companyPhone = company?.support_phone || '+92 42 35889900';

    let totalDeliveredUnits = 0;
    const itemRows = items.map((it) => {
      const delivQty = it.delivered_quantity !== null && it.delivered_quantity !== undefined 
        ? it.delivered_quantity 
        : it.quantity;
      totalDeliveredUnits += delivQty;
      const lineTotal = delivQty * it.unit_price;

      return `
        <div style="margin-bottom: 5px; font-size: 10.5pt;">
          <div style="font-weight: 700;">${it.product_name}</div>
          <div style="display: flex; justify-content: space-between; font-size: 9.5pt; color: #222;">
            <span>${delivQty} x Rs. ${it.unit_price.toFixed(0)}</span>
            <span style="font-weight: 700;">Rs. ${lineTotal.toFixed(0)}</span>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="challan-paper-thermal shadow-xl text-black bg-white" style="width: 80mm; min-height: 140mm; padding: 4mm 5mm; box-sizing: border-box; font-family: 'Courier New', Courier, monospace; margin: 0 auto; line-height: 1.35; border: 1px solid #ccc;">
        
        <!-- Center Header -->
        <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px;">
          <div style="font-size: 13pt; font-weight: 900; letter-spacing: 0.5px;">${companyName}</div>
          <div style="font-size: 9pt;">FMCG Wholesale Logistics</div>
          <div style="font-size: 8.5pt;">Helpline: ${companyPhone}</div>
          <div style="margin: 6px 0 2px 0; font-size: 11pt; font-weight: 900; background: #000; color: #fff; padding: 2px 0;">
            DELIVERY CHALLAN (POD)
          </div>
          <div style="margin-top: 4px;">
            ${barcodeSvg}
          </div>
          <div style="font-size: 9.5pt; font-weight: 700; margin-top: 2px;">Challan #: ${challanNum}</div>
        </div>

        <!-- Meta Details -->
        <div style="font-size: 9pt; border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px;">
          <div><strong>Order Ref:</strong> ${order.order_number}</div>
          <div><strong>Date/Time:</strong> ${createdDate} ${createdTime}</div>
          <div><strong>Customer:</strong> ${customer?.shop_name || order.customer_name}</div>
          <div><strong>Contact:</strong> ${customer?.phone || order.customer_phone || '-'}</div>
          <div><strong>Route:</strong> ${order.route || customer?.territory_route || 'North Ring'}</div>
          <div><strong>Address:</strong> ${customer?.address || order.customer_address || '-'}</div>
        </div>

        <!-- Itemized Lines -->
        <div style="border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px;">
          <div style="font-size: 9pt; font-weight: 700; margin-bottom: 4px; text-transform: uppercase;">Delivered Items:</div>
          ${itemRows}
          <div style="display: flex; justify-content: space-between; font-size: 10pt; font-weight: 800; border-top: 1px dashed #666; padding-top: 4px; margin-top: 4px;">
            <span>Total Units Delivered:</span>
            <span>${totalDeliveredUnits}</span>
          </div>
        </div>

        <!-- Settlement Totals -->
        <div style="border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; font-size: 10pt;">
          <div style="display: flex; justify-content: space-between;">
            <span>Grand Total:</span>
            <span style="font-weight: 700;">Rs. ${order.total.toFixed(0)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: 700;">
            <span>COD Collected:</span>
            <span>Rs. ${order.status === 'delivered' ? order.total.toFixed(0) : '0'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 11pt;">
            <span>Balance Due:</span>
            <span>Rs. ${order.status === 'delivered' ? '0' : order.total.toFixed(0)}</span>
          </div>
        </div>

        <!-- Dispatcher & Driver Verification on Thermal Slip -->
        <div style="border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; font-size: 8.5pt;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 4px;">
            <div>
              <span style="font-size: 7.5pt; color: #444; display: block; text-transform: uppercase;">Dispatched By:</span>
              <strong style="font-size: 8.5pt;">${order.dispatcher_name || 'Rashid Minhas'}</strong>
            </div>
            ${order.dispatcher_signature ? `
              <div style="height: 22px; display: flex; align-items: flex-end;">
                <img src="${order.dispatcher_signature}" style="max-height: 20px; max-width: 90px; object-contain: contain;">
              </div>
            ` : ''}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <span style="font-size: 7.5pt; color: #444; display: block; text-transform: uppercase;">Fleet Carrier:</span>
              <strong style="font-size: 8.5pt;">${order.driver_name || 'Kamran Akmal'}</strong>
            </div>
            ${order.driver_signature ? `
              <div style="height: 22px; display: flex; align-items: flex-end;">
                <img src="${order.driver_signature}" style="max-height: 20px; max-width: 90px; object-contain: contain;">
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Recipient Signature -->
        <div style="text-align: center; margin-top: 6px; font-size: 9pt;">
          <div style="font-weight: 800; text-transform: uppercase;">Recipient Acknowledgement (POD)</div>
          
          <div style="margin: 6px auto; height: 42px; display: flex; align-items: center; justify-content: center;">
            ${order.pod_signature ? `
              <img src="${order.pod_signature}" alt="Customer Signature" style="max-height: 40px; max-width: 160px; object-contain: contain;">
            ` : `
              <div style="border-bottom: 1px solid #000; width: 140px; height: 30px;"></div>
            `}
          </div>

          <div style="font-weight: 700;">${order.received_by_name || 'Customer Signature'}</div>
          <div style="font-size: 8pt; color: #333;">${order.received_by_relation || 'Designation: Store Owner/Staff'}</div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 10px; font-size: 8pt; color: #444; border-top: 1px dashed #000; padding-top: 6px;">
          <div>*** Goods Verified & Accepted ***</div>
          <div>Thank you for your business!</div>
          <div style="font-size: 7pt; color: #777; margin-top: 2px;">DMS Enterprise Fleet System</div>
        </div>

      </div>
    `;
  },

  /**
   * Spawns clean dedicated print window without web app layout bleed
   */
  printDocument() {
    const isThermal = this.currentLayout === 'thermal';
    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Please allow popups to print delivery challans.');
      return;
    }

    const docHtml = this.getPreviewHtml();
    const title = `Delivery Challan - ${this.currentData?.order?.order_number || 'Print'}`;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          @page {
            size: ${isThermal ? '80mm auto' : 'A4 portrait'};
            margin: ${isThermal ? '0' : '8mm'};
          }
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #000000;
          }
          .challan-paper-a4, .challan-paper-thermal {
            box-shadow: none !important;
            margin: 0 auto !important;
            border: none !important;
          }
        </style>
      </head>
      <body>
        ${docHtml}
        <script>
          window.onload = function() {
            window.focus();
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  }
};
