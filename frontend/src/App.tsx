import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import VehicleList from './pages/VehicleList';
import VehicleDetail from './pages/VehicleDetail';
import VehicleForm from './pages/VehicleForm';
import VehicleEditForm from './pages/VehicleEditForm';
import Maintenance from './pages/Maintenance';
import MaintenanceRecordList from './pages/MaintenanceRecordList';
import MaintenanceScheduleList from './pages/MaintenanceScheduleList';
import MaintenanceRecordForm from './pages/MaintenanceRecordForm';
import MaintenanceScheduleForm from './pages/MaintenanceScheduleForm';
import MaintenanceRecordDetail from './pages/MaintenanceRecordDetail';
import MaintenanceScheduleDetail from './pages/MaintenanceScheduleDetail';
import MaintenanceRecordEditForm from './pages/MaintenanceRecordEditForm';
import MaintenanceScheduleEditForm from './pages/MaintenanceScheduleEditForm';
import Layout from './components/Layout';
import NotFound from './pages/NotFound';
import Analytics from './pages/Analytics';
import Simulator from './pages/Simulator';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        
        {/* Vehicle Routes */}
        <Route path="vehicles" element={<VehicleList />} />
        <Route path="vehicles/new" element={<VehicleForm />} />
        <Route path="vehicles/:id" element={<VehicleDetail />} />
        <Route path="vehicles/:id/edit" element={<VehicleEditForm />} />
        
        {/* Maintenance Routes */}
        <Route path="maintenance" element={<Maintenance />} />
        
        {/* Maintenance Records Routes */}
        <Route path="maintenance/records" element={<MaintenanceRecordList />} />
        <Route path="maintenance/records/new" element={<MaintenanceRecordForm />} />
        <Route path="maintenance/records/:id" element={<MaintenanceRecordDetail />} />
        <Route path="maintenance/records/:id/edit" element={<MaintenanceRecordEditForm />} />
        
        {/* Maintenance Schedules Routes */}
        <Route path="maintenance/schedules" element={<MaintenanceScheduleList />} />
        <Route path="maintenance/schedules/new" element={<MaintenanceScheduleForm />} />
        <Route path="maintenance/schedules/:id" element={<MaintenanceScheduleDetail />} />
        <Route path="maintenance/schedules/:id/edit" element={<MaintenanceScheduleEditForm />} />
        
        {/* Other Routes */}
        <Route path="analytics" element={<Analytics />} />
        <Route path="simulator" element={<Simulator />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App; 