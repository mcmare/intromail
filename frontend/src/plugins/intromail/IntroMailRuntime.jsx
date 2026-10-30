import { useEffect } from 'react';
import { useStore } from '../../store/index.js';
import { loadConfig } from './config.js';

// Refresh server-saved settings on login, independently of whether the Settings tab is visited.
export default function IntroMailRuntime() {
  const userId = useStore(state => state.user?.id);
  useEffect(() => {
    if (!userId) return;
    loadConfig(userId).catch(error => {
      console.warn('IntroMail settings sync failed:', error.message);
    });
  }, [userId]);
  return null;
}
