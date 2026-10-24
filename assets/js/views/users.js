/**
 * Staff & User Accounts Management View
 */

import { Api } from '../api.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';
import { Confirm } from '../components/confirm.js';
import { Permissions } from '../permissions.js';

export const UsersView = {
  users: [],
  roles: [],
  territories: [],

  async render(container) {
    container.innerHTML = `
      <div class="space-y-4">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-main">System Users & Field Personnel</h1>
            <p class="text-xs sm:text-sm text-muted-custom">Manage administrative accounts, sales representatives, and delivery fleet drivers.</p>
          </div>
          <div class="flex items-center gap-2">
            ${Permissions.can('users', 'create') ? `
              <button id="add-user-modal-btn" class="btn btn-primary btn-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                <span>+ Add Staff Member</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Users Table -->
        <div class="card overflow-hidden">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Display Name</th>
                  <th>Signature</th>
                  <th>Email / Username</th>
                  <th>System Role</th>
                  <th>Assigned Route</th>
                  <th>Phone</th>
                  <th class="text-center">Status</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody id="users-table-tbody">
                <tr><td colspan="8" class="text-center py-8 text-muted-custom">Loading users...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    await this.loadUsers();
    this.bindEvents();
  },

  async loadUsers() {
    try {
      const [uRes, rRes, sRes] = await Promise.all([
        Api.get('/users'),
        Api.get('/roles'),
        Api.get('/settings')
      ]);

      this.users = uRes.data || [];
      this.roles = rRes.data || [];
      this.territories = sRes.data?.territories || [];

      this.renderTable();
    } catch (e) {
      Toast.error('Failed to load users: ' + e.message);
    }
  },

  renderTable() {
    const tbody = document.getElementById('users-table-tbody');
    if (!tbody) return;

    if (this.users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-muted-custom">No users found.</td></tr>';
      return;
    }

    const canEdit = Permissions.can('users', 'edit');
    const canDelete = Permissions.can('users', 'delete');

    tbody.innerHTML = this.users.map(u => `
      <tr class="${!u.active ? 'opacity-50' : ''}">
        <td>
          <div class="font-bold text-main">${u.display_name}</div>
          <div class="text-[11px] text-subtle-custom font-mono">${u.uid}</div>
        </td>
        <td>
          ${u.signature ? `
            <div class="h-8 w-24 border border-custom rounded bg-white p-0.5 flex items-center justify-center shadow-sm">
              <img src="${u.signature}" alt="Signature" class="max-h-full max-w-full object-contain">
            </div>
          ` : `<span class="text-[10px] text-muted-custom italic">Not on file</span>`}
        </td>
        <td class="text-xs text-muted-custom">${u.email}</td>
        <td>
          <span class="badge badge-primary text-xs font-semibold">${u.role_name}</span>
        </td>
        <td class="text-xs text-muted-custom">${u.territory_route}</td>
        <td class="text-xs text-main font-mono">${u.phone || 'N/A'}</td>
        <td class="text-center">
          ${u.active ? '<span class="badge badge-success text-[10px]">Active</span>' : '<span class="badge badge-danger text-[10px]">Inactive</span>'}
        </td>
        <td class="text-right whitespace-nowrap">
          <div class="flex items-center justify-end gap-1">
            ${canEdit ? `
              <button class="btn btn-secondary btn-sm p-1.5 edit-user-btn" data-id="${u.id}" title="Edit Profile">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
              </button>
            ` : ''}
            ${canDelete ? `
              <button class="btn btn-secondary btn-sm p-1.5 toggle-user-btn" data-id="${u.id}" title="${u.active ? 'Deactivate' : 'Activate'}">
                <svg class="w-3.5 h-3.5 ${u.active ? 'text-rose-500' : 'text-emerald-500'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.edit-user-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        const user = this.users.find(u => u.id === id);
        if (user) this.openUserModal(user);
      });
    });

    tbody.querySelectorAll('.toggle-user-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.getAttribute('data-id'));
        const user = this.users.find(u => u.id === id);
        if (!user) return;

        const actionText = user.active ? 'deactivate' : 'activate';
        const ok = await Confirm.ask({
          title: `${user.active ? 'Deactivate' : 'Activate'} User`,
          message: `Are you sure you want to ${actionText} ${user.display_name}?`,
          isDanger: user.active
        });

        if (ok) {
          try {
            const res = await Api.delete(`/users/${id}`);
            Toast.success(res.message);
            await this.loadUsers();
          } catch (e) {
            console.error(e);
          }
        }
      });
    });
  },

  bindEvents() {
    document.getElementById('add-user-modal-btn')?.addEventListener('click', () => {
      this.openUserModal();
    });
  },

  openUserModal(user = null) {
    const isEdit = user !== null;

    const roleOptions = this.roles.map(r => `
      <option value="${r.id}" ${user?.role_id === r.id ? 'selected' : ''}>${r.name}</option>
    `).join('');

    const routeOptions = `
      <option value="All Territories">All Territories</option>
      <option value="Central Warehouse">Central Warehouse</option>
      <option value="Regional HQ">Regional HQ</option>
      ${this.territories.map(t => `<option value="${t.name}" ${user?.territory_route === t.name ? 'selected' : ''}>${t.name}</option>`).join('')}
    `;

    Modal.open({
      title: isEdit ? `Edit Staff Account: ${user.display_name}` : 'Add New Staff Member',
      size: 'md',
      bodyHtml: `
        <div class="space-y-3">
          <div>
            <label class="form-label text-xs">Full Display Name *</label>
            <input type="text" id="m-user-name" class="form-input text-xs" required value="${user?.display_name || ''}" placeholder="e.g. Tariq Mahmood">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="form-label text-xs">Email Address *</label>
              <input type="email" id="m-user-email" class="form-input text-xs" required value="${user?.email || ''}" ${isEdit ? 'disabled' : ''} placeholder="user@company.com">
            </div>
            <div>
              <label class="form-label text-xs">Contact Phone</label>
              <input type="text" id="m-user-phone" class="form-input text-xs" value="${user?.phone || ''}" placeholder="+92 300 1234567">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="form-label text-xs">System Role *</label>
              <select id="m-user-role" class="form-select text-xs" required>
                ${roleOptions}
              </select>
            </div>
            <div>
              <label class="form-label text-xs">Territory Route *</label>
              <select id="m-user-route" class="form-select text-xs" required>
                ${routeOptions}
              </select>
            </div>
          </div>

          <div>
            <label class="form-label text-xs">${isEdit ? 'New Password (Leave blank to keep existing)' : 'Account Password *'}</label>
            <input type="password" id="m-user-pass" class="form-input text-xs" placeholder="••••••••">
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="form-label text-xs mb-0 font-semibold">Staff Digital Signature</label>
              <button type="button" class="text-[11px] text-rose-500 hover:underline" id="btn-user-clear-sig">Clear Signature</button>
            </div>
            <div class="border border-custom rounded-lg bg-white p-1.5 h-24 relative overflow-hidden shadow-inner">
              <canvas id="user-sig-canvas" class="w-full h-full cursor-crosshair block"></canvas>
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none text-subtle-custom text-xs" id="user-sig-placeholder">
                ✍️ Draw signature inside this box
              </div>
            </div>
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" onclick="window.Modal.close()">Cancel</button>
        <button class="btn btn-primary btn-sm" id="confirm-user-btn">${isEdit ? 'Save Changes' : 'Register Staff'}</button>
      `,
      onOpen: (modalEl) => {
        let hasModifiedSig = false;
        let currentSigUri = user?.signature || '';

        const canvas = modalEl.querySelector('#user-sig-canvas');
        const placeholder = modalEl.querySelector('#user-sig-placeholder');
        const clearBtn = modalEl.querySelector('#btn-user-clear-sig');

        if (canvas) {
          const ctx = canvas.getContext('2d');
          const rect = canvas.getBoundingClientRect();
          canvas.width = rect.width || 360;
          canvas.height = rect.height || 90;
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.strokeStyle = '#0f172a';

          // If user already has signature, draw it
          if (currentSigUri) {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, 10, 5, canvas.width - 20, canvas.height - 10);
              if (placeholder) placeholder.style.display = 'none';
            };
            img.src = currentSigUri;
          }

          let isDrawing = false;
          const getPos = (e) => {
            const r = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return { x: clientX - r.left, y: clientY - r.top };
          };

          const start = (e) => {
            isDrawing = true;
            hasModifiedSig = true;
            if (placeholder) placeholder.style.display = 'none';
            const pos = getPos(e);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
          };

          const move = (e) => {
            if (!isDrawing) return;
            e.preventDefault();
            const pos = getPos(e);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
          };

          const stop = () => { isDrawing = false; };

          canvas.addEventListener('mousedown', start);
          canvas.addEventListener('mousemove', move);
          window.addEventListener('mouseup', stop);
          canvas.addEventListener('touchstart', start, { passive: false });
          canvas.addEventListener('touchmove', move, { passive: false });
          window.addEventListener('touchend', stop);

          clearBtn?.addEventListener('click', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            hasModifiedSig = true;
            currentSigUri = '';
            if (placeholder) placeholder.style.display = 'flex';
          });
        }

        modalEl.querySelector('#confirm-user-btn')?.addEventListener('click', async () => {
          const name = modalEl.querySelector('#m-user-name')?.value.trim();
          const email = modalEl.querySelector('#m-user-email')?.value.trim();
          const phone = modalEl.querySelector('#m-user-phone')?.value.trim();
          const roleId = parseInt(modalEl.querySelector('#m-user-role')?.value);
          const route = modalEl.querySelector('#m-user-route')?.value;
          const password = modalEl.querySelector('#m-user-pass')?.value;

          if (!name || (!isEdit && (!email || !password))) {
            Toast.error('Please complete all required fields.');
            return;
          }

          let finalSig = currentSigUri;
          if (hasModifiedSig && canvas) {
            finalSig = canvas.toDataURL('image/png');
          }

          try {
            if (isEdit) {
              await Api.put(`/users/${user.id}`, {
                display_name: name, phone, role_id: roleId, territory_route: route, password, signature: finalSig
              });
              Toast.success('User updated successfully!');
            } else {
              await Api.post('/users', {
                display_name: name, email, password, role_id: roleId, phone, territory_route: route, signature: finalSig
              });
              Toast.success('User registered successfully!');
            }
            Modal.close();
            await this.loadUsers();
          } catch (e) {
            console.error(e);
          }
        });
      }
    });
  }
};
