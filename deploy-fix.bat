@echo off
echo Deploying BioPing with API fixes...

REM Build the project
echo Building project...
call npm run build

REM Deploy to Netlify (if you have Netlify CLI installed)
echo Deploying to Netlify...
netlify deploy --prod --dir=build

echo Deployment complete!
pause
