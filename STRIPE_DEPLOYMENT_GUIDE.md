# 🚨 URGENT: Stripe Keys Deployment Guide

## Problem Identified
Your live site is showing `pk_live_YOUR_STRIPE_PUBLISHABLE_KEY_HERE` instead of the real Stripe key, causing payment failures.

## Solution

### Option 1: Use Deployment Scripts (Recommended)

1. **For Windows**: Edit `deploy-template.bat` and replace:
   ```bat
   set STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY
   set STRIPE_PUBLISHABLE_KEY=YOUR_STRIPE_PUBLISHABLE_KEY
   set REACT_APP_STRIPE_PUBLISHABLE_KEY=YOUR_STRIPE_PUBLISHABLE_KEY
   ```
   
   With your actual keys (replace with your real Stripe keys):
   ```bat
   set STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY_HERE
   set STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_PUBLISHABLE_KEY_HERE
   set REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_PUBLISHABLE_KEY_HERE
   ```

2. **Run the script**: `deploy-template.bat`

### Option 2: Set Environment Variables on Hosting Platform

Set these environment variables on your hosting platform (GoDaddy/Render):

- `STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY_HERE`
- `REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_PUBLISHABLE_KEY_HERE`

### Option 3: Manual Build with Keys

```bash
# Set environment variables
export STRIPE_SECRET_KEY="sk_live_YOUR_STRIPE_SECRET_KEY_HERE"
export REACT_APP_STRIPE_PUBLISHABLE_KEY="pk_live_YOUR_STRIPE_PUBLISHABLE_KEY_HERE"

# Build
npm run build

# Deploy build folder
```

## Current Status
- ✅ Backend: Auto-cut subscription system working
- ✅ Frontend: Payment method integration complete  
- ❌ **ISSUE**: Frontend using placeholder Stripe key
- ✅ Solution: Use deployment scripts with real keys

## After Fix
Your 12-day auto-cut subscription will work perfectly with card: `6522940717096518`
