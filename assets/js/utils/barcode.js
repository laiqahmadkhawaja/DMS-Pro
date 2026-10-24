/**
 * DMS Enterprise SKU Barcode Generation & Scanning Engine
 * 100% Offline, Zero external dependencies.
 * Includes Code-128 SVG generator, thermal label printing,
 * hardware laser scanner listener, Web Audio feedback,
 * and live camera barcode scanner modal.
 */

export const Barcode = {
  // Code 128B patterns (107 patterns, each 11 bits: 1=bar, 0=space, stop is 13 bits)
  code128Patterns: [
    "11011001100", "11001101100", "11001100110", "10010011000", "10010001100",
    "10001001100", "10011001000", "10011000100", "10001100100", "11001001000",
    "11001000100", "11000100100", "10110011100", "10011011100", "10011001110",
    "10111001100", "10011101100", "10011100110", "11001110010", "11001011100",
    "11001001110", "11011100100", "11001110100", "11101101110", "11101001100",
    "11100101100", "11100100110", "11101100100", "11100110100", "11100110010",
    "11011011000", "11011000110", "11000110110", "10100011000", "10001011000",
    "10001000110", "10110001000", "10001101000", "10001100010", "11010001000",
    "11000101000", "11000100010", "10110111000", "10110001110", "10001101110",
    "10111011000", "10111000110", "10001110110", "11101110110", "11010001110",
    "11000101110", "11011101000", "11011100010", "11011101110", "11101011000",
    "11101000110", "11100010110", "11101101000", "11101100010", "11100011010",
    "11101111010", "11001000010", "11110001010", "10100110000", "10100001100",
    "10010110000", "10010000110", "10000101100", "10000100110", "10110010000",
    "10110000100", "10011010000", "10011000010", "10000110100", "10000110010",
    "11000010010", "11001010000", "11110111010", "11000010100", "10001111010",
    "10100111100", "10010111100", "10010011110", "10111100100", "10011110100",
    "10011110010", "11110100100", "11110010100", "11110010010", "11011011110",
    "11011110110", "11110110110", "10101111000", "10100011110", "10001011110",
    "10111101000", "10111100010", "11110101000", "11110100010", "10111011110",
    "10111101110", "11101011110", "11110101110", "11010000100", "11010010000",
    "11010011100", "1100011101011" // 106 = Stop
  ],

  /**
   * Generates a clean Code 128 SVG string for any alphanumeric text (SKU or Barcode).
   */
  generateCode128Svg(text, options = {}) {
    const rawText = String(text || '').trim();
    if (!rawText) return '';

    const height = options.height || 60;
    const barWidth = options.barWidth || 2;
    const showText = options.showText !== false;
    const quietZone = options.quietZone !== false ? 10 * barWidth : 0;

    // Start Code B is index 104
    const startCode = 104;
    let checksum = startCode;
    const codeIndices = [startCode];

    for (let i = 0; i < rawText.length; i++) {
      const charCode = rawText.charCodeAt(i);
      // Code 128B maps ASCII 32..127 to indices 0..95
      let val = charCode - 32;
      if (val < 0 || val > 95) val = 0; // fallback to space
      codeIndices.push(val);
      checksum += val * (i + 1);
    }

    const checkDigit = checksum % 103;
    codeIndices.push(checkDigit);
    codeIndices.push(106); // Stop pattern

    // Convert indices to binary string of modules
    let binary = "";
    for (const idx of codeIndices) {
      binary += this.code128Patterns[idx] || "";
    }

    // Build SVG Rectangles
    let rects = "";
    let posX = quietZone;
    let inBar = false;
    let barLength = 0;

    for (let i = 0; i < binary.length; i++) {
      if (binary[i] === '1') {
        if (!inBar) {
          inBar = true;
          barLength = barWidth;
        } else {
          barLength += barWidth;
        }
      } else {
        if (inBar) {
          rects += `<rect x="${posX}" y="0" width="${barLength}" height="${height}" fill="#000000"/>`;
          posX += barLength;
          inBar = false;
        }
        posX += barWidth;
      }
    }

    if (inBar) {
      rects += `<rect x="${posX}" y="0" width="${barLength}" height="${height}" fill="#000000"/>`;
      posX += barLength;
    }

    const totalWidth = posX + quietZone;
    const totalHeight = showText ? height + 18 : height;

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}" class="barcode-svg" style="display: block; margin: 0 auto; max-width: 100%; height: auto;">
        <rect width="${totalWidth}" height="${totalHeight}" fill="#ffffff"/>
        ${rects}
        ${showText ? `<text x="${totalWidth / 2}" y="${height + 14}" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="600" fill="#000000" letter-spacing="1">${rawText}</text>` : ''}
      </svg>
    `;
  },

  /**
   * Play an audible acoustic scanner beep using Web Audio API.
   */
  beep(success = true) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = success ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(success ? 880 : 330, ctx.currentTime);
      if (success) {
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08);
      }

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (success ? 0.12 : 0.25));

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (success ? 0.12 : 0.25));
    } catch (e) {
      // Audio autoplay policy fallback
    }
  },

  /**
   * Initializes hardware laser/CCD barcode scanner listener.
   * Scanners act as high-speed keyboard emulators (<50ms per character ending in Enter).
   */
  initHardwareListener(callback) {
    let buffer = "";
    let lastKeyTime = 0;

    window.addEventListener('keydown', (e) => {
      // If user is actively typing in a normal form input or textarea and typing slowly, don't hijack
      const targetTag = e.target.tagName.toLowerCase();
      const isInput = targetTag === 'input' || targetTag === 'textarea';

      const now = Date.now();
      const timeDiff = now - lastKeyTime;
      lastKeyTime = now;

      // Laser scanners type with < 40ms interval
      if (e.key === 'Enter') {
        if (buffer.length >= 3 && timeDiff < 100) {
          e.preventDefault();
          const scannedCode = buffer.trim();
          buffer = "";
          this.beep(true);
          window.dispatchEvent(new CustomEvent('dms:barcode-scanned', { 
            detail: { code: scannedCode, barcode: scannedCode } 
          }));
          if (callback) callback(scannedCode);
        } else {
          buffer = "";
        }
      } else if (e.key.length === 1) {
        if (timeDiff > 120 && !isInput) {
          buffer = e.key;
        } else {
          buffer += e.key;
        }
      }
    });
  },

  /**
   * Opens Interactive Camera Scanner Modal.
   * Uses native BarcodeDetector if available, with instant manual fallback.
   */
  openCameraScanner(options = {}) {
    const onScan = typeof options === 'function' ? options : (options.onScan || (() => {}));
    const title = (typeof options === 'object' && options.title) || 'Barcode & SKU Camera Scanner';

    const modalId = 'barcode-scanner-modal';
    const oldModal = document.getElementById(modalId);
    if (oldModal) oldModal.remove();

    const overlay = document.createElement('div');
    overlay.id = modalId;
    overlay.className = 'fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-fadeIn';

    overlay.innerHTML = `
      <div class="card w-full max-w-md bg-surface p-4 sm:p-5 shadow-2xl border-custom space-y-4">
        <div class="flex items-center justify-between border-b border-custom pb-2">
          <div class="flex items-center gap-2">
            <span class="p-1.5 rounded-lg bg-primary/10 text-primary">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
            </span>
            <h3 class="text-sm sm:text-base font-bold text-main">${title}</h3>
          </div>
          <button type="button" id="close-scanner-btn" class="p-1 rounded text-muted-custom hover:text-main text-lg">&times;</button>
        </div>

        <!-- Video Camera Viewport -->
        <div class="relative bg-black rounded-lg overflow-hidden flex items-center justify-center border-2 border-primary/50" style="height: 240px;">
          <video id="scanner-video" class="w-full h-full object-cover" autoplay playsinline muted></video>
          
          <!-- Animated Laser Targeting Reticle -->
          <div class="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse"></div>
          <div class="absolute inset-8 border-2 border-dashed border-white/60 rounded-lg pointer-events-none flex items-end justify-center pb-2">
            <span class="text-[11px] text-white/90 bg-black/60 px-2 py-0.5 rounded font-mono font-medium">Align Barcode in frame</span>
          </div>
        </div>

        <!-- Manual Input / Quick Scan Option -->
        <div>
          <label class="form-label text-xs font-semibold">Or Type / Laser Scan SKU or Barcode</label>
          <div class="flex gap-2">
            <input type="text" id="scanner-manual-input" class="form-input text-xs font-mono font-bold" placeholder="e.g. 896001000003 or BEV-WAT-001" autofocus autocomplete="off">
            <button type="button" id="scanner-submit-btn" class="btn btn-primary btn-sm px-3">
              <span>Scan</span>
            </button>
          </div>
        </div>

        <div class="text-[11px] text-muted-custom text-center">
          Hardware USB & Bluetooth scanners are automatically captured instantly.
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const videoEl = overlay.querySelector('#scanner-video');
    const manualInput = overlay.querySelector('#scanner-manual-input');
    const submitBtn = overlay.querySelector('#scanner-submit-btn');
    const closeBtn = overlay.querySelector('#close-scanner-btn');

    let stream = null;
    let scanInterval = null;

    const cleanup = () => {
      if (scanInterval) clearInterval(scanInterval);
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      overlay.remove();
    };

    closeBtn.addEventListener('click', cleanup);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup();
    });

    const triggerSuccess = (code) => {
      const cleanCode = String(code || '').trim();
      if (!cleanCode) return;
      Barcode.beep(true);
      cleanup();
      onScan(cleanCode);
    };

    submitBtn.addEventListener('click', () => {
      triggerSuccess(manualInput.value);
    });

    manualInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        triggerSuccess(manualInput.value);
      }
    });

    // Start Camera Stream
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      }).then(s => {
        stream = s;
        videoEl.srcObject = s;

        // Native BarcodeDetector support
        if ('BarcodeDetector' in window) {
          const detector = new window.BarcodeDetector({
            formats: ['code_128', 'ean_13', 'ean_8', 'qr_code', 'upc_a', 'upc_e']
          });

          scanInterval = setInterval(async () => {
            if (videoEl.readyState >= 2) {
              try {
                const barcodes = await detector.detect(videoEl);
                if (barcodes.length > 0) {
                  triggerSuccess(barcodes[0].rawValue);
                }
              } catch (err) {
                // Ignore detection hiccups
              }
            }
          }, 250);
        }
      }).catch(err => {
        console.warn('Camera access error:', err);
      });
    }

    setTimeout(() => manualInput.focus(), 300);
  },

  /**
   * Opens the Barcode Label Generator Modal for printing labels.
   */
  openLabelPrinter(product, companyName = 'Apex Distribution') {
    const code = product.barcode || product.sku;
    const barcodeSvg = this.generateCode128Svg(code, { height: 50, barWidth: 1.8, showText: true });

    const modalId = 'barcode-print-modal';
    const oldModal = document.getElementById(modalId);
    if (oldModal) oldModal.remove();

    const overlay = document.createElement('div');
    overlay.id = modalId;
    overlay.className = 'fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm';

    overlay.innerHTML = `
      <div class="card w-full max-w-lg bg-surface p-4 sm:p-5 shadow-2xl border-custom space-y-4">
        <div class="flex items-center justify-between border-b border-custom pb-2">
          <h3 class="text-base font-bold text-main">Print Product Barcode Labels</h3>
          <button type="button" id="close-label-printer-btn" class="p-1 rounded text-muted-custom hover:text-main text-lg">&times;</button>
        </div>

        <!-- Label Preview -->
        <div class="p-4 bg-muted-custom rounded-lg flex items-center justify-center">
          <div id="barcode-single-sticker" class="border border-slate-300 rounded bg-white p-3 text-center shadow-md text-black" style="width: 240px; font-family: sans-serif;">
            <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500">${companyName}</div>
            <div class="font-bold text-xs text-slate-900 truncate mb-1">${product.name}</div>
            <div class="py-1">
              ${barcodeSvg}
            </div>
            <div class="flex items-center justify-between text-xs font-bold pt-1 border-t border-slate-200 mt-1">
              <span class="font-mono text-[10px] text-slate-600">SKU: ${product.sku}</span>
              <span class="text-sm font-bold text-slate-900">Rs. ${product.selling_price.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- Print Controls -->
        <div class="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label class="form-label font-semibold">Labels to Print</label>
            <input type="number" id="label-qty-input" class="form-input text-xs" min="1" max="100" value="12">
          </div>
          <div>
            <label class="form-label font-semibold">Label Layout</label>
            <select id="label-layout-select" class="form-select text-xs">
              <option value="thermal">Thermal Roll (50mm x 25mm)</option>
              <option value="sheet" selected>Standard A4 Sheet (24 Labels/Page)</option>
            </select>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-custom">
          <button type="button" class="btn btn-secondary btn-sm" id="btn-cancel-label">Cancel</button>
          <button type="button" class="btn btn-primary btn-sm inline-flex items-center gap-1.5" id="btn-print-labels-now">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            <span>Print Labels</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const cleanup = () => overlay.remove();
    overlay.querySelector('#close-label-printer-btn').addEventListener('click', cleanup);
    overlay.querySelector('#btn-cancel-label').addEventListener('click', cleanup);

    overlay.querySelector('#btn-print-labels-now').addEventListener('click', () => {
      const qty = parseInt(overlay.querySelector('#label-qty-input').value, 10) || 1;
      const layout = overlay.querySelector('#label-layout-select').value;
      cleanup();

      const printWin = window.open('', '_blank');
      if (!printWin) {
        alert('Please allow popups to print barcode stickers.');
        return;
      }

      let labelsHtml = "";
      for (let i = 0; i < qty; i++) {
        labelsHtml += `
          <div class="barcode-sticker">
            <div class="sticker-company">${companyName}</div>
            <div class="sticker-title">${product.name}</div>
            <div class="sticker-barcode">${barcodeSvg}</div>
            <div class="sticker-footer">
              <span class="sticker-sku">SKU: ${product.sku}</span>
              <span class="sticker-price">Rs. ${product.selling_price.toFixed(2)}</span>
            </div>
          </div>
        `;
      }

      printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Barcode Labels - ${product.sku}</title>
          <style>
            @page { margin: ${layout === 'thermal' ? '0' : '10mm'}; size: ${layout === 'thermal' ? '50mm 25mm' : 'A4'}; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 0; }
            .labels-container {
              display: flex;
              flex-wrap: wrap;
              gap: ${layout === 'thermal' ? '0' : '8mm 6mm'};
              justify-content: ${layout === 'thermal' ? 'center' : 'flex-start'};
            }
            .barcode-sticker {
              width: ${layout === 'thermal' ? '48mm' : '64mm'};
              height: ${layout === 'thermal' ? '24mm' : '32mm'};
              box-sizing: border-box;
              border: 1px dashed #ccc;
              padding: 2mm 3mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              text-align: center;
              background: #fff;
              page-break-inside: avoid;
            }
            .sticker-company { font-size: 7pt; font-weight: 700; text-transform: uppercase; color: #666; }
            .sticker-title { font-size: 8pt; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .sticker-barcode svg { width: 100%; height: auto; max-height: ${layout === 'thermal' ? '12mm' : '16mm'}; }
            .sticker-footer { display: flex; justify-content: space-between; align-items: center; font-size: 8pt; font-weight: 700; border-top: 0.5px solid #ddd; padding-top: 1mm; }
            .sticker-sku { font-family: monospace; font-size: 7pt; color: #333; }
            .sticker-price { font-size: 8pt; color: #000; }
          </style>
        </head>
        <body>
          <div class="labels-container">
            ${labelsHtml}
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
        </html>
      `);
      printWin.document.close();
    });
  }
};
