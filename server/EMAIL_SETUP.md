# Email OTP Setup Guide

## 🚀 **Real Email OTP Configuration**

### **Step 1: Gmail Setup**

1. **Enable 2-Factor Authentication**:
   - Go to your Google Account Settings
   - Security → 2-Step Verification → Turn on

2. **Generate App Password**:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and generate password
   - Copy the 16-character password

### **Step 2: Update .env File**

Edit `server/.env` file:

```env
# Server Configuration
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (Gmail)
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

### **Step 3: Test Email Configuration**

```bash
cd server
npm start
```

Then test signup:
1. Go to: `http://localhost:3000/signup`
2. Fill form with real email
3. Check email for OTP code

### **Step 4: AWS Deployment**

For AWS deployment, update environment variables:

```env
EMAIL_USER=your-production-email@gmail.com
EMAIL_PASS=your-production-app-password
```

## 🔧 **Email Template**

The system uses beautiful HTML email templates:

- ✅ Professional BioPing branding
- ✅ 6-digit OTP code
- ✅ 10-minute expiration
- ✅ Mobile-friendly design

## 📧 **Email Features**

- ✅ Real Gmail SMTP
- ✅ HTML email templates
- ✅ Error handling
- ✅ Debug mode for development
- ✅ AWS deployment ready

## 🧪 **Testing**

1. **Development**: OTP shows in console + email
2. **Production**: Only email delivery
3. **Error Handling**: Graceful fallback

## 🔒 **Security**

- ✅ App passwords (not regular passwords)
- ✅ 2FA required
- ✅ Secure SMTP connection
- ✅ Environment variables for secrets

## 📝 **Example .env**

```env
PORT=3001
JWT_SECRET=my-super-secret-jwt-key-2024
EMAIL_USER=admin@bioping.com
EMAIL_PASS=abcd efgh ijkl mnop
```

**Note**: Replace with your actual Gmail and App Password! 