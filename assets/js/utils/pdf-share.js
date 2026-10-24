/**
 * DMS Enterprise Universal PDF Generator & WhatsApp/Web Share Engine
 * Supports 100% offline PDF downloads and cross-platform WhatsApp & native device sharing.
 */

import { Toast } from '../components/toast.js';

export const PdfShare = {
  /**
   * Generates and triggers download or print-to-PDF for any HTML content or element.
   */
  downloadPdf(htmlContent, filename = 'document.pdf', layout = 'a4') {
    const isThermal = layout === 'thermal';
    const printWin = window.open('', '_blank');
    if (!printWin) {
      Toast.error('Please allow popups to generate and download PDF.');
      return;
    }

    const cleanTitle = filename.replace(/\.pdf$/i, '');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${cleanTitle}</title>
        <meta charset="utf-8">
        <style>
          @page {
            size: ${isThermal ? '80mm auto' : 'A4 portrait'};
            margin: ${isThermal ? '0' : '10mm'};
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #000000;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          }
          .challan-paper-a4, .challan-paper-thermal {
            box-shadow: none !important;
            margin: 0 auto !important;
            border: none !important;
            width: 100% !important;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${htmlContent}
        <script>
          window.onload = function() {
            window.focus();
            window.print();
            setTimeout(function() {
              // Inform user in title
              document.title = "${cleanTitle}.pdf";
            }, 600);
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
    Toast.success('PDF preview ready. Select "Save as PDF" in your print dialog.');
  },

  /**
   * Opens the WhatsApp share link with pre-formatted professional business message.
   */
  shareViaWhatsApp(options = {}) {
    const {
      docType = 'Document',
      refNumber = '',
      customerName = '',
      customerPhone = '',
      totalAmount = 0,
      extraText = ''
    } = options;

    const formattedAmount = totalAmount ? `Rs. ${Number(totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '';
    const dateStr = new Date().toLocaleDateString('en-GB');

    const lines = [
      `*APEX DISTRIBUTION LOGISTICS*`,
      `📄 *${docType.toUpperCase()}*`,
      `---------------------------------`,
      refNumber ? `*Ref / ID:* ${refNumber}` : null,
      customerName ? `*Customer:* ${customerName}` : null,
      `*Date:* ${dateStr}`,
      formattedAmount ? `*Total Amount:* ${formattedAmount}` : null,
      extraText ? `*Note:* ${extraText}` : null,
      `---------------------------------`,
      `Thank you for your business! For queries contact our helpline: +92 42 35889900`
    ].filter(Boolean).join('\n');

    const encodedMsg = encodeURIComponent(lines);

    // Clean phone number (e.g. 03001234567 -> 923001234567)
    let cleanPhone = String(customerPhone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '92' + cleanPhone.substring(1);
    }

    const whatsappUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`
      : `https://api.whatsapp.com/send?text=${encodedMsg}`;

    window.open(whatsappUrl, '_blank');
    Toast.success('Opening WhatsApp share...');
  },

  /**
   * Triggers native Web Share API dialog on mobile / supported modern browsers.
   */
  async shareNative(options = {}) {
    const {
      title = 'DMS Enterprise Document',
      text = 'Please find attached document details.',
      url = window.location.href
    } = options;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        Toast.success('Shared successfully!');
      } catch (err) {
        if (err.name !== 'AbortError') {
          this.shareViaWhatsApp(options);
        }
      }
    } else {
      // Fallback directly to WhatsApp
      this.shareViaWhatsApp(options);
    }
  }
};
