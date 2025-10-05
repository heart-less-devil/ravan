@echo off
echo 🔧 Deploying Backend with Fixed Environment Variables...

echo.
echo 📦 Committing changes to git...
git add .
git commit -m "Fix: Add missing environment variables and remove duplicate health endpoints"

echo.
echo 🚀 Pushing to main branch for Render deployment...
git push origin main

echo.
echo ✅ Backend deployment initiated!
echo.
echo 🔧 Fixed issues:
echo    - Added STRIPE_SECRET_KEY to render.yaml
echo    - Added STRIPE_PUBLISHABLE_KEY to render.yaml  
echo    - Added REACT_APP_STRIPE_PUBLISHABLE_KEY to render.yaml
echo    - Added MONGODB_URI to render.yaml
echo    - Removed duplicate /api/health endpoints
echo    - Enhanced CORS configuration
echo.
echo ⏳ Render will automatically deploy the changes
echo 🌐 Backend URL: https://bioping-backend.onrender.com
echo.
pause
