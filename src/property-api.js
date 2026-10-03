import { defaults, lines } from './model.js';

const base = (import.meta.env?.VITE_API_BASE_URL || '/profile-estate').replace(/\/$/, '');
const tokenKey = 'nt-studio-session';
const specFields = {
  area: 'land_area', building: 'building_detail', electric: 'electricity_system',
  water: 'water_drainage', telecom: 'telecom_system', transport: 'transportation',
  zoning: 'city_plan_zoning', price: 'price_conditions', ownership: 'ownership_status',
};
const themes = ['corporate-yellow', 'modern-navy', 'emerald-green', 'luxury-red'];

async function request(path, method = 'GET', body, suppliedToken) {
  const token = suppliedToken || sessionStorage.getItem(tokenKey);
  if (!token) throw new Error('กรุณาเข้าสู่ระบบอีกครั้ง');
  const response = await fetch(`${base}${path}`, {
    method, signal: AbortSignal.timeout(20000),
    headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = response.headers.get('content-type')?.includes('application/json') ? await response.json() : null;
  if (!response.ok || result?.success === false) throw new Error(result?.message || `เชื่อมต่อข้อมูลทรัพย์สินไม่สำเร็จ (${response.status})`);
  if (!result || !('data' in result)) throw new Error('รูปแบบข้อมูลจากระบบไม่ถูกต้อง');
  return result;
}

export async function listProperties() {
  const properties = [];
  for (let page = 1; ; page++) {
    const result = await request(`/properties/?page=${page}&limit=100`);
    properties.push(...result.data);
    if (!result.pagination?.has_next) return properties;
  }
}

export async function loadProperty(id) {
  const result = await request(`/properties/${id}`);
  return { record: result.data, data: fromPropertyRecord(result.data) };
}

export async function firstLogin(username, cdgId, token) {
  const result = await request('/first-login', 'POST', { username, user: username, cdg_id: cdgId }, token);
  if (!result.data || typeof result.data !== 'object' || Array.isArray(result.data) || result.data.cdg_id == null || Number(result.data.cdg_id) !== Number(cdgId)) {
    throw new Error('ข้อมูลตั้งต้นของรหัสพื้นที่ไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ');
  }
  return { record: result.data, data: fromPropertyRecord(result.data) };
}

export function fromPropertyRecord(record) {
  const data = structuredClone(defaults);
  data.propertyId = record.id == null ? null : Number(record.id);
  data.cdgId = String(record.cdg_id ?? 0);
  data.propertyCode = record.property_code ?? '';
  for (const key of ['title', 'category']) data[key] = record[key] ?? '';
  data.lat = String(record.latitude ?? '');
  data.lng = String(record.longitude ?? '');
  data.mapUrl = record.custom_map_url ?? '';
  // District and custom slide labels have no columns in database.md.
  data.district = '';
  data.slideLabels = {};
  for (const [key, column] of Object.entries(specFields)) data[key] = record.specs?.[column] ?? '';
  data.tags = (record.tags ?? []).map(tag => tag.tag_name);
  data.tagHighlights = (record.tags ?? []).map(tag => Boolean(tag.is_highlighted));
  data.points = (record.points ?? []).filter(point => point.point_type === 'SELLING').map(point => point.content).join('\n');
  data.caveats = (record.points ?? []).filter(point => point.point_type === 'CAVEAT').map(point => point.content).join('\n');
  const satellite = (record.media ?? []).find(item => item.media_type === 'SATELLITE' && Number(item.slot_index) === 1);
  if (satellite?.caption) data.slideLabels.photoCaption = satellite.caption;
  data.photo = satellite?.image_url ?? '';
  data.photoFit = satellite?.object_fit ?? 'cover';
  data.photoPos = satellite?.object_position ?? 'center';
  for (let index = 1; index <= 3; index++) {
    const item = (record.media ?? []).find(media => media.media_type === 'SITE_PHOTO' && Number(media.slot_index) === index);
    data[`photo${index}`] = item?.image_url ?? '';
    data[`photo${index}Fit`] = item?.object_fit ?? 'cover';
    data[`caption${index}`] = item?.caption ?? '';
  }
  const config = record.slide_config;
  data.theme = config?.theme_name ?? defaults.theme;
  data.density = config?.text_density ?? defaults.density;
  data.showDimensions = config?.show_dimension_box ?? defaults.showDimensions;
  for (const [key, column] of Object.entries({ dimTop: 'dim_top', dimBottom: 'dim_bottom', dimLeft: 'dim_left', dimRight: 'dim_right' })) data[key] = config?.[column] ?? '';
  data.logoPhoto = config?.logo_url ?? '';
  data.slideLabels.footerRight = config?.footer_text ?? defaults.slideLabels.footerRight ?? '© National Telecom All Rights Reserved';
  return data;
}

export function toPropertyPayload(data) {
  const property = {
    cdg_id: Number(data.cdgId), property_code: data.propertyCode.trim(), title: data.title.trim(),
    category: data.category.trim(), latitude: Number(data.lat), longitude: Number(data.lng),
    custom_map_url: data.mapUrl.trim() || null,
  };
  const specs = Object.fromEntries(Object.entries(specFields).map(([key, column]) => [column, data[key] ?? '']));
  const tags = data.tags.map((tag, index) => ({ tag_name: tag.trim(), is_highlighted: Boolean(data.tagHighlights[index]), display_order: index + 1 })).filter(tag => tag.tag_name);
  const points = [
    ...lines(data.points).map((content, index) => ({ point_type: 'SELLING', content, sort_order: index + 1 })),
    ...lines(data.caveats).map((content, index) => ({ point_type: 'CAVEAT', content, sort_order: index + 1 })),
  ];
  const media = [];
  if (data.photo) media.push({ media_type: 'SATELLITE', image_url: data.photo, caption: data.slideLabels?.photoCaption || null, object_fit: data.photoFit, object_position: data.photoPos, slot_index: 1 });
  for (let index = 1; index <= 3; index++) if (data[`photo${index}`]) media.push({ media_type: 'SITE_PHOTO', image_url: data[`photo${index}`], caption: data[`caption${index}`] || null, object_fit: data[`photo${index}Fit`], object_position: 'center', slot_index: index });
  const config = {
    theme_name: data.theme, text_density: data.density, show_dimension_box: Boolean(data.showDimensions),
    dim_top: data.dimTop || null, dim_bottom: data.dimBottom || null,
    dim_left: data.dimLeft || null, dim_right: data.dimRight || null,
    logo_url: data.logoPhoto || null, footer_text: data.slideLabels?.footerRight || '',
  };
  return { property, specs, tags, points, media, config };
}

function validatePayload(data, payload) {
  if (!Number.isInteger(payload.property.cdg_id) || payload.property.cdg_id < 0) throw new Error('CDG ID ต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป');
  if (!payload.property.property_code) throw new Error('กรุณาระบุรหัสทรัพย์สิน');
  if (!payload.property.title) throw new Error('กรุณาระบุชื่อทรัพย์สิน');
  if (!Number.isFinite(payload.property.latitude) || !Number.isFinite(payload.property.longitude) || Math.abs(payload.property.latitude) > 90 || Math.abs(payload.property.longitude) > 180) throw new Error('พิกัดทรัพย์สินไม่ถูกต้อง');
  if (!themes.includes(data.theme)) throw new Error('ธีมสไลด์ไม่ตรงกับฐานข้อมูล');
  if (!['center', 'top', 'bottom'].includes(data.photoPos)) throw new Error('ตำแหน่งภาพต้องเป็น กึ่งกลาง, ด้านบน หรือด้านล่าง');
}

async function syncRows(path, propertyId, previous, next, keyOf) {
  const oldRows = previous ?? [];
  const oldByKey = new Map(oldRows.map((row, index) => [keyOf(row, index), row]));
  const nextKeys = new Set(next.map(keyOf));
  for (const [key, old] of oldByKey) if (!nextKeys.has(key)) await request(`/${path}/${old.id}`, 'DELETE');
  for (let index = 0; index < next.length; index++) {
    const row = next[index];
    const old = oldByKey.get(keyOf(row, index));
    if (old) await request(`/${path}/${old.id}`, 'PATCH', row);
    else await request(`/${path}/`, 'POST', { property_id: propertyId, ...row });
  }
}

export async function saveProperty(data, previous) {
  const payload = toPropertyPayload(data);
  validatePayload(data, payload);
  let id = previous?.id;
  try {
    if (id) await request(`/properties/${id}`, 'PATCH', payload.property);
    else {
      id = (await request('/properties/', 'POST', payload.property)).data.id;
      previous = (await loadProperty(id)).record;
    }
    const upsert = (path, old, body) => old?.id
      ? request(`/${path}/${old.id}`, 'PATCH', body)
      : request(`/${path}/`, 'POST', { property_id: id, ...body });
    await upsert('specs', previous?.specs, payload.specs);
    await syncRows('tags', id, previous?.tags, payload.tags, (_row, index) => index);
    await syncRows('points', id, previous?.points, payload.points, (row, index) => `${row.point_type}:${row.sort_order ?? index + 1}`);
    await syncRows('media', id, previous?.media, payload.media, row => `${row.media_type}:${row.slot_index}`);
    await upsert('slide-configs', previous?.slide_config, payload.config);
    return loadProperty(id);
  } catch (error) {
    error.propertyId = id;
    throw error;
  }
}
