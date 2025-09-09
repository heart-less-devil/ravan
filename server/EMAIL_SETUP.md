# Email OTP Setup Guide

## 🚀 **Real Email OTP Configuration**

### **Step 1: Bioping Email Setup**

1. **Set up support@bioping.com email account**:
   - Create email account with your hosting provider
   - Configure SMTP settings for the domain
   - Enable email forwarding if needed

2. **Alternative: Gmail Setup (if using Gmail for support@bioping.com)**:
   - Go to your Google Account Settings
   - Security → 2-Step Verification → Turn on
   - Generate App Password for Mail

### **Step 2: Update .env File**

Edit `server/.env` file:

```env
# Server Configuration
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (Bioping Email)
EMAIL_USER=support@bioping.com
EMAIL_PASS=your-email-password-or-app-password
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
EMAIL_USER=support@bioping.com
EMAIL_PASS=your-bioping-email-password
```

**Note**: Replace with your actual Bioping email credentials! 