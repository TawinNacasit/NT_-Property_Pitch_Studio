import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let mode = 'invalid';
  let requests = 0;
  await page.route('**/profile-estate/auth/login', async route => {
    requests++;
    assert.deepEqual(route.request().postDataJSON(), { username: 'tester', password: 'test-password' });
    if (mode === 'invalid') return route.fulfill({ status: 401, json: { success: false } });
    if (mode === 'network') return route.abort();
    if (mode === 'missing-token') return route.fulfill({ json: { success: true, data: {} } });
    return route.fulfill({ json: { success: true, data: { token: 'test-token' } } });
  });
  await page.route('**/profile-estate/auth/me', route => {
    assert.equal(route.request().headers().authorization, 'Bearer test-token');
    return route.fulfill({ status: mode === 'expired' ? 401 : 200, json: { success: mode !== 'expired', data: { username: 'tester' } } });
  });
  await page.goto(`${process.env.LOGIN_TEST_URL || 'http://127.0.0.1:5173'}/login`);
  await page.locator('#login-title').waitFor();
  await page.evaluate(() => document.fonts.ready);
  for (const width of [1440, 1024, 768, 390, 360]) {
    await page.setViewportSize({ width, height: 960 });
    assert(await page.evaluate(() => document.querySelector('#app').scrollWidth <= innerWidth + 1), `Overflow at ${width}`);
    await page.screenshot({ path: `artifacts/login-${width}.png`, fullPage: true });
  }
  await page.locator('.login-submit').click();
  assert.equal(requests, 0);
  await page.locator('#username').fill(' tester ');
  await page.locator('#password').fill('test-password');
  await page.locator('#toggle-password').click();
  assert.equal(await page.locator('#password').getAttribute('type'), 'text');
  await page.locator('#toggle-password').click();
  assert.equal(await page.locator('#password').getAttribute('type'), 'password');
  await page.locator('#forgot-password').click();
  assert(await page.locator('#login-support').isVisible());
  for (const scenario of ['invalid', 'network', 'missing-token']) {
    mode = scenario;
    await page.locator('.login-submit').click();
    await page.locator('#login-error').waitFor();
    assert(await page.locator('#login-form').isVisible());
    assert.equal(await page.evaluate(() => sessionStorage.getItem('nt-studio-session')), null);
  }
  mode = 'success';
  await page.locator('.login-submit').click();
  await page.locator('.logout-button').waitFor();
  assert.equal(await page.evaluate(() => sessionStorage.getItem('nt-studio-session')), 'test-token');
  assert.equal(await page.evaluate(() => JSON.stringify(localStorage).includes('test-password')), false);
  await page.reload();
  await page.locator('.logout-button').waitFor();
  mode = 'expired';
  await page.reload();
  await page.locator('#login-title').waitFor();
  assert.equal(await page.evaluate(() => sessionStorage.getItem('nt-studio-session')), null);
  mode = 'success';
  await page.locator('#username').fill('tester');
  await page.locator('#password').fill('test-password');
  await page.locator('.login-submit').click();
  await page.locator('.logout-button').click();
  await page.locator('#login-title').waitFor();
  assert.equal(await page.evaluate(() => sessionStorage.getItem('nt-studio-session')), null);
  assert.deepEqual(errors, []);
  console.log('PASS: login validation, errors, password toggle, verified session, reload, expiry, logout and 5 viewport sizes. API mocked.');
} finally { await browser.close(); }
