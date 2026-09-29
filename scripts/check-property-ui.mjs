import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const property = {
  id: 1, cdg_id: 101, property_code: 'NT-PKN-001', title: 'ชุมสายพระโขนง',
  category: 'PROPERTY', latitude: 13.707841, longitude: 100.601377, custom_map_url: null,
  specs: { id: 2, property_id: 1, land_area: '2 ไร่', building_detail: 'อาคาร', electricity_system: '24 KV', water_drainage: 'ประปา', telecom_system: 'Fiber', transportation: 'BTS', city_plan_zoning: 'สีแดง', price_conditions: 'เสนอราคา', ownership_status: 'NT' },
  tags: [{ id: 3, property_id: 1, tag_name: 'Office', is_highlighted: true, display_order: 1 }],
  points: [{ id: 4, property_id: 1, point_type: 'SELLING', content: 'ใกล้ BTS', sort_order: 1 }],
  media: [],
  slide_config: { id: 5, property_id: 1, theme_name: 'emerald-green', text_density: 'normal', show_dimension_box: true, dim_top: '10 ม.', dim_bottom: '10 ม.', dim_left: '20 ม.', dim_right: '20 ม.', logo_url: null, footer_text: 'NT' },
};
const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage();
const errors = [];
const writes = [];
page.on('pageerror', error => errors.push(error.message));
await page.addInitScript(() => sessionStorage.setItem('nt-studio-session', 'test-token'));
await page.route('**/profile-estate/**', async route => {
  const req = route.request();
  const path = new URL(req.url()).pathname;
  if (path.endsWith('/auth/me')) return route.fulfill({ json: { success: true, data: { username: 'tester' } } });
  if (req.method() !== 'GET') {
    writes.push({ path, method: req.method(), body: req.postDataJSON?.() });
    if (path.endsWith('/properties/1')) Object.assign(property, req.postDataJSON());
    return route.fulfill({ json: { success: true, data: {} } });
  }
  if (path.endsWith('/properties/')) return route.fulfill({ json: { success: true, data: [property], pagination: { has_next: false } } });
  if (path.endsWith('/properties/1')) return route.fulfill({ json: { success: true, data: property } });
  return route.fulfill({ status: 404, json: { success: false } });
});
await page.goto(process.env.STUDIO_TEST_URL || 'http://127.0.0.1:5173');
await page.waitForFunction(() => document.querySelector('#property-select')?.value === '1');
await page.locator('#property-select').waitFor({ state: 'visible' });
await page.locator('[data-field=title]').waitFor();
assert.equal(await page.locator('[data-field=propertyCode]').inputValue(), 'NT-PKN-001');
assert.equal(await page.locator('[data-field=area]').inputValue(), '2 ไร่');
assert.match(await page.locator('#slide').getAttribute('class'), /emerald-green-theme/);
await page.locator('[data-field=title]').fill('ชื่อที่แก้ไข');
await page.locator('#save').click();
await page.getByText('บันทึกในระบบแล้ว').waitFor();
assert.equal(writes[0].path, '/profile-estate/properties/1');
assert.equal(writes[0].body.title, 'ชื่อที่แก้ไข');
await page.setViewportSize({ width: 390, height: 844 });
assert(await page.locator('#property-select').isVisible());
assert(await page.evaluate(() => document.querySelector('#app').scrollWidth <= innerWidth + 1), 'Mobile page must not overflow');
await page.reload();
await page.locator('[data-field=title]').waitFor();
await page.waitForFunction(() => document.querySelector('[data-field=title]').value === 'ชื่อที่แก้ไข');
assert.deepEqual(errors, []);
console.log('PASS: property API load, edit, save and reload in browser');
await browser.close();
