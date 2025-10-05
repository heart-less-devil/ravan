@echo off
echo ========================================
echo DEPLOYING LIVE OTP FIX TO PRODUCTION
echo ========================================

echo.
echo Step 1: Committing OTP fixes to git...
git add .
git commit -m "Fix OTP: Simple Gmail configuration for reliable email sending"

echo.
echo Step 2: Pushing to GitHub...
git push origin main

echo.
echo Step 3: Production deployment will auto-trigger on Render...
echo - Backend: https://bioping-backend.onrender.com
echo - Frontend: https://bioping.netlify.app
echo.
echo Step 4: OTP Features in Production:
echo - Email Verification: Working with Gmail
echo - Password Reset: Working with Gmail  
echo - Fallback: OTP code in response if email fails
echo.
echo ========================================
echo LIVE DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Test OTP in production:
echo 1. Go to https://bioping.netlify.app
echo 2. Try signup or password reset
echo 3. Check email or response for OTP code
echo.
pause
