import { getStatusTone } from '../../utils/sensorStatus';

export default function FloatMpuPanelCard({ height, gForce, status, xAxis, yAxis, zAxis }) {
  const tone = getStatusTone(status);
  return <article className="panel-card"><div className="card-heading"><div className="card-title-row"><div className="card-icon">↕</div><div><h2 className="card-title">Sensor Pelampung</h2><p className="card-kicker">MPU6050 di pelampung</p></div></div><span className={`status-badge tone-${tone}`}>{status || 'Menunggu data'}</span></div><div className="force-reading"><strong>{Number(gForce ?? 0).toFixed(2)}</strong><span>g-force</span></div><div className="water-stat"><span>KETINGGIAN DARI PELAMPUNG</span><strong>{height ?? '—'} <small>cm</small></strong></div><div className="float-axes"><span>X {Number(xAxis ?? 0).toFixed(2)} g</span><span>Y {Number(yAxis ?? 0).toFixed(2)} g</span><span>Z {Number(zAxis ?? 0).toFixed(2)} g</span></div></article>;
}
