@echo off
echo 🔧 Deploying Direct OTP Fix (No Email Required)...

echo.
echo 📦 Committing direct OTP fix to git...
git add .
git commit -m "Fix: Return OTP directly in response due to email service issues"

echo.
echo 🚀 Pushing to main branch for Render deployment...
git push origin main

echo.
echo ✅ Direct OTP fix deployed!
echo.
echo 🔧 Changes made:
echo    - Temporarily disabled email sending due to SMTP issues
echo    - Return verification code directly in API response
echo    - Frontend shows verification code to user immediately
echo    - Signup process works without email dependency
echo.
echo ⏳ Render will automatically deploy the changes
echo 🌐 Backend URL: https://bioping-backend.onrender.com
echo.
echo 📧 OTP Flow (Temporary):
echo    1. User enters email on signup
echo    2. Backend generates 6-digit OTP
echo    3. OTP returned directly in response (no email)
echo    4. Frontend shows OTP in alert popup
echo    5. User enters OTP to complete signup
echo.
echo 🔍 Test on live site: thebioping.com/signup
echo.
echo ⚠️ Note: This is a temporary fix until email service is restored
echo.
pause
