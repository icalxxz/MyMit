import { useEffect, useState } from 'react';
import { get, onValue, ref } from 'firebase/database';
import { rtdb } from '../firebase/firebase';

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

function collectHistory(nodes, activeId) {
  return Object.entries(nodes || {}).flatMap(([nodeId, nodeData]) => {
    if (!nodeData || typeof nodeData !== 'object' || nodeNumber(nodeId) === null) return [];
    const records = Object.entries(nodeData).filter(([key, value]) => /^data[_-]?\d+$/i.test(key) && value && typeof value === 'object');
    const candidates = records.length ? records.map(([recordId, data]) => ({
      id: `${nodeId}/${recordId}`, nodeId, recordId, data,
      order: Number(recordId.match(/\d+/)?.[0]) || 0,
    })) : [{ id: nodeId, nodeId, recordId: null, data: nodeData, order: 0 }];
    return candidates.filter(record => record.id !== activeId);
  }).sort((a, b) => nodeNumber(b.nodeId) - nodeNumber(a.nodeId) || b.order - a.order);
}

/** Mengikuti semua sensors di RTDB, lalu menampilkan node bernomor terbaru. */
export function useSensorData() {
  const [sensorData, setSensorData] = useState(null);
  const [activeNodeId, setActiveNodeId] = useState(null);
  const [history, setHistory] = useState([]);
  const [connectionState, setConnectionState] = useState('connecting');
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  useEffect(() => {
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
        setHistory([]);
        setConnectionState('empty');
        return;
      }
      setSensorData(selected.data);
      setActiveNodeId(selected.id);
      setHistory(collectHistory(snapshot.val(), selected.id));
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

  return { sensorData, activeNodeId, history, connectionState, lastSyncedAt };
}
