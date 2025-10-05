@echo off
echo 🔧 Deploying Email OTP Restoration (No Alert Popup)...

echo.
echo 📦 Committing email OTP restoration to git...
git add .
git commit -m "Fix: Restore proper email OTP sending without alert popup"

echo.
echo 🚀 Pushing to main branch for Render deployment...
git push origin main

echo.
echo ✅ Email OTP restoration deployed!
echo.
echo 🔧 Changes made:
echo    - Removed alert popup showing verification code
echo    - Restored proper email sending functionality
echo    - Optimized email timeout settings (15 seconds)
echo    - Clean error handling for email failures
echo    - Removed duplicate code
echo.
echo ⏳ Render will automatically deploy the changes
echo 🌐 Backend URL: https://bioping-backend.onrender.com
echo.
echo 📧 OTP Flow (Proper):
echo    1. User enters email on signup
echo    2. Backend generates 6-digit OTP
echo    3. OTP sent via email to user
echo    4. User receives email with verification code
echo    5. User enters OTP to complete signup
echo    6. NO alert popup shown
echo.
echo 🔍 Test on live site: thebioping.com/signup
echo.
pause
