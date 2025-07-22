// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
export const ADMIN_API_BASE_URL = process.env.REACT_APP_ADMIN_API_URL || 'http://localhost:3001';

// Environment check
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production'; 