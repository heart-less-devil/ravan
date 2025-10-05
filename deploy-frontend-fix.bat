@echo off
echo 🔧 Fixing Frontend Environment Variables and Deploying...

echo.
echo 📦 Building frontend with production environment variables...
call npm run build:production

echo.
echo ✅ Build completed with environment variables!
echo.
echo 🚀 Frontend is ready for deployment with:
echo    - REACT_APP_STRIPE_PUBLISHABLE_KEY: Set
echo    - REACT_APP_API_BASE_URL: https://bioping-backend.onrender.com
echo    - CORS: Fixed for thebioping.com
echo.
echo 📁 Built files are in the 'build' directory
echo 🌐 Upload the 'build' directory contents to GoDaddy hosting
echo.
pause
