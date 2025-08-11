import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedAdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  console.log('ProtectedAdminRoute - Token:', !!token);
  console.log('ProtectedAdminRoute - User:', user);
  console.log('ProtectedAdminRoute - User email:', user.email);
  

  
  // Check if user is logged in
  if (!token) {
    console.log('ProtectedAdminRoute - No token, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  
  // Check if user is admin (multiple admin emails)
  const adminEmails = [
    'universalx0242@gmail.com',
    'admin@bioping.com',
    'your-email@gmail.com' // Add your email here
  ];
  
  if (!adminEmails.includes(user.email)) {
    console.log('ProtectedAdminRoute - Not admin, redirecting to login with admin message');
    // If not admin, redirect to login with admin message
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login?admin=true" replace />;
  }
  
  console.log('ProtectedAdminRoute - Admin access granted');
  return children;
};

export default ProtectedAdminRoute; 