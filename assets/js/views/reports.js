/**
 * Reports & Distribution Analytics Suite
 * Supports all 7 official distribution reports with live calculations,
 * date preset filtering, real-time table search, CSV spreadsheet export,
 * print formatting, and 1-click interactive invoice inspection modal.
 */

import { Api } from '../api.js';
import { Toast } from '../components/toast.js';
import { PdfShare } from '../utils/pdf-share.js';

export const ReportsView = {
  raw: {
    orders: [],
    products: [],
    customers: [],
    payments: [],
    movements: []
  },

  activeReport: 'sales_summary',
  activeDatePreset: 'month',
  searchQuery: '',

  currentTableData: {
    title: '',
    headers: [],
    csvHeaders: [],
    rows: [],
    csvRows: [],
    summaryHtml: ''
  },

  async render(container) {
    container.innerHTML = `
      <div class="space-y-4">
        <!-- Print Header (Visible only when printed) -->
        <div class="hidden print:block border-b-2 border-primary pb-3 mb-4">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-xl font-bold text-main">DMS ENTERPRISE DISTRIBUTION PLATFORM</h1>
              <p class="text-xs text-muted-custom">Official Executive Management & Financial Audit Report</p>
            </div>
            <div class="text-right text-xs">
              <h2 class="font-bold text-main" id="print-report-type-title">Audit Report</h2>
              <p class="text-muted-custom text-[11px]">Generated: <span id="report-print-date">-</span></p>
            </div>
          </div>
        </div>

        <!-- Page Header & Action Buttons -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-main">Distribution Reports & Analytics</h1>
            <p class="text-xs sm:text-sm text-muted-custom">Comprehensive business reports with live calculations and CSV spreadsheet exports.</p>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <button type="button" class="btn btn-secondary btn-sm" id="btn-print-report">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              <span>Print</span>
            </button>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-pdf-report" title="Download Formatted PDF Report">
              <svg class="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <span>Download PDF</span>
            </button>
            <button type="button" class="btn btn-secondary btn-sm text-emerald-600 dark:text-emerald-400" id="btn-share-report" title="Share Summary directly to WhatsApp">
              <svg class="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.697c.983.54 1.803.774 2.806.775l.004-.001c3.182 0 5.768-2.586 5.768-5.766.001-3.182-2.585-5.769-5.772-5.769zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.06-1.809-.427-1.464-.607-2.39-2.094-2.464-2.193-.074-.099-.606-.807-.606-1.54 0-.733.383-1.093.52-1.24.136-.148.3-.186.4-.186.1 0 .201.002.288.006.094.004.22-.036.344.262.129.312.441 1.077.479 1.156.038.079.063.172.012.273-.051.101-.077.164-.153.253-.075.088-.159.197-.227.265-.077.076-.157.159-.068.312.089.153.396.654.85 1.059.584.521 1.076.682 1.229.758.153.076.242.064.331-.039.09-.102.383-.447.485-.6.102-.153.204-.128.344-.077.14.051.892.42 1.045.497.153.076.255.115.293.178.038.064.038.371-.106.776z"/></svg>
              <span>Share WhatsApp</span>
            </button>
            <button type="button" class="btn btn-primary btn-sm" id="btn-export-csv">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <!-- Toolbar & Filter Selectors Card -->
        <div class="card p-3 sm:p-4 no-print">
          <div class="flex flex-col lg:flex-row items-center justify-between gap-3">
            <div class="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
              <!-- Report Type Selector -->
              <select id="report-type-select" class="form-select text-xs font-semibold w-full sm:w-72">
                <option value="sales_summary">1. Sales Summary Report (Daily/Monthly)</option>
                <option value="product_performance">2. Product Sales Performance</option>
                <option value="customer_sales">3. Customer Sales Ranking</option>
                <option value="receivables_aging">4. Accounts Receivable Aging Report</option>
                <option value="inventory_valuation">5. Warehouse Inventory Valuation</option>
                <option value="stock_movements">6. Stock Movements Audit Ledger</option>
                <option value="payment_collections">7. Cash & Payment Collections Summary</option>
              </select>

              <!-- Date Preset Selector -->
              <select id="report-date-preset" class="form-select text-xs w-full sm:w-44">
                <option value="month">Month to Date</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="year">Year to Date</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <!-- Search Table -->
            <div class="relative w-full lg:w-64">
              <input type="search" id="report-search-input" class="form-input pl-9 text-xs" placeholder="Search table results..." autocomplete="off">
              <svg class="w-4 h-4 text-subtle-custom absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
          </div>
        </div>

        <!-- Dynamic Metric Badges Bar -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3" id="report-summary-bar">
          <div class="card p-3 skeleton h-16"></div>
          <div class="card p-3 skeleton h-16"></div>
          <div class="card p-3 skeleton h-16"></div>
          <div class="card p-3 skeleton h-16"></div>
        </div>

        <!-- Report Data Table -->
        <div class="card overflow-hidden">
          <div class="p-3 border-b border-custom flex items-center justify-between">
            <h3 class="text-sm font-bold text-main" id="report-title-display">Sales Summary Report</h3>
            <span class="badge badge-primary font-mono text-[11px]" id="report-rows-badge">0 Records</span>
          </div>

          <div class="table-responsive">
            <table class="data-table text-xs" id="report-table">
              <thead id="report-thead">
                <tr><th class="py-3">Loading Columns...</th></tr>
              </thead>
              <tbody id="report-tbody">
                <tr><td class="text-center py-8 text-muted-custom">Compiling distribution analytics...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    await this.loadSuiteData();
  },

  bindEvents() {
    document.getElementById('report-type-select')?.addEventListener('change', (e) => {
      this.activeReport = e.target.value;
      this.compileActiveReport();
    });

    document.getElementById('report-date-preset')?.addEventListener('change', (e) => {
      this.activeDatePreset = e.target.value;
      this.compileActiveReport();
    });

    document.getElementById('report-search-input')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderReportView();
    });

    document.getElementById('btn-export-csv')?.addEventListener('click', () => {
      this.exportCurrentReportCsv();
    });

    document.getElementById('btn-print-report')?.addEventListener('click', () => {
      window.print();
    });

    document.getElementById('btn-pdf-report')?.addEventListener('click', () => {
      this.downloadPdfReport();
    });

    document.getElementById('btn-share-report')?.addEventListener('click', () => {
      this.shareReportWhatsApp();
    });
  },

  downloadPdfReport() {
    const title = this.currentTableData.title || 'Distribution Report';
    const dateStr = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const period = this.activeDatePreset.toUpperCase();
    
    const headersHtml = (this.currentTableData.headers || []).map(h => `<th style="border: 1px solid #cbd5e1; padding: 6px 8px; background: #f1f5f9; font-size: 11px; text-align: left;">${h}</th>`).join('');
    
    const rows = this.currentTableData.rows || [];
    const rowsHtml = rows.map(r => `
      <tr>
        ${r.map(c => `<td style="border: 1px solid #e2e8f0; padding: 6px 8px; font-size: 11px;">${c}</td>`).join('')}
      </tr>
    `).join('');

    const html = `
      <div style="font-family: Arial, sans-serif; color: #1e293b; padding: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 12px;">
          <div>
            <h1 style="margin: 0; font-size: 18px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">DMS Distribution Platform</h1>
            <p style="margin: 2px 0 0; font-size: 12px; color: #64748b; font-weight: bold;">${title}</p>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748b;">
            <div>Period: <strong>${period}</strong></div>
            <div>Generated: <strong>${dateStr}</strong></div>
            <div>Total Records: <strong>${rows.length}</strong></div>
          </div>
        </div>

        <div style="margin-bottom: 12px; font-size: 11px;">
          ${this.currentTableData.summaryHtml || ''}
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
          <thead>
            <tr>${headersHtml}</tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="10" style="text-align: center; padding: 16px;">No records available.</td></tr>'}
          </tbody>
        </table>

        <div style="margin-top: 20px; border-top: 1px dashed #cbd5e1; padding-top: 8px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between;">
          <span>CONFIDENTIAL &bull; DMS Enterprise Management System</span>
          <span>Verified Accurate Digital Report</span>
        </div>
      </div>
    `;

    PdfShare.downloadPdf(html, `DMS_Report_${this.activeReport}_${new Date().toISOString().split('T')[0]}.pdf`, 'a4');
  },

  shareReportWhatsApp() {
    const title = this.currentTableData.title || 'Distribution Report';
    const period = this.activeDatePreset.toUpperCase();
    const count = (this.currentTableData.rows || []).length;
    
    // Extract key metrics text from summary HTML if present
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = this.currentTableData.summaryHtml || '';
    const summaryText = tempDiv.innerText.replace(/\s+/g, ' ').trim();

    const options = {
      title: `📊 DMS ${title}`,
      docType: 'Official Report',
      refNumber: `${this.activeReport.toUpperCase()}-${new Date().toISOString().split('T')[0]}`,
      date: new Date().toLocaleDateString('en-GB'),
      text: `📊 *DMS DISTRIBUTION REPORT*\n📌 *Report:* ${title}\n📅 *Preset:* ${period}\n🔢 *Total Rows:* ${count}\n\n*Key Summary Metrics:*\n${summaryText}\n\nGenerated via DMS Platform.`
    };

    if (PdfShare.isMobile() && navigator.share) {
      PdfShare.shareNative(options);
    } else {
      PdfShare.shareViaWhatsApp(options);
    }
  },

  async loadSuiteData() {
    try {
      const res = await Api.get('/reports/suite');
      if (res.success && res.data) {
        this.raw = res.data;
        this.compileActiveReport();
      }
    } catch (e) {
      Toast.error('Failed to load reports suite: ' + e.message);
    }
  },

  matchesDate(dateString) {
    if (!dateString) return false;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;

    const now = new Date();

    if (this.activeDatePreset === 'today') {
      return date.getDate() === now.getDate() &&
             date.getMonth() === now.getMonth() &&
             date.getFullYear() === now.getFullYear();
    } else if (this.activeDatePreset === '7days') {
      const diff = (now - date) / (1000 * 60 * 60 * 24);
      return diff <= 7 && diff >= 0;
    } else if (this.activeDatePreset === 'month') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    } else if (this.activeDatePreset === 'year') {
      return date.getFullYear() === now.getFullYear();
    }
    return true; // 'all'
  },

  compileActiveReport() {
    switch (this.activeReport) {
      case 'sales_summary':
        this.compileSalesSummary();
        break;
      case 'product_performance':
        this.compileProductPerformance();
        break;
      case 'customer_sales':
        this.compileCustomerSales();
        break;
      case 'receivables_aging':
        this.compileReceivablesAging();
        break;
      case 'inventory_valuation':
        this.compileInventoryValuation();
        break;
      case 'stock_movements':
        this.compileStockMovements();
        break;
      case 'payment_collections':
        this.compilePaymentCollections();
        break;
    }

    this.renderReportView();
  },

  // 1. Sales Summary Report
  compileSalesSummary() {
    const orders = (this.raw.orders || []).filter(o => o.status !== 'cancelled' && this.matchesDate(o.created_at));
    const dateMap = {};

    orders.forEach(o => {
      const dStr = new Date(o.created_at).toLocaleDateString('en-GB');
      if (!dateMap[dStr]) {
        dateMap[dStr] = { date: dStr, rawDate: o.created_at, orders: 0, units: 0, cash: 0, credit: 0, total: 0, latestInvoice: o.invoice_number || o.order_number };
      }
      dateMap[dStr].orders++;
      dateMap[dStr].total += o.total;
      if (o.payment_terms && o.payment_terms.toLowerCase().includes('cash')) {
        dateMap[dStr].cash += o.total;
      } else {
        dateMap[dStr].credit += o.total;
      }

      (o.items || []).forEach(it => {
        dateMap[dStr].units += (Number(it.quantity) || 0);
      });
    });

    const rows = Object.values(dateMap);
    let totalSales = 0;
    let totalUnits = 0;
    rows.forEach(r => { totalSales += r.total; totalUnits += r.units; });

    this.currentTableData = {
      title: 'Daily & Monthly Sales Summary Report',
      headers: ['Date', 'Orders', 'Units Sold', 'Cash Sales', 'Credit Sales', 'Total Sales Volume'],
      csvHeaders: ['Date', 'Orders', 'Units Sold', 'Cash Sales (PKR)', 'Credit Sales (PKR)', 'Total Sales Volume (PKR)'],
      rows: rows.map(r => [
        `<span class="font-mono text-muted-custom font-semibold">${r.date}</span>`,
        `<span class="font-bold text-main">${r.orders}</span>`,
        `<span class="font-mono">${r.units}</span>`,
        `Rs. ${r.cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        `Rs. ${r.credit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        `<b class="text-primary font-bold">Rs. ${r.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</b>`
      ]),
      csvRows: rows.map(r => [
        r.date, r.orders, r.units, r.cash.toFixed(2), r.credit.toFixed(2), r.total.toFixed(2)
      ]),
      summaryHtml: `
        <div class="card p-3">
          <span class="text-[11px] text-muted-custom block font-medium">Total Sales Volume</span>
          <b class="text-base sm:text-lg font-bold text-primary">Rs. ${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</b>
        </div>
        <div class="card p-3">
          <span class="text-[11px] text-muted-custom block font-medium">Units Sold</span>
          <b class="text-base sm:text-lg font-bold text-main">${totalUnits.toLocaleString()} Units</b>
        </div>
        <div class="card p-3">
          <span class="text-[11px] text-muted-custom block font-medium">Orders Processed</span>
          <b class="text-base sm:text-lg font-bold text-emerald-600">${orders.length} Orders</b>
        </div>
        <div class="card p-3">
          <span class="text-[11px] text-muted-custom block font-medium">Average Order Value</span>
          <b class="text-base sm:text-lg font-bold text-main">Rs. ${(orders.length ? (totalSales / orders.length) : 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</b>
        </div>
      `
    };
  },

  // 2. Product Sales Performance
  compileProductPerformance() {
    const prodMap = {};
    (this.raw.products || []).forEach(p => {
      prodMap[p.id] = {
        name: p.name,
        sku: p.sku || '-',
        category: p.category || 'General',
        unitsSold: 0,
        revenue: 0
      };
    });

    (this.raw.orders || []).filter(o => o.status !== 'cancelled' && this.matchesDate(o.created_at)).forEach(o => {
      (o.items || []).forEach(it => {
        if (prodMap[it.product_id]) {
          const qty = Number(it.quantity) || 0;
          prodMap[it.product_id].unitsSold += qty;
          prodMap[it.product_id].revenue += (it.line_total || (qty * (it.unit_price || 0)));
        }
      });
    });

    const rows = Object.values(prodMap).filter(p => p.unitsSold > 0).sort((a, b) => b.revenue - a.revenue);
    let totalUnits = 0;
    let totalRev = 0;
    rows.forEach(r => { totalUnits += r.unitsSold; totalRev += r.revenue; });

    this.currentTableData = {
      title: 'Product Sales Performance Report',
      headers: ['Product Description', 'SKU', 'Category', 'Units Sold', 'Total Revenue'],
      csvHeaders: ['Product Name', 'SKU', 'Category', 'Units Sold', 'Total Revenue (PKR)'],
      rows: rows.map(r => [
        `<b class="text-main">${r.name}</b>`,
        `<span class="font-mono text-xs text-muted-custom">${r.sku}</span>`,
        `<span class="badge badge-secondary text-[10px]">${r.category}</span>`,
        `<span class="font-bold text-main">${r.unitsSold.toLocaleString()}</span>`,
        `<b class="text-primary font-bold">Rs. ${r.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</b>`
      ]),
      csvRows: rows.map(r => [
        r.name, r.sku, r.category, r.unitsSold, r.revenue.toFixed(2)
      ]),
      summaryHtml: `
        <div class="card p-3">
          <span class="text-[11px] text-muted-custom block font-medium">Active SKUs Sold</span>
          <b class="text-base sm:text-lg font-bold text-primary">${rows.length} Products</b>
        </div>
        <div class="card p-3">
          <span class="text-[11px] text-muted-custom block font-medium">Total Units Sold</span>
          <b class="text-base sm:text-lg font-bold text-main">${totalUnits.toLocaleString()} Units</b>
        </div>
        <div class="card p-3">
          <span class="text-[11px] text-muted-custom block font-medium">Total Product Revenue</span>
          <b class="text-base sm:text-lg font-bold text-emerald-600">Rs. ${totalRev.toLocaleString('en-US', { minimumFractionDigits: 2 })}</b>
        </div>
        <div class="card p-3">
          <span class="text-[11px] text-muted-custom block font-medium">Top SKU by Volume</span>
          <b class="text-xs sm:text-sm font-bold text-main truncate block">${rows[0] ? rows[0].name : 'N/A'}</b>
        </div>
      `
    };
  },

  // 3. Customer Sales Ranking
  compileCustomerSales() {
    const custMap = {};
    (this.raw.customers || []).forEach(c => {
      custMap[c.id] = {
        name: c.shop_name,
        code: c.code || '-',
        route: c.territory_route || 'General',
        ordersCount: 0,
        totalSales: 0,
        balance: c.current_balance || 0,
        latestInvoice: ''
      };
    });

    (this.raw.orders || []).filter(o => o.status !== 'cancelled' && this.matchesDate(o.created_at)).forEach(o => {
      if (o.customer_id && custMap[o.customer_id]) {
        custMap[o.customer_id].ordersCount++;
        custMap[o.customer_id].totalSales += o.total;
        if (!custMap[o.customer_id].latestInvoice && o.invoice_number) {
          custMap[o.customer_id].latestInvoice = o.invoice_number;
        }
      }
    });

    const rows = Object.values(custMap)
      .filter(c => c.ordersCount > 0 || c.balance > 0)
      .sort((a, b) => b.totalSales - a.totalSales);

    let billedSum = 0;
    let balanceSum = 0;
    rows.forEach(r => { billedSum += r.totalSales; balanceSum += r.balance; });

    this.currentTableData = {
      title: 'Customer Sales & Volume Ranking Report',
      headers: ['Customer / Shop', 'Territory Route', 'Orders', 'Total Sales Volume', 'Current Balance Due', 'Latest Invoice'],
      csvHeaders: ['Customer Name', 'Code', 'Territory', 'Orders Count', 'Total Sales Volume (PKR)', 'Current Balance (PKR)', 'Latest Invoice #'],
      rows: rows.map(r => [
        `<div><b class="text-main">${r.name}</b> <span class="font-mono text-[10px] text-muted-custom">(${r.code})</span></div>`,
        `<span class="text-muted-custom">${r.route}</span>`,
        `<span class="font-bold text-main">${r.ordersCount}</span>`,
        `<b class="text-primary font-bold">Rs. ${r.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</b>`,
        `<span class="font-bold ${r.balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-muted-custom'}">Rs. ${r.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>`,
        r.latestInvoice ? `
          <button type="button" class="font-mono font-bold text-primary hover:underline open-invoice-modal-btn inline-flex items-center gap-1" data-ref="${r.latestInvoice}">
            <span>${r.latestInvoice}</span>
            <svg class="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          </button>
        ` : `<span class="text-muted-custom">-</span>`
      ]),
      csvRows: rows.map(r => [
        r.name, r.code, r.route, r.ordersCount, r.totalSales.toFixed(2), r.balance.toFixed(2), r.latestInvoice || ''
      ]),
      summaryHtml: `
        <div class="card p-3">
          <span class="text-[11px] text-muted-custom block font-medium">Active Clients</span>
          <b class="text-base sm:text-lg font-bold text-primary">${rows.length} Retailers</b>
        </div>
        <div class="card p-3">
          <span class="text-[11px] text-muted-custom block font-medium">Total Billed Volume</span>
          <b class="text-base sm:text-lg font-bold text-main">Rs. ${billedSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</b>
        </div>
        <div class="card p-3">
          <span class="text-[11px] text-muted-custom block font-medium">Total Outstanding Receivables</span>
          <b class="text-base sm:text-lg font-bold text-rose-600 dark:text-rose-400">Rs. ${balanceSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</b>
        </div>
        <div class="card p-3">
          <span class="text-[11px] text-muted-custom block font-medium">Top Customer</span>
          <b class="text-xs sm:text-sm font-bold text-main truncate block">${rows[0] ? rows[0].name : 'N/A'}</b>
        </div>
      `
    };
  },

  // 4. Accounts Receivable Aging Report
  compileReceivablesAging() {
    const now = new Date();
    const debtors = (this.raw.customers || [])
      .filter(c => (c.current_balance || 0) > 0)
      .map(c => {
        const bal = c.current_balance || 0;
        const limit = c.credit_limit || 0;
        const regDate = new Date(c.created_at || now);
        const diffDays = Math.max(0, Math.floor((now - regDate) / (1000 * 60 * 60 * 24)));

        let bracket = '0 - 15d';
        let badgeClass = 'badge-success';
        if (diffDays > 60) {
          bracket = '60+d Risk';
          badgeClass = 'badge-danger';
        } else if (diffDays > 30) {
          bracket = '31 - 60d';
          badgeClass = 'badge-warning';
        } else if (diffDays > 15) {
          bracket = '16 - 30d';
          badgeClass = 'badge-info';
        }

        return {
          name: c.shop_name,
          code: c.code || '-',
          phone: c.phone || 'N/A',
          route: c.territory_route || 'General',
          limit,
          balance: bal,
          bracket,
          badgeClass
        };
      })
      .sort((a, b) => b.balance - a.balance);

    let totalReceivable = 0;
    debtors.forEach(d => totalReceivable += d.balance);

    this.currentTableData = {
      title: 'Accounts Receivable Aging & Debt Analysis Report',
      headers: ['Customer / Shop', 'Contact Phone', 'Territory Route', 'Credit Limit', 'Aging Bracket', 'Balance Due'],
      csvHeaders: ['Customer Name', 'Code', 'Phone', 'Territory', 'Credit Limit (PKR)', 'Aging Bracket', 'Balance Due (PKR)'],
      rows: debtors.map(d => [
        `<div><b class="text-main">${d.name}</b> <span class="font-mono text-[10px] text-muted-custom">(${d.code})</span></div>`,
        `<a href="tel:${d.phone}" class="text-primary font-semibold">${d.phone}</a>`,
        `<span class="text-muted-custom">${d.route}</span>`,
        `<span class="font-mono">Rs. ${d.limit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>`,
        `<span class="badge ${d.badgeClass} text-[10px] uppercase font-bold">${d.bracket}</span>`,
        `<b class="text-rose-600 dark:text-rose-400 font-bold">Rs. ${d.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</b>`
      ]),
      csvRows: debtors.map(d => [
        d.name, d.code, d.phone, d.route, d.limit.toFixed(2), d.bracket, d.balance.toFixed(2)
      ]),
      summaryHtml: `
        <div class="card p-3">
          <span class="text-[11px] text-muted-custom block font-medium">Total Overdue Receivables</span>
          <b class="text-base sm:text-lg font-bold text-rose-600 dark:text-rose-400">Rs. ${totalReceivable.toLocaleString('en-US', { minimumFractionDigits: 2 })}</b>
        </div>
        <div class="card p-3">
          <span class="text-[11px] text-muted-custom block font-medium">Debtor Accounts</span>
          <b class="text-base sm:text-lg font-bold text-main">${debtors.length} Accounts</b>
        </div>
        <div class="card p-3">
          <span class="text-[11px] text-muted-custom block font-medium">High Risk (30d+) Accounts</span>
          <b class="text-base sm:text-lg font-bold text-amber-500">${debtors.filter(d => d.bracket.includes('30') || d.bracket.includes('60')).length} Accounts</b>
        </div>
      `
    };
  },

  // 5. Warehouse Inventory Valuation
  compileInventoryValuation() {
    let totalCostVal = 0;
    let totalRetailVal = 0;
    let totalUnits = 0;

    const rows = (this.raw.products || []).map(p => {
      const stock = Number(p.current_stock) || 0;
      const cost = Number(p.cost_price) || 0;
      const selling = Number(p.selling_price) || 0;
      const costTotal = stock * cost;
      const retailTotal = stock * selling;

      totalCostVal += costTotal;
      totalRetailVal += retailTotal;
      totalUnits += stock;

      return {
        name: p.name,
        sku: p.sku || '-',
        category: p.category || 'General',
        stock,
        cost,
        selling,
        costTotal,
        retailTotal,
        expiry: p.expiry_date || null,
        batch: p.batch_number || null,
        days: p.days_to_expiry,
        isExpired: p.is_expired,
        isNear: p.is_near_expiry
      };
    }).sort((a, b) => b.retailTotal - a.retailTotal);

    this.currentTableData = {
      title: 'Warehouse Stock Valuation & Expiry Audit Report',
      headers: ['Product Name', 'SKU', 'Category', 'Expiry & Lot', 'Physical Stock', 'Purchase Cost', 'Retail Price', 'Total Cost Value', 'Total Retail Value'],
      csvHeaders: ['Product Name', 'SKU', 'Category', 'Expiry Date', 'Batch Lot', 'Physical Stock', 'Purchase Cost (PKR)', 'Retail Price (PKR)', 'Total Cost Value (PKR)', 'Total Retail Value (PKR)'],
      rows: rows.map(r => [
        `<b class="text-main">${r.name}</b>`,
        `<span class="font-mono text-xs text-muted-custom">${r.sku}</span>`,
        `<span class="badge badge-secondary text-[10px]">${r.category}</span>`,
        r.expiry ? `
          <div class="text-xs font-semibold ${r.isExpired ? 'text-rose-600' : (r.isNear ? 'text-amber-600' : 'text-main')}">${new Date(r.expiry).toLocaleDateString('en-GB')}</div>
          <div class="text-[10px] text-muted-custom font-mono">${r.batch || '—'}</div>
        ` : '<span class="text-xs text-muted-custom">—</span>',
        `<span class="font-bold text-main font-mono">${r.stock.toLocaleString()}</span>`,
        `Rs. ${r.cost.toFixed(2)}`,
        `Rs. ${r.selling.toFixed(2)}`,
        `<span class="font-mono">Rs. ${r.costTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>`,
        `<b class="text-primary font-bold">Rs. ${r.retailTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</b>`
      ]),
      csvRows: rows.map(r => [
        r.name, r.sku, r.category, r.expiry || 'N/A', r.batch || 'N/A', r.stock, r.cost.toFixed(2), r.selling.toFixed(2), r.costTotal.toFixed(2), r.retailTotal.toFixed(2)
      ]),
      summaryHtml: `
        <div class="card p-3">
          <span class="text-[11px] text-muted-custom block font-medium">Total Cost Valuation</span>
          <b class="text-base sm:text-lg font-bold text-primary">Rs. ${totalCostVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</b>
        </div>
        <div class="card p-3">
          <span class="text-[11px] text-muted-custom block font-medium">Total Retail Valuation</span>
          <b class="text-base sm:text-lg font-bold text-emerald-600">Rs. ${totalRetailVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</b>
        </div>
        <div class="card p-3">
          <span class="text-[11px] text-muted-custom block font-medium">Physical Warehouse Units</span>
          <b class="text-base sm:text-lg font-bold text-main">${totalUnits.toLocaleString()} Units</b>
        </div>
        <div class="card p-3">
          <span class="text-[11px] text-muted-custom block font-medium">Total Inventory SKUs</span>
          <b class="text-base sm:text-lg font-bold text-main">${rows.length} Items</b>
        </div>
      `
    };
  },

  // 6. Stock Movements Audit Ledger
  compileStockMovements() {
    const movements = (this.raw.movements || []).filter(m => this.matchesDate(m.created_at));

    this.currentTableData = {
      title: 'Stock Movements & Variance Audit Report',
      headers: ['Timestamp', 'Product Name', 'Movement Type', 'Qty Delta', 'Stock After', 'Reference Doc', 'Actor'],
      csvHeaders: ['Timestamp', 'Product Name', 'Movement Type', 'Quantity Delta', 'Balance After', 'Reference Doc', 'Recorded By'],
      rows: movements.map(m => [
        `<span class="font-mono text-muted-custom whitespace-nowrap">${new Date(m.created_at).toLocaleDateString('en-GB')} ${new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`,
        `<b class="text-main">${m.product_name}</b>`,
        `<span class="badge badge-secondary text-[10px] font-mono">${m.movement_type}</span>`,
        `<span class="font-mono font-bold ${m.quantity_change >= 0 ? 'text-emerald-600' : 'text-rose-600'}">${m.quantity_change >= 0 ? '+' + m.quantity_change : m.quantity_change}</span>`,
        `<span class="font-mono font-bold text-main">${m.new_stock}</span>`,
        m.reference_id && (m.reference_id.startsWith('ORD-') || m.reference_id.startsWith('INV-')) ? `
          <button type="button" class="font-mono text-primary font-bold hover:underline open-invoice-modal-btn inline-flex items-center gap-1" data-ref="${m.reference_id}">
            <span>${m.reference_id}</span>
            <svg class="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          </button>
        ` : `<span class="font-mono text-muted-custom">${m.reference_id || '-'}</span>`,
        `<span class="text-muted-custom">${m.recorded_by || 'System'}</span>`
      ]),
      csvRows: movements.map(m => [
        new Date(m.created_at).toISOString(), m.product_name, m.movement_type, m.quantity_change, m.new_stock, m.reference_id || '', m.recorded_by || ''
      ]),
      summaryHtml: `
        <div class="card p-3">
          <span class="text-[11px] text-muted-custom block font-medium">Movement Audit Records</span>
          <b class="text-base sm:text-lg font-bold text-primary">${movements.length} Entries</b>
        </div>
      `
    };
  },

  // 7. Cash & Payment Collections Summary
  compilePaymentCollections() {
    const payments = (this.raw.payments || []).filter(p => this.matchesDate(p.payment_date || p.created_at));
    let totalCollected = 0;
    payments.forEach(p => totalCollected += p.amount);

    this.currentTableData = {
      title: 'Cash & Payment Collections Summary Report',
      headers: ['Payment Date', 'Receipt #', 'Customer / Shop', 'Method', 'Reference #', 'Collector', 'Amount Collected'],
      csvHeaders: ['Date', 'Receipt Number', 'Customer Name', 'Payment Method', 'Reference Number', 'Collector', 'Amount (PKR)'],
      rows: payments.map(p => [
        `<span class="font-mono text-muted-custom whitespace-nowrap">${new Date(p.payment_date || p.created_at).toLocaleDateString('en-GB')}</span>`,
        `<span class="font-mono font-bold text-primary">${p.payment_number}</span>`,
        `<b class="text-main">${p.customer_name}</b>`,
        `<span class="badge badge-secondary text-[10px] uppercase font-semibold">${p.payment_method}</span>`,
        p.reference_number && (p.reference_number.startsWith('ORD-') || p.reference_number.startsWith('INV-')) ? `
          <button type="button" class="font-mono text-primary font-bold hover:underline open-invoice-modal-btn inline-flex items-center gap-1" data-ref="${p.reference_number}">
            <span>${p.reference_number}</span>
            <svg class="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          </button>
        ` : `<span class="font-mono text-muted-custom">${p.reference_number || '-'}</span>`,
        `<span class="text-muted-custom">${p.collected_by_name || 'Staff'}</span>`,
        `<b class="text-emerald-600 dark:text-emerald-400 font-bold">Rs. ${p.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</b>`
      ]),
      csvRows: payments.map(p => [
        new Date(p.payment_date || p.created_at).toLocaleDateString('en-GB'), p.payment_number, p.customer_name, p.payment_method, p.reference_number || '', p.collected_by_name || '', p.amount.toFixed(2)
      ]),
      summaryHtml: `
        <div class="card p-3">
          <span class="text-[11px] text-muted-custom block font-medium">Total Payments Collected</span>
          <b class="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">Rs. ${totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}</b>
        </div>
        <div class="card p-3">
          <span class="text-[11px] text-muted-custom block font-medium">Receipts Processed</span>
          <b class="text-base sm:text-lg font-bold text-primary">${payments.length} Receipts</b>
        </div>
      `
    };
  },

  renderReportView() {
    const titleDisplay = document.getElementById('report-title-display');
    const summaryBar = document.getElementById('report-summary-bar');
    const rowsBadge = document.getElementById('report-rows-badge');
    const thead = document.getElementById('report-thead');
    const tbody = document.getElementById('report-tbody');

    const printTitle = document.getElementById('print-report-type-title');
    const printDate = document.getElementById('report-print-date');

    if (!titleDisplay || !summaryBar || !thead || !tbody) return;

    titleDisplay.textContent = this.currentTableData.title;
    summaryBar.innerHTML = this.currentTableData.summaryHtml;

    if (printTitle) printTitle.textContent = this.currentTableData.title;
    if (printDate) printDate.textContent = new Date().toLocaleString();

    thead.innerHTML = `<tr>${this.currentTableData.headers.map(h => `<th class="py-2.5">${h}</th>`).join('')}</tr>`;

    // Filter rows by search
    let displayRows = this.currentTableData.rows;
    if (this.searchQuery) {
      displayRows = displayRows.filter(r => 
        r.some(cell => String(cell).toLowerCase().includes(this.searchQuery))
      );
    }

    if (rowsBadge) rowsBadge.textContent = `${displayRows.length} Records`;

    if (displayRows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${this.currentTableData.headers.length}" class="text-center py-8 text-muted-custom">No matching records found for the selected criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = displayRows.map(row => `
      <tr>
        ${row.map(cell => `<td class="py-2.5">${cell}</td>`).join('')}
      </tr>
    `).join('');

    // Attach 1-click invoice modal listeners to any open-invoice-modal-btn
    tbody.querySelectorAll('.open-invoice-modal-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const ref = btn.getAttribute('data-ref');
        if (window.openInvoiceModal) {
          window.openInvoiceModal(ref);
        }
      });
    });
  },

  exportCurrentReportCsv() {
    if (this.currentTableData.csvRows.length === 0) {
      Toast.warning('No report rows available to export.');
      return;
    }

    const csvLines = [
      this.currentTableData.csvHeaders.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...this.currentTableData.csvRows.map(row => 
        row.map(val => `"${String(val !== undefined ? val : '').replace(/"/g, '""')}"`).join(',')
      )
    ];

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DMS_${this.activeReport}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    Toast.success(`Report exported to DMS_${this.activeReport}.csv!`);
  }
};
