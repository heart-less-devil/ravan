const https = require('https');
const http = require('http');

console.log('🔍 Debugging Credits Issue...');

// Test API endpoint
const options = {
  hostname: 'localhost',
  port: 3006,
  path: '/api/auth/subscription',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer test-token',
    'Content-Type': 'application/json'
  }
};

console.log('📡 Testing API endpoint...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📊 Response:', data);
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.end();
