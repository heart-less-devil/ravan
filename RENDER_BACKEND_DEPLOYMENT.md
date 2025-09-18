# 🚀 Render Backend Deployment Guide

## **📋 Overview**
This guide will help you deploy your Node.js backend to Render.com

## **🎯 Step 1: Prepare Your Backend**

Your backend is already in the `server/` directory with all necessary files.

## **🎯 Step 2: Deploy to Render**

### **1. Create Render Account**
- Go to: https://render.com
- Sign up with your GitHub account

### **2. Create New Web Service**
1. Click "New +" → "Web Service"
2. Connect your GitHub repository: `heart-less-devil/ravan`
3. Configure the service:

### **3. Service Configuration**
```
Name: bioping-backend
Root Directory: server
Runtime: Node
Build Command: npm install
Start Command: node index.js
```

### **4. Environment Variables**
Add these in the Render dashboard:
```
JWT_SECRET=bioping-super-secure-jwt-secret-key-2025-very-long-and-random-string
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
NODE_ENV=production
```

### **5. Advanced Settings**
- **Auto-Deploy:** Yes (from main branch)
- **Health Check Path:** `/api/health` (optional)

## **🎯 Step 3: Update CORS Settings**

After deployment, update your backend CORS in `server/index.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-frontend-site.netlify.app',
    'https://*.netlify.app'
  ],
  credentials: true
}));
```

## **🎯 Step 4: Test Your Backend**

Your backend will be available at: `https://your-service-name.onrender.com`

Test these endpoints:
- `GET /api/health` - Health check
- `POST /api/auth/login` - Login
- `POST /api/auth/signup` - Signup

## **🎯 Step 5: Update Frontend**

Update your frontend API URL in `src/config.js`:

```javascript
export const API_BASE_URL = 'https://your-service-name.onrender.com';
```

## **✅ Benefits of Render:**

- **Free tier:** 750 hours/month
- **Automatic HTTPS**
- **Auto-scaling**
- **Easy environment variables**
- **Git-based deployments**

## **🔧 Troubleshooting:**

### **Build Failures:**
- Check if `package.json` exists in server directory
- Ensure all dependencies are listed
- Verify Node.js version compatibility

### **Runtime Errors:**
- Check environment variables
- Verify file paths for data persistence
- Check logs in Render dashboard

### **CORS Issues:**
- Update CORS origins to include your Netlify domain
- Ensure credentials are properly configured

## **📱 Next Steps:**

1. Deploy backend to Render
2. Test all API endpoints
3. Update frontend API URL
4. Deploy frontend to Netlify
5. Test complete application

**Your backend will be live and ready!** 🎉 