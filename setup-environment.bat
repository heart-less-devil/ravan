@echo off
echo Setting up environment variables for BioPing...

REM Create .env file in server directory
echo # MongoDB Configuration > server\.env
echo MONGODB_URI=mongodb+srv://bioping:bioping123@cluster0.mongodb.net/bioping?retryWrites=true^&w=majority >> server\.env
echo. >> server\.env
echo # Server Configuration >> server\.env
echo PORT=5000 >> server\.env
echo NODE_ENV=development >> server\.env
echo. >> server\.env
echo # Email Configuration >> server\.env
echo EMAIL_USER=support@thebioping.com >> server\.env
echo EMAIL_PASS=your_email_password_here >> server\.env
echo. >> server\.env
echo # Stripe Configuration >> server\.env
echo STRIPE_SECRET_KEY=sk_live_your_real_stripe_secret_key_here >> server\.env
echo STRIPE_PUBLISHABLE_KEY=pk_live_your_real_stripe_publishable_key_here >> server\.env
echo REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_real_stripe_publishable_key_here >> server\.env
echo. >> server\.env
echo # SMTP Settings >> server\.env
echo SMTP_HOST=mail.thebioping.com >> server\.env
echo SMTP_PORT=465 >> server\.env
echo SMTP_SECURE=true >> server\.env

echo.
echo ✅ Created server/.env file successfully!
echo.
echo 📝 Environment variables configured:
echo    - MongoDB URI: Set to cluster0.mongodb.net
echo    - Port: 5000
echo    - Node Environment: development
echo    - Email: support@thebioping.com (password needs to be set)
echo.
echo 🔧 Next steps:
echo    1. Edit server/.env file and set your actual EMAIL_PASS
echo    2. Restart your server
echo    3. Check MongoDB connection logs
echo.
echo 📧 To enable email functionality:
echo    - Replace "your_email_password_here" with actual password
echo    - Or leave as is to disable email (app will work without email)
echo.
pause
