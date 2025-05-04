import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  sidebarOpen: boolean;
  alerts: {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  }[];
}

const initialState: UiState = {
  sidebarOpen: true,
  alerts: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    addAlert: (state, action: PayloadAction<{ type: 'success' | 'error' | 'warning' | 'info'; message: string }>) => {
      const id = new Date().getTime().toString();
      state.alerts.push({
        id,
        ...action.payload,
      });
    },
    removeAlert: (state, action: PayloadAction<string>) => {
      state.alerts = state.alerts.filter(alert => alert.id !== action.payload);
    },
  },
});

export const { toggleSidebar, setSidebarOpen, addAlert, removeAlert } = uiSlice.actions;

export default uiSlice.reducer; 