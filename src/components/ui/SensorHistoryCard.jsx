import { getStatusTone } from '../../utils/sensorStatus';

const formatHeight = record => record.data?.waterLevel?.jsnHeight ?? record.data?.waterLevel?.height ?? record.data?.floatMpu?.height ?? '—';
const formatRain = record => {
  const rain = record.data?.rain;
  if (!rain) return '—';
  return `${rain.rate ?? rain.value ?? 0} ${rain.unit || 'mm/jam'}`;
};

export default function SensorHistoryCard({ records = [] }) {
  const recent = records.slice(0, 6);
  return <article className="panel-card history-card"><div className="card-heading"><div className="card-title-row"><div className="card-icon">↺</div><div><h2 className="card-title">Riwayat Data Sensor</h2><p className="card-kicker">Ringkasan pembacaan RTDB sebelumnya</p></div></div><span className="status-badge tone-safe">{records.length} rekaman</span></div>
    {recent.length ? <div className="history-list">{recent.map(record => {
      const data = record.data || {};
      const status = data.masterAlert?.status ?? data.waterLevel?.status ?? 'Tersimpan';
      return <div className="history-item" key={record.id}><div className="history-item-heading"><strong>Node {record.nodeId.replace(/^node[_-]?/i, '')}</strong><span>{record.recordId || 'rekaman'}</span></div><div className="history-summary"><span>Air <b>{formatHeight(record)} cm</b></span><span>Hujan <b>{formatRain(record)}</b></span><span>MPU darat <b>{Number(data.mpu6050?.gForce ?? 0).toFixed(2)} g</b></span></div><span className={`status-badge tone-${getStatusTone(status)}`}>{status}</span></div>;
    })}</div> : <p className="history-empty">Belum ada rekaman sebelumnya pada RTDB.</p>}
  </article>;
}
