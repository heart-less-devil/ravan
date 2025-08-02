const http = require('http');

// Test the consulting sessions endpoint
const testConsultingEndpoint = () => {
  const options = {
    hostname: 'localhost',
    port: 3005,
    path: '/api/admin/consulting-sessions',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response:', data);
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error.message);
  });

  req.end();
};

// Test the complete session endpoint
const testCompleteSessionEndpoint = () => {
  const options = {
    hostname: 'localhost',
    port: 3005,
    path: '/api/admin/complete-session/1',
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response:', data);
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error.message);
  });

  req.end();
};

console.log('Testing consulting sessions endpoint...');
testConsultingEndpoint();

console.log('\nTesting complete session endpoint...');
testCompleteSessionEndpoint(); 