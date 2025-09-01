const https = require('https');
const http = require('http');
const fs = require('fs');

// Configuration
const CONFIG = {
  websiteUrl: 'https://biopingweb.com', // Your Godaddy website URL
  loginUrl: 'https://bioping-backend.onrender.com/api/auth/login', // Your actual login API endpoint
  logoutUrl: 'https://bioping-backend.onrender.com/api/auth/logout', // Your actual logout API endpoint
  apiHealthUrl: 'https://bioping-backend.onrender.com/api/health',
  loginEmail: 'amankk0007@gmail.com',
  loginPassword: 'Wildboy07@', // Actual password for amankk0007@gmail.com
  intervalMinutes: 4,
  logFile: 'keepalive.log',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

// Log function
const log = (message) => {
  const timestamp = new Date().toLocaleString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  
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
        'Accept': 'application/json, text/html, */*',
        'Content-Type': options.body ? 'application/json' : 'text/html',
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
          data: data.substring(0, 500)
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

// Perform login
const performLogin = async () => {
  try {
    log('🔐 Attempting to login...');
    
    const loginData = {
      email: CONFIG.loginEmail,
      password: CONFIG.loginPassword
    };
    
    const loginResult = await makeRequest(CONFIG.loginUrl, {
      method: 'POST',
      body: JSON.stringify(loginData)
    });
    
    if (loginResult.success && loginResult.status === 200) {
      log(`✅ Login successful - Status: ${loginResult.status} - Time: ${loginResult.duration}ms`);
      
      // Extract token from response if needed
      try {
        const responseData = JSON.parse(loginResult.data);
        if (responseData.token) {
          log('🎫 Authentication token received');
          return responseData.token;
        }
      } catch (e) {
        log('⚠️ Could not parse login response, but login appears successful');
      }
      
      return 'logged_in';
    } else {
      log(`❌ Login failed - Status: ${loginResult.status} - Error: ${loginResult.error || 'Unknown error'}`);
      return null;
    }
    
  } catch (error) {
    log(`❌ Login error: ${error.message}`);
    return null;
  }
};

// Perform logout
const performLogout = async (token) => {
  try {
    log('🚪 Attempting to logout...');
    
    const headers = {};
    if (token && token !== 'logged_in') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const logoutResult = await makeRequest(CONFIG.logoutUrl, {
      method: 'POST',
      headers
    });
    
    if (logoutResult.success && logoutResult.status === 200) {
      log(`✅ Logout successful - Status: ${logoutResult.status} - Time: ${logoutResult.duration}ms`);
      return true;
    } else {
      log(`⚠️ Logout failed - Status: ${logoutResult.status} - Error: ${logoutResult.error || 'Unknown error'}`);
      return false;
    }
    
  } catch (error) {
    log(`❌ Logout error: ${error.message}`);
    return false;
  }
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
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. Perform login
    const loginToken = await performLogin();
    
    if (loginToken) {
      log('✅ User logged in successfully');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 3. Visit dashboard or protected pages while logged in
      log('📊 Visiting protected pages while logged in...');
      
      const protectedPages = [
        '/dashboard',
        '/profile',
        '/admin-panel'
      ];
      
      for (const page of protectedPages) {
        const pageUrl = `${CONFIG.websiteUrl}${page}`;
        log(`📄 Visiting protected page: ${pageUrl}`);
        
        const pageResult = await makeRequest(pageUrl);
        if (pageResult.success) {
          log(`✅ ${page} loaded - Status: ${pageResult.status} - Time: ${pageResult.duration}ms`);
        } else {
          log(`❌ ${page} failed: ${pageResult.error}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // 4. Perform logout
      await performLogout(loginToken);
      
    } else {
      log('⚠️ Login failed, continuing with public pages only');
    }
    
    // 5. Test API health endpoint
    log(`🏥 Testing API health: ${CONFIG.apiHealthUrl}`);
    const healthResult = await makeRequest(CONFIG.apiHealthUrl);
    
    if (healthResult.success) {
      log(`✅ API health check - Status: ${healthResult.status} - Time: ${healthResult.duration}ms`);
    } else {
      log(`❌ API health failed: ${healthResult.error}`);
    }
    
    // 6. Visit public pages
    log('📄 Visiting public pages...');
    const publicPages = [
      '/about',
      '/contact',
      '/pricing',
      '/resources',
      '/how-it-works'
    ];
    
    for (const page of publicPages) {
      const pageUrl = `${CONFIG.websiteUrl}${page}`;
      log(`📄 Visiting: ${pageUrl}`);
      
      const pageResult = await makeRequest(pageUrl);
      if (pageResult.success) {
        log(`✅ ${page} loaded - Status: ${pageResult.status} - Time: ${pageResult.duration}ms`);
      } else {
        log(`❌ ${page} failed: ${pageResult.error}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    log('✅ Keepalive session completed successfully!');
    
  } catch (error) {
    log(`❌ Error during keepalive: ${error.message}`);
  }
};

// Main execution
const main = async () => {
  log('🎯 Starting Automated Login/Logout Keepalive System');
  log(`📧 Login Email: ${CONFIG.loginEmail}`);
  log(`🌐 Website: ${CONFIG.websiteUrl}`);
  log(`🔐 Login API: ${CONFIG.loginUrl}`);
  log(`🚪 Logout API: ${CONFIG.logoutUrl}`);
  log(`⏰ Interval: Every ${CONFIG.intervalMinutes} minutes`);
  log('=' .repeat(70));
  
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
