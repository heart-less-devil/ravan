@echo off
echo Starting BioPing Server...

REM Kill any existing Node.js processes
taskkill /F /IM node.exe 2>nul

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Start the server
cd server
node index.js

pause 