// API Configuration with fallback URLs - URGENT REBUILD REQUIRED
const getApiUrl = () => {
  // Check if we're on the live website
  if (typeof window !== 'undefined' && window.location.hostname.includes('thebioping.com')) {
    return 'https://bioping-backend.onrender.com';
  }
  
  // Development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3005';
  }
  
  // Custom environment variable
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  
  // Production fallbacks - try multiple servers
  const productionUrls = [
    'https://bioping-backend.onrender.com',
    'https://thebioping.com',
    'https://www.thebioping.com',
    'https://ravan-8n0h.onrender.com',
    'https://ravan-backend.onrender.com',
    'https://bioping-server.onrender.com'
  ];
  
  return productionUrls[0]; // Use your correct backend as default
};

export const API_BASE_URL = getApiUrl();
export const ADMIN_API_BASE_URL = getApiUrl();

// Fallback URLs for different deployment scenarios
const getBackendURL = () => {
  // Check if we're on the live website
  if (typeof window !== 'undefined' && window.location.hostname.includes('thebioping.com')) {
    return 'https://bioping-backend.onrender.com';
  }
  
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
    'https://thebioping.com',
    'https://www.thebioping.com',
    'https://ravan-8n0h.onrender.com',
    'https://ravan-backend.onrender.com',
    'https://bioping-server.onrender.com'
  ];
  
  return possibleURLs[0]; // Use your correct backend as default
};

// Stripe Configuration with better error handling
const getStripeKey = () => {
  const key = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
  
  if (!key) {
    console.error('❌ REACT_APP_STRIPE_PUBLISHABLE_KEY is not set in environment variables');
    console.error('🔧 Please create a .env file with: REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here');
    return null;
  }
  
  if (key.includes('your_stripe_publishable_key_here') || key.includes('your_key_here')) {
    console.error('❌ Stripe key is still using placeholder value');
    console.error('🔧 Please replace with your actual Stripe publishable key');
    return null;
  }
  
  if (!key.startsWith('pk_test_') && !key.startsWith('pk_live_')) {
    console.error('❌ Invalid Stripe publishable key format');
    console.error('🔧 Stripe keys should start with pk_test_ or pk_live_');
    return null;
  }
  
  console.log('✅ Valid Stripe publishable key found');
  return key;
};

export const STRIPE_PUBLISHABLE_KEY = getStripeKey();

// Environment check
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

// Debug logging - URGENT FIX
console.log('🚨 URGENT API Configuration Debug:');
console.log('  - NODE_ENV:', process.env.NODE_ENV);
console.log('  - API_BASE_URL:', API_BASE_URL);
console.log('  - REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
console.log('  - isDevelopment:', isDevelopment);
console.log('  - isProduction:', isProduction);
console.log('  - Hostname:', typeof window !== 'undefined' ? window.location.hostname : 'server-side');
console.log('  - Timestamp:', new Date().toISOString()); 
