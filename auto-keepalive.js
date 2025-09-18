const puppeteer = require('puppeteer');
const fs = require('fs');

// Configuration
const CONFIG = {
  websiteUrl: 'http://localhost:3000', // Change this to your live website URL
  loginEmail: 'amankk0007@gmail.com',
  loginPassword: 'your_password_here', // Replace with actual password
  intervalMinutes: 4,
  headless: false, // Set to true for production (no browser window)
  logFile: 'keepalive.log'
};

// Log function
const log = (message) => {
  const timestamp = new Date().toLocaleString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  
  // Save to log file
  fs.appendFileSync(CONFIG.logFile, logMessage + '\n');
};

// Main keepalive function
const performKeepalive = async () => {
  let browser;
  
  try {
    log('🚀 Starting automated keepalive session...');
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: CONFIG.headless,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Navigate to website
    log(`🌐 Navigating to: ${CONFIG.websiteUrl}`);
    await page.goto(CONFIG.websiteUrl, { waitUntil: 'networkidle2' });
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Look for login button/link
    log('🔍 Looking for login button...');
    
    // Try different selectors for login button
    const loginSelectors = [
      'a[href*="login"]',
      'a[href*="Login"]',
      'button:contains("Login")',
      'button:contains("Sign In")',
      '[data-testid="login-button"]',
      '.login-btn',
      '#login-button'
    ];
    
    let loginButton = null;
    for (const selector of loginSelectors) {
      try {
        loginButton = await page.$(selector);
        if (loginButton) {
          log(`✅ Found login button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!loginButton) {
      // Try to find by text content
      loginButton = await page.$x("//a[contains(text(), 'Login')] | //button[contains(text(), 'Login')]");
      if (loginButton.length > 0) {
        loginButton = loginButton[0];
        log('✅ Found login button by text content');
      }
    }
    
    if (!loginButton) {
      throw new Error('❌ Login button not found');
    }
    
    // Click login button
    log('🖱️ Clicking login button...');
    await loginButton.click();
    
    // Wait for login page to load
    await page.waitForTimeout(2000);
    
    // Fill login form
    log('📝 Filling login form...');
    
    // Wait for email input
    await page.waitForSelector('input[type="email"], input[name="email"], #email', { timeout: 10000 });
    
    // Clear and fill email
    await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"], input[name="email"], #email');
      if (emailInput) emailInput.value = '';
    });
    await page.type('input[type="email"], input[name="email"], #email', CONFIG.loginEmail);
    
    // Wait for password input
    await page.waitForSelector('input[type="password"], input[name="password"], #password', { timeout: 10000 });
    
    // Clear and fill password
    await page.evaluate(() => {
      const passwordInput = document.querySelector('input[type="password"], input[name="password"], #password');
      if (passwordInput) passwordInput.value = '';
    });
    await page.type('input[type="password"], input[name="password"], #password', CONFIG.loginPassword);
    
    // Find and click submit button
    log('🔐 Submitting login form...');
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:contains("Login")',
      'button:contains("Sign In")',
      '.submit-btn',
      '#submit-button'
    ];
    
    let submitButton = null;
    for (const selector of submitSelectors) {
      try {
        submitButton = await page.$(selector);
        if (submitButton) {
          log(`✅ Found submit button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!submitButton) {
      // Try to find by text content
      submitButton = await page.$x("//button[contains(text(), 'Login')] | //button[contains(text(), 'Sign In')] | //input[@type='submit']");
      if (submitButton.length > 0) {
        submitButton = submitButton[0];
        log('✅ Found submit button by text content');
      }
    }
    
    if (!submitButton) {
      throw new Error('❌ Submit button not found');
    }
    
    // Click submit
    await submitButton.click();
    
    // Wait for login to complete
    log('⏳ Waiting for login to complete...');
    await page.waitForTimeout(5000);
    
    // Check if login was successful
    const currentUrl = page.url();
    log(`📍 Current URL after login: ${currentUrl}`);
    
    // Look for logout button or user menu
    log('🔍 Looking for logout button...');
    await page.waitForTimeout(2000);
    
    const logoutSelectors = [
      'a[href*="logout"]',
      'button:contains("Logout")',
      'button:contains("Sign Out")',
      '.logout-btn',
      '#logout-button',
      '[data-testid="logout-button"]'
    ];
    
    let logoutButton = null;
    for (const selector of logoutSelectors) {
      try {
        logoutButton = await page.$(selector);
        if (logoutButton) {
          log(`✅ Found logout button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!logoutButton) {
      // Try to find by text content
      logoutButton = await page.$x("//a[contains(text(), 'Logout')] | //button[contains(text(), 'Logout')] | //button[contains(text(), 'Sign Out')]");
      if (logoutButton.length > 0) {
        logoutButton = logoutButton[0];
        log('✅ Found logout button by text content');
      }
    }
    
    if (logoutButton) {
      // Click logout
      log('🚪 Logging out...');
      await logoutButton.click();
      await page.waitForTimeout(3000);
      log('✅ Logout completed');
    } else {
      log('⚠️ Logout button not found, but continuing...');
    }
    
    log('✅ Keepalive session completed successfully!');
    
  } catch (error) {
    log(`❌ Error during keepalive: ${error.message}`);
    console.error('Full error:', error);
  } finally {
    if (browser) {
      await browser.close();
      log('🔌 Browser closed');
    }
  }
};

// Main execution
const main = async () => {
  log('🎯 Starting Automated Keepalive System');
  log(`📧 Login Email: ${CONFIG.loginEmail}`);
  log(`⏰ Interval: Every ${CONFIG.intervalMinutes} minutes`);
  log(`🌐 Website: ${CONFIG.websiteUrl}`);
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
