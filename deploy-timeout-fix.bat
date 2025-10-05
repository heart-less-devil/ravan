@echo off
echo 🔧 Deploying SMTP Timeout Fix...

echo.
echo 📦 Committing SMTP timeout fix to git...
git add .
git commit -m "Fix: Increase SMTP timeouts to prevent connection timeout errors"

echo.
echo 🚀 Pushing to main branch for Render deployment...
git push origin main

echo.
echo ✅ SMTP Timeout Fix Deployed!
echo.
echo 🔧 Changes made:
echo    - Increased connectionTimeout from 20s to 60s
echo    - Increased greetingTimeout from 10s to 30s
echo    - Increased socketTimeout from 20s to 60s
echo    - Increased email timeout from 15s to 90s
echo    - This should prevent connection timeout errors
echo.
echo 📧 Updated SMTP Configuration:
echo    - SMTP Host: smtpout.secureserver.net
echo    - Port: 587 (TLS)
echo    - From: support@thebioping.com
echo    - Password: Wildboy07@
echo    - Connection Timeout: 60 seconds
echo    - Email Timeout: 90 seconds
echo.
echo ⏳ Render will automatically deploy the changes
echo 🌐 Backend URL: https://bioping-backend.onrender.com
echo.
echo 🧪 Testing OTP:
echo    1. Wait 2-3 minutes for deployment
echo    2. Go to: thebioping.com/signup
echo    3. Enter any email address
echo    4. Check email for OTP code
echo.
echo 🔍 Monitor logs at: https://dashboard.render.com
echo.
echo ✅ This should fix the connection timeout issue!
echo.
pause