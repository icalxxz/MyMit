import { getStatusTone } from '../../utils/sensorStatus';

const axes = [{ key: 'xAxis', label: 'X' }, { key: 'yAxis', label: 'Y' }, { key: 'zAxis', label: 'Z' }];

export default function EarthquakePanelCard({ gForce, status, xAxis, yAxis, zAxis, sensorType, vibrationDetected }) {
  if (sensorType === 'SW-420') {
    return <article className="panel-card"><div className="card-heading"><div className="card-title-row"><div className="card-icon">⌁</div><div><h2 className="card-title">Aktivitas Getaran</h2><p className="card-kicker">Sensor SW-420</p></div></div><span className={`status-badge tone-${getStatusTone(status)}`}>{status}</span></div><div className="force-reading"><strong>{vibrationDetected ? 'Terdeteksi' : 'Tidak ada'}</strong><span>getaran</span></div></article>;
  }

  const values = { xAxis, yAxis, zAxis };
  return <article className="panel-card"><div className="card-heading"><div className="card-title-row"><div className="card-icon">⌁</div><div><h2 className="card-title">Aktivitas Seismik</h2><p className="card-kicker">Sensor MPU6050</p></div></div><span className={`status-badge tone-${getStatusTone(status)}`}>{status}</span></div><div className="force-reading"><strong>{Number(gForce ?? 0).toFixed(2)}</strong><span>g-force</span></div><div className="axis-list">{axes.map(({ key, label }) => { const value = Number(values[key] ?? 0); return <div className="axis-item" key={key}><span className="axis-name">{label}</span><div className="axis-track"><div className="axis-fill" style={{ width: `${Math.min(100, Math.abs(value) * 100)}%` }} /></div><span>{value.toFixed(2)} g</span></div>; })}</div></article>;
}
