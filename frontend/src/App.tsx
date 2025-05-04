import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import VehicleList from './pages/VehicleList';
import VehicleDetail from './pages/VehicleDetail';
import Maintenance from './pages/Maintenance';
import Analytics from './pages/Analytics';
import Simulator from './pages/Simulator';
import Layout from './components/Layout';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="vehicles" element={<VehicleList />} />
        <Route path="vehicles/:id" element={<VehicleDetail />} />
        <Route path="maintenance" element={<Maintenance />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="simulator" element={<Simulator />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App; 