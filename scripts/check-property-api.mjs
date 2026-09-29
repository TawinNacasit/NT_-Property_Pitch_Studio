import assert from 'node:assert/strict';
import { defaults } from '../src/model.js';
import { fromPropertyRecord, toPropertyPayload, saveProperty } from '../src/property-api.js';

const record = {
  id: 7, cdg_id: 101, property_code: 'NT-PKN-001', title: 'ชุมสายพระโขนง',
  category: 'PROPERTY', latitude: 13.707841, longitude: 100.601377, custom_map_url: null,
  specs: { id: 8, property_id: 7, land_area: '2 ไร่', building_detail: 'อาคาร', electricity_system: '24 KV', water_drainage: 'ประปา', telecom_system: 'Fiber', transportation: 'BTS', city_plan_zoning: 'สีแดง', price_conditions: 'เสนอราคา', ownership_status: 'NT' },
  tags: [{ id: 9, property_id: 7, tag_name: 'Office', is_highlighted: true, display_order: 1 }],
  points: [{ id: 10, property_id: 7, point_type: 'SELLING', content: 'ใกล้ BTS', sort_order: 1 }, { id: 11, property_id: 7, point_type: 'CAVEAT', content: 'ทางเข้าแคบ', sort_order: 1 }],
  media: [{ id: 12, property_id: 7, media_type: 'SATELLITE', image_url: '/map.jpg', caption: null, object_fit: 'contain', object_position: 'top', slot_index: 1 }, { id: 13, property_id: 7, media_type: 'SITE_PHOTO', image_url: '/site.jpg', caption: 'พื้นที่', object_fit: 'cover', object_position: 'center', slot_index: 2 }],
  slide_config: { id: 14, property_id: 7, theme_name: 'emerald-green', text_density: 'compact', show_dimension_box: false, dim_top: '10 ม.', dim_bottom: '9 ม.', dim_left: '20 ม.', dim_right: '20 ม.', logo_url: '/logo.png', footer_text: 'NT' },
};
const data = fromPropertyRecord(record);
const payload = toPropertyPayload(data);
assert.equal(payload.property.property_code, record.property_code);
assert.deepEqual(payload.specs, Object.fromEntries(Object.entries(record.specs).filter(([key]) => !['id', 'property_id'].includes(key))));
assert.deepEqual(payload.tags, [{ tag_name: 'Office', is_highlighted: true, display_order: 1 }]);
assert.deepEqual(payload.points.map(({ point_type, content, sort_order }) => [point_type, content, sort_order]), [['SELLING', 'ใกล้ BTS', 1], ['CAVEAT', 'ทางเข้าแคบ', 1]]);
assert.deepEqual(payload.media.map(({ media_type, slot_index }) => [media_type, slot_index]), [['SATELLITE', 1], ['SITE_PHOTO', 2]]);
assert.equal(payload.config.theme_name, 'emerald-green');
assert.equal(payload.config.footer_text, 'NT');

globalThis.sessionStorage = { getItem: () => 'test-token' };
const requests = [];
globalThis.fetch = async (url, options) => {
  requests.push({ url, method: options.method, body: options.body ? JSON.parse(options.body) : undefined });
  return { ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({ success: true, data: record }) };
};
await saveProperty(data, record);
assert.deepEqual(requests.map(({ url, method }) => [url.split('/profile-estate')[1], method]), [
  ['/properties/7', 'PATCH'], ['/specs/8', 'PATCH'], ['/tags/9', 'PATCH'],
  ['/points/10', 'PATCH'], ['/points/11', 'PATCH'], ['/media/12', 'PATCH'],
  ['/media/13', 'PATCH'], ['/slide-configs/14', 'PATCH'], ['/properties/7', 'GET'],
]);
assert(requests.every(item => item.method === 'GET' || item.body));
assert.equal(requests[0].body.latitude, record.latitude);
requests.length = 0;
const newData = structuredClone(defaults);
newData.propertyCode = 'NEW-001';
await saveProperty(newData, null);
assert.deepEqual(requests.slice(0, 2).map(({ url, method }) => [url.split('/profile-estate')[1], method]), [['/properties/', 'POST'], ['/properties/7', 'GET']]);
assert(requests.some(item => item.url.endsWith('/slide-configs/14') && item.method === 'PATCH'), 'New property must update its automatically created slide config');
console.log('PASS: database.md round trip and API save mapping');
