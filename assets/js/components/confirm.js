/**
 * Modern Confirmation Dialog Component
 */

export const Confirm = {
  ask({ title = 'Confirm Action', message = 'Are you sure you want to proceed?', confirmText = 'Confirm', cancelText = 'Cancel', isDanger = false }) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.style.zIndex = '100';

      const btnConfirmClass = isDanger ? 'btn-danger' : 'btn-primary';

      overlay.innerHTML = `
        <div class="modal-dialog" style="max-width: 26rem;">
          <div class="p-5 border-b border-custom">
            <h3 class="text-base font-bold text-main">${title}</h3>
          </div>
          <div class="p-5 text-sm text-muted-custom">
            ${message}
          </div>
          <div class="p-4 bg-muted-custom border-t border-custom flex justify-end gap-2">
            <button class="btn btn-secondary btn-sm" id="confirm-cancel-btn">${cancelText}</button>
            <button class="btn ${btnConfirmClass} btn-sm" id="confirm-ok-btn">${confirmText}</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      const cleanup = (result) => {
        overlay.classList.add('opacity-0');
        setTimeout(() => {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        }, 150);
        resolve(result);
      };

      overlay.querySelector('#confirm-cancel-btn').addEventListener('click', () => cleanup(false));
      overlay.querySelector('#confirm-ok-btn').addEventListener('click', () => cleanup(true));

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) cleanup(false);
      });
    });
  }
};
