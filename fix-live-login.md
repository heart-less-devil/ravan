# 🔧 Fix Live Site Login Issues

## 🚨 Current Problems:
1. **MongoDB Connection Issues** on Render
2. **Environment Variables** not configured properly
3. **JWT Secret** missing on live server
4. **Email Configuration** not working

## ✅ Solutions:

### 1. **Update Render Environment Variables**

Go to [Render Dashboard](https://dashboard.render.com) and add these environment variables:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://universal:universal07@cluster0.f2z1iic.mongodb.net/bioping?retryWrites=true&w=majority&appName=Cluster0&authSource=admin

# JWT Secret (CRITICAL)
JWT_SECRET=bioping-super-secure-jwt-secret-key-2025-very-long-and-random-string

# Email Configuration
EMAIL_USER=universalx0242@gmail.com
EMAIL_PASS=your_gmail_app_password_here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here

# Server Configuration
NODE_ENV=production
PORT=3005
```

### 2. **MongoDB Atlas IP Whitelist**

1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Navigate to **Network Access**
3. Add IP Address: `0.0.0.0/0` (Allow all IPs)
4. Or add Render's IP ranges

### 3. **Test Live Server**

After updating environment variables:

1. **Health Check:** `https://ravan-8n0h.onrender.com/api/health`
2. **Login Test:** Try login with `universalx0242@gmail.com` / `password`
3. **MongoDB Status:** Check server logs for MongoDB connection

### 4. **Common Issues & Fixes**

#### **Issue: "Invalid credentials"**
- **Cause:** MongoDB not connected
- **Fix:** Update MONGODB_URI environment variable

#### **Issue: "Network error"**
- **Cause:** Server not responding
- **Fix:** Check Render deployment status

#### **Issue: "JWT verification failed"**
- **Cause:** JWT_SECRET not set
- **Fix:** Add JWT_SECRET environment variable

#### **Issue: "Email sending failed"**
- **Cause:** EMAIL_PASS not configured
- **Fix:** Add Gmail app password

## 🧪 Testing Steps:

1. **Test Health Endpoint:**
   ```bash
   curl https://ravan-8n0h.onrender.com/api/health
   ```

2. **Test Login:**
   ```bash
   curl -X POST https://ravan-8n0h.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"universalx0242@gmail.com","password":"password"}'
   ```

3. **Check Server Logs:**
   - Go to Render Dashboard
   - Check service logs for errors

## 📋 Deployment Checklist:

- [ ] Environment variables updated on Render
- [ ] MongoDB Atlas IP whitelist configured
- [ ] Render service redeployed
- [ ] Health endpoint working
- [ ] Login functionality tested
- [ ] Email sending tested

## 🚀 Expected Results:

After fixes:
- ✅ Login works on live site
- ✅ MongoDB connection established
- ✅ JWT tokens working
- ✅ Email functionality working
- ✅ No more "invalid credentials" errors
