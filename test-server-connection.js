const fetch = require('node-fetch');

const testServerConnection = async () => {
  const servers = [
    'https://bioping-backend.onrender.com',
    'https://ravan-backend.onrender.com',
    'https://bioping-server.onrender.com',
    'http://localhost:3005'
  ];

  console.log('🔧 Testing server connections...\n');

  for (const server of servers) {
    try {
      console.log(`Testing: ${server}`);
      const response = await fetch(`${server}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${server} - Status: ${data.status}`);
        console.log(`   Server: ${data.server}`);
        console.log(`   Version: ${data.version}`);
        console.log(`   Timestamp: ${data.timestamp}\n`);
      } else {
        console.log(`❌ ${server} - HTTP ${response.status}\n`);
      }
    } catch (error) {
      console.log(`❌ ${server} - Error: ${error.message}\n`);
    }
  }
};

testServerConnection(); 