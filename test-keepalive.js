const https = require('https');

// Test keepalive endpoints
const endpoints = [
  'https://bioping-backend.onrender.com/api/health',
  'https://ravan-backend.onrender.com/api/health',
  'https://bioping-server.onrender.com/api/health'
];

const testEndpoint = (url) => {
  return new Promise((resolve) => {
    const start = Date.now();
    
    https.get(url, (res) => {
      const duration = Date.now() - start;
      console.log(`✅ ${url} - Status: ${res.statusCode} - Response time: ${duration}ms`);
      resolve({ success: true, status: res.statusCode, duration });
    }).on('error', (err) => {
      const duration = Date.now() - start;
      console.log(`❌ ${url} - Error: ${err.message} - Time: ${duration}ms`);
      resolve({ success: false, error: err.message, duration });
    });
  });
};

const testAllEndpoints = async () => {
  console.log('🔍 Testing Keepalive Endpoints...\n');
  
  const results = [];
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push({ endpoint, ...result });
  }
  
  console.log('\n📊 Summary:');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`🕒 Test completed at: ${new Date().toLocaleString()}`);
  
  if (failed > 0) {
    console.log('\n⚠️ Some endpoints failed. Check if Render services are running.');
  } else {
    console.log('\n🎯 All endpoints working! Keepalive should keep Render awake.');
  }
};

// Run the test
testAllEndpoints();
