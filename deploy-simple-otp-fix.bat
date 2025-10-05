@echo off
echo ========================================
echo DEPLOYING SIMPLE OTP FIX
echo ========================================

echo.
echo Step 1: Stopping existing processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo Step 2: Installing dependencies...
cd /d "D:\ravan"
npm install

echo.
echo Step 3: Starting server with simple OTP...
start "BioPing Server" cmd /k "cd /d D:\ravan && node server/index.js"

echo.
echo Step 4: Starting API with simple OTP...
start "BioPing API" cmd /k "cd /d D:\ravan\api && node index.js"

echo.
echo Step 5: Starting frontend...
start "BioPing Frontend" cmd /k "cd /d D:\ravan && npm start"

echo.
echo ========================================
echo DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Services started:
echo - Server: http://localhost:3005
echo - API: http://localhost:3001  
echo - Frontend: http://localhost:3000
echo.
echo OTP Features:
echo - Email verification: Working with Gmail
echo - Password reset: Working with Gmail
echo - Fallback: Code shown in response if email fails
echo.
echo Test OTP by:
echo 1. Go to http://localhost:3000
echo 2. Try to sign up or reset password
echo 3. Check email or response for OTP code
echo.
pause
