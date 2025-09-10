import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedAdminRoute = ({ children }) => {
  const token = sessionStorage.getItem('token');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch('/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [token]);
  
  console.log('ProtectedAdminRoute - Token:', !!token);
  console.log('ProtectedAdminRoute - User:', user);
  console.log('ProtectedAdminRoute - User email:', user?.email);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
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
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    return <Navigate to="/login?admin=true" replace />;
  }
  
  console.log('ProtectedAdminRoute - Admin access granted');
  return children;
};

export default ProtectedAdminRoute; 
