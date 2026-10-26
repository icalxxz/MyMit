const states = [
  { tone: 'safe', title: 'Aman', copy: 'Parameter berada dalam batas normal.' },
  { tone: 'watch', title: 'Warning', copy: 'Perlu perhatian dan pemantauan.' },
  { tone: 'danger', title: 'Bahaya', copy: 'Segera lakukan prosedur mitigasi.' },
];

export default function SafetyStatusCard({ activeTone, permission, supported, onEnableNotifications }) {
  const notificationsEnabled = permission === 'granted';
  return <article className="panel-card safety-card">
    <div className="card-heading">
      <div className="card-title-row"><div className="card-icon">◉</div><div><h2 className="card-title">Parameter Keselamatan</h2><p className="card-kicker">Indikator status sistem</p></div></div>
      <span className={`status-badge tone-${activeTone}`}>{activeTone === 'danger' ? 'BAHAYA' : activeTone === 'watch' ? 'WARNING' : 'AMAN'}</span>
    </div>
    <div className="safety-states">
      {states.map((state) => <div key={state.tone} className={`safety-state tone-${state.tone} ${activeTone === state.tone ? 'is-active' : ''}`}>
        <i className="safety-dot" /><div><strong>{state.title}</strong><span>{state.copy}</span></div>{activeTone === state.tone && <b>Aktif</b>}
      </div>)}
    </div>
    <div className="notification-control">
      <div><strong>Notifikasi bahaya</strong><span>{notificationsEnabled ? 'Aktif di perangkat ini' : supported ? 'Izinkan agar peringatan terkirim' : 'Browser tidak mendukung notifikasi'}</span></div>
      {supported && !notificationsEnabled && <button type="button" onClick={onEnableNotifications}>Aktifkan</button>}
      {notificationsEnabled && <span className="notification-enabled">Aktif</span>}
    </div>
  </article>;
}
