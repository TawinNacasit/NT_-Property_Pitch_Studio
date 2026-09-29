import { defineCustomElements } from '@ionic/core/loader';
import { defineCustomElements as definePwaElements } from '@ionic/pwa-elements/loader';
import { Camera } from '@capacitor/camera';
import '@ionic/core/css/core.css';
import '@ionic/core/css/normalize.css';
import '@ionic/core/css/structure.css';
import '@fontsource/prompt/thai-400.css';
import '@fontsource/prompt/thai-600.css';
import '@fontsource/prompt/latin-400.css';
import '@fontsource/prompt/latin-600.css';
import '@fontsource/sarabun/thai-400.css';
import { createIcons, icons } from 'lucide';
import { defaults, fields, escapeHTML as esc, lines, validateData, migrateLegacyPointCopy } from './model';
import { createInlineEditor } from './inline-edit';
import { formMarkup } from './forms';
import { slideMarkup, mapHref } from './slide';
import { exportEditablePptx } from './export-pptx';
import './style.css';
import './studio-theme.css';
import './reference-slide.css';
defineCustomElements(window);
definePwaElements(window);
let data = structuredClone(defaults);
try { const saved=JSON.parse(localStorage.getItem('nt-studio')); if(saved && typeof saved==='object') for(const key of Object.keys(defaults)) {if(typeof saved[key]===typeof defaults[key]) data[key]=saved[key];} } catch {}
migrateLegacyPointCopy(data);
if(data.theme==='navy')data.theme='corporate-yellow';
if(data.theme==='blue')data.theme='modern-navy';
if(!Array.isArray(data.tags))data.tags=structuredClone(defaults.tags);
if(!Array.isArray(data.tagHighlights))data.tagHighlights=structuredClone(defaults.tagHighlights);
let tab='profile';
const icon = name => '<i data-lucide="'+name+'" aria-hidden="true"></i>';
const logo = '<span class="nt-mark"><b></b><b></b><b></b></span><strong>nt</strong>';
document.querySelector('#app').innerHTML = `
<header class="app-header"><a class="brand" href="/" aria-label="NT Property Studio หน้าหลัก">${logo}<span class="brand-divider"></span><span>Property Studio<small>พื้นที่สร้างโอกาส ให้ทุกทรัพย์สิน</small></span></a><div class="header-right"><span class="workspace-label">${icon('building-2')} พื้นที่ทำงานของคุณ</span><span class="avatar">NT</span></div></header>
<div class="project-bar"><div><div class="breadcrumb">พื้นที่ทำงาน <span>/</span> สร้างสไลด์นำเสนอ</div><h1>นำเสนอทรัพย์สิน <span>อย่างมืออาชีพ</span></h1></div><div class="project-actions"><span id="save-status" role="status">${icon('check')} พร้อมแก้ไข</span><ion-button id="save" fill="outline">${icon('save')} บันทึกฉบับร่าง</ion-button><ion-button id="export" class="primary">${icon('download')} ส่งออกสไลด์</ion-button></div></div>
<ion-segment class="mobile-view" value="edit" aria-label="มุมมองพื้นที่ทำงาน"><ion-segment-button value="edit">แก้ไขข้อมูล</ion-segment-button><ion-segment-button value="preview">ตัวอย่างสไลด์</ion-segment-button></ion-segment>
<main class="workspace" data-view="edit"><aside class="editor"><div class="editor-heading"><div><h2>รายละเอียดทรัพย์สิน</h2><p>เติมข้อมูล แล้วดูสไลด์เปลี่ยนไปพร้อมกัน</p></div><span class="edit-icon">${icon('sliders-horizontal')}</span></div><nav class="editor-tabs" aria-label="หมวดข้อมูล">${[['profile','building-2','ข้อมูล'],['points','list-checks','จุดเด่น'],['media','images','รูปภาพ'],['style','palette','รูปแบบ']].map(([id,ic,label])=>`<button data-tab="${id}" class="${id===tab?'active':''}" aria-pressed="${id===tab}">${icon(ic)}<span>${label}</span></button>`).join('')}</nav><div id="form-panel"></div><div class="editor-foot">${icon('shield-check')} ข้อมูลฉบับร่างเก็บในเบราว์เซอร์นี้</div></aside>
<section class="preview-area" aria-label="ตัวอย่างสไลด์"><div class="preview-toolbar"><div><span class="live-dot"></span><h2>ตัวอย่างสไลด์</h2><span class="aspect">16:9</span></div><div class="preview-actions"><button id="print-slide" class="text-button">${icon('printer')} <span>เตรียมพิมพ์</span></button><button id="expand" class="text-button">${icon('maximize-2')} <span>ขยายตัวอย่าง</span></button></div></div><div class="slide-stage"><div id="slide-holder"><article id="slide"></article></div></div><div class="preview-caption"><span>${icon('monitor')} สไลด์นำเสนอทรัพย์สิน</span><span>1 / 1</span></div><div class="workflow-tip"><span class="tip-icon">${icon('lightbulb')}</span><div><strong>ข้อมูลครบ สื่อสารได้ในหน้าเดียว</strong><p>เพิ่มจุดเด่นและภาพทรัพย์สิน เพื่อให้ผู้สนใจเห็นศักยภาพได้ชัดเจน</p></div><button id="tip-media" class="text-button">เพิ่มรูปภาพ ${icon('arrow-up-right')}</button></div><p class="sample-note">ข้อมูลและภาพตัวอย่างสำหรับจัดรูปแบบ • โปรดตรวจสอบก่อนนำเสนอ</p></section></main>
<dialog id="export-dialog"><div class="dialog-heading"><h2>ส่งออกสไลด์</h2><button id="close-dialog" class="icon-button" aria-label="ปิด">${icon('x')}</button></div><p>เลือกไฟล์สำหรับนำเสนอหรือส่งต่อ</p><button class="export-choice" data-format="png">${icon('image')}<span><strong>รูปภาพ PNG</strong><small>ความละเอียดสูง พร้อมแชร์</small></span>${icon('chevron-right')}</button><button class="export-choice" data-format="pptx">${icon('presentation')}<span><strong>PowerPoint</strong><small>ข้อความและรูปภาพแก้ไขต่อได้</small></span>${icon('chevron-right')}</button><p id="export-status" role="status"></p></dialog><div id="toast" role="status"></div>`;
const zoomControls = document.createElement('div');
zoomControls.className = 'zoom-controls';
zoomControls.setAttribute('role', 'group');
zoomControls.setAttribute('aria-label', 'ซูมสไลด์');
zoomControls.innerHTML = `<span class="zoom-aspect">${icon('scan')} สัดส่วน 16:9</span><button id="zoom-out" type="button" aria-label="ย่อสไลด์">− ย่อ</button><button id="zoom-reset" type="button" aria-label="กลับขนาดพอดีหน้าจอ">100%</button><button id="zoom-in" type="button" aria-label="ขยายสไลด์">+ ขยาย</button>`;
document.querySelector('.preview-caption').insertBefore(zoomControls, document.querySelector('.preview-caption > span:last-child'));
let zoomLevel = 1;
const inlineButton = document.createElement('button');
inlineButton.id = 'inline-edit';
inlineButton.type = 'button';
inlineButton.className = 'inline-edit-button';
inlineButton.setAttribute('aria-pressed', 'false');
inlineButton.setAttribute('aria-label', 'แก้ข้อความบนสไลด์');
inlineButton.innerHTML = `${icon('pen-line')} <span>แก้ข้อความบนสไลด์</span>`;
document.querySelector('.project-actions').prepend(inlineButton);
const wideToolbar = matchMedia('(min-width: 1200px)');
function placeStudioActions() {
  const actions = document.querySelector('.project-actions');
  if (wideToolbar.matches) document.querySelector('.header-right').prepend(actions);
  else document.querySelector('.project-bar').append(actions);
}
wideToolbar.addEventListener('change', placeStudioActions);
placeStudioActions();
const uiThemeKey = 'nt-studio-ui-theme';
const themeButton = document.createElement('button');
themeButton.id = 'ui-theme-toggle';
themeButton.type = 'button';
themeButton.className = 'ui-theme-toggle';
document.querySelector('.header-right').append(themeButton);
function applyUiTheme(theme) {
  const light = theme === 'light';
  document.querySelector('#app').dataset.uiTheme = light ? 'light' : 'dark';
  const label = light ? 'เปลี่ยนเป็นธีมมืด' : 'เปลี่ยนเป็นธีมสว่าง';
  themeButton.setAttribute('aria-label', label);
  themeButton.setAttribute('title', label);
  themeButton.setAttribute('aria-pressed', String(light));
  themeButton.innerHTML = `${icon(light ? 'moon' : 'sun')}<span>${light ? 'ธีมมืด' : 'ธีมสว่าง'}</span>`;
  refreshIcons();
}
let savedUiTheme = 'dark';
try { if (localStorage.getItem(uiThemeKey) === 'light') savedUiTheme = 'light'; } catch {}
applyUiTheme(savedUiTheme);
themeButton.addEventListener('click', () => {
  const next = document.querySelector('#app').dataset.uiTheme === 'dark' ? 'light' : 'dark';
  applyUiTheme(next);
  try { localStorage.setItem(uiThemeKey, next); } catch {}
});
function refreshIcons(){ createIcons({icons}); }
function renderForm(){
  document.querySelector('#form-panel').innerHTML=formMarkup(tab,data);
  refreshIcons();
}
function renderSlide(){
  const slide=document.querySelector('#slide');
  slide.className=`${data.theme}-theme ${data.density}-density`;
  slide.innerHTML=slideMarkup(data,fields,icon,logo);
  inlineEditor.decorate();
  refreshIcons();
  fitSlide();
}function fitSlide(){
  const stage=document.querySelector('.slide-stage');
  const holder=document.querySelector('#slide-holder');
  const slide=document.querySelector('#slide');
  slide.style.transform='none';
  slide.style.height='auto';
  const height=Math.max(675,slide.scrollHeight);
  const style=getComputedStyle(stage);
  const availableWidth=stage.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);
  const availableHeight=stage.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom);
  const widthScale=Math.max(0,availableWidth)/1200;
  const fitScale=innerWidth>800 ? Math.min(widthScale,Math.max(0,availableHeight)/height) : widthScale;
  // Match the reference HTML's 1140px canvas at 100%, then scale from that baseline.
  const scale=Math.min(fitScale,1140/1200)*zoomLevel;
  slide.style.height=height+'px';
  slide.style.transform=`scale(${scale})`;
  holder.style.width=1200*scale+'px';
  holder.style.height=height*scale+'px';
}
new ResizeObserver(fitSlide).observe(document.querySelector('.slide-stage'));
function changeZoom(next) {
  zoomLevel=Math.max(0.5,Math.min(2,Math.round(next*10)/10));
  document.querySelector('#zoom-reset').textContent=Math.round(zoomLevel*100)+'%';
  document.querySelector('#zoom-out').disabled=zoomLevel<=0.5;
  document.querySelector('#zoom-in').disabled=zoomLevel>=2;
  const stage=document.querySelector('.slide-stage');
  stage.classList.toggle('zoomed',zoomLevel>1);
  fitSlide();
  requestAnimationFrame(()=>{
    stage.scrollLeft=Math.max(0,(stage.scrollWidth-stage.clientWidth)/2);
    // Keep the title and top edge visible when zooming; the bottom remains reachable by scrolling.
    stage.scrollTop=0;
  });
}
document.querySelector('#zoom-out').onclick=()=>changeZoom(zoomLevel-0.1);
document.querySelector('#zoom-reset').onclick=()=>changeZoom(1);
document.querySelector('#zoom-in').onclick=()=>changeZoom(zoomLevel+0.1);
function toast(message){ const el=document.querySelector('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.classList.remove('visible'),3500); }
async function useImage(key, file){
  if(file.size>5*1024*1024||!['image/jpeg','image/png','image/webp'].includes(file.type)){
    toast('เลือกรูป JPG, PNG หรือ WebP ไม่เกิน 5 MB');
    return;
  }
  const image=await new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(reader.result);
    reader.onerror=()=>reject(reader.error);
    reader.readAsDataURL(file);
  });
  data[key]=image;
  if(tab==='media')renderForm();
  renderSlide();
  markDirty();
}
async function takePicture(key,button){
  button.disabled=true;
  try{
    const photo=await Camera.takePhoto({quality:85,saveToGallery:false});
    if(!photo.webPath)throw new Error('Camera returned no image');
    const response=await fetch(photo.webPath);
    if(!response.ok)throw new Error('Cannot read camera image');
    await useImage(key,await response.blob());
  }catch(error){
    if(!/cancelled|canceled/i.test(error?.message||''))toast('ถ่ายรูปไม่สำเร็จ กรุณาอนุญาตการใช้กล้องหรือลองอัปโหลดรูป');
  }finally{button.disabled=false;}
}
function preparePrint(){fitSlide();requestAnimationFrame(()=>window.print());}
function save(){try{localStorage.setItem('nt-studio',JSON.stringify(data));document.querySelector('#save-status').innerHTML=icon('check')+' บันทึกแล้ว';refreshIcons();toast('บันทึกฉบับร่างในเบราว์เซอร์แล้ว');}catch{toast('พื้นที่เก็บข้อมูลไม่พอ ลองใช้รูปภาพที่มีขนาดเล็กลง');}}
function changeTab(next){tab=next;document.querySelectorAll('[data-tab]').forEach(el=>{el.classList.toggle('active',el.dataset.tab===tab);el.setAttribute('aria-pressed',el.dataset.tab===tab);});renderForm();}
const markDirty=()=>{document.querySelector('#save-status').textContent='ยังไม่ได้บันทึก';};
function toggleTagHighlight(index){
  data.tagHighlights[index]=!data.tagHighlights[index];
  if(tab==='points')renderForm();
  renderSlide();markDirty();
}
document.querySelector('#slide').addEventListener('keydown',event=>{
  const tag=event.target.closest('.target-tags [data-tag-index]');
  if(tag&&!tag.isContentEditable&&['Enter',' '].includes(event.key)){event.preventDefault();tag.click();}
});
document.addEventListener('input',e=>{
  if(!e.target.closest('#form-panel'))return;
  const key=e.target.dataset.field;
  if(key){if(['footerLeft','footerRight'].includes(key))data.slideLabels[key]=e.target.value;else data[key]=e.target.value;const mapLink=document.querySelector('#map-preview-link');if(mapLink)mapLink.href=mapHref(data);}
  else if(e.target.dataset.tagIndex!==undefined){data.tags[Number(e.target.dataset.tagIndex)]=e.target.value;}
  else return;
  markDirty();renderSlide();
});
document.addEventListener('click',e=>{
  const tag=e.target.closest('#slide .target-tags [data-tag-index]');
  if(tag&&!tag.isContentEditable){
    const index=Number(tag.dataset.tagIndex);
    toggleTagHighlight(index);
    document.querySelector(`#slide [data-tag-index="${index}"]`)?.focus({preventScroll:true});
    return;
  }
  const btn=e.target.closest('button');
  if(!btn)return;
  if(btn.dataset.selectUpload){document.querySelector(`[data-upload="${btn.dataset.selectUpload}"]`)?.click();return;}
  if(btn.dataset.camera){takePicture(btn.dataset.camera,btn);return;}
  if(btn.dataset.tab){changeTab(btn.dataset.tab);return;}
  if(btn.dataset.theme){data.theme=btn.dataset.theme;renderForm();renderSlide();markDirty();return;}
  if(btn.dataset.reset){data[btn.dataset.reset]=defaults[btn.dataset.reset];renderForm();renderSlide();markDirty();return;}
  if(btn.hasAttribute('data-add-tag')){data.tags.push('กลุ่มเป้าหมายใหม่');data.tagHighlights.push(false);renderForm();renderSlide();markDirty();return;}
  if(btn.dataset.tagDelete!==undefined){if(data.tags.length<=1){toast('ต้องมีอย่างน้อย 1 แท็ก');return;}const i=Number(btn.dataset.tagDelete);data.tags.splice(i,1);data.tagHighlights.splice(i,1);renderForm();renderSlide();markDirty();return;}
  if(btn.dataset.tagHighlight!==undefined){toggleTagHighlight(Number(btn.dataset.tagHighlight));return;}
  if(btn.hasAttribute('data-auto-fit')){const length=fields.reduce((sum,[key])=>sum+String(data[key]).length,0)+data.points.length+data.caveats.length;data.density=length>850?'ultracompact':length>550?'compact':'normal';renderForm();renderSlide();markDirty();toast('จัดข้อความให้พอดีแล้ว');return;}
  if(btn.hasAttribute('data-print'))preparePrint();
});
document.addEventListener('change',async e=>{
  if(e.target.dataset.check){data[e.target.dataset.check]=e.target.checked;markDirty();renderSlide();return;}
  const key=e.target.dataset.upload;
  if(!key)return;
  const file=e.target.files[0];
  if(!file)return;
  try{await useImage(key,file);}catch{toast('อ่านไฟล์รูปไม่สำเร็จ กรุณาลองอีกครั้ง');}
});document.querySelector('#save').addEventListener('click',save);
document.querySelector('#tip-media').onclick=()=>{changeTab('media');document.querySelector('.mobile-view').value='edit';document.querySelector('.workspace').dataset.view='edit';};
document.querySelector('.mobile-view').addEventListener('ionChange',e=>{document.querySelector('.workspace').dataset.view=e.detail.value;requestAnimationFrame(fitSlide);});
document.querySelector('#expand').onclick=()=>{document.querySelector('.workspace').classList.toggle('expanded');document.querySelector('#expand span').textContent=document.querySelector('.workspace').classList.contains('expanded')?'กลับไปแก้ไข':'ขยายตัวอย่าง';requestAnimationFrame(fitSlide);};
document.querySelector('#print-slide').onclick=preparePrint;
const dialog=document.querySelector('#export-dialog');document.querySelector('#export').onclick=()=>{const error=validateData(data);if(error){toast(error);return;}dialog.showModal();};document.querySelector('#close-dialog').onclick=()=>dialog.close();
async function exportSlide(format){
  const status=document.querySelector('#export-status');
  status.textContent='กำลังเตรียมไฟล์…';
  dialog.querySelectorAll('[data-format]').forEach(button=>button.disabled=true);
  let clone;
  try{
    if(format==='pptx'){
      await exportEditablePptx(data,fields);
    }else{
      await document.fonts.ready;
      const {toPng}=await import('html-to-image');
      const source=document.querySelector('#slide');
      clone=source.cloneNode(true);
      clone.removeAttribute('id');
      clone.classList.add('export-slide');
      Object.assign(clone.style,{visibility:'visible',transform:'none',position:'fixed',left:'-20000px',top:'0',width:'1200px',height:source.style.height});
      document.body.append(clone);
      const height=clone.scrollHeight;
      const png=await toPng(clone,{pixelRatio:2,backgroundColor:'#ffffff',width:1200,height,style:{inset:'auto',insetInline:'auto',insetBlock:'auto',position:'static'}});
      const a=document.createElement('a');a.href=png;a.download=data.title+'.png';a.click();
    }
    status.textContent='ส่งออกเรียบร้อยแล้ว';
  }catch(error){console.error(error);status.textContent='ส่งออกไม่สำเร็จ กรุณาลองอีกครั้ง';}
  finally{clone?.remove();dialog.querySelectorAll('[data-format]').forEach(button=>button.disabled=false);}
}
dialog.querySelectorAll('[data-format]').forEach(b=>b.onclick=()=>exportSlide(b.dataset.format));
const inlineEditor = createInlineEditor({
  data, fields, fitSlide, toast,
  markDirty: () => { document.querySelector('#save-status').textContent = 'ยังไม่ได้บันทึก'; },
});
renderForm();renderSlide();document.fonts.ready.then(fitSlide);



