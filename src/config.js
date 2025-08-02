// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || (process.env.NODE_ENV === 'development' ?  "http://localhost:3005" : 'https://bioping-backend.onrender.com');
export const ADMIN_API_BASE_URL = process.env.REACT_APP_ADMIN_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3005' : 'https://bioping-backend.onrender.com');

// Stripe Configuration
export const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_live_51RlErgLf1iznKy11bUQ4zowN63lhfc2ElpXY9stuz1XqzBBJcWHHWzczvSUfVAxkFQiOTFfzaDzD38WMzBKCAlJA00lB6CGJwT';

// Environment check
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production'; 
