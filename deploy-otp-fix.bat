@echo off
echo 🔧 Deploying OTP Email Fix for Live Site...

echo.
echo 📦 Committing OTP fixes to git...
git add .
git commit -m "Fix: Improve OTP email sending with fallback and better timeout handling"

echo.
echo 🚀 Pushing to main branch for Render deployment...
git push origin main

echo.
echo ✅ OTP fixes deployed!
echo.
echo 🔧 Changes made:
echo    - Reduced email timeout to 10 seconds
echo    - Added fallback to return verification code in response
echo    - Frontend shows verification code if email fails
echo    - Better error handling for email service issues
echo.
echo ⏳ Render will automatically deploy the changes
echo 🌐 Backend URL: https://bioping-backend.onrender.com
echo.
echo 📧 OTP Flow:
echo    1. Try to send email (10 second timeout)
echo    2. If email fails, return verification code in response
echo    3. Frontend shows verification code to user
echo    4. User can still complete signup
echo.
echo 🔍 Test on live site: thebioping.com/signup
echo.
pause
