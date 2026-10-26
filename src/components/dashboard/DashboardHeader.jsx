export default function DashboardHeader({ deviceInfo, connectionState, lastSyncedAt }) {
  const isLive = connectionState === 'live';
  const message = isLive ? 'RTDB tersinkron' : connectionState === 'empty' ? 'Data node belum tersedia' : connectionState === 'offline' ? 'RTDB tidak terhubung' : 'Menghubungkan RTDB...';
  const syncedTime = lastSyncedAt?.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return <header className="app-header"><div><h1 className="app-title">Sistem Mitigasi Bencana</h1></div><div className="header-meta"><div className="live-chip"><i className={`live-dot ${isLive ? 'is-live' : ''}`} /><span>{message}</span>{syncedTime && <small>· {syncedTime}</small>}</div><div className="device-chip"><strong>{deviceInfo.deviceId}</strong><span>Wi-Fi - {deviceInfo.rssi} dBm</span></div></div></header>;
}
