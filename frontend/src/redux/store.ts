import { configureStore } from '@reduxjs/toolkit';
import vehicleReducer from './slices/vehicleSlice';
import maintenanceRecordReducer from './slices/maintenanceRecordSlice';
import maintenanceScheduleReducer from './slices/maintenanceScheduleSlice';
import maintenanceStatsReducer from './slices/maintenanceStatsSlice';
import analyticsReducer from './slices/analyticsSlice';
import simulatorReducer from './slices/simulatorSlice';
import trackingReducer from './slices/trackingSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    vehicles: vehicleReducer,
    maintenanceRecords: maintenanceRecordReducer,
    maintenanceSchedules: maintenanceScheduleReducer, 
    maintenanceStats: maintenanceStatsReducer,
    analytics: analyticsReducer,
    simulator: simulatorReducer,
    tracking: trackingReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 