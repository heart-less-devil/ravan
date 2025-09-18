@echo off
echo ========================================
echo    BioPing Admin Data Fetcher
echo ========================================
echo.
echo Choose an option:
echo 1. Fetch basic data once
echo 2. Fetch COMPLETE data once (all tabs)
echo 3. Start continuous fetching (every 5 minutes)
echo 4. Start continuous COMPLETE fetching (every 5 minutes)
echo 5. Start continuous fetching (every 10 minutes)
echo 6. Start continuous fetching (every 15 minutes)
echo 7. Exit
echo.
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" (
    echo.
    echo 🔍 Fetching basic admin panel data once...
    cd /d "%~dp0server"
    npm run fetch-exact
    pause
) else if "%choice%"=="2" (
    echo.
    echo 🔍 Fetching COMPLETE admin panel data once (all tabs)...
    cd /d "%~dp0server"
    npm run fetch-complete
    pause
) else if "%choice%"=="3" (
    echo.
    echo 🚀 Starting continuous basic fetching every 5 minutes...
    cd /d "%~dp0server"
    npm run fetch-continuous
) else if "%choice%"=="4" (
    echo.
    echo 🚀 Starting continuous COMPLETE fetching every 5 minutes...
    cd /d "%~dp0server"
    npm run fetch-complete-continuous
) else if "%choice%"=="5" (
    echo.
    echo 🚀 Starting continuous fetching every 10 minutes...
    cd /d "%~dp0server"
    node fetch-exact-admin-data.js --continuous --interval=10
) else if "%choice%"=="6" (
    echo.
    echo 🚀 Starting continuous fetching every 15 minutes...
    cd /d "%~dp0server"
    node fetch-exact-admin-data.js --continuous --interval=15
) else if "%choice%"=="7" (
    echo Exiting...
    exit /b 0
) else (
    echo Invalid choice. Please run the script again.
    pause
    exit /b 1
)
