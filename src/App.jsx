import DashboardHeader from './components/dashboard/DashboardHeader';
import EarthquakePanelCard from './components/ui/EarthquakePanelCard';
import MasterAlertCard from './components/ui/MasterAlertCard';
import WaterLevelPanelCard from './components/ui/WaterLevelPanelCard';
import { useSensorData } from './hooks/useSensorData';
import { useDangerNotification } from './hooks/useDangerNotification';
import { getStatusTone } from './utils/sensorStatus';
import SafetyStatusCard from './components/ui/SafetyStatusCard';
import './App.css';

// Ambang awal untuk modul hujan pada ADC 12-bit ESP32; perlu dikalibrasi dengan perangkat.
const RAIN_ADC_THRESHOLDS = { heavy: 1000, moderate: 2200, light: 3000 };

export default function App() {
  const { sensorData, activeNodeId, connectionState, lastSyncedAt } = useSensorData();
  const { masterAlert = {}, mpu6050, sw420 = {}, floatMpu = {}, waterLevel = {}, rain = {}, deviceInfo = {} } = sensorData ?? {};
  const vibrationSensor = mpu6050 ?? {
    ...sw420,
    sensorType: 'SW-420',
    status: sw420.vibrationDetected ? 'Waspada' : sw420.status ?? 'Tidak tersedia',
  };
  const motionWarning = vibrationSensor.vibrationDetected || ['watch', 'danger'].includes(getStatusTone(vibrationSensor.status));
  const rainWarning = rain.detected === true || getStatusTone(rain.status) === 'watch';
  const sources = [{ status: masterAlert.status }, { status: motionWarning ? 'Waspada' : 'Aman' }, { status: rainWarning ? 'Waspada' : 'Aman' }];
  const dangerSources = sources.filter(({ status }) => getStatusTone(status) === 'danger');
  const activeTone = dangerSources.length ? 'danger' : sources.some(({ status }) => getStatusTone(status) === 'watch') ? 'watch' : 'safe';
  const notifications = useDangerNotification(dangerSources);
  const rainValue = rain.rawAdc ?? rain.rate ?? rain.value ?? rain.intensity;
  const rainUnit = rain.rawAdc !== undefined ? 'ADC' : rain.unit ?? 'mm/jam';

  return <main className="dashboard-shell"><section className="dashboard" aria-label="Dashboard mitigasi bencana">
    <DashboardHeader deviceInfo={deviceInfo} activeNodeId={activeNodeId} connectionState={connectionState} lastSyncedAt={lastSyncedAt} />
    {sensorData ? <><div className="dashboard-grid">
      <MasterAlertCard {...masterAlert} />
      <EarthquakePanelCard {...vibrationSensor} />
      <WaterLevelPanelCard waterLevel={waterLevel} floatMpu={floatMpu} />
      <RainIntensityCard detected={rain.detected} value={rainValue} unit={rainUnit} status={rain.status} />
      <SafetyStatusCard activeTone={activeTone} permission={notifications.permission} supported={notifications.supported} onEnableNotifications={notifications.enableNotifications} />
    </div>
      {notifications.alert && <div className="danger-toast" role="alert"><span>!</span><div><strong>{notifications.alert.title}</strong><p>{notifications.alert.message}</p></div><button type="button" onClick={notifications.dismissAlert} aria-label="Tutup notifikasi">×</button></div>}
    </> : <section className="panel-card" aria-live="polite">{connectionState === 'empty' ? 'Belum ada data sensor.' : 'Menunggu data sensor...'}</section>}
  </section></main>;
}

function RainIntensityCard({ detected, value, unit, status }) {
  const number = value === undefined || value === null ? null : Number(value);
  const rawAdc = unit === 'ADC' && Number.isFinite(number) ? number : null;
  const intensity = detected === false ? 'Tidak hujan' : rawAdc === null ? status || 'Belum terukur' : rawAdc <= RAIN_ADC_THRESHOLDS.heavy ? 'Lebat' : rawAdc <= RAIN_ADC_THRESHOLDS.moderate ? 'Sedang' : rawAdc <= RAIN_ADC_THRESHOLDS.light ? 'Ringan' : 'Terdeteksi';
  const tone = detected === false ? 'tone-safe' : detected !== true ? 'tone-info' : intensity === 'Lebat' ? 'tone-danger' : intensity === 'Sedang' ? 'tone-watch' : 'tone-info';
  const state = detected === true ? `Hujan ${intensity.toLowerCase()}` : detected === false ? 'Tidak terdeteksi' : status || 'Status tidak tersedia';

  return <article className="panel-card rain-card">
    <div className="card-heading"><div className="card-title-row"><div className="card-icon">☂</div><div><h2 className="card-title">Intensitas Hujan</h2><p className="card-kicker">Sensor hujan</p></div></div><span className={`status-badge ${tone}`}>{state}</span></div>
    <div className="rain-reading"><strong>{intensity}</strong></div>
  </article>;
}
