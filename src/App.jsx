import DashboardHeader from './components/dashboard/DashboardHeader';
import EarthquakePanelCard from './components/ui/EarthquakePanelCard';
import MasterAlertCard from './components/ui/MasterAlertCard';
import WaterLevelPanelCard from './components/ui/WaterLevelPanelCard';
import { useSensorData } from './hooks/useSensorData';
import './App.css';

export default function App() {
  const { sensorData, connectionState, lastSyncedAt } = useSensorData('node_01');
  const { masterAlert = {}, mpu6050 = {}, waterLevel = {}, deviceInfo = {} } = sensorData ?? {};

  return <main className="dashboard-shell"><section className="dashboard" aria-label="Dashboard mitigasi bencana">
    <DashboardHeader deviceInfo={deviceInfo} connectionState={connectionState} lastSyncedAt={lastSyncedAt} />
    {sensorData ? <><div className="dashboard-grid"><MasterAlertCard {...masterAlert} /><EarthquakePanelCard {...mpu6050} /><WaterLevelPanelCard {...waterLevel} /></div></> : <section className="panel-card" aria-live="polite">{connectionState === 'empty' ? 'Data untuk sensors/node_01 belum tersedia di RTDB.' : 'Menunggu data real-time dari RTDB...'}</section>}
  </section></main>;
}
