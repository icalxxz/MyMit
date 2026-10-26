import { useCallback, useEffect, useRef, useState } from 'react';

const isSupported = () => typeof window !== 'undefined' && 'Notification' in window;

export function useDangerNotification(dangerSources) {
  const [permission, setPermission] = useState(() => isSupported() ? Notification.permission : 'unsupported');
  const [alert, setAlert] = useState(null);
  const wasDanger = useRef(false);
  const sourcesRef = useRef(dangerSources);
  const sourceKey = dangerSources.map(({ label, status }) => `${label}:${status}`).join('|');

  useEffect(() => {
    sourcesRef.current = dangerSources;
  }, [dangerSources]);

  const notify = useCallback((sources) => {
    const labels = sources.map(({ label }) => label).join(', ');
    setAlert({ title: 'Peringatan bahaya', message: `${labels} mendeteksi kondisi bahaya. Segera ikuti prosedur mitigasi.` });
    if (isSupported() && Notification.permission === 'granted') {
      new Notification('⚠️ Peringatan Bahaya', { body: `${labels} mendeteksi kondisi bahaya.`, tag: 'disaster-danger-alert', renotify: true });
    }
  }, []);

  useEffect(() => {
    const hasDanger = dangerSources.length > 0;
    if (hasDanger && !wasDanger.current) notify(dangerSources);
    wasDanger.current = hasDanger;
  }, [sourceKey, dangerSources, notify]);

  const enableNotifications = useCallback(async () => {
    if (!isSupported()) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted' && sourcesRef.current.length) notify(sourcesRef.current);
  }, [notify]);

  return { permission, alert, dismissAlert: () => setAlert(null), enableNotifications, supported: isSupported() };
}
