const http = require('http');

// Test admin access
const testAdminAccess = async () => {
  console.log('🔍 Testing Admin Access...\n');

  // First, let's test if we can get users without authentication
  const testUsersEndpoint = () => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3005,
        path: '/api/admin/users',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          console.log('📊 Users Endpoint Test:');
          console.log(`Status: ${res.statusCode}`);
          console.log(`Response: ${data}`);
          console.log('---');
          resolve();
        });
      });

      req.on('error', (error) => {
        console.error('Error testing users endpoint:', error.message);
        reject(error);
      });

      req.end();
    });
  };

  // Test health endpoint
  const testHealthEndpoint = () => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3005,
        path: '/api/health',
        method: 'GET'
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          console.log('🏥 Health Check:');
          console.log(`Status: ${res.statusCode}`);
          console.log(`Response: ${data}`);
          console.log('---');
          resolve();
        });
      });

      req.on('error', (error) => {
        console.error('Error testing health endpoint:', error.message);
        reject(error);
      });

      req.end();
    });
  };

  try {
    await testHealthEndpoint();
    await testUsersEndpoint();
  } catch (error) {
    console.error('Test failed:', error);
  }
};

testAdminAccess(); 