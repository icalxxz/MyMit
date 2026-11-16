export default function DashboardHeader({ deviceInfo = {}, connectionState, lastSyncedAt }) {
  const isLive = connectionState === 'live';
  const message = isLive ? 'Sensor terhubung' : connectionState === 'local' ? 'Data sensor tersedia' : connectionState === 'empty' ? 'Data belum tersedia' : connectionState === 'offline' ? 'Koneksi terputus' : 'Menghubungkan sensor...';
  const syncedTime = lastSyncedAt?.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return <header className="app-header"><div><h1 className="app-title">Sistem Mitigasi Bencana</h1></div><div className="header-meta"><div className="live-chip"><i className={`live-dot ${isLive ? 'is-live' : ''}`} /><span>{message}</span>{syncedTime && <small>· {syncedTime}</small>}</div><div className="device-chip"><strong>{deviceInfo.deviceId || 'Perangkat sensor'}</strong>{deviceInfo.rssi !== undefined && <span>Sinyal Wi-Fi: {deviceInfo.rssi} dBm</span>}</div></div></header>;
}
