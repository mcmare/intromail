// Cached per-user for synchronous compose initialization. Server plugin_data is authoritative.
export const DEFAULT_CONFIG = Object.freeze({
  text: 'Добрый день коллеги,',
  onNew: true,
  onReply: false,
  onForward: false,
});

const MAX = 1000;

export function normalizeConfig(value) {
  return {
    text: typeof value?.text === 'string' ? value.text.slice(0, MAX) : DEFAULT_CONFIG.text,
    onNew: typeof value?.onNew === 'boolean' ? value.onNew : DEFAULT_CONFIG.onNew,
    onReply: typeof value?.onReply === 'boolean' ? value.onReply : DEFAULT_CONFIG.onReply,
    onForward: typeof value?.onForward === 'boolean' ? value.onForward : DEFAULT_CONFIG.onForward,
  };
}

function storageKey(userId) {
  return 'mailflow_intromail_v1_' + userId;
}

export function readConfig(userId) {
  if (!userId) return { ...DEFAULT_CONFIG };
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? normalizeConfig(JSON.parse(raw)) : { ...DEFAULT_CONFIG };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function cacheConfig(userId, value) {
  const config = normalizeConfig(value);
  if (!userId) return config;
  try { localStorage.setItem(storageKey(userId), JSON.stringify(config)); } catch { /* storage blocked */ }
  return config;
}

async function callApi(method, config) {
  const response = await fetch('/api/intromail/config', {
    method,
    credentials: 'include',
    headers: {
      'X-Requested-With': 'MailFlow',
      ...(config ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(config ? { body: JSON.stringify({ config }) } : {}),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'IntroMail request failed (' + response.status + ')');
  }
  return (await response.json()).config;
}

export async function loadConfig(userId) {
  const config = normalizeConfig(await callApi('GET'));
  return cacheConfig(userId, config);
}

export async function saveConfig(userId, value) {
  const config = normalizeConfig(await callApi('PUT', normalizeConfig(value)));
  return cacheConfig(userId, config);
}
