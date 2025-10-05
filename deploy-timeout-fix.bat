@echo off
echo 🔧 Deploying Timeout Fix for Signup Page...

echo.
echo 📦 Committing timeout fixes to git...
git add .
git commit -m "Fix: Increase frontend timeout and optimize backend email sending"

echo.
echo 🚀 Pushing to main branch for Render deployment...
git push origin main

echo.
echo ✅ Timeout fixes deployed!
echo.
echo 🔧 Changes made:
echo    - Frontend timeout increased from 10s to 45s
echo    - Backend email timeout reduced from 30s to 15s
echo    - Better error messages for timeout scenarios
echo    - Verification code returned in response for debugging
echo.
echo ⏳ Render will automatically deploy the changes
echo 🌐 Backend URL: https://bioping-backend.onrender.com
echo.
echo 📧 Email sending should now be more reliable
echo 🔍 Check console logs for verification codes if email fails
echo.
pause
