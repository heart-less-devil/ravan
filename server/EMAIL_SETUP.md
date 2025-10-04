# Email OTP Setup Guide

## 🚀 **Real Email OTP Configuration**

### **Step 1: cPanel Email Setup**

1. **Set up support@thebioping.com email account**:
   - Create email account in cPanel
   - Use the following SMTP settings from cPanel:
     - **Host**: mail.thebioping.com
     - **Port**: 465 (SSL/TLS)
     - **Username**: support@thebioping.com
     - **Password**: [Your email account password]

### **Step 2: Update .env File**

Edit `server/.env` file:

```env
# Server Configuration
PORT=3005
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (cPanel Mail Settings)
EMAIL_USER=support@thebioping.com
EMAIL_PASS=your-email-password

# cPanel SMTP Settings
SMTP_HOST=mail.thebioping.com
SMTP_PORT=465
SMTP_SECURE=true
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

- ✅ Real cPanel SMTP (mail.thebioping.com)
- ✅ HTML email templates
- ✅ Error handling
- ✅ Debug mode for development
- ✅ Production deployment ready

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
PORT=3005
JWT_SECRET=my-super-secret-jwt-key-2024
EMAIL_USER=support@thebioping.com
EMAIL_PASS=your-bioping-email-password
SMTP_HOST=mail.thebioping.com
SMTP_PORT=465
SMTP_SECURE=true
```

**Note**: Replace with your actual thebioping.com email credentials from cPanel! 