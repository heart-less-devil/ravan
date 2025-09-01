# 🚀 BioPing Auto Keepalive System

This system will keep your website alive by automatically visiting it every 4 minutes, preventing Render from sleeping.

## 📁 Files Created:

1. **`simple-keepalive.js`** - Main keepalive script
2. **`start-keepalive.bat`** - Windows batch file to start the system
3. **`keepalive-config.json`** - Configuration file
4. **`auto-keepalive.js`** - Advanced version with Puppeteer (requires installation)

## 🎯 How It Works:

1. **Every 4 minutes**, the script will:
   - Visit your main website
   - Visit the login page
   - Test your API health endpoint
   - Visit additional pages (about, contact, pricing, etc.)
   - Simulate real user activity

2. **This keeps your Render service awake** because:
   - Regular HTTP requests prevent auto-sleep
   - Simulates real user traffic
   - Tests multiple endpoints

## 🚀 Quick Start:

### Option 1: Double-click (Easiest)
1. Double-click `start-keepalive.bat`
2. Press any key to start
3. The system will run automatically every 4 minutes

### Option 2: Command Line
```bash
cd D:\ravan
node simple-keepalive.js
```

### Option 3: Advanced (with Puppeteer)
```bash
npm install puppeteer
node auto-keepalive.js
```

## ⚙️ Configuration:

Edit `keepalive-config.json` to customize:

```json
{
  "websiteUrl": "https://your-website.com",
  "intervalMinutes": 4,
  "additionalPages": ["/about", "/contact"],
  "waitBetweenRequests": 2000
}
```

## 📊 What You'll See:

```
[12:00:00] 🎯 Starting Automated Keepalive System
[12:00:00] 🌐 Website: https://biopingweb.netlify.app
[12:00:00] ⏰ Interval: Every 4 minutes
[12:00:00] ============================================================
[12:00:00] 🚀 Starting keepalive session...
[12:00:00] 🌐 Visiting main website: https://biopingweb.netlify.app
[12:00:02] ✅ Main page loaded - Status: 200 - Time: 1500ms
[12:00:04] 🔐 Visiting login page: https://biopingweb.netlify.app/login
[12:00:06] ✅ Login page loaded - Status: 200 - Time: 1200ms
[12:00:08] 🏥 Testing API health: https://bioping-backend.onrender.com/api/health
[12:00:10] ✅ API health check - Status: 200 - Time: 800ms
[12:00:11] 📄 Visiting: https://biopingweb.netlify.app/about
[12:00:12] ✅ /about loaded - Status: 200 - Time: 900ms
[12:00:13] ✅ Keepalive session completed successfully!
[12:00:13] 🔄 Next run in 4 minutes
```

## 🔧 Customization:

### Change Website URL:
Edit `keepalive-config.json`:
```json
{
  "websiteUrl": "https://your-new-website.com"
}
```

### Change Interval:
```json
{
  "intervalMinutes": 2  // Every 2 minutes
}
```

### Add More Pages:
```json
{
  "additionalPages": [
    "/about",
    "/contact", 
    "/pricing",
    "/blog",
    "/support"
  ]
}
```

## 📝 Logs:

- **Console Output**: Real-time in the terminal
- **Log File**: Saved to `keepalive.log`
- **Timestamps**: Every action is timestamped

## 🛑 Stopping the System:

- **Press Ctrl+C** in the terminal
- **Close the terminal window**
- **Stop the batch file** (if using .bat)

## ⚠️ Important Notes:

1. **Keep your computer running** - The script needs to stay active
2. **Internet connection required** - For making HTTP requests
3. **4-minute intervals** - Perfect for keeping Render awake
4. **No browser needed** - Uses lightweight HTTP requests
5. **Logs saved** - Check `keepalive.log` for history

## 🎯 Expected Results:

- ✅ **Render stays awake** - No more sleeping
- ✅ **Fast response times** - No cold starts
- ✅ **Consistent uptime** - 24/7 availability
- ✅ **Real user simulation** - Authentic traffic patterns

## 🚨 Troubleshooting:

### If the script stops:
1. Check your internet connection
2. Verify website URLs are correct
3. Check the log file for errors
4. Restart the script

### If Render still sleeps:
1. Verify the script is running
2. Check logs for successful requests
3. Ensure URLs are accessible
4. Try reducing interval to 2 minutes

## 🎉 Success Indicators:

- ✅ Script runs every 4 minutes
- ✅ All pages return 200 status
- ✅ Log file shows successful requests
- ✅ Render service responds quickly
- ✅ No more "service sleeping" messages

---

**🎯 Your website will now stay alive 24/7! 🎯**
