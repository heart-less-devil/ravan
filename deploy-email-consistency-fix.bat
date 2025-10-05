@echo off
echo 🔧 Deploying Email Consistency Fix...

echo.
echo 📦 Committing email consistency fix to git...
git add .
git commit -m "Fix: Update all email configurations to use consistent cPanel settings"

echo.
echo 🚀 Pushing to main branch for Render deployment...
git push origin main

echo.
echo ✅ Email Consistency Fix Deployed!
echo.
echo 🔧 Changes made:
echo    - Updated all email functions to use support@thebioping.com
echo    - Changed all SMTP configurations to mail.thebioping.com:465
echo    - Updated fallback email configurations
echo    - Fixed hardcoded email credentials
echo.
echo 📧 Consistent Email Configuration:
echo    - SMTP Host: mail.thebioping.com
echo    - Port: 465 (SSL)
echo    - From: support@thebioping.com
echo    - Password: Wildboy07@
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
pause
