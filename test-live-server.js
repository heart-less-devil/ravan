const fetch = require('node-fetch');

async function testLiveServer() {
  console.log('🔍 Testing Live Server Status...\n');
  
  const baseUrls = [
    'https://bioping-backend.onrender.com',
    'https://ravan-backend.onrender.com', 
    'https://bioping-server.onrender.com'
  ];
  
  for (const baseUrl of baseUrls) {
    console.log(`📡 Testing: ${baseUrl}`);
    
    try {
      // Test health endpoint
      const healthResponse = await fetch(`${baseUrl}/api/health`);
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log(`✅ Health Check: ${healthData.status}`);
        console.log(`   Environment: ${healthData.environment}`);
        console.log(`   MongoDB: ${healthData.mongoDB}`);
        console.log(`   PDF Files: ${healthData.pdfFiles}`);
        
        // Test login endpoint
        const loginData = {
          email: 'amankk0007@gmail.com',
          password: 'Wildboy07@'
        };
        
        const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(loginData)
        });
        
        if (loginResponse.ok) {
          const loginResult = await loginResponse.json();
          console.log(`✅ Login Test: SUCCESS`);
          console.log(`   User: ${loginResult.user.name}`);
          console.log(`   Token: ${loginResult.token ? 'Present' : 'Missing'}`);
        } else {
          const errorData = await loginResponse.json();
          console.log(`❌ Login Test: FAILED`);
          console.log(`   Error: ${errorData.message || 'Unknown error'}`);
        }
        
      } else {
        console.log(`❌ Health Check: FAILED (${healthResponse.status})`);
      }
      
    } catch (error) {
      console.log(`❌ Connection Error: ${error.message}`);
    }
    
    console.log('---\n');
  }
}

testLiveServer().catch(console.error);