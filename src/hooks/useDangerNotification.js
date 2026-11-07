import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { useCallback, useEffect, useRef, useState } from 'react';

const isNative = () => Capacitor.isNativePlatform();
const browserNotificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window;

async function getNotificationPermission() {
  if (isNative()) {
    const result = await LocalNotifications.checkPermissions();
    return result.display === 'granted' ? 'granted' : result.display;
  }
  return browserNotificationsSupported() ? Notification.permission : 'unsupported';
}

export function useDangerNotification(dangerSources) {
  const [permission, setPermission] = useState('prompt');
  const [alert, setAlert] = useState(null);
  const [supported] = useState(() => isNative() || browserNotificationsSupported());
  const wasDanger = useRef(null);
  const sourcesRef = useRef(dangerSources);
  const sourceKey = dangerSources.map(({ label, status }) => `${label}:${status}`).join('|');

  useEffect(() => {
    let active = true;
    getNotificationPermission()
      .then((value) => { if (active) setPermission(value); })
      .catch(() => { if (active) setPermission('unavailable'); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    sourcesRef.current = dangerSources;
  }, [dangerSources]);

  const notify = useCallback(async (sources) => {
    const labels = sources.map(({ label }) => label).join(', ');
    const message = `${labels} mendeteksi kondisi bahaya. Segera ikuti prosedur mitigasi.`;
    setAlert({ title: 'Peringatan bahaya', message });

    try {
      if (isNative()) {
        const result = await LocalNotifications.checkPermissions();
        if (result.display === 'granted') {
          await LocalNotifications.schedule({ notifications: [{
            id: 1001,
            title: 'Peringatan bahaya',
            body: `${labels} mendeteksi kondisi bahaya.`,
            channelId: 'danger-alerts',
            extra: { type: 'danger-alert' },
          }] });
        }
      } else if (browserNotificationsSupported() && Notification.permission === 'granted') {
        new Notification('Peringatan bahaya', { body: `${labels} mendeteksi kondisi bahaya.`, tag: 'disaster-danger-alert', renotify: true });
      }
    } catch (error) {
      console.error('Notifikasi bahaya gagal ditampilkan:', error);
    }
  }, []);

  // Establish the first resolved sensor state as a baseline. This avoids a
  // false alert on page load, while still catching danger after data arrives.
  useEffect(() => {
    const hasDanger = dangerSources.length > 0;
    if (wasDanger.current === null) {
      wasDanger.current = dangerSources.length > 0;
      return;
    }
    if (hasDanger && !wasDanger.current) notify(dangerSources);
    wasDanger.current = hasDanger;
  }, [sourceKey, dangerSources, notify]);

  const enableNotifications = useCallback(async () => {
    try {
      let result;
      if (isNative()) {
        result = await LocalNotifications.requestPermissions();
        const granted = result.display === 'granted';
        setPermission(granted ? 'granted' : result.display);
        if (granted && Capacitor.getPlatform() === 'android') {
          await LocalNotifications.createChannel({ id: 'danger-alerts', name: 'Peringatan bahaya', description: 'Peringatan kondisi bahaya sensor', importance: 5, sound: 'default', vibration: true });
        }
        if (granted && sourcesRef.current.length) await notify(sourcesRef.current);
      } else if (browserNotificationsSupported()) {
        result = await Notification.requestPermission();
        setPermission(result);
        if (result === 'granted' && sourcesRef.current.length) await notify(sourcesRef.current);
      } else {
        setPermission('unsupported');
      }
    } catch (error) {
      console.error('Izin notifikasi tidak dapat diminta:', error);
      setPermission('unavailable');
    }
  }, [notify]);

  const dismissAlert = useCallback(() => setAlert(null), []);
  return { permission, alert, dismissAlert, enableNotifications, supported };
}
