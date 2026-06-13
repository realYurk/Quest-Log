import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const APP_URL = 'http://localhost:5174';
const SHOT_DIR = 'C:/tmp/shots';
mkdirSync(SHOT_DIR, { recursive: true });

async function main() {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    headless: true,
  });

  const page = await browser.newPage();

  // STEP 1: Open app, reset to defaults
  console.log('=== STEP 1: Reset to defaults ===');
  await page.goto(APP_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(500);

  // Switch to SOP Manager
  const sopBtn = await page.$('.sidebar-btn[title="任务手册"]');
  await sopBtn?.click();
  await page.waitForTimeout(1000);

  // Open settings and reset
  const settingsBtn = await page.$('.sidebar-btn[title="设置"]');
  await settingsBtn?.click();
  await page.waitForTimeout(500);

  page.on('dialog', async dialog => {
    console.log(`Dialog: ${dialog.message().substring(0, 40)}`);
    await dialog.accept();
  });

  const resetBtn = await page.$('button:has-text("重置")');
  await resetBtn?.click();
  await page.waitForTimeout(3000);
  console.log('Reset completed');

  // Close settings
  const closeBtn = await page.$('.modal-header button:has-text("✕")');
  await closeBtn?.click();
  await page.waitForTimeout(500);

  // Check collections on SAME PAGE (no reload)
  const domAfterReset = await page.$$eval('.nav-collection', els => els.map(e => e.innerText.substring(0, 30)));
  console.log('After reset (same page):', domAfterReset.length, 'collections');
  console.log('  Collections:', domAfterReset);

  // STEP 2: Full page reload to test persistence
  console.log('\n=== STEP 2: Full page reload ===');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Switch to SOP Manager again
  const sopBtn2 = await page.$('.sidebar-btn[title="任务手册"]');
  await sopBtn2?.click();
  await page.waitForTimeout(1000);

  // Check collections after reload
  const domAfterReload = await page.$$eval('.nav-collection', els => els.map(e => e.innerText.substring(0, 30)));
  console.log('After reload:', domAfterReload.length, 'collections');
  console.log('  Collections:', domAfterReload);

  // Check localStorage
  const lsData = await page.evaluate(() => {
    const data = localStorage.getItem('questlog-data');
    if (!data) return 'NO localStorage';
    return `collections: ${JSON.parse(data).collections?.length}`;
  });
  console.log('localStorage:', lsData);

  await page.screenshot({ path: `${SHOT_DIR}/final-sop-manager.png` });
  console.log('\nFinal screenshot saved');

  // Final verdict
  const passed = domAfterReload.length === 3;
  console.log(`\n${passed ? '✅ PASS' : '❌ FAIL'}: Reset to defaults persisted correctly`);

  await browser.close();
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });