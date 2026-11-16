import { useEffect, useState } from 'react';
import { get, onValue, ref } from 'firebase/database';
import sensorJson from '../../data.json';
import { hasFirebaseConfig, rtdb } from '../firebase/firebase';

function nodeNumber(key) {
  const match = String(key).match(/^(?:node[_-]?)?(\d+)$/i);
  return match ? Number(match[1]) : null;
}

function newestNode(nodes) {
  const selectedNode = Object.entries(nodes || {})
    .filter(([key, value]) => value && typeof value === 'object' && nodeNumber(key) !== null)
    .sort(([keyA], [keyB]) => nodeNumber(keyB) - nodeNumber(keyA))[0] || null;
  if (!selectedNode) return null;

  const [nodeId, nodeData] = selectedNode;
  // Mendukung struktur RTDB { node_02: { data_01: {...}, data_02: {...} } }
  // dan memilih rekaman bernomor terbaru di dalam node tersebut.
  const latestRecord = Object.entries(nodeData)
    .filter(([key, value]) => /^data[_-]?\d+$/i.test(key) && value && typeof value === 'object')
    .sort(([keyA], [keyB]) => Number(keyB.match(/\d+/)?.[0]) - Number(keyA.match(/\d+/)?.[0]))[0];
  return latestRecord
    ? { id: `${nodeId}/${latestRecord[0]}`, data: latestRecord[1] }
    : { id: nodeId, data: nodeData };
}

/** Mengikuti semua sensors di RTDB, lalu menampilkan node bernomor terbaru. */
export function useSensorData() {
  const localNode = newestNode(sensorJson);
  const [sensorData, setSensorData] = useState(hasFirebaseConfig ? null : localNode?.data ?? null);
  const [activeNodeId, setActiveNodeId] = useState(hasFirebaseConfig ? null : localNode?.id ?? null);
  const [connectionState, setConnectionState] = useState(hasFirebaseConfig ? 'connecting' : 'local');
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  useEffect(() => {
    if (!hasFirebaseConfig || !rtdb) return undefined;
    const sensorsRef = ref(rtdb, 'sensors');
    let active = true;
    let isConnected = false;
    let syncRequest = 0;

    const applySnapshot = (snapshot, fromServer = false) => {
      if (!active) return;
      const selected = newestNode(snapshot.val());
      if (!selected) {
        setSensorData(null);
        setActiveNodeId(null);
        setConnectionState('empty');
        return;
      }
      setSensorData(selected.data);
      setActiveNodeId(selected.id);
      if (fromServer && isConnected) {
        setLastSyncedAt(new Date());
        setConnectionState('live');
      }
    };

    const unsubscribeData = onValue(sensorsRef, snapshot => applySnapshot(snapshot, isConnected), () => {
      if (active) setConnectionState('offline');
    });

    const unsubscribeConnection = onValue(ref(rtdb, '.info/connected'), snapshot => {
      isConnected = snapshot.val() === true;
      if (!isConnected) {
        setConnectionState('offline');
        return;
      }

      const requestId = ++syncRequest;
      setConnectionState('connecting');
      get(sensorsRef).then(snapshot => {
        if (!active || !isConnected || requestId !== syncRequest) return;
        applySnapshot(snapshot, true);
      }).catch(() => {
        if (active && isConnected && requestId === syncRequest) setConnectionState('offline');
      });
    });

    return () => {
      active = false;
      syncRequest += 1;
      unsubscribeData();
      unsubscribeConnection();
    };
  }, []);

  return { sensorData, activeNodeId, connectionState, lastSyncedAt };
}
