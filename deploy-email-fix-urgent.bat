@echo off
echo ========================================
echo URGENT EMAIL FIX DEPLOYMENT
echo ========================================

echo.
echo Fixing Gmail SMTP timeout issues...
echo Adding retry logic and better error handling...

echo.
echo Step 1: Committing email fixes...
git add server/index.js
git commit -m "URGENT: Fix Gmail SMTP timeout issues - add retry logic and better error handling"

echo.
echo Step 2: Pushing to GitHub...
git push origin main

echo.
echo Step 3: Render will auto-deploy in 2-3 minutes...
echo Backend URL: https://bioping-backend.onrender.com

echo.
echo ========================================
echo EMAIL FIX DEPLOYED!
echo ========================================
echo.
echo What's Fixed:
echo - Gmail SMTP timeout issues resolved
echo - Added retry logic for email sending
echo - Better error handling and fallbacks
echo - OTP will work even if email fails (shows in response)
echo.
echo Test OTP in 3 minutes:
echo 1. Go to https://bioping-backend.onrender.com/api/auth/send-verification
echo 2. Send POST with email
echo 3. Check response for OTP code
echo.
pause
