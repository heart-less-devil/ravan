@echo off
echo 🔧 Deploying SMTPout Fix...

echo.
echo 📦 Committing SMTPout fix to git...
git add .
git commit -m "Fix: Use smtpout.secureserver.net for better DNS resolution"

echo.
echo 🚀 Pushing to main branch for Render deployment...
git push origin main

echo.
echo ✅ SMTPout Fix Deployed!
echo.
echo 🔧 Changes made:
echo    - Changed SMTP host to smtpout.secureserver.net
echo    - This is GoDaddy's primary SMTP relay server
echo    - Better DNS resolution and reliability
echo.
echo 📧 Updated SMTP Configuration:
echo    - SMTP Host: smtpout.secureserver.net
echo    - Port: 587 (TLS)
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
echo 📝 Note: smtpout.secureserver.net is GoDaddy's primary SMTP relay
echo.
pause
