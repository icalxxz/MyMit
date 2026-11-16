import { getStatusTone } from '../../utils/sensorStatus';

function measurement(value, digits = 1) {
  if (value === undefined || value === null || value === '') return '—';
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : '—';
}

export default function WaterLevelPanelCard({ waterLevel = {}, floatMpu = {} }) {
  const hasDistance = waterLevel.jsnDistance !== undefined && waterLevel.jsnDistance !== null;
  const hasFloat = floatMpu.available !== false && (floatMpu.gForceDeviation !== undefined || floatMpu.xAxis !== undefined || floatMpu.yAxis !== undefined || floatMpu.zAxis !== undefined);
  const complete = hasDistance && hasFloat;
  const valid = waterLevel.valid !== false && floatMpu.available !== false;
  const tones = [waterLevel.status, floatMpu.status].filter(Boolean).map(getStatusTone);
  const tone = !valid || !complete ? 'watch' : tones.includes('danger') ? 'danger' : tones.includes('watch') ? 'watch' : 'safe';
  const label = !valid ? 'Periksa sensor' : !complete ? 'Data belum lengkap' : tone === 'danger' ? 'Bahaya' : tone === 'watch' ? 'Waspada' : 'Normal';
  const message = !valid ? 'Periksa sensor sebelum mengambil keputusan.' : !complete ? 'Data sensor belum lengkap.' : tone === 'danger' ? 'Ikuti prosedur mitigasi.' : tone === 'watch' ? 'Perlu pemeriksaan dan pemantauan.' : 'Kedua sensor melaporkan kondisi normal.';

  return <article className="panel-card combined-water-card">
    <div className="card-heading"><div className="card-title-row"><div className="card-icon">↕</div><div><h2 className="card-title">Pemantauan Air Gabungan</h2><p className="card-kicker">JSN-SR04T · MPU pelampung</p></div></div><span className={`status-badge tone-${tone}`}>{label}</span></div>
    <div className="combined-readings">
      <div className="water-stat"><span>JARAK PERMUKAAN AIR</span><strong>{measurement(waterLevel.jsnDistance)} <small>cm</small></strong><small>JSN-SR04T</small></div>
      <div className="water-stat"><span>LAJU PERUBAHAN</span><strong>{measurement(waterLevel.deltaRateCmPerMin, 2)} <small>cm/menit</small></strong><small>JSN-SR04T</small></div>
      <div className="water-stat"><span>GERAKAN PELAMPUNG</span><strong>{hasFloat ? measurement(floatMpu.gForceDeviation, 2) : '—'} <small>g</small></strong><small>MPU pelampung</small></div>
    </div>
    <div className={`combined-guidance tone-${tone}`} role="status">{message}</div>
  </article>;
}
