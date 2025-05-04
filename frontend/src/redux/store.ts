import { configureStore } from '@reduxjs/toolkit';
import vehicleReducer from './slices/vehicleSlice';
import maintenanceReducer from './slices/maintenanceSlice';
import analyticsReducer from './slices/analyticsSlice';
import simulatorReducer from './slices/simulatorSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    vehicles: vehicleReducer,
    maintenance: maintenanceReducer,
    analytics: analyticsReducer,
    simulator: simulatorReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 