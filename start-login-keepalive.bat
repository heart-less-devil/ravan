@echo off
echo ========================================
echo    BioPing Login/Logout Keepalive
echo ========================================
echo.
echo This script will keep your website alive by:
echo • Actually logging in with amankk0007@gmail.com
echo • Visiting protected pages while logged in
echo • Logging out properly
echo • Repeating every 4 minutes
echo.
echo ⚠️  IMPORTANT: Edit working-login-keepalive.js first!
echo     Replace 'your_actual_password_here' with real password
echo.
echo Press any key to start...
pause >nul

echo.
echo 🚀 Starting login/logout keepalive system...
echo 📧 Email: amankk0007@gmail.com
echo 🌐 Website: https://biopingweb.netlify.app
echo 🔐 Login API: https://bioping-backend.onrender.com/api/auth/login
echo ⏰ Interval: Every 4 minutes
echo 📝 Logs will be saved to: keepalive.log
echo.
echo Press Ctrl+C to stop the system
echo.

node working-login-keepalive.js

echo.
echo Keepalive system stopped.
pause
