# 🚀 Backend Deployment Guide

## **Problem:** 
Netlify only serves static files. Your backend server needs to be deployed separately.

## **Solution: Deploy Backend on Render.com (Free)**

### **Step 1: Deploy Backend on Render**

1. **Go to:** https://render.com
2. **Sign up/Login** with GitHub
3. **Click:** "New" → "Web Service"
4. **Connect GitHub** and select: `amankk0007/ravan`
5. **Configure:**
   - **Name:** `bioping-backend`
   - **Environment:** `Node`
   - **Build Command:** `cd server && npm install`
   - **Start Command:** `cd server && node index.js`
   - **Plan:** Free

### **Step 2: Add Environment Variables**

In Render dashboard:
- **Environment** → **Environment Variables**
- Add: `JWT_SECRET` = `bioping-super-secure-jwt-secret-key-2025-very-long-and-random-string`

### **Step 3: Deploy**

Click **"Create Web Service"** and wait ~5 minutes.

## **Step 4: Update Frontend**

✅ **Already done!** Frontend now points to: `https://bioping-backend.onrender.com/api`

## **Step 5: Redeploy Frontend**

1. **Rebuild your React app:**
   ```bash
   npm run build
   ```

2. **Upload new build folder** to Netlify

## **🎯 Result:**

- **Frontend:** `https://your-site.netlify.app` (Netlify)
- **Backend:** `https://bioping-backend.onrender.com` (Render)
- **Login/Admin:** Working! ✅

## **🔧 Alternative: Railway.app**

If Render doesn't work:
1. **Go to:** https://railway.app
2. **Same process** but on Railway
3. **Get URL** like: `https://bioping-backend.railway.app`

## **✅ Benefits:**

- **Free hosting** for both frontend and backend
- **Automatic HTTPS**
- **Easy environment variables**
- **Git-based deployments**

**Your app will work perfectly!** 🎉 