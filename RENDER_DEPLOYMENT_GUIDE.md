# Backend Deployment Guide - Render.com

## Step 1: Deploy Backend to Render

1. **Go to [Render.com](https://render.com)**
2. **Sign up/Login with GitHub**
3. **Click "New +" → "Web Service"**
4. **Connect your GitHub repository**
5. **Configure the service:**

```
Name: bioping-backend
Environment: Node
Build Command: cd server && npm install
Start Command: cd server && node index.js
```

6. **Add Environment Variables:**
   - `JWT_SECRET`: `bioping-super-secure-jwt-secret-key-2025-very-long-and-random-string`
   - `NODE_ENV`: `production`

7. **Click "Create Web Service"**

## Step 2: Get Backend URL

After deployment, you'll get a URL like:
`https://bioping-backend.onrender.com`

**Save this URL - you'll need it for frontend deployment!**

## Step 3: Test Backend

Visit: `https://bioping-backend.onrender.com/api/health`

Should show: `{"status":"OK","server":"BioPing Backend"}`

## Step 4: Update Frontend Config

Once you have the backend URL, update `src/config.js`:

```javascript
export const API_BASE_URL = 'https://bioping-backend.onrender.com';
export const ADMIN_API_BASE_URL = 'https://bioping-backend.onrender.com';
```

## Troubleshooting

- If build fails, check if all dependencies are in `server/package.json`
- If service doesn't start, check logs in Render dashboard
- Make sure `server/index.js` is the main file 