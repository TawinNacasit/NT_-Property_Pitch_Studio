import { escapeHTML as esc } from './model';

const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`;

export function pointsFormMarkup(data) {
  const pointCard = (key, title, symbol, help, rows) => `
    <section class="form-section points-card ${key}-card">
      <div class="points-card-heading">
        <h3>${icon(symbol)} ${title}</h3>
        <button type="button" class="points-ai-button" disabled aria-describedby="points-ai-note" title="ยังไม่ได้เชื่อมต่อบริการ AI">${icon('wand-sparkles')} AI ขัดเกลา</button>
      </div>
      <p class="points-help" id="${key}-help">${help}</p>
      <label class="field"><span class="points-sr-only">${title}</span><textarea data-field="${key}" rows="${rows}" aria-describedby="${key}-help">${esc(data[key])}</textarea></label>
    </section>`;

  return `
    <section class="form-section points-card">
      <div class="points-card-heading">
        <h3>${icon('tags')} กลุ่มธุรกิจเป้าหมาย</h3>
        <button type="button" data-add-tag class="points-add-button">${icon('plus')} เพิ่มแท็ก</button>
      </div>
      <p class="points-help">คลิกปุ่มดาวเพื่อสลับ ไฮไลต์ (สีทึบ) / ปกติ (เส้นกรอบ) หรือคลิกแท็กบนสไลด์</p>
      <div class="tag-editor">${data.tags.map((tag,index)=>`
        <div class="tag-editor-row">
          <button type="button" class="tag-highlight-button" data-tag-highlight="${index}" aria-pressed="${!!data.tagHighlights[index]}" aria-label="ไฮไลต์แท็ก ${index+1}">${icon('star')}<span>${data.tagHighlights[index]?'ไฮไลต์':'ปกติ'}</span></button>
          <input data-tag-index="${index}" aria-label="แท็ก ${index+1}" value="${esc(tag)}">
          <button type="button" data-tag-delete="${index}" aria-label="ลบแท็ก ${index+1}" title="${data.tags.length<=1?'ต้องมีอย่างน้อย 1 แท็ก':'ลบแท็ก'}">${icon('trash-2')}</button>
        </div>`).join('')}</div>
    </section>
    ${pointCard('points','จุดขาย (Key Selling Points)','star','ขึ้นบรรทัดใหม่ 1 บรรทัดต่อ 1 ข้อ (แนะนำ 2–4 ข้อ เพื่อให้พอดีกรอบ)',4)}
    ${pointCard('caveats','ข้อจำกัด / ข้อควรระวัง','triangle-alert','ขึ้นบรรทัดใหม่ 1 บรรทัดต่อ 1 ข้อ (แนะนำ 1–3 ข้อ)',3)}
    <p id="points-ai-note" class="points-ai-note">AI ขัดเกลายังไม่พร้อมใช้งาน เนื่องจากยังไม่ได้เชื่อมต่อบริการ AI</p>
    <section class="form-section points-card">
      <label class="field"><span>ข้อความท้ายสไลด์ (Footer)</span><input data-field="footerRight" value="${esc(data.slideLabels?.footerRight ?? 'NT Property Studio')}"></label>
    </section>`;
}
