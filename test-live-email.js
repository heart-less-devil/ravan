const https = require('https');

// Test the live email functionality
const testData = JSON.stringify({
  email: 'universalx0242@gmail.com'
});

const options = {
  hostname: 'bioping-backend.onrender.com',
  port: 443,
  path: '/api/auth/forgot-password',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': testData.length
  }
};

console.log('🧪 Testing live email functionality...');
console.log('📧 Sending password reset request to: universalx0242@gmail.com');

const req = https.request(options, (res) => {
  console.log(`📊 Status Code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📧 Response:', data);
    
    try {
      const response = JSON.parse(data);
      if (response.success) {
        console.log('✅ Email functionality is working on live website!');
        if (response.verificationCode) {
          console.log('🔑 Verification Code:', response.verificationCode);
        }
      } else {
        console.log('❌ Email functionality failed:', response.message);
      }
    } catch (e) {
      console.log('❌ Error parsing response:', e.message);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error);
});

req.write(testData);
req.end();
