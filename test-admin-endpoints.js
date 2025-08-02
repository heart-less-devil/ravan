const http = require('http');

// Test admin endpoints
const testEndpoints = async () => {
  const baseUrl = 'http://localhost:3005';
  const adminToken = 'your-admin-token'; // Replace with actual admin token

  const endpoints = [
    '/api/admin/user-activity',
    '/api/admin/trial-data', 
    '/api/admin/potential-customers'
  ];

  for (const endpoint of endpoints) {
    console.log(`Testing ${endpoint}...`);
    
    const options = {
      hostname: 'localhost',
      port: 3005,
      path: endpoint,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}`);
        console.log('---');
      });
    });

    req.on('error', (error) => {
      console.error(`Error testing ${endpoint}:`, error.message);
    });

    req.end();
  }
};

testEndpoints(); 