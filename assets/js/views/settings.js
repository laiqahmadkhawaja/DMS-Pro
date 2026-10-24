/**
 * Company & System Configuration View
 */

import { Api } from '../api.js';
import { Toast } from '../components/toast.js';
import { Permissions } from '../permissions.js';

export const SettingsView = {
  settings: {},
  territories: [],

  async render(container) {
    container.innerHTML = `
      <div class="space-y-4">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-main">System & Company Profile</h1>
            <p class="text-xs sm:text-sm text-muted-custom">Configure distribution organization details, invoices, tax rate, and logistics routes.</p>
          </div>
          <div class="flex items-center gap-2">
            ${Permissions.can('settings', 'edit_company') ? `
              <button id="save-settings-btn" class="btn btn-primary btn-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                <span>Save Profile Settings</span>
              </button>
            ` : ''}
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- Company Info Form -->
          <div class="lg:col-span-2 card p-4 sm:p-5 space-y-4">
            <h3 class="text-sm font-bold text-main border-b border-custom pb-2">Company Information & Print Invoicing</h3>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="form-label text-xs">Company Trade Name *</label>
                <input type="text" id="set-company-name" class="form-input text-xs" placeholder="Apex Distribution Ltd">
              </div>
              <div>
                <label class="form-label text-xs">Tagline / Motto</label>
                <input type="text" id="set-tagline" class="form-input text-xs" placeholder="Premier FMCG Wholesale">
              </div>
            </div>

            <div>
              <label class="form-label text-xs">Official Business Address</label>
              <input type="text" id="set-address" class="form-input text-xs" placeholder="Plot 102-B, Industrial Estate">
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="form-label text-xs">Official Phone</label>
                <input type="text" id="set-phone" class="form-input text-xs" placeholder="+92 42 35551234">
              </div>
              <div>
                <label class="form-label text-xs">Official Email</label>
                <input type="email" id="set-email" class="form-input text-xs" placeholder="info@company.com">
              </div>
            </div>

            <h3 class="text-sm font-bold text-main border-b border-custom pb-2 pt-2">Financial Defaults</h3>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="form-label text-xs">Currency Symbol</label>
                <input type="text" id="set-currency" class="form-input text-xs" value="Rs.">
              </div>
              <div>
                <label class="form-label text-xs">Sales GST Tax Rate (%)</label>
                <input type="number" id="set-tax-rate" class="form-input text-xs" step="0.5" value="5.0">
              </div>
              <div>
                <label class="form-label text-xs">Default Credit Period (Days)</label>
                <input type="number" id="set-credit-days" class="form-input text-xs" value="30">
              </div>
            </div>

            <div>
              <label class="form-label text-xs">Invoice & Receipt Footer Remarks</label>
              <textarea id="set-footer" class="form-textarea text-xs" rows="2" placeholder="Thank you for your business!"></textarea>
            </div>
          </div>

          <!-- Territories & System Info -->
          <div class="space-y-4">
            <div class="card p-4 sm:p-5">
              <h3 class="text-sm font-bold text-main border-b border-custom pb-2 mb-3">Territories & Routes</h3>
              <div class="space-y-2 text-xs" id="settings-territory-list">
                <div class="skeleton h-8 w-full"></div>
                <div class="skeleton h-8 w-full"></div>
              </div>
            </div>

            <div class="card p-4 sm:p-5 bg-muted-custom text-xs space-y-2">
              <h4 class="font-bold text-main">System Specifications</h4>
              <p class="text-muted-custom">Version: <strong>2.0.0 Enterprise</strong></p>
              <p class="text-muted-custom">Database: <strong>MySQL 8.x / MariaDB (InnoDB)</strong></p>
              <p class="text-muted-custom">Security: <strong>Dynamic RBAC + BCrypt Passwords</strong></p>
            </div>
          </div>
        </div>
      </div>
    `;

    await this.loadSettings();
    this.bindEvents();
  },

  async loadSettings() {
    try {
      const res = await Api.get('/settings');
      if (res.success && res.data) {
        this.settings = res.data.settings || {};
        this.territories = res.data.territories || [];

        // Fill form
        document.getElementById('set-company-name').value = this.settings.company_name || '';
        document.getElementById('set-tagline').value = this.settings.tagline || '';
        document.getElementById('set-address').value = this.settings.address || '';
        document.getElementById('set-phone').value = this.settings.phone || '';
        document.getElementById('set-email').value = this.settings.email || '';
        document.getElementById('set-currency').value = this.settings.currency || 'Rs.';
        document.getElementById('set-tax-rate').value = this.settings.tax_rate || '5.0';
        document.getElementById('set-credit-days').value = this.settings.default_credit_days || '30';
        document.getElementById('set-footer').value = this.settings.receipt_footer || '';

        // Render territories
        const terrList = document.getElementById('settings-territory-list');
        if (terrList) {
          terrList.innerHTML = this.territories.map(t => `
            <div class="p-2 rounded bg-surface border border-custom flex items-center justify-between">
              <div>
                <span class="font-bold text-main">${t.name}</span>
                <span class="block text-[11px] text-muted-custom">${t.description || ''}</span>
              </div>
              <span class="badge badge-primary font-mono text-[10px]">${t.code}</span>
            </div>
          `).join('');
        }
      }
    } catch (e) {
      Toast.error('Failed to load settings: ' + e.message);
    }
  },

  bindEvents() {
    document.getElementById('save-settings-btn')?.addEventListener('click', async () => {
      const company_name = document.getElementById('set-company-name')?.value.trim();
      const tagline = document.getElementById('set-tagline')?.value.trim();
      const address = document.getElementById('set-address')?.value.trim();
      const phone = document.getElementById('set-phone')?.value.trim();
      const email = document.getElementById('set-email')?.value.trim();
      const currency = document.getElementById('set-currency')?.value.trim();
      const tax_rate = document.getElementById('set-tax-rate')?.value.trim();
      const default_credit_days = document.getElementById('set-credit-days')?.value.trim();
      const receipt_footer = document.getElementById('set-footer')?.value.trim();

      try {
        const res = await Api.post('/settings', {
          company_name, tagline, address, phone, email,
          currency, tax_rate, default_credit_days, receipt_footer
        });
        if (res.success) {
          Toast.success('Company profile & invoicing terms saved!');
        }
      } catch (e) {
        console.error(e);
      }
    });
  }
};
