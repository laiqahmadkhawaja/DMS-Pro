/**
 * Dynamic Granular Roles & Permissions Matrix View
 */

import { Api } from '../api.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';
import { Confirm } from '../components/confirm.js';
import { Permissions } from '../permissions.js';

export const RolesView = {
  roles: [],
  modules: [],
  rolePerms: {}, // { roleId: [actionId, ...] }
  selectedRoleId: null,

  async render(container) {
    container.innerHTML = `
      <div class="space-y-4">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-main">Granular Roles & Permissions Matrix</h1>
            <p class="text-xs sm:text-sm text-muted-custom">Configure dynamic module-wise, page-wise, and action-wise access control across all distribution roles.</p>
          </div>
          <div class="flex items-center gap-2">
            ${Permissions.can('roles', 'create') ? `
              <button id="add-role-modal-btn" class="btn btn-primary btn-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                <span>+ Create Custom Role</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Role Selector Tabs -->
        <div class="card p-3 sm:p-4">
          <div class="flex items-center gap-2 overflow-x-auto pb-1" id="role-selector-pills">
            <div class="skeleton h-8 w-24"></div>
            <div class="skeleton h-8 w-24"></div>
            <div class="skeleton h-8 w-24"></div>
          </div>
        </div>

        <!-- Role Permissions Matrix Card -->
        <div class="card overflow-hidden">
          <div class="p-4 border-b border-custom flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 class="text-base font-bold text-main" id="selected-role-name">Loading Role...</h3>
              <p class="text-xs text-muted-custom" id="selected-role-desc">Select role above to edit granted capabilities.</p>
            </div>
            <div class="flex items-center gap-2">
              <button id="toggle-all-perms-btn" class="btn btn-secondary btn-sm">Toggle All</button>
              <button id="save-permissions-matrix-btn" class="btn btn-primary btn-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                <span>Save Permissions Matrix</span>
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="data-table text-xs" id="matrix-table">
              <thead>
                <tr>
                  <th style="width: 25%;">System Module</th>
                  <th style="width: 75%;">Configurable Actions & Privileges</th>
                </tr>
              </thead>
              <tbody id="matrix-tbody">
                <tr><td colspan="2" class="text-center py-12 text-muted-custom">Loading permissions grid...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    await this.loadMatrixData();
    this.bindEvents();
  },

  async loadMatrixData() {
    try {
      const res = await Api.get('/roles/matrix');
      if (res.success && res.data) {
        this.roles = res.data.roles || [];
        this.modules = res.data.modules || [];
        this.rolePerms = res.data.role_perms || {};

        if (this.roles.length > 0 && !this.selectedRoleId) {
          // Default select first non-superadmin role (or superadmin)
          const defRole = this.roles.find(r => r.slug !== 'super_admin') || this.roles[0];
          this.selectedRoleId = defRole.id;
        }

        this.renderRolePills();
        this.renderMatrix();
      }
    } catch (e) {
      Toast.error('Failed to load permission matrix: ' + e.message);
    }
  },

  renderRolePills() {
    const container = document.getElementById('role-selector-pills');
    if (!container) return;

    container.innerHTML = this.roles.map(r => `
      <button class="btn ${r.id === this.selectedRoleId ? 'btn-primary' : 'btn-secondary'} btn-sm role-pill-btn whitespace-nowrap" data-id="${r.id}">
        ${r.name} ${r.is_system ? '<span class="text-[10px] opacity-75">(System)</span>' : ''}
      </button>
    `).join('');

    container.querySelectorAll('.role-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        this.selectedRoleId = id;
        this.renderRolePills();
        this.renderMatrix();
      });
    });
  },

  renderMatrix() {
    const role = this.roles.find(r => r.id === this.selectedRoleId);
    if (!role) return;

    const roleNameEl = document.getElementById('selected-role-name');
    const roleDescEl = document.getElementById('selected-role-desc');
    const saveBtn = document.getElementById('save-permissions-matrix-btn');
    const toggleBtn = document.getElementById('toggle-all-perms-btn');
    const tbody = document.getElementById('matrix-tbody');

    if (roleNameEl) roleNameEl.textContent = `${role.name} (${role.slug})`;
    if (roleDescEl) roleDescEl.textContent = role.description || 'System access role';

    const isSuperAdmin = role.slug === 'super_admin';
    if (saveBtn) saveBtn.disabled = isSuperAdmin;
    if (toggleBtn) toggleBtn.disabled = isSuperAdmin;

    if (isSuperAdmin) {
      tbody.innerHTML = `
        <tr>
          <td colspan="2" class="p-8 text-center bg-primary-light text-primary">
            <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            <div class="font-bold text-sm">Super Administrator Role is Global</div>
            <p class="text-xs mt-1">Super Admin inherently retains all operational, financial, and management privileges globally.</p>
          </td>
        </tr>
      `;
      return;
    }

    const assignedActionIds = this.rolePerms[role.id] || [];

    tbody.innerHTML = this.modules.map(mod => {
      const actions = mod.actions || [];

      const actionPills = actions.map(act => {
        const isChecked = assignedActionIds.includes(act.id);
        return `
          <label class="inline-flex items-center gap-1.5 p-1.5 rounded-lg border border-custom bg-surface hover:bg-muted-custom cursor-pointer transition-colors text-xs select-none">
            <input type="checkbox" class="perm-action-checkbox w-3.5 h-3.5 rounded text-primary focus:ring-primary" data-action-id="${act.id}" ${isChecked ? 'checked' : ''}>
            <span class="font-semibold text-main">${act.label}</span>
            <span class="text-[10px] text-subtle-custom font-mono">(${act.action_slug})</span>
          </label>
        `;
      }).join('');

      return `
        <tr>
          <td class="align-top font-bold text-main">
            <div class="flex items-center gap-2">
              <span class="p-1 rounded bg-muted-custom text-primary font-mono text-xs">#${mod.sort_order}</span>
              <div>
                <div class="text-sm">${mod.name}</div>
                <div class="text-[11px] text-muted-custom font-mono">${mod.slug}</div>
              </div>
            </div>
            <button class="text-primary hover:underline text-[10px] mt-2 block select-module-row-btn" data-mod-id="${mod.id}">
              Select / Deselect Row
            </button>
          </td>
          <td class="align-top">
            <div class="flex flex-wrap gap-2">
              ${actionPills || '<span class="text-xs text-muted-custom">No specific actions configured for this module.</span>'}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Row selection helper
    tbody.querySelectorAll('.select-module-row-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tr = e.target.closest('tr');
        const checkboxes = tr.querySelectorAll('.perm-action-checkbox');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        checkboxes.forEach(cb => { cb.checked = !allChecked; });
      });
    });
  },

  bindEvents() {
    document.getElementById('save-permissions-matrix-btn')?.addEventListener('click', async () => {
      await this.saveMatrix();
    });

    document.getElementById('toggle-all-perms-btn')?.addEventListener('click', () => {
      const checkboxes = document.querySelectorAll('.perm-action-checkbox');
      const allChecked = Array.from(checkboxes).every(cb => cb.checked);
      checkboxes.forEach(cb => { cb.checked = !allChecked; });
    });

    document.getElementById('add-role-modal-btn')?.addEventListener('click', () => {
      this.openAddRoleModal();
    });
  },

  async saveMatrix() {
    if (!this.selectedRoleId) return;

    const checkboxes = document.querySelectorAll('.perm-action-checkbox:checked');
    const actionIds = Array.from(checkboxes).map(cb => parseInt(cb.getAttribute('data-action-id')));

    try {
      const res = await Api.post('/roles/matrix', {
        role_id: this.selectedRoleId,
        action_ids: actionIds
      });

      if (res.success) {
        Toast.success('Permissions matrix successfully saved and cached!');
        this.rolePerms[this.selectedRoleId] = actionIds;
      }
    } catch (e) {
      console.error(e);
    }
  },

  openAddRoleModal() {
    Modal.open({
      title: 'Create New Custom Role',
      size: 'sm',
      bodyHtml: `
        <div class="space-y-3">
          <div>
            <label class="form-label text-xs">Role Name *</label>
            <input type="text" id="new-role-name" class="form-input text-xs" placeholder="e.g. Regional Supervisor, Junior Accountant">
          </div>
          <div>
            <label class="form-label text-xs">Role Description</label>
            <input type="text" id="new-role-desc" class="form-input text-xs" placeholder="Brief summary of duties and responsibilities">
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" onclick="window.Modal.close()">Cancel</button>
        <button class="btn btn-primary btn-sm" id="confirm-create-role-btn">Create Role</button>
      `,
      onOpen: (modalEl) => {
        modalEl.querySelector('#confirm-create-role-btn')?.addEventListener('click', async () => {
          const name = modalEl.querySelector('#new-role-name')?.value.trim();
          const desc = modalEl.querySelector('#new-role-desc')?.value.trim();

          if (!name) {
            Toast.error('Please enter a role name.');
            return;
          }

          try {
            const res = await Api.post('/roles', { name, description: desc });
            if (res.success) {
              Toast.success('Role created successfully!');
              Modal.close();
              this.selectedRoleId = res.data.id;
              await this.loadMatrixData();
            }
          } catch (e) {
            console.error(e);
          }
        });
      }
    });
  }
};
