const defaultLabels = {
  photoCaption: 'แผนที่ตั้ง (Satellite View)',
  locationHeading: 'พิกัดที่ตั้ง',
  pointsHeading: 'จุดขาย (Key Selling Points)',
  profileHeading: 'ข้อมูลพื้นที่ (Property Profile)',
  profileSubtitle: 'Property profile',
  priceHeading: 'ราคา / อัตรา',
  caveatsHeading: 'ข้อจำกัด / ข้อควรระวัง',
  footerLeft: '',
  footerRight: '© National Telecom All Rights Reserved',
};

export function createInlineEditor({ data, fields, fitSlide, markDirty, toast }) {
  const slide = document.querySelector('#slide');
  const button = document.querySelector('#inline-edit');
  let enabled = false;
  const legacyLabels={pointsHeading:'ศักยภาพของพื้นที่',profileHeading:'ข้อมูลทรัพย์สิน',priceHeading:'เงื่อนไขการลงทุน',caveatsHeading:'ข้อควรพิจารณา',footerLeft:'ฝ่ายบริหารทรัพย์สิน • บริษัท โทรคมนาคมแห่งชาติ จำกัด (มหาชน)',footerRight:'NT Property Studio'};
  for(const [key,value] of Object.entries(legacyLabels))if(data.slideLabels?.[key]===value)data.slideLabels[key]=defaultLabels[key];
  data.slideLabels = { ...defaultLabels, ...data.slideLabels };

  function editable(element, type, key, value) {
    if (!element) return;
    if (value !== undefined) element.textContent = value;
    element.dataset.inlineEdit = type;
    element.dataset.inlineKey = key;
    element.contentEditable = String(enabled);
    if (enabled) element.tabIndex = 0;
    else element.removeAttribute('tabindex');
  }

  function label(selector, key) {
    editable(slide.querySelector(selector), 'label', key, data.slideLabels[key]);
  }

  function labelAfterIcon(selector, key) {
    const parent = slide.querySelector(selector);
    if (!parent) return;
    const textNode = [...parent.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    if (!textNode) return;
    const span = document.createElement('span');
    parent.replaceChild(span, textNode);
    editable(span, 'label', key, data.slideLabels[key]);
  }

  function decorate() {
    slide.classList.toggle('inline-edit-mode', enabled);
    for (const [selector, key] of [
      ['.property-category', 'category'], ['.slide-header h2', 'title'],
      ['.price-row strong', 'price'],
    ]) editable(slide.querySelector(selector), 'field', key);
    const district = slide.querySelector('.slide-header p');
    const districtText = [...district.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    if (districtText) {
      const span = document.createElement('span');
      district.replaceChild(span, districtText);
      editable(span, 'field', 'district', data.district);
    }
    editable(slide.querySelector('.location-strip strong'), 'coords', 'coords');
    fields.forEach(([key, name], index) => {
      const row = slide.querySelector(`[data-spec="${key}"]`);
      editable(row?.querySelector('dt'), 'label', `field-${key}`, data.slideLabels[`field-${key}`] ?? name);
      editable(row?.querySelector('dd'), 'field', key);
    });
    slide.querySelectorAll('.selling-points li').forEach((item, index) => editable(item, 'point', String(index)));
    slide.querySelectorAll('.caveats li').forEach((item, index) => editable(item, 'caveat', String(index)));
    slide.querySelectorAll('.target-tags span').forEach((item, index) => editable(item, 'tag', String(index)));
    syncTagControls();
    slide.querySelectorAll('[data-caption]').forEach(item => editable(item, 'caption', item.dataset.caption));
    slide.querySelectorAll('[data-dimension]').forEach(item => editable(item, 'dimension', item.dataset.dimension));
    labelAfterIcon('.map-badge', 'photoCaption');
    label('.location-strip small', 'locationHeading');
    labelAfterIcon('.selling-points h3', 'pointsHeading');
    label('.profile-title h3', 'profileHeading');
    label('.profile-title > span', 'profileSubtitle');
    label('.price-row > span', 'priceHeading');
    labelAfterIcon('.caveats strong', 'caveatsHeading');
    label('[data-footer-label="left"]', 'footerLeft');
    label('[data-footer-label="right"]', 'footerRight');
  }

  function syncTagControls(){
    slide.querySelectorAll('.target-tags [data-tag-index]').forEach(item=>{
      item.tabIndex=0;
      item.setAttribute('role',enabled?'textbox':'button');
      item.title=enabled?'แก้ข้อความแท็ก':'คลิกเพื่อสลับไฮไลต์ / ปกติ';
      if(enabled)item.removeAttribute('aria-pressed');
      else item.setAttribute('aria-pressed',String(!!data.tagHighlights[Number(item.dataset.tagIndex)]));
    });
  }

  function update(element) {
    const value = element.innerText.replace(/\r/g, '').replace(/\u00a0/g, ' ').trim();
    const { inlineEdit: type, inlineKey: key } = element.dataset;
    if (type === 'field') {
      data[key] = key === 'caveats' ? value.replace(/\s+\/\s+/g, '\n') : value;
      const input = document.querySelector(`[data-field="${key}"]`);
      if (input) input.value = data[key];
    } else if (type === 'point' || type === 'caveat') {
      const field=type==='point'?'points':'caveats';
      const selector=type==='point'?'.selling-points li':'.caveats li';
      data[field] = [...slide.querySelectorAll(selector)].map(item => item.innerText.trim()).filter(Boolean).join('\n');
      const input = document.querySelector(`[data-field="${field}"]`);
      if (input) input.value = data[field];
    } else if (type === 'tag') {
      data.tags[Number(key)] = value;
      const input = document.querySelector(`#form-panel [data-tag-index="${key}"]`);
      if (input) input.value = value;
    } else if (type === 'caption') {
      data[`caption${key}`] = value;
      const input = document.querySelector(`[data-field="caption${key}"]`);
      if (input) input.value = value;
    } else if (type === 'dimension') {
      data[key] = value;
      const input = document.querySelector(`[data-field="${key}"]`);
      if (input) input.value = value;
    } else if (type === 'label') {
      data.slideLabels[key] = value;
      const input=document.querySelector(`[data-field="${key}"]`);
      if(input)input.value=value;
    }
    markDirty();
    return value;
  }

  slide.addEventListener('input', event => {
    const target = event.target.closest('[data-inline-edit]');
    if (enabled && target && target.dataset.inlineEdit !== 'coords') update(target);
    else if (enabled && target) markDirty();
  });
  slide.addEventListener('focusout', event => {
    const target = event.target.closest('[data-inline-edit]');
    if (!target || !enabled) return;
    if (target.dataset.inlineEdit === 'coords') {
      const parts = target.innerText.split(',').map(part => part.trim());
      const [lat, lng] = parts.map(Number);
      if (parts.length === 2 && parts.every(Boolean) && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        data.lat = parts[0]; data.lng = parts[1];
        for (const key of ['lat', 'lng']) {
          const input = document.querySelector(`[data-field="${key}"]`);
          if (input) input.value = data[key];
        }
        const link = slide.querySelector('.location-strip a');
        link.href = `https://www.google.com/maps?q=${encodeURIComponent(data.lat + ',' + data.lng)}`;
        markDirty();
      } else toast('กรุณากรอกพิกัดเป็น ละติจูด, ลองจิจูด');
      target.textContent = `${data.lat}, ${data.lng}`;
    } else {
      target.textContent = update(target);
    }
    requestAnimationFrame(fitSlide);
  });
  slide.addEventListener('keydown', event => {
    if(!enabled)return;
    const target = event.target.closest('[data-inline-edit]');
    if (!target || event.key !== 'Enter' || ['building', 'transport'].includes(target.dataset.inlineKey)) return;
    event.preventDefault();
    target.blur();
  });
  slide.addEventListener('paste', event => {
    const target = event.target.closest('[data-inline-edit]');
    if (!target) return;
    event.preventDefault();
    const multiline = ['building', 'transport'].includes(target.dataset.inlineKey);
    const value = event.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, multiline ? value : value.replace(/\s*\n\s*/g, ' '));
  });

  button.addEventListener('click', () => {
    if (enabled && document.activeElement?.isContentEditable) document.activeElement.blur();
    enabled = !enabled;
    button.setAttribute('aria-pressed', String(enabled));
    button.querySelector('span').textContent = enabled ? 'เสร็จสิ้น' : 'แก้ข้อความบนสไลด์';
    button.classList.toggle('active', enabled);
    slide.classList.toggle('inline-edit-mode', enabled);
    slide.querySelectorAll('[data-inline-edit]').forEach(element => {
      element.contentEditable = String(enabled);
      if (enabled) element.tabIndex = 0;
      else element.removeAttribute('tabindex');
    });
    syncTagControls();
    if (enabled && innerWidth <= 800) {
      document.querySelector('.mobile-view').value = 'preview';
      document.querySelector('.workspace').dataset.view = 'preview';
      requestAnimationFrame(fitSlide);
    }
    toast(enabled ? 'คลิกข้อความบนสไลด์เพื่อพิมพ์แก้ไข' : 'ปิดโหมดแก้ข้อความบนสไลด์');
  });

  return { decorate };
}
