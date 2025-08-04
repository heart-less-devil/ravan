// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || (process.env.NODE_ENV === 'development' ?  "http://localhost:3005" : 'https://bioping-backend.onrender.com');
export const ADMIN_API_BASE_URL = process.env.REACT_APP_ADMIN_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3005' : 'https://bioping-backend.onrender.com');

// Fallback URLs for different deployment scenarios
const getBackendURL = () => {
  // Check if we're in development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3005';
  }
  
  // Check for custom environment variable
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  
  // Production fallbacks
  const possibleURLs = [
    'https://bioping-backend.onrender.com',
    'https://ravan-backend.onrender.com',
    'https://bioping-server.onrender.com'
  ];
  
  return possibleURLs[0]; // Use first one as default
};

// Stripe Configuration
export const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_live_51RlErgLf1iznKy11bUQ4zowN63lhfc2ElpXY9stuz1XqzBBJcWHHWzczvSUfVAxkFQiOTFfzaDzD38WMzBKCAlJA00lB6CGJwT';

// Environment check
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

// Debug logging
console.log('🔧 API Configuration Debug:');
console.log('  - NODE_ENV:', process.env.NODE_ENV);
console.log('  - API_BASE_URL:', API_BASE_URL);
console.log('  - REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
console.log('  - isDevelopment:', isDevelopment);
console.log('  - isProduction:', isProduction); 
