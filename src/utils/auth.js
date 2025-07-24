// Auth utilities for better token management
import { API_BASE_URL } from '../config';

export const checkTokenValidity = async () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.ok;
  } catch (error) {
    console.error('Token validation failed:', error);
    return false;
  }
};

export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userCredits');
  localStorage.removeItem('paymentCompleted');
  localStorage.removeItem('userCurrentPlan');
};

export const isUniversalUser = (email) => {
  const universalEmails = [
    'universalx0242@gmail.com',
    'admin@bioping.com',
    'demo@bioping.com',
    'test@bioping.com'
  ];
  return universalEmails.includes(email);
}; 