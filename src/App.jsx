import DashboardHeader from './components/dashboard/DashboardHeader';
import EarthquakePanelCard from './components/ui/EarthquakePanelCard';
import MasterAlertCard from './components/ui/MasterAlertCard';
import WaterLevelPanelCard from './components/ui/WaterLevelPanelCard';
import { useSensorData } from './hooks/useSensorData';
import { useDangerNotification } from './hooks/useDangerNotification';
import { getStatusTone } from './utils/sensorStatus';
import SafetyStatusCard from './components/ui/SafetyStatusCard';
import FloatMpuPanelCard from './components/ui/FloatMpuPanelCard';
import SensorHistoryCard from './components/ui/SensorHistoryCard';
import './App.css';

export default function App() {
  const { sensorData, activeNodeId, history, connectionState, lastSyncedAt } = useSensorData();
  const { masterAlert = {}, mpu6050 = {}, floatMpu: floatMpuNode = {}, mpu6050Float = {}, waterLevel = {}, rain = {}, deviceInfo = {} } = sensorData ?? {};
  const floatMpu = { ...mpu6050Float, ...floatMpuNode, height: floatMpuNode.height ?? mpu6050Float.height ?? waterLevel.floatHeight ?? waterLevel.mpuHeight };
  const groundMotion = Number(mpu6050.gForce ?? 0) >= Number(mpu6050.warningThreshold ?? 1.5) || ['watch', 'danger'].includes(getStatusTone(mpu6050.status));
  const sources = [{ status: masterAlert.status }, { status: groundMotion ? 'Waspada' : 'Aman' }, { status: groundMotion ? 'Waspada' : 'Aman' }, { status: rain.status }];
  const dangerSources = sources.filter(({ status }) => getStatusTone(status) === 'danger');
  const activeTone = dangerSources.length ? 'danger' : sources.some(({ status }) => getStatusTone(status) === 'watch') ? 'watch' : 'safe';
  const notifications = useDangerNotification(dangerSources);

  return <main className="dashboard-shell"><section className="dashboard" aria-label="Dashboard mitigasi bencana">
    <DashboardHeader deviceInfo={deviceInfo} activeNodeId={activeNodeId} connectionState={connectionState} lastSyncedAt={lastSyncedAt} />
    {sensorData ? <><div className="dashboard-grid"><MasterAlertCard {...masterAlert} /><EarthquakePanelCard {...mpu6050} /><FloatMpuPanelCard {...floatMpu} /><WaterLevelPanelCard {...waterLevel} floatHeight={floatMpu.height} mpuHeight={waterLevel.mpuHeight} jsnHeight={waterLevel.jsnHeight} mpuStatus={mpu6050.status} mpuGForce={mpu6050.gForce} mpuThreshold={mpu6050.warningThreshold} status={groundMotion ? 'Waspada' : 'Normal'} /><RainParameterCard {...rain} /><SafetyStatusCard activeTone={activeTone} permission={notifications.permission} supported={notifications.supported} onEnableNotifications={notifications.enableNotifications} /><SensorHistoryCard records={history} /></div>
      {notifications.alert && <div className="danger-toast" role="alert"><span>!</span><div><strong>{notifications.alert.title}</strong><p>{notifications.alert.message}</p></div><button type="button" onClick={notifications.dismissAlert} aria-label="Tutup notifikasi">×</button></div>}</> : <section className="panel-card" aria-live="polite">{connectionState === 'empty' ? 'Belum ada node bernomor di sensors RTDB.' : 'Menunggu data real-time dari RTDB...'}</section>}
  </section></main>;
}

function RainParameterCard({ detected, isRaining, rate, value, intensity, unit = 'mm/jam', status }) {
  const amount = Number(rate ?? value ?? intensity ?? 0);
  const rainy = detected ?? isRaining ?? (status ? getStatusTone(status) !== 'safe' : amount > 0);
  const rainStatus = status || (rainy ? 'Hujan' : 'Tidak hujan');
  const tone = getStatusTone(rainStatus);
  return <article className="panel-card"><div className="card-heading"><div className="card-title-row"><div className="card-icon">☂</div><div><h2 className="card-title">Parameter Hujan</h2><p className="card-kicker">Sensor hujan</p></div></div><span className={`status-badge tone-${tone}`}>{rainStatus}</span></div><div className="rain-reading"><strong>{amount}</strong><span>{unit}</span></div><p className="rain-caption">Data pembacaan sensor real-time</p></article>;
}
