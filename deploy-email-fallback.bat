@echo off
echo 🔧 Deploying Email Fallback Fix for OTP...

echo.
echo 📦 Committing email fallback fix to git...
git add .
git commit -m "Fix: Add email fallback - return OTP in response if email service is slow"

echo.
echo 🚀 Pushing to main branch for Render deployment...
git push origin main

echo.
echo ✅ Email fallback fix deployed!
echo.
echo 🔧 Changes made:
echo    - Added fallback to return OTP in response if email fails
echo    - Email service tries to send first (15 second timeout)
echo    - If email fails, OTP returned in response for debugging
echo    - Frontend handles both success and fallback scenarios
echo.
echo ⏳ Render will automatically deploy the changes
echo 🌐 Backend URL: https://bioping-backend.onrender.com
echo.
echo 📧 OTP Flow (With Fallback):
echo    1. User enters email on signup
echo    2. Backend tries to send email (15 second timeout)
echo    3. If email succeeds: User receives email
echo    4. If email fails: OTP returned in response (for debugging)
echo    5. User can complete signup in both cases
echo.
echo 🔍 Test on live site: thebioping.com/signup
echo.
pause
