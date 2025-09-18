# 🔐 Secure Deployment Guide for API Keys

## ✅ **Current Security Status**
- ✅ `.env` file is in `.gitignore` - **API keys will NOT be committed to Git**
- ✅ Your Stripe live key is safely stored in `.env` file
- ✅ Environment variables are properly configured

## 🚀 **Deployment Options**

### **Option 1: Environment Variables (Recommended)**
Set environment variables directly on your hosting platform:

#### **For GoDaddy/Render:**
```bash
# In your hosting platform's environment settings, add:
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_51RlErgLf1iznKy11bUQ4zowN63lhfc2ElpXY9stuz1XqzBBJcWHHWzczvSUfVAxkFQiOTFfzaDzD38WMzBKCAlJA00lB6CGJwT
REACT_APP_API_BASE_URL=https://your-backend-url.com
```

#### **For Netlify:**
1. Go to Site Settings → Environment Variables
2. Add the variables above

#### **For Vercel:**
1. Go to Project Settings → Environment Variables
2. Add the variables above

### **Option 2: Build-time Configuration**
Create a build script that injects environment variables:

```bash
# build-with-env.sh
export REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_51RlErgLf1iznKy11bUQ4zowN63lhfc2ElpXY9stuz1XqzBBJcWHHWzczvSUfVAxkFQiOTFfzaDzD38WMzBKCAlJA00lB6CGJwT
export REACT_APP_API_BASE_URL=https://your-backend-url.com
npm run build
```

## 🔒 **Security Best Practices**

### **✅ DO:**
- Use environment variables for all sensitive data
- Keep `.env` files in `.gitignore`
- Use different keys for development/production
- Rotate keys regularly
- Use HTTPS in production

### **❌ DON'T:**
- Commit API keys to Git
- Hardcode keys in source code
- Share keys in chat/email
- Use test keys in production

## 🛡️ **Git Security Commands**

### **Check if .env is ignored:**
```bash
git status
# Should NOT show .env file
```

### **If .env was accidentally committed:**
```bash
# Remove from Git but keep local file
git rm --cached .env
git commit -m "Remove .env from tracking"
```

### **Verify .gitignore:**
```bash
git check-ignore .env
# Should return: .env
```

## 🚨 **Emergency Key Rotation**

If your key is compromised:
1. **Immediately** rotate the key in Stripe dashboard
2. Update environment variables on all platforms
3. Redeploy your application
4. Check logs for any unauthorized usage

## 📋 **Deployment Checklist**

- [ ] `.env` file is in `.gitignore`
- [ ] Environment variables set on hosting platform
- [ ] HTTPS enabled in production
- [ ] Test payment flow works
- [ ] No API keys visible in browser source
- [ ] Backup of working configuration

## 🔍 **Verification Commands**

```bash
# Check if .env is ignored
git check-ignore .env

# Check what's being tracked
git ls-files | grep -E "\.(env|key)"

# Verify build doesn't include secrets
grep -r "pk_live_" build/ || echo "✅ No keys in build"
```

---

**Remember:** Your API key is now safely stored in `.env` and will NOT be committed to Git! 🎉