import DashboardHeader from './components/dashboard/DashboardHeader';
import EarthquakePanelCard from './components/ui/EarthquakePanelCard';
import MasterAlertCard from './components/ui/MasterAlertCard';
import WaterLevelPanelCard from './components/ui/WaterLevelPanelCard';
import { useSensorData } from './hooks/useSensorData';
import { useDangerNotification } from './hooks/useDangerNotification';
import { getStatusTone } from './utils/sensorStatus';
import SafetyStatusCard from './components/ui/SafetyStatusCard';
import './App.css';

export default function App() {
  const { sensorData, connectionState, lastSyncedAt } = useSensorData('node_01');
  const { masterAlert = {}, mpu6050 = {}, waterLevel = {}, deviceInfo = {} } = sensorData ?? {};
  const sources = [{ label: 'Status utama', status: masterAlert.status }, { label: 'Aktivitas seismik', status: mpu6050.status }, { label: 'Muka air', status: waterLevel.status }];
  const dangerSources = sources.filter(({ status }) => getStatusTone(status) === 'danger');
  const activeTone = dangerSources.length ? 'danger' : sources.some(({ status }) => getStatusTone(status) === 'watch') ? 'watch' : 'safe';
  const notifications = useDangerNotification(dangerSources);

  return <main className="dashboard-shell"><section className="dashboard" aria-label="Dashboard mitigasi bencana">
    <DashboardHeader deviceInfo={deviceInfo} connectionState={connectionState} lastSyncedAt={lastSyncedAt} />
    {sensorData ? <><div className="dashboard-grid"><MasterAlertCard {...masterAlert} /><EarthquakePanelCard {...mpu6050} /><WaterLevelPanelCard {...waterLevel} /><SafetyStatusCard activeTone={activeTone} permission={notifications.permission} supported={notifications.supported} onEnableNotifications={notifications.enableNotifications} /></div>
    {notifications.alert && <div className="danger-toast" role="alert"><span>⚠</span><div><strong>{notifications.alert.title}</strong><p>{notifications.alert.message}</p></div><button type="button" onClick={notifications.dismissAlert} aria-label="Tutup notifikasi">×</button></div>}</> : <section className="panel-card" aria-live="polite">{connectionState === 'empty' ? 'Data untuk sensors/node_01 belum tersedia di RTDB.' : 'Menunggu data real-time dari RTDB...'}</section>}
  </section></main>;
}
