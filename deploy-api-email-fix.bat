@echo off
echo 🔧 Deploying API Email Fix...

echo.
echo 📦 Committing API email fix to git...
git add .
git commit -m "Fix: Update API email configuration for OTP support"

echo.
echo 🚀 Pushing to main branch for Render deployment...
git push origin main

echo.
echo ✅ API Email Fix Deployed!
echo.
echo 🔧 Changes made:
echo    - Updated API email configuration to use smtpout.secureserver.net
echo    - Changed from info@bioping.com to support@thebioping.com
echo    - Added OTP verification endpoints
echo    - Added verification email template
echo    - Updated password reset email configuration
echo.
echo 📧 API Email Configuration:
echo    - SMTP Host: smtpout.secureserver.net
echo    - Port: 587 (TLS)
echo    - From: support@thebioping.com
echo    - Password: Wildboy07@
echo.
echo 🆕 New API Endpoints:
echo    - POST /api/auth/send-verification (Send OTP)
echo    - POST /api/auth/verify-email (Verify OTP)
echo.
echo ⏳ Render will automatically deploy the changes
echo 🌐 Backend URL: https://bioping-backend.onrender.com
echo.
echo 🧪 Testing OTP:
echo    1. Wait 2-3 minutes for deployment
echo    2. Test API endpoints for OTP functionality
echo    3. Check email delivery from support@thebioping.com
echo.
echo 🔍 Monitor logs at: https://dashboard.render.com
echo.
pause
