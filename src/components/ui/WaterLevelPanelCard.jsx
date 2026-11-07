import { getStatusTone } from '../../utils/sensorStatus';

export default function WaterLevelPanelCard({ height, deltaRate, status, jsnHeight, floatHeight, mpuHeight, mpuStatus, mpuGForce, mpuThreshold = 1.5 }) {
  const jsn = Number(jsnHeight ?? height ?? 0);
  const float = Number(floatHeight ?? mpuHeight ?? 0);
  const confirmedMovement = getStatusTone(mpuStatus) === 'watch' || getStatusTone(mpuStatus) === 'danger' || Number(mpuGForce) >= Number(mpuThreshold);
  const combinedHeight = jsnHeight !== undefined && (floatHeight !== undefined || mpuHeight !== undefined) ? (jsn + float) / 2 : jsn;
  const levelStatus = status || (confirmedMovement ? 'Perlu perhatian' : 'Normal');
  const tone = getStatusTone(levelStatus);
  const capacity = Math.min(100, Math.round((combinedHeight / 250) * 100));
  return <article className="panel-card"><div className="card-heading"><div className="card-title-row"><div className="card-icon">≋</div><div><h2 className="card-title">Ketinggian Air Gabungan</h2><p className="card-kicker">JSN-SR04T + MPU6050 pelampung</p></div></div><span className={`status-badge tone-${tone}`}>{levelStatus}</span></div><div className="water-stats"><div className="water-stat"><span>HASIL GABUNGAN</span><strong>{combinedHeight.toFixed(1)} <small>cm</small></strong></div><div className="water-stat"><span>LAJU PERUBAHAN</span><strong>{deltaRate ?? '—'} <small>cm/menit</small></strong></div><div className="water-stat"><span>JSN DARI ATAS</span><strong>{jsn.toFixed(1)} <small>cm</small></strong></div><div className="water-stat"><span>MPU PELAMPUNG</span><strong>{floatHeight ?? mpuHeight ?? '—'} <small>cm</small></strong></div></div><div className="water-scale"><span>{confirmedMovement ? 'Gerakan pelampung terkonfirmasi' : 'Kenaikan JSN saja belum mengonfirmasi tsunami'}</span><span>{capacity}%</span></div><div className="water-track"><div className={`water-fill tone-${tone}`} style={{ width: `${capacity}%` }} /></div></article>;
}
