/**
 * Application-wide configuration options
 */
const config = {
  apiBaseUrl: (import.meta as any).env?.VITE_API_BASE_URL || '/api',
  appName: (import.meta as any).env?.VITE_APP_NAME || 'Fleet Management System',
  
  // API endpoints (in case they change in the future)
  endpoints: {
    vehicles: '/vehicles',
    tracking: '/tracking',
    maintenance: '/maintenance',
    analytics: '/analytics',
    simulator: '/simulator',
  }
};

export default config; 