@echo off
echo 🚀 Deploying to GoDaddy thebioping.com...
echo.

echo 📦 Building React app...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo.
echo 📁 Copying files to public directory...
xcopy build\* public\ /E /Y
if %errorlevel% neq 0 (
    echo ❌ File copy failed!
    pause
    exit /b 1
)

echo.
echo ✅ Build completed successfully!
echo 📂 Files are ready in public/ directory
echo 🌐 Upload these files to GoDaddy File Manager
echo.
echo 📋 Next steps:
echo 1. Go to GoDaddy File Manager
echo 2. Navigate to public_html folder
echo 3. Upload all files from public/ directory
echo 4. Make sure index.html is in the root of public_html
echo.
echo 🎉 Deployment ready for GoDaddy!
pause