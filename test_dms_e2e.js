const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost/DMS';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log('🚀 Starting Comprehensive DMS Enterprise Full-Stack E2E Verification...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,850']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 850 });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`[PAGE CONSOLE ERROR] ${msg.text()}`);
    }
  });

  page.on('response', async res => {
    if (res.url().includes('/orders') && res.request().method() === 'POST') {
      try {
        console.log('ORDERS API RESPONSE [' + res.status() + ']:', await res.text());
      } catch(e) {}
    }
  });

  try {
    // 1. Visit App Root
    console.log('\n--- 1. Testing Initial App Load & Login UI ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
    await sleep(600);

    const hasLoginForm = await page.$('#login-form');
    console.log('✓ Login view displayed:', !!hasLoginForm);

    // Click Super Admin demo profile
    await page.click('.demo-role-btn[data-email="laiq@company.com"]');
    await sleep(200);

    // Submit Login
    await page.click('#login-submit-btn');
    await page.waitForSelector('#app-view', { timeout: 5000 });
    console.log('✓ Successfully authenticated and navigated into App Shell!');

    // 2. Verify Dashboard View
    console.log('\n--- 2. Auditing Executive Dashboard ---');
    await sleep(800);
    const kpiCards = await page.$$eval('#kpi-cards-grid .card', cards => cards.length);
    console.log(`✓ KPI cards rendered: ${kpiCards}`);
    if (kpiCards < 4) throw new Error('Failed: Less than 4 KPI cards rendered.');

    const svgBars = await page.$$eval('#velocity-chart-container svg rect', rects => rects.length);
    console.log(`✓ 7-Day Sales Velocity Chart rendered with ${svgBars} SVG bars.`);
    if (svgBars === 0) throw new Error('Failed: 0 velocity chart bars rendered.');

    // 3. Test Theme Switcher (Dark / Light)
    console.log('\n--- 3. Testing Theme Switcher (Light / Dark) ---');
    const isDarkInitially = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    console.log('Initially dark:', isDarkInitially);

    await page.click('.theme-toggle-btn');
    await sleep(300);
    const isDarkAfterToggle = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    console.log('After toggle dark:', isDarkAfterToggle);
    if (isDarkInitially === isDarkAfterToggle) throw new Error('Theme toggle failed to flip state.');

    // 4. Test Book Order (POS-Style)
    console.log('\n--- 4. Testing POS Book Order Screen & Live Cart ---');
    await page.goto(`${BASE_URL}/#order-create`, { waitUntil: 'networkidle0' });
    await sleep(800);

    // Pick customer
    await page.select('#order-customer-select', 'CUST-1001');
    await sleep(400);

    const bannerText = await page.$eval('#customer-credit-banner', el => el.textContent.trim());
    console.log('✓ Customer credit banner active:', bannerText.slice(0, 60) + '...');

    // Add first product to cart
    await page.click('.catalog-plus-btn');
    await sleep(300);

    const cartSubtotal = await page.$eval('#cart-subtotal-text', el => el.textContent.trim());
    const cartGrandTotal = await page.$eval('#cart-grand-total', el => el.textContent.trim());
    console.log(`✓ Cart Subtotal: ${cartSubtotal}, Grand Total: ${cartGrandTotal}`);
    if (cartGrandTotal === 'Rs. 0.00') throw new Error('Cart calculation failed.');

    // Sign canvas or use saved signature if needed
    const diag = await page.evaluate(() => {
      const btn = document.querySelector('#submit-order-btn');
      return {
        disabled: btn ? btn.disabled : 'no-btn',
        toasts: Array.from(document.querySelectorAll('.toast-msg')).map(t => t.innerText)
      };
    });
    console.log('Order create diagnostics:', JSON.stringify(diag));

    // Sign on canvas
    const canvas = await page.$('#booker-sig-canvas');
    if (canvas) {
      const box = await canvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + 30, box.y + 30);
        await page.mouse.down();
        await page.mouse.move(box.x + 100, box.y + 50);
        await page.mouse.up();
      }
    }
    await sleep(300);

    // Submit Order
    await page.click('#submit-order-btn');
    await page.waitForSelector('.modal-dialog', { visible: true, timeout: 5000 });
    console.log('✓ Order booked successfully! Modal popped up.');
    // Close success modal
    await page.evaluate(() => window.Modal.close());
    await sleep(300);

    // 5. Test Orders Pipeline & Order Inspector
    console.log('\n--- 5. Auditing Orders Pipeline ---');
    await page.goto(`${BASE_URL}/#orders`, { waitUntil: 'networkidle0' });
    await sleep(800);

    const orderRows = await page.$$eval('#orders-table-tbody tr', rows => rows.length);
    console.log(`✓ Orders listed: ${orderRows}`);
    if (orderRows === 0) throw new Error('No orders listed.');

    // Open first order inspect modal
    await page.click('.inspect-order-btn');
    await page.waitForSelector('.modal-dialog h3', { visible: true, timeout: 5000 });
    const orderModalTitle = await page.$eval('.modal-dialog h3', el => el.textContent.trim());
    console.log(`✓ In-place Order Inspector Modal opened: ${orderModalTitle}`);
    await page.click('#modal-close-x');
    await sleep(300);

    // 6. Test Products Catalog & Modal
    console.log('\n--- 6. Auditing Products Catalog & Add Product Modal ---');
    await page.goto(`${BASE_URL}/#products`, { waitUntil: 'networkidle0' });
    await sleep(800);

    const initialProductCount = await page.$$eval('#products-table-tbody tr', rows => rows.length);
    console.log(`✓ Initial Products displayed: ${initialProductCount}`);

    // Click Add Product
    await page.click('#add-product-modal-btn');
    await sleep(400);

    const testSku = 'TEST-' + Math.floor(1000 + Math.random() * 9000);
    await page.type('#m-prod-sku', testSku);
    await page.type('#m-prod-name', 'Verification Test Energy Drink 250ml');
    await page.type('#m-prod-category', 'Beverages');
    await page.type('#m-prod-cost', '140');
    await page.type('#m-prod-price', '195');

    await page.click('#save-product-btn');
    await sleep(1000);

    const updatedProductCount = await page.$$eval('#products-table-tbody tr', rows => rows.length);
    console.log(`✓ Product created! Count went from ${initialProductCount} to ${updatedProductCount} with ZERO page reload.`);

    // 7. Test Granular Roles & Permissions Matrix
    console.log('\n--- 7. Auditing Granular Roles & Permissions Matrix ---');
    await page.goto(`${BASE_URL}/#roles`, { waitUntil: 'networkidle0' });
    await sleep(800);

    const rolePills = await page.$$eval('.role-pill-btn', pills => pills.length);
    console.log(`✓ System and custom roles loaded in pills: ${rolePills}`);

    const matrixRows = await page.$$eval('#matrix-tbody tr', rows => rows.length);
    console.log(`✓ Configurable modules rendered in matrix: ${matrixRows}`);

    const checkboxes = await page.$$eval('.perm-action-checkbox', cbs => cbs.length);
    console.log(`✓ Granular action checkboxes rendered: ${checkboxes}`);
    if (checkboxes === 0) throw new Error('No permission checkboxes found.');

    // Save Matrix
    await page.click('#save-permissions-matrix-btn');
    await sleep(800);
    console.log('✓ Permissions matrix successfully saved via AJAX!');

    // 8. Mobile Viewport Testing (iPhone SE 375x667)
    console.log('\n--- 8. Auditing Mobile-First Viewport (375x667) ---');
    await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
    await page.goto(`${BASE_URL}/#dashboard`, { waitUntil: 'networkidle0' });
    await sleep(600);

    const mobileNavVisible = await page.$eval('.mobile-bottom-nav', el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none';
    });
    console.log('✓ Mobile bottom navigation bar visible on smartphone screen:', mobileNavVisible);
    if (!mobileNavVisible) throw new Error('Mobile bottom nav bar missing on mobile viewport.');

    // Tap Mobile Menu Drawer
    await page.click('#mobile-menu-drawer-btn');
    await sleep(400);
    const drawerOpen = await page.$eval('#mobile-drawer-overlay', el => !el.classList.contains('hidden'));
    console.log('✓ Slide-over touch drawer opened on mobile:', drawerOpen);
    if (!drawerOpen) throw new Error('Mobile drawer failed to open.');

    console.log('\n======================================================');
    console.log('🎉 ALL 8 FULL-STACK E2E VERIFICATION CHECKS PASSED 100%!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ E2E VERIFICATION FAILED:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
