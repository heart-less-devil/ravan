@echo off
echo 🔧 Deploying GoDaddy SMTP Fix...

echo.
echo 📦 Committing GoDaddy SMTP fix to git...
git add .
git commit -m "Fix: Use GoDaddy relay-hosting.secureserver.net SMTP server"

echo.
echo 🚀 Pushing to main branch for Render deployment...
git push origin main

echo.
echo ✅ GoDaddy SMTP Fix Deployed!
echo.
echo 🔧 Changes made:
echo    - Changed SMTP host to relay-hosting.secureserver.net
echo    - Updated port from 465 to 587 (TLS)
echo    - Changed secure from true to false (TLS instead of SSL)
echo    - This should resolve DNS resolution issues on Render
echo.
echo 📧 Updated SMTP Configuration:
echo    - SMTP Host: relay-hosting.secureserver.net
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
echo 📝 Note: relay-hosting.secureserver.net is GoDaddy's official SMTP relay server
echo.
pause
