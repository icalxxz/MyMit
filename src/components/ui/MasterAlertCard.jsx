import { getMasterStatus } from '../../utils/sensorStatus';

function formatTimestamp(timestamp) {
  if (!timestamp) return 'Waktu tidak tersedia';
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function MasterAlertCard({ status, timestamp }) {
  const config = getMasterStatus(status);
  const label = status || 'Status tidak tersedia';
  return <article className="panel-card">
    <div className="card-heading"><div className="card-title-row"><div className="card-icon">⚑</div><div><h2 className="card-title">Peringatan Utama</h2><p className="card-kicker">Status dari master alert</p></div></div><span className={`status-badge tone-${config.tone}`}>{label}</span></div>
    <div className="master-state"><span className="state-label">KONDISI TERKINI</span><strong className="state-value">{config.label}</strong><p className="state-description">{config.description}</p></div>
    <footer className="card-footer">Diperbarui: {formatTimestamp(timestamp)}</footer>
  </article>;
}
