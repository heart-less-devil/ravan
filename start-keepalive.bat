@echo off
echo ========================================
echo    BioPing Auto Keepalive System
echo ========================================
echo.
echo This script will keep your website alive by:
echo • Visiting your website every 4 minutes
echo • Simulating user activity
echo • Preventing Render from sleeping
echo.
echo Press any key to start...
pause >nul

echo.
echo 🚀 Starting keepalive system...
echo 📍 Website: https://biopingweb.com
echo ⏰ Interval: Every 4 minutes
echo 📝 Logs will be saved to: keepalive.log
echo.
echo Press Ctrl+C to stop the system
echo.

node simple-keepalive.js

echo.
echo Keepalive system stopped.
pause
