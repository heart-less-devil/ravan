@echo off
echo 🔧 Deploying OTP Email Fix with cPanel SMTP...

echo.
echo 📦 Committing OTP email configuration fix to git...
git add .
git commit -m "Fix: Configure OTP email to use cPanel SMTP (support@thebioping.com)"

echo.
echo 🚀 Pushing to main branch for Render deployment...
git push origin main

echo.
echo ✅ OTP Email Fix Deployed!
echo.
echo 🔧 Changes made:
echo    - Updated OTP email to use cPanel SMTP (mail.thebioping.com:465)
echo    - Changed from Gmail to support@thebioping.com
echo    - Updated email transporter configuration
echo    - Added SSL/TLS support for port 465
echo.
echo 📧 OTP Email Configuration:
echo    - SMTP Host: mail.thebioping.com
echo    - Port: 465 (SSL)
echo    - From: support@thebioping.com
echo    - Password: Wildboy07@
echo.
echo ⏳ Render will automatically deploy the changes
echo 🌐 Backend URL: https://bioping-backend.onrender.com
echo.
echo 🧪 Testing OTP:
echo    1. Go to: thebioping.com/signup
echo    2. Enter any email address
echo    3. Check email for OTP code
echo    4. OTP should now be delivered successfully
echo.
echo 🔍 Monitor logs at: https://dashboard.render.com
echo.
pause
