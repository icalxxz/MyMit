import { useEffect, useState } from 'react';
import { get, onValue, ref } from 'firebase/database';
import sensorJson from '../../data.json';
import { hasFirebaseConfig, rtdb, sensorPath } from '../firebase/firebase';

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

function isSensorRecord(value) {
  if (!value || typeof value !== 'object') return false;
  return ['deviceInfo', 'masterAlert', 'waterLevel', 'rain', 'sw420', 'floatMpu', 'mpu6050']
    .some((key) => Object.hasOwn(value, key));
}

function selectSensorRecord(value) {
  // Mendukung path yang menunjuk langsung ke data sebuah node, misalnya
  // /sensors/node_01, selain struktur koleksi seperti isi data.json.
  if (isSensorRecord(value)) return { id: sensorPath, data: value };
  const directNode = newestNode(value);
  if (directNode) return directNode;

  // Saat JSON diimpor ke root RTDB, data dapat berada di /node_01.
  // Bila memakai struktur /sensors/node_01, root RTDB berisi properti sensors.
  return newestNode(value?.sensors);
}

/** Mengikuti semua sensors di RTDB, lalu menampilkan node bernomor terbaru. */
export function useSensorData() {
  const localNode = newestNode(sensorJson);
  // Tampilkan data.json lebih dahulu agar dashboard tetap berguna saat RTDB
  // belum tersambung. Snapshot Firebase akan menggantikan data ini saat ada.
  const [sensorData, setSensorData] = useState(localNode?.data ?? null);
  const [activeNodeId, setActiveNodeId] = useState(localNode?.id ?? null);
  const [connectionState, setConnectionState] = useState(hasFirebaseConfig ? 'connecting' : 'local');
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  useEffect(() => {
    if (!hasFirebaseConfig || !rtdb) return undefined;
    const sensorsRef = sensorPath ? ref(rtdb, sensorPath) : ref(rtdb);
    let active = true;
    let isConnected = false;
    let syncRequest = 0;
    let unsubscribeRootFallback;

    const useLocalFallback = () => {
      if (localNode) {
        setSensorData(localNode.data);
        setActiveNodeId(localNode.id);
        setConnectionState('fallback');
        return;
      }
      setSensorData(null);
      setActiveNodeId(null);
      setConnectionState('empty');
    };

    const applySelectedRecord = (selected, fromServer = false) => {
      if (!selected) return false;
      setSensorData(selected.data);
      setActiveNodeId(selected.id);
      if (fromServer && isConnected) {
        setLastSyncedAt(new Date());
        setConnectionState('live');
      }
      return true;
    };

    const subscribeRootFallback = () => {
      if (unsubscribeRootFallback || sensorPath === '') return;
      // Fallback ini menangani impor data.json persis di root RTDB:
      // { "node_01": { ... } }, tanpa perlu memindahkannya ke /sensors.
      unsubscribeRootFallback = onValue(ref(rtdb), snapshot => {
        if (!active) return;
        const selected = selectSensorRecord(snapshot.val());
        if (!applySelectedRecord(selected, isConnected)) useLocalFallback();
      }, () => {
        if (active) useLocalFallback();
      });
    };

    const applySnapshot = (snapshot, fromServer = false) => {
      if (!active) return;
      const selected = selectSensorRecord(snapshot.val());
      if (!selected) {
        subscribeRootFallback();
        useLocalFallback();
        return;
      }
      applySelectedRecord(selected, fromServer);
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
      unsubscribeRootFallback?.();
    };
  }, []);

  return { sensorData, activeNodeId, connectionState, lastSyncedAt };
}
