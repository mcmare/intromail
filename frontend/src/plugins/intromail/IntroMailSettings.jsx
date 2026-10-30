import { useEffect, useState } from 'react';
import { useStore } from '../../store/index.js';
import { loadConfig, readConfig, saveConfig } from './config.js';

const field = { display: 'block', width: '100%', boxSizing: 'border-box', font: 'inherit',
  background: 'var(--bg-primary)', color: 'var(--text-primary)',
  border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px' };

export default function IntroMailSettings() {
  const userId = useStore(state => state.user?.id);
  const [config, setConfig] = useState(() => readConfig(userId));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    setConfig(readConfig(userId));
    loadConfig(userId).then(value => {
      if (mounted) setConfig(value);
    }).catch(error => {
      if (mounted) setStatus({ error: true, message: 'Не удалось загрузить настройки: ' + error.message });
    });
    return () => { mounted = false; };
  }, [userId]);

  const update = (key, value) => { setConfig(old => ({ ...old, [key]: value })); setStatus(null); };

  const submit = async event => {
    event.preventDefault();
    if (!userId || saving) return;
    setSaving(true); setStatus(null);
    try {
      const saved = await saveConfig(userId, config);
      setConfig(saved);
      setStatus({ error: false, message: 'Настройки сохранены' });
    } catch (error) {
      setStatus({ error: true, message: 'Ошибка сохранения: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} style={{
      border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px',
      background: 'var(--bg-secondary)', marginTop: 16,
    }}>
      <h3 style={{ fontSize: 14, margin: '0 0 6px', color: 'var(--text-primary)' }}>
        IntroMail — приветствие в начале письма
      </h3>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
        Приветствие вставляется при открытии редактора, а не при отправке.
        Его можно изменить или удалить прямо в письме. Сохранённые черновики не изменяются.
      </p>
      <label htmlFor="intromail-greeting" style={{ fontSize: 12, color: 'var(--text-primary)' }}>
        Текст приветствия
      </label>
      <textarea
        id="intromail-greeting" rows={3} maxLength={1000}
        value={config.text} onChange={event => update('text', event.target.value)}
        style={{ ...field, marginTop: 6, marginBottom: 12, resize: 'vertical' }}
      />
      {[
        ['onNew', 'Добавлять в новые письма'],
        ['onReply', 'Добавлять в ответы'],
        ['onForward', 'Добавлять при пересылке'],
      ].map(([key, label]) => (
        <label key={key} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 12, color: 'var(--text-primary)', marginBottom: 8,
        }}>
          <input type="checkbox" checked={config[key]} onChange={event => update(key, event.target.checked)} />
          {label}
        </label>
      ))}
      <button type="submit" disabled={saving || !userId} style={{
        background: 'var(--accent)', color: 'white', border: 0, borderRadius: 6,
        padding: '8px 14px', marginTop: 4, cursor: saving ? 'default' : 'pointer',
      }}>{saving ? 'Сохранение…' : 'Сохранить'}</button>
      {status && <p role={status.error ? 'alert' : 'status'} style={{
        fontSize: 12, marginTop: 8, marginBottom: 0,
        color: status.error ? 'var(--danger, #d94a4a)' : 'var(--text-secondary)',
      }}>{status.message}</p>}
    </form>
  );
}
