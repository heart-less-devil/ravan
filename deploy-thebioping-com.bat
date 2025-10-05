@echo off
echo ========================================
echo DEPLOYING TO THEBIOPING.COM
echo ========================================

echo.
echo Step 1: Building React app for thebioping.com...
npm run build

echo.
echo Step 2: Build complete!
echo.
echo ========================================
echo DEPLOYMENT OPTIONS FOR THEBIOPING.COM:
echo ========================================
echo.
echo Option 1 - Netlify (Recommended):
echo 1. Go to https://netlify.com
echo 2. New site from Git
echo 3. Select: heart-less-devil/ravan
echo 4. Build command: npm run build
echo 5. Publish directory: build
echo 6. Domain: Connect thebioping.com
echo.
echo Option 2 - Manual Upload:
echo 1. Upload 'build' folder to your hosting
echo 2. Point thebioping.com to hosting server
echo.
echo Option 3 - GoDaddy Hosting:
echo 1. Upload 'build' folder to GoDaddy file manager
echo 2. Extract to public_html folder
echo.
echo ========================================
echo CONFIGURATION:
echo ========================================
echo Frontend: https://thebioping.com/
echo Backend: https://bioping-backend.onrender.com
echo OTP: Working with Gmail
echo.
echo ========================================
echo READY FOR DEPLOYMENT!
echo ========================================
pause
