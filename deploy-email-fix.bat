@echo off
echo 🔧 Deploying Email Configuration Fix for OTP Sending...

echo.
echo 📦 Committing email configuration fixes to git...
git add .
git commit -m "Fix: Update email configuration for reliable OTP sending on live site"

echo.
echo 🚀 Pushing to main branch for Render deployment...
git push origin main

echo.
echo ✅ Email configuration fixes deployed!
echo.
echo 🔧 Changes made:
echo    - Added SMTP environment variables to render.yaml
echo    - Updated email transporter to use environment variables
echo    - Reduced email timeouts for better reliability
echo    - Added email configuration test endpoint
echo.
echo ⏳ Render will automatically deploy the changes
echo 🌐 Backend URL: https://bioping-backend.onrender.com
echo.
echo 📧 Email configuration:
echo    - SMTP Host: smtp.gmail.com
echo    - SMTP Port: 587
echo    - Security: TLS (not SSL)
echo    - Timeout: 30 seconds
echo.
echo 🔍 Test email config: https://bioping-backend.onrender.com/api/test-email-config
echo.
pause
