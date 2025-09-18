# Frontend Deployment Guide - Netlify

## Prerequisites

1. **Backend must be deployed first** (see RENDER_DEPLOYMENT_GUIDE.md)
2. **Get your backend URL** (e.g., `https://bioping-backend.onrender.com`)

## Step 1: Update Configuration

### Update `src/config.js`:

```javascript
// API Configuration
export const API_BASE_URL = 'https://bioping-backend.onrender.com';
export const ADMIN_API_BASE_URL = 'https://bioping-backend.onrender.com';

// Environment check
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
```

### Update `netlify.toml`:

```toml
[build]
  publish = "build"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
  CI = "false"
  NPM_FLAGS = "--legacy-peer-deps"

# Handle API routes for backend
[[redirects]]
  from = "/api/*"
  to = "https://bioping-backend.onrender.com/api/:splat"
  status = 200
  force = true

# Handle static files
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

# Cache static assets
[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

## Step 2: Deploy to Netlify

### Option A: Deploy via Netlify UI

1. **Go to [Netlify.com](https://netlify.com)**
2. **Sign up/Login with GitHub**
3. **Click "New site from Git"**
4. **Choose GitHub and select your repository**
5. **Configure build settings:**
   - **Build command:** `npm run build`
   - **Publish directory:** `build`
6. **Click "Deploy site"**

### Option B: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Build the project
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=build
```

## Step 3: Configure Environment Variables

In Netlify dashboard:

1. **Go to Site Settings → Environment Variables**
2. **Add:**
   - `REACT_APP_API_URL`: `https://bioping-backend.onrender.com`
   - `REACT_APP_ADMIN_API_URL`: `https://bioping-backend.onrender.com`

## Step 4: Test Deployment

1. **Visit your Netlify URL**
2. **Test all features:**
   - ✅ User registration/login
   - ✅ PDF viewer
   - ✅ BD Tracker
   - ✅ Search functionality
   - ✅ Admin panel

## Step 5: Custom Domain (Optional)

1. **Go to Site Settings → Domain management**
2. **Add custom domain**
3. **Configure DNS settings**

## Troubleshooting

### Common Issues:

1. **Build fails:**
   - Check `package.json` has all dependencies
   - Ensure Node.js version is 18+
   - Check for syntax errors

2. **API calls fail:**
   - Verify backend URL is correct
   - Check CORS settings in backend
   - Ensure backend is running

3. **PDF not loading:**
   - Check if PDF files are in `public/pdf/`
   - Verify PDF worker path

4. **Authentication issues:**
   - Check JWT_SECRET is set in backend
   - Verify token storage in frontend

### Debug Commands:

```bash
# Test build locally
npm run build

# Check for errors
npm run test

# Verify dependencies
npm list
```

## Final Checklist

- [ ] Backend deployed on Render
- [ ] Backend URL working
- [ ] Frontend config updated
- [ ] Netlify deployment successful
- [ ] All features working
- [ ] Custom domain configured (optional) 