/**
 * Modern Animated Modal Component
 */

export const Modal = {
  activeOverlay: null,

  open({ title = '', bodyHtml = '', footerHtml = '', size = '', onOpen = null, onClose = null }) {
    this.close(); // Close any currently open modal

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'active-modal-overlay';

    let sizeClass = '';
    if (size === 'lg') sizeClass = 'modal-lg';
    if (size === 'xl') sizeClass = 'modal-xl';
    if (size === 'full') sizeClass = 'modal-full';

    overlay.innerHTML = `
      <div class="modal-dialog ${sizeClass}">
        <div class="px-5 py-4 border-b border-custom flex items-center justify-between">
          <h3 class="text-base font-bold text-main">${title}</h3>
          <button class="p-1 rounded-lg text-subtle-custom hover:text-main hover:bg-muted-custom transition-colors" id="modal-close-x">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="p-5 overflow-y-auto max-h-[70vh] text-sm text-main" id="modal-body-container">
          ${bodyHtml}
        </div>
        ${footerHtml ? `<div class="px-5 py-3 bg-muted-custom border-t border-custom flex justify-end gap-2" id="modal-footer-container">${footerHtml}</div>` : ''}
      </div>
    `;

    document.body.appendChild(overlay);
    this.activeOverlay = overlay;

    // Handlers
    const closeBtn = overlay.querySelector('#modal-close-x');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close(onClose));

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close(onClose);
    });

    const escHandler = (e) => {
      if (e.key === 'Escape') {
        this.close(onClose);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    if (typeof onOpen === 'function') {
      setTimeout(() => onOpen(overlay), 20);
    }

    return overlay;
  },

  close(onClose = null) {
    if (this.activeOverlay) {
      const el = this.activeOverlay;
      this.activeOverlay = null;
      if (el.parentNode) el.parentNode.removeChild(el);
      if (typeof onClose === 'function') onClose();
    }
    // Clean up any other modal overlays
    document.querySelectorAll('.modal-overlay').forEach(ov => {
      if (ov.parentNode) ov.parentNode.removeChild(ov);
    });
  }
};
