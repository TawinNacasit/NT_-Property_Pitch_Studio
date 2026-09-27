import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ channel: 'msedge' });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route(/^https?:\/\//, route => route.abort());
  await page.goto(pathToFileURL(resolve('property_profile_slide_generator.html')).href);

  const button = page.locator('#inlineEditBtn');
  await button.click();
  assert.equal(await button.getAttribute('aria-pressed'), 'true');
  await page.locator('#displayTitle').fill('หัวข้อที่แก้บนสไลด์');
  assert.equal(await page.locator('#inputTitle').inputValue(), 'หัวข้อที่แก้บนสไลด์');

  await page.locator('#displaySellingPointsList [data-inline-list]').first().fill('จุดขายใหม่');
  assert((await page.locator('#inputSellingPoints').inputValue()).startsWith('จุดขายใหม่'));
  await page.locator('#displayTagsContainer [data-inline-tag]').first().fill('กลุ่มธุรกิจใหม่');
  assert.equal(await page.locator('#tagsListEditor input').first().inputValue(), 'กลุ่มธุรกิจใหม่');
  await page.locator('#displayDimTop').fill('หน้ากว้าง 40 ม.');
  assert.equal(await page.locator('#dimTop').inputValue(), 'หน้ากว้าง 40 ม.');

  await button.click();
  assert.equal(await button.getAttribute('aria-pressed'), 'false');
  assert.equal(await page.locator('#displayTitle').getAttribute('contenteditable'), 'false');
  assert.equal(await page.locator('#displayTitle').textContent(), 'หัวข้อที่แก้บนสไลด์');
  assert.deepEqual(errors, []);
  console.log('PASS: inline mode edits slide text, list, tag and dimensions; source inputs stay in sync.');
} finally {
  await browser.close();
}
