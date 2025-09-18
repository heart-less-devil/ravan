# Gmail Setup Guide for BioPing

## Step 1: Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/
2. Click on "Security"
3. Enable "2-Step Verification"

## Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" from dropdown
3. Click "Generate"
4. Copy the 16-character password (without spaces)

## Step 3: Update .env File
Replace the EMAIL_PASS in your .env file with the new app password.

## Step 4: Test Email
Run the test email script to verify it works.

## Alternative: Use Gmail OAuth2
If app password doesn't work, we can switch to OAuth2 authentication. 