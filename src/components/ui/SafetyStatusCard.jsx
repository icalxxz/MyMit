export default function SafetyStatusCard({ activeTone, permission, supported, onEnableNotifications }) {
  const notificationsEnabled = permission === 'granted';
  const label = activeTone === 'danger' ? 'Bahaya' : activeTone === 'watch' ? 'Waspada' : 'Aman';
  const guidance = activeTone === 'danger' ? 'Segera ikuti prosedur mitigasi.' : activeTone === 'watch' ? 'Pantau kondisi dan pembacaan sensor.' : 'Kondisi sensor dalam batas normal.';

  return <article className="panel-card safety-card">
    <div className="card-heading"><div className="card-title-row"><div className="card-icon">◉</div><div><h2 className="card-title">Status Keselamatan</h2><p className="card-kicker">Ringkasan peringatan sensor</p></div></div><span className={`status-badge tone-${activeTone}`}>{label}</span></div>
    <p className="safety-guidance">{guidance}</p>
    <div className="notification-control">
      <div><strong>Notifikasi</strong><span>{notificationsEnabled ? 'Aktif' : supported ? 'Nonaktif' : 'Tidak tersedia'}</span></div>
      {supported && !notificationsEnabled && permission !== 'denied' && <button type="button" onClick={onEnableNotifications}>Aktifkan</button>}
      {supported && permission === 'denied' && <span>Izin ditolak</span>}
      {notificationsEnabled && <span className="notification-enabled">Aktif</span>}
    </div>
  </article>;
}
