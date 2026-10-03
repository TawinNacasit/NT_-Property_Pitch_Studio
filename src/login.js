import '@fontsource/prompt/thai-400.css';
import '@fontsource/prompt/thai-600.css';
import '@fontsource/prompt/latin-400.css';
import '@fontsource/prompt/latin-600.css';
import '@fontsource/sarabun/thai-400.css';
import './style.css';
import './login.css';
import { firstLogin } from './property-api.js';
import { readLoginContext, saveLoginContext, clearLoginContext, validCdgId, setInitialProperty } from './login-context.js';

const root = document.querySelector('#app');
const base = (import.meta.env.VITE_API_BASE_URL || '/profile-estate').replace(/\/$/, '');
const sessionKey = 'nt-studio-session';
const loginContext = readLoginContext();
let token;
try { token = sessionStorage.getItem(sessionKey); } catch {}

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, { ...options, signal: AbortSignal.timeout(15000) });
  if (response.status === 401 || response.status === 403) throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หรือบัญชีไม่มีสิทธิ์เข้าใช้งาน');
  if (response.status === 429) throw new Error('เข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่แล้วลองอีกครั้ง');
  if (!response.ok) throw new Error('ไม่สามารถเข้าสู่ระบบได้ กรุณาลองอีกครั้ง หรือติดต่อผู้ดูแลระบบ');
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('ยังไม่สามารถเชื่อมต่อระบบเข้าสู่ระบบได้ กรุณาติดต่อผู้ดูแลระบบ');
  const result = await response.json();
  if (result.success === false) throw new Error('ไม่สามารถเข้าสู่ระบบได้ กรุณาตรวจสอบบัญชี หรือติดต่อผู้ดูแลระบบ');
  return result;
}

async function openStudio() {
  await import('./main.js');
  document.title = 'NT Property Studio — สร้างสไลด์นำเสนอทรัพย์สิน';
  const logout = document.createElement('button');
  logout.className = 'logout-button';
  logout.textContent = 'ออกจากระบบ';
  logout.onclick = () => { try { sessionStorage.removeItem(sessionKey); clearLoginContext(); } catch {} location.replace('/login'); };
  document.querySelector('.header-right').append(logout);
  const url = new URL(location.href);
  url.searchParams.delete('username');
  url.searchParams.delete('cdg_id');
  if (url.pathname === '/login') url.pathname = '/';
  history.replaceState(null, '', url.pathname + url.search + url.hash);
}

function renderLogin(message = '') {
  document.title = 'เข้าสู่ระบบ | NT Property Studio';
  root.innerHTML = `
    <main class="login-page">
      <section class="login-story" aria-label="NT Property Studio">
        <a class="brand login-brand" href="/login" aria-label="NT Property Studio"><span class="nt-mark" aria-hidden="true"><b></b><b></b><b></b></span><strong>nt</strong><span class="brand-divider"></span><span>Property Studio<small>บริษัท โทรคมนาคมแห่งชาติ จำกัด (มหาชน)</small></span></a>
        <div class="login-intro"><span class="login-kicker">พื้นที่สร้างโอกาส ให้ทุกทรัพย์สิน</span><h1>เปลี่ยนข้อมูลทรัพย์สิน<br>ให้เป็นโอกาสที่มองเห็น</h1><p>จัดข้อมูลพื้นที่ ถ่ายทอดจุดเด่น และสร้างสไลด์นำเสนอ<br class="desktop-break">ที่พร้อมส่งต่อได้ในที่เดียว</p></div>
        <figure class="login-property"><img src="/assets/building.jpg" alt="ภาพประกอบอาคารและพื้นที่อสังหาริมทรัพย์"><figcaption><span>มองเห็นศักยภาพในทุกพื้นที่</span><span>NT Property Studio</span></figcaption></figure>
        <div class="login-capabilities"><span>ข้อมูลทรัพย์สิน</span><span>สไลด์นำเสนอ 16:9</span><span>ส่งออก PNG / PowerPoint</span></div>
      </section>
      <section class="login-panel" aria-labelledby="login-title">
        <div class="login-form-wrap"><div class="login-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v3"/></svg></div>
          <h2 id="login-title">เข้าสู่ระบบ</h2><p class="login-subtitle">เข้าใช้งานพื้นที่จัดทำสไลด์ทรัพย์สินของคุณ</p>
          <form id="login-form">
            <label class="login-label" for="username">ชื่อผู้ใช้</label><input id="username" name="username" autocomplete="username" placeholder="กรอกชื่อผู้ใช้" required autocapitalize="none" spellcheck="false">
            <label class="login-label area-label" for="cdg_id">รหัสพื้นที่</label><input id="cdg_id" name="cdg_id" inputmode="numeric" pattern="[0-9]+" autocomplete="off" placeholder="กรอกรหัสพื้นที่ เช่น 101" required aria-describedby="area-hint"><p id="area-hint" class="area-hint">รหัสพื้นที่สำหรับดึงข้อมูลทรัพย์สินตั้งต้น</p>
            <div class="password-label"><label class="login-label" for="password">รหัสผ่าน</label><button type="button" class="login-help" id="forgot-password">ลืมรหัสผ่าน?</button></div>
            <div class="password-control"><input id="password" name="password" type="password" autocomplete="current-password" placeholder="กรอกรหัสผ่าน" required><button type="button" id="toggle-password" aria-label="แสดงรหัสผ่าน" aria-pressed="false">แสดง</button></div>
            <p id="login-error" role="alert" hidden></p>
            <button type="submit" class="login-submit">เข้าสู่ระบบ <span aria-hidden="true">→</span></button>
          </form>
          <div class="login-access"><strong>ยังไม่มีบัญชีผู้ใช้งาน?</strong><p>กรุณาติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์เข้าใช้งาน</p></div>
          <p id="login-support" class="login-support" role="status" hidden>หากลืมรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบของหน่วยงานเพื่อขอรีเซ็ตรหัสผ่าน</p>
        </div>
        <footer class="login-footer">บริษัท โทรคมนาคมแห่งชาติ จำกัด (มหาชน)<br><span>NT Property Studio</span></footer>
      </section>
    </main>`;
  const form = document.querySelector('#login-form');
  form.elements.username.value = loginContext.username;
  form.elements.cdg_id.value = loginContext.cdgId;
  const password = document.querySelector('#password');
  const error = document.querySelector('#login-error');
  const submit = document.querySelector('.login-submit');
  const showError = text => { error.textContent = text; error.hidden = false; };
  if (message) showError(message);
  document.querySelector('#toggle-password').onclick = event => {
    const visible = password.type === 'password';
    password.type = visible ? 'text' : 'password';
    event.currentTarget.textContent = visible ? 'ซ่อน' : 'แสดง';
    event.currentTarget.setAttribute('aria-label', visible ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน');
    event.currentTarget.setAttribute('aria-pressed', String(visible));
  };
  document.querySelector('#forgot-password').onclick = () => { document.querySelector('#login-support').hidden = false; };
  form.onsubmit = async event => {
    event.preventDefault();
    if (submit.disabled) return;
    const username = form.elements.username.value.trim();
    if (!username) { showError('กรุณากรอกชื่อผู้ใช้'); form.elements.username.focus(); return; }
    const cdgId = form.elements.cdg_id.value.trim();
    if (!validCdgId(cdgId)) { showError('กรุณากรอกรหัสพื้นที่เป็นตัวเลขจำนวนเต็ม'); form.elements.cdg_id.focus(); return; }
    error.hidden = true;
    submit.disabled = true;
    submit.textContent = 'กำลังเข้าสู่ระบบ…';
    form.setAttribute('aria-busy', 'true');
    try {
      const result = await request('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password: password.value }) });
      const nextToken = result.data?.token ?? result.token;
      if (typeof nextToken !== 'string' || !nextToken.trim()) throw new Error('ข้อมูลการเข้าสู่ระบบไม่สมบูรณ์ กรุณาติดต่อผู้ดูแลระบบ');
      await request('/auth/me', { headers: { Authorization: `Bearer ${nextToken}` } });
      submit.textContent = 'กำลังดึงข้อมูลพื้นที่…';
      const initial = await firstLogin(username, cdgId, nextToken);
      try { saveLoginContext({ username, cdgId }); sessionStorage.setItem(sessionKey, nextToken); } catch { throw new Error('กรุณาอนุญาตการจัดเก็บข้อมูลสำหรับเว็บไซต์นี้ แล้วลองอีกครั้ง'); }
      setInitialProperty(initial);
      password.value = '';
      await openStudio();
    } catch (failure) {
      showError(failure instanceof TypeError || failure.name === 'TimeoutError' ? 'เชื่อมต่อไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง' : failure.message);
    } finally {
      submit.disabled = false;
      submit.innerHTML = 'เข้าสู่ระบบ <span aria-hidden="true">→</span>';
      form.removeAttribute('aria-busy');
    }
  };
}

async function initialize() {
  if (token) {
    root.innerHTML = '<div class="session-loading" role="status">กำลังตรวจสอบการเข้าสู่ระบบ…</div>';
    try {
      await request('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      if (loginContext.username || loginContext.cdgId) {
        if (!loginContext.username || !validCdgId(loginContext.cdgId)) throw new Error('กรุณาตรวจสอบชื่อผู้ใช้และรหัสพื้นที่ที่ส่งมา');
        const initial = await firstLogin(loginContext.username, loginContext.cdgId, token);
        saveLoginContext(loginContext);
        setInitialProperty(initial);
      }
      await openStudio();
    }
    catch (failure) { try { sessionStorage.removeItem(sessionKey); } catch {} renderLogin(failure.message || 'กรุณาเข้าสู่ระบบอีกครั้งเพื่อเข้าใช้งาน'); }
  } else renderLogin();
}

initialize();
