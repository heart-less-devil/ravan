const https = require('https');
const http = require('http');

// 24/7 Keepalive System - Can run on any server/hosting
const CONFIG = {
  targets: [
    // Your websites
    'https://biopingweb.com',
    'https://biopingweb.com/about',
    'https://biopingweb.com/contact',
    'https://biopingweb.com/pricing',
    'https://biopingweb.com/resources',
    
    // Your backend APIs
    'https://bioping-backend.onrender.com/api/health',
    'https://bioping-backend.onrender.com/api/auth/login',
    'https://ravan-backend.onrender.com/api/health',
    'https://bioping-server.onrender.com/api/health'
  ],
  intervalMinutes: 4,
  userAgent: 'BioPing-24-7-Keepalive/1.0'
};

// Make HTTP request
const makeRequest = (url) => {
  return new Promise((resolve) => {
    const start = Date.now();
    
    const requestOptions = {
      method: 'GET',
      headers: {
        'User-Agent': CONFIG.userAgent,
        'Accept': 'text/html,application/json,*/*',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 30000
    };
    
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.request(url, requestOptions, (res) => {
      const duration = Date.now() - start;
      resolve({
        success: true,
        status: res.statusCode,
        duration,
        url
      });
    });
    
    req.on('error', (err) => {
      const duration = Date.now() - start;
      resolve({
        success: false,
        error: err.message,
        duration,
        url
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout',
        duration: Date.now() - start,
        url
      });
    });
    
    req.end();
  });
};

// Perform keepalive cycle
const performKeepalive = async () => {
  const timestamp = new Date().toLocaleString();
  console.log(`\n🔄 [${timestamp}] Starting 24/7 Keepalive Cycle...`);
  
  const results = [];
  
  // Visit all targets
  for (const target of CONFIG.targets) {
    try {
      const result = await makeRequest(target);
      results.push(result);
      
      if (result.success) {
        console.log(`✅ ${target} - Status: ${result.status} - Time: ${result.duration}ms`);
      } else {
        console.log(`❌ ${target} - Error: ${result.error} - Time: ${result.duration}ms`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`💥 ${target} - Fatal Error: ${error.message}`);
      results.push({ success: false, error: error.message, url: target });
    }
  }
  
  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n📊 [${timestamp}] Keepalive Cycle Summary:`);
  console.log(`✅ Successful: ${successful}/${CONFIG.targets.length}`);
  console.log(`❌ Failed: ${failed}/${CONFIG.targets.length}`);
  console.log(`🔄 Next cycle in ${CONFIG.intervalMinutes} minutes`);
  console.log(`🌐 Total targets: ${CONFIG.targets.length}`);
  
  return results;
};

// Main execution
const main = async () => {
  console.log('🚀 24/7 BioPing Keepalive System Starting...');
  console.log(`⏰ Interval: Every ${CONFIG.intervalMinutes} minutes`);
  console.log(`🎯 Targets: ${CONFIG.targets.length} endpoints`);
  console.log(`🌐 Primary: https://biopingweb.com (Godaddy)`);
  console.log(`🏥 Backend: https://bioping-backend.onrender.com (Render)`);
  console.log('=' .repeat(80));
  
  // First run
  await performKeepalive();
  
  // Set up interval
  const intervalMs = CONFIG.intervalMinutes * 60 * 1000;
  console.log(`\n✅ 24/7 Keepalive System Active!`);
  console.log(`🔄 Running every ${CONFIG.intervalMinutes} minutes (${intervalMs}ms)`);
  console.log(`📅 Started at: ${new Date().toLocaleString()}`);
  console.log(`🎯 This system will keep your services alive 24/7!`);
  console.log(`\nPress Ctrl+C to stop (but don't stop it!)`);
  
  // Run every 4 minutes
  setInterval(async () => {
    await performKeepalive();
  }, intervalMs);
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 24/7 Keepalive System Shutting Down...');
  console.log('⚠️  Warning: Stopping this will stop your services from staying alive!');
  process.exit(0);
});

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error.message);
  console.log('🔄 Restarting keepalive cycle...');
  // Continue running despite errors
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection:', reason);
  console.log('🔄 Continuing keepalive system...');
  // Continue running despite errors
});

// Start the system
main().catch(error => {
  console.error('💥 Fatal Error Starting 24/7 Keepalive:', error.message);
  console.log('🔄 Attempting to restart in 30 seconds...');
  
  setTimeout(() => {
    main().catch(err => {
      console.error('💥 Failed to restart:', err.message);
      process.exit(1);
    });
  }, 30000);
});
