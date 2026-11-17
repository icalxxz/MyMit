import { useEffect, useMemo, useRef, useState } from 'react';
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

const SAMPLE_LIMIT = 10;

// Serialisasi stabil mencegah snapshot RTDB yang sama dihitung dua kali saat
// koneksi tersambung ulang.
function stableSerialize(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(',')}}`;
}

function averageSamples(samples) {
  const latest = samples.at(-1);

  const averageValue = (latestValue, values) => {
    if (typeof latestValue === 'number' && Number.isFinite(latestValue)) {
      const numericValues = values.filter(value => typeof value === 'number' && Number.isFinite(value));
      return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
    }
    if (!latestValue || typeof latestValue !== 'object' || Array.isArray(latestValue)) return latestValue;

    return Object.fromEntries(Object.keys(latestValue).map(key => [
      key,
      averageValue(latestValue[key], values.map(value => value?.[key])),
    ]));
  };

  return averageValue(latest, samples);
}

/** Mengikuti semua sensors di RTDB, lalu menampilkan node bernomor terbaru. */
export function useSensorData() {
  const localNode = useMemo(() => newestNode(sensorJson), []);
  // Tampilkan data.json lebih dahulu agar dashboard tetap berguna saat RTDB
  // belum tersambung. Snapshot Firebase akan menggantikan data ini saat ada.
  const [sensorData, setSensorData] = useState(localNode?.data ?? null);
  const [activeNodeId, setActiveNodeId] = useState(localNode?.id ?? null);
  const [connectionState, setConnectionState] = useState(hasFirebaseConfig ? 'connecting' : 'local');
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [sampleCount, setSampleCount] = useState(0);
  const samplesRef = useRef([]);
  const sampleSourceRef = useRef(null);
  const lastSampleKeyRef = useRef(null);

  useEffect(() => {
    if (!hasFirebaseConfig || !rtdb) return undefined;
    const sensorsRef = sensorPath ? ref(rtdb, sensorPath) : ref(rtdb);
    let active = true;
    let isConnected = false;
    let syncRequest = 0;
    let unsubscribeRootFallback;

    const applyLocalFallback = () => {
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

    const addSample = selected => {
      // data_01, data_02, dan seterusnya berasal dari node yang sama. Saat
      // node berganti, sampel perangkat sebelumnya tidak boleh tercampur.
      const sourceId = selected.id.split('/')[0];
      const sampleKey = `${selected.id}:${stableSerialize(selected.data)}`;
      if (sampleSourceRef.current !== sourceId) {
        sampleSourceRef.current = sourceId;
        samplesRef.current = [];
        lastSampleKeyRef.current = null;
      }
      if (lastSampleKeyRef.current === sampleKey) return averageSamples(samplesRef.current);

      lastSampleKeyRef.current = sampleKey;
      samplesRef.current = [...samplesRef.current, selected.data].slice(-SAMPLE_LIMIT);
      setSampleCount(samplesRef.current.length);
      return averageSamples(samplesRef.current);
    };

    const applySelectedRecord = (selected, fromServer = false) => {
      if (!selected) return false;
      // Data lokal hanya sebagai cadangan; buffer berisi pembaruan RTDB.
      setSensorData(fromServer ? addSample(selected) : selected.data);
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
        if (!applySelectedRecord(selected, isConnected)) applyLocalFallback();
      }, () => {
        if (active) applyLocalFallback();
      });
    };

    const applySnapshot = (snapshot, fromServer = false) => {
      if (!active) return;
      const selected = selectSensorRecord(snapshot.val());
      if (!selected) {
        subscribeRootFallback();
        applyLocalFallback();
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
  }, [localNode]);

  return { sensorData, activeNodeId, connectionState, lastSyncedAt, sampleCount };
}
