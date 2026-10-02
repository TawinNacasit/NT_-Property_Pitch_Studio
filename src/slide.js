import { escapeHTML as esc, lines } from './model';

const safeFit = value => value === 'contain' ? 'contain' : 'cover';
const safePosition = value => ['top', 'bottom', 'left', 'right', 'center'].includes(value) ? value : 'center';

export function mapHref(data) {
  if (data.mapUrl) {
    try {
      const url = new URL(data.mapUrl);
      if (['http:', 'https:'].includes(url.protocol)) return url.href;
    } catch {}
  }
  return coordinateMapHref(data);
}

export function coordinateMapHref(data) {
  return `https://www.google.com/maps?q=${encodeURIComponent(data.lat + ',' + data.lng)}`;
}

export function slideMarkup(data, fields, icon, logo) {
  const tags = data.tags.map((tag, index) => `<span class="${data.tagHighlights[index] ? 'highlighted' : ''}" data-tag-index="${index}">${esc(tag)}</span>`).join('');
  const photos = [1, 2, 3].map(index => `
    <div class="site-photo">
      <img src="${esc(data[`photo${index}`])}" alt="ภาพประกอบ ${index}" style="object-fit:${safeFit(data[`photo${index}Fit`])}">
      <span class="site-caption" data-caption="${index}">${esc(data[`caption${index}`])}</span>
    </div>`).join('');
  const logoMarkup = data.logoPhoto
    ? `<img class="custom-slide-logo" src="${esc(data.logoPhoto)}" alt="โลโก้ที่เลือก">`
    : `${logo}<small>National<br>Telecom</small>`;
  const priceRow=`<div class="price-row">${icon('tags')}<span>ราคา / อัตรา</span><strong>${esc(data.price)}</strong></div>`;

  return `
    <div class="slide-header">
      <div class="slide-title-block"><span class="property-category">${esc(data.category)}</span><h2>${esc(data.title)}</h2><p>${icon('map-pin')}${esc(data.district)}</p></div>
      <div class="target-tags">${tags}</div>
    </div>
    <div class="slide-body">
      <div class="visual-column">
        <div class="property-photo">
          ${data.photo?`<img class="satellite-image" src="${esc(data.photo)}" alt="ภาพแผนที่หรือภาพหลักของทรัพย์สิน" style="object-fit:${safeFit(data.photoFit)};object-position:${safePosition(data.photoPos)}">`:''}
          <div class="photo-empty slide-photo-empty" ${data.photo?'hidden':''}>ไม่มีภาพแผนที่<br><small>เพิ่มภาพได้ในแท็บรูปและสื่อ</small></div>
          <span class="map-badge">${icon('map')} ${data.photo?'แผนที่ตั้ง':'ภาพหลักของทรัพย์สิน'}</span>
          <div class="dimension-overlay ${data.showDimensions ? '' : 'hidden'}" aria-hidden="${!data.showDimensions}">
            <span class="dimension-tag top" data-dimension="dimTop">${esc(data.dimTop)}</span>
            <span class="dimension-tag left" data-dimension="dimLeft">${esc(data.dimLeft)}</span>
            <span class="dimension-tag right" data-dimension="dimRight">${esc(data.dimRight)}</span>
            <span class="dimension-tag bottom" data-dimension="dimBottom">${esc(data.dimBottom)}</span>
            <span class="dimension-pin">${icon('map-pin')}</span>
          </div>
        </div>
        <div class="site-photos">${photos}</div>
        <div class="location-strip">${icon('map-pin')}<div><small>พิกัดที่ตั้ง</small><strong>${esc(data.lat)}, ${esc(data.lng)}</strong></div><a href="${esc(mapHref(data))}" target="_blank" rel="noopener noreferrer" aria-label="เปิดพิกัดใน Google Maps">${icon('arrow-up-right')}</a></div>
      </div>
      <div class="detail-column">
        <div class="profile-title"><h3>ข้อมูลพื้นที่ (Property Profile)</h3><span>Property profile</span></div>
        <dl>${fields.map(([key, label, iconName]) => `${key==='ownership'?priceRow:''}<div data-spec="${key}">${icon(iconName)}<dt>${esc(label)}</dt><dd>${esc(data[key])}</dd></div>`).join('')}</dl>
        <div class="highlight-cards">
          <div class="selling-points"><h3>${icon('star')} จุดขาย (Key Selling Points)</h3><ul>${lines(data.points).map(point => `<li>${esc(point)}</li>`).join('')}</ul></div>
          <div class="caveats"><strong>${icon('triangle-alert')} ข้อจำกัด / ข้อควรระวัง</strong><ul>${lines(data.caveats).map(point=>`<li>${esc(point)}</li>`).join('')}</ul></div>
        </div>
      </div>
    </div>
    <footer class="slide-footer"><div class="slide-logo">${logoMarkup}</div><span data-footer-label="left"></span><span data-footer-label="right">© National Telecom All Rights Reserved</span></footer>`;
}
