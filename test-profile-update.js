const http = require('http');

// Test profile update endpoint
const testProfileUpdate = async () => {
  console.log('🧪 Testing Profile Update Endpoint...\n');

  const testData = {
    name: 'Test User Updated',
    company: 'Test Company Updated'
  };

  const postData = JSON.stringify(testData);

  const options = {
    hostname: 'localhost',
    port: 3005,
    path: '/api/auth/update-profile',
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Authorization': 'Bearer your-test-token' // Replace with actual token
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('📊 Profile Update Test:');
      console.log(`Status: ${res.statusCode}`);
      console.log(`Response: ${data}`);
      console.log('---');
    });
  });

  req.on('error', (error) => {
    console.error('Error testing profile update:', error.message);
  });

  req.write(postData);
  req.end();
};

testProfileUpdate(); 