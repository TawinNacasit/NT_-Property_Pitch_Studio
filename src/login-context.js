const contextKey = 'nt-studio-login-context';
let initialProperty = null;

export function validCdgId(value) {
  return /^\d+$/.test(value) && Number.isSafeInteger(Number(value));
}

export function readLoginContext() {
  const params = new URLSearchParams(location.search);
  // An explicit redirect takes precedence over the previous tab's area.
  if (params.has('username') || params.has('cdg_id')) {
    return { username: (params.get('username') || '').trim(), cdgId: (params.get('cdg_id') || '').trim() };
  }
  try {
    const saved = JSON.parse(sessionStorage.getItem(contextKey));
    if (typeof saved?.username === 'string' && typeof saved?.cdgId === 'string') return saved;
  } catch {}
  return { username: '', cdgId: '' };
}

export function saveLoginContext(context) { sessionStorage.setItem(contextKey, JSON.stringify(context)); }
export function clearLoginContext() { sessionStorage.removeItem(contextKey); }
export function setInitialProperty(result) { initialProperty = result; }
export function getInitialProperty() { return initialProperty; }
