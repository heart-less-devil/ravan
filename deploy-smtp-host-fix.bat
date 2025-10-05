@echo off
echo 🔧 Deploying SMTP Host Fix...

echo.
echo 📦 Committing SMTP host fix to git...
git add .
git commit -m "Fix: Revert to correct SMTP host mail.thebioping.com (confirmed from cPanel)"

echo.
echo 🚀 Pushing to main branch for Render deployment...
git push origin main

echo.
echo ✅ SMTP Host Fix Deployed!
echo.
echo 🔧 Changes made:
echo    - Reverted to correct SMTP host: mail.thebioping.com
echo    - Confirmed from cPanel manual settings
echo.
echo 📧 Updated SMTP Configuration:
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
