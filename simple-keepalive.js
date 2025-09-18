const https = require('https');
const http = require('http');
const fs = require('fs');

// Configuration
const CONFIG = {
  websiteUrl: 'https://biopingweb.com', // Your Godaddy website URL
  loginUrl: 'https://biopingweb.com/login', // Your login page URL
  apiHealthUrl: 'https://bioping-backend.onrender.com/api/health', // Your backend health endpoint
  intervalMinutes: 4,
  logFile: 'keepalive.log',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

// Log function
const log = (message) => {
  const timestamp = new Date().toLocaleString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  
  // Save to log file
  try {
    fs.appendFileSync(CONFIG.logFile, logMessage + '\n');
  } catch (error) {
    console.error('Failed to write to log file:', error.message);
  }
};

// Make HTTP request
const makeRequest = (url, options = {}) => {
  return new Promise((resolve) => {
    const start = Date.now();
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'User-Agent': CONFIG.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        ...options.headers
      },
      timeout: 30000
    };
    
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.request(url, requestOptions, (res) => {
      const duration = Date.now() - start;
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          success: true,
          status: res.statusCode,
          duration,
          headers: res.headers,
          data: data.substring(0, 500) // First 500 chars for logging
        });
      });
    });
    
    req.on('error', (err) => {
      const duration = Date.now() - start;
      resolve({
        success: false,
        error: err.message,
        duration
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout',
        duration: Date.now() - start
      });
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
};

// Perform keepalive session
const performKeepalive = async () => {
  try {
    log('🚀 Starting keepalive session...');
    
    // 1. Visit main website
    log(`🌐 Visiting main website: ${CONFIG.websiteUrl}`);
    const mainPageResult = await makeRequest(CONFIG.websiteUrl);
    
    if (mainPageResult.success) {
      log(`✅ Main page loaded - Status: ${mainPageResult.status} - Time: ${mainPageResult.duration}ms`);
    } else {
      log(`❌ Main page failed: ${mainPageResult.error}`);
    }
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. Visit login page
    log(`🔐 Visiting login page: ${CONFIG.loginUrl}`);
    const loginPageResult = await makeRequest(CONFIG.loginUrl);
    
    if (loginPageResult.success) {
      log(`✅ Login page loaded - Status: ${loginPageResult.status} - Time: ${loginPageResult.duration}ms`);
    } else {
      log(`❌ Login page failed: ${loginPageResult.error}`);
    }
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. Test API health endpoint
    log(`🏥 Testing API health: ${CONFIG.apiHealthUrl}`);
    const healthResult = await makeRequest(CONFIG.apiHealthUrl);
    
    if (healthResult.success) {
      log(`✅ API health check - Status: ${healthResult.status} - Time: ${healthResult.duration}ms`);
    } else {
      log(`❌ API health failed: ${healthResult.error}`);
    }
    
    // 4. Visit some other pages to simulate user activity
    const additionalPages = [
      '/about',
      '/contact',
      '/pricing',
      '/resources'
    ];
    
    for (const page of additionalPages) {
      const pageUrl = `${CONFIG.websiteUrl}${page}`;
      log(`📄 Visiting: ${pageUrl}`);
      
      const pageResult = await makeRequest(pageUrl);
      if (pageResult.success) {
        log(`✅ ${page} loaded - Status: ${pageResult.status} - Time: ${pageResult.duration}ms`);
      } else {
        log(`❌ ${page} failed: ${pageResult.error}`);
      }
      
      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    log('✅ Keepalive session completed successfully!');
    
  } catch (error) {
    log(`❌ Error during keepalive: ${error.message}`);
  }
};

// Main execution
const main = async () => {
  log('🎯 Starting Automated Keepalive System');
  log(`🌐 Website: ${CONFIG.websiteUrl}`);
  log(`🔐 Login Page: ${CONFIG.loginUrl}`);
  log(`🏥 API Health: ${CONFIG.apiHealthUrl}`);
  log(`⏰ Interval: Every ${CONFIG.intervalMinutes} minutes`);
  log('=' .repeat(60));
  
  // First run
  await performKeepalive();
  
  // Set up interval
  const intervalMs = CONFIG.intervalMinutes * 60 * 1000;
  log(`🔄 Setting up interval: ${CONFIG.intervalMinutes} minutes (${intervalMs}ms)`);
  
  setInterval(async () => {
    log(`\n🔄 Running scheduled keepalive at ${new Date().toLocaleString()}`);
    await performKeepalive();
  }, intervalMs);
  
  log(`✅ Keepalive system active. Next run in ${CONFIG.intervalMinutes} minutes.`);
  log('Press Ctrl+C to stop.\n');
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('🛑 Shutting down keepalive system...');
  process.exit(0);
});

// Run the system
main().catch(error => {
  log(`💥 Fatal error: ${error.message}`);
  process.exit(1);
});
