import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { rtdb } from '../firebase/firebase';

/** Mendengarkan sensors/{nodeId} secara real-time dari Firebase RTDB. */
export function useSensorData(nodeId) {
  // Nilai dashboard hanya berasal dari snapshot RTDB, bukan data contoh.
  const [sensorData, setSensorData] = useState(null);
  const [connectionState, setConnectionState] = useState('connecting');
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  useEffect(() => {
    const sensorRef = ref(rtdb, `sensors/${nodeId}`);
    const unsubscribeData = onValue(sensorRef, (snapshot) => {
      if (!snapshot.exists()) {
        setSensorData(null);
        setConnectionState('empty');
        return;
      }
      setSensorData(snapshot.val());
      setLastSyncedAt(new Date());
      setConnectionState('live');
    }, () => setConnectionState('offline'));

    const unsubscribeConnection = onValue(ref(rtdb, '.info/connected'), (snapshot) => {
      if (!snapshot.val()) setConnectionState('offline');
    });

    return () => {
      unsubscribeData();
      unsubscribeConnection();
    };
  }, [nodeId]);

  return { sensorData, connectionState, lastSyncedAt };
}
