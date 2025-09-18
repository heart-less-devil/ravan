// API Configuration with fallback URLs - FIXED FOR LIVE DEPLOYMENT
const getApiUrl = () => {
  // Check if we're on the live website (GoDaddy or Netlify)
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('thebioping.com')) {
      return 'https://ravan-8n0h.onrender.com';
    }
    if (window.location.hostname.includes('netlify.app')) {
      return 'https://ravan-8n0h.onrender.com';
    }
  }
  
  // Custom environment variable (highest priority)
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  
  // Development - use localhost first, then fallback
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3005';
  }
  
  // Production fallbacks - use the correct Render backend
  return 'https://ravan-8n0h.onrender.com';
};

export const API_BASE_URL = getApiUrl();
export const ADMIN_API_BASE_URL = getApiUrl();

// Fallback URLs for different deployment scenarios - UNIFIED CONFIG
const getBackendURL = () => {
  // Use the same logic as getApiUrl for consistency
  return getApiUrl();
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
