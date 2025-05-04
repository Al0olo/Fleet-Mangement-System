import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MaintenanceScheduleForm from './MaintenanceScheduleForm';

const MaintenanceScheduleEditForm = () => {
  const { id } = useParams<{ id: string }>();
  
  // Simply render the MaintenanceScheduleForm which already handles both create and edit modes
  return <MaintenanceScheduleForm />;
};

export default MaintenanceScheduleEditForm; 