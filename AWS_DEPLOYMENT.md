# AWS Deployment Guide

## 🚀 **Complete AWS Deployment Setup**

### **Step 1: AWS EC2 Instance Setup**

#### **1.1 Create EC2 Instance**
- **Instance Type**: t2.micro (Free tier) or t2.small
- **OS**: Amazon Linux 2 or Ubuntu 20.04
- **Storage**: 20GB minimum
- **Security Group**: Open ports 22 (SSH), 80 (HTTP), 443 (HTTPS), 3001 (App)

#### **1.2 Security Group Configuration**
```
Inbound Rules:
- SSH (22) - Your IP
- HTTP (80) - 0.0.0.0/0
- HTTPS (443) - 0.0.0.0/0
- Custom TCP (3001) - 0.0.0.0/0
```

### **Step 2: Server Setup**

#### **2.1 Connect to EC2**
```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
```

#### **2.2 Install Dependencies**
```bash
# Update system
sudo yum update -y

# Install Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 16
nvm use 16

# Install PM2 (Process Manager)
npm install -g pm2

# Install Git
sudo yum install git -y
```

#### **2.3 Clone and Setup Application**
```bash
# Clone repository
git clone https://github.com/your-repo/ravan.git
cd ravan

# Install dependencies
npm install
cd server
npm install

# Create data directories
mkdir -p data backups
```

### **Step 3: Environment Configuration**

#### **3.1 Production .env File**
Create `server/.env`:
```env
# Production Environment
PORT=3001
NODE_ENV=production
JWT_SECRET=bioping-super-secret-jwt-key-2024-production

# Email Configuration
EMAIL_USER=universalx0242@gmail.com
EMAIL_PASS=ynlm rrap pglu qynu

# AWS Settings
CORS_ORIGIN=https://your-domain.com
```

#### **3.2 Frontend Configuration**
Update `src/config.js`:
```javascript
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://your-ec2-ip:3001';
export const ADMIN_API_BASE_URL = process.env.REACT_APP_ADMIN_API_URL || 'http://your-ec2-ip:3001';
```

### **Step 4: Application Deployment**

#### **4.1 Build Frontend**
```bash
# Build React app
npm run build

# Copy build to server
cp -r build/* /var/www/html/
```

#### **4.2 Start Backend with PM2**
```bash
cd server

# Start application
pm2 start index.js --name "bioping-backend"

# Save PM2 configuration
pm2 save
pm2 startup

# Check status
pm2 status
pm2 logs bioping-backend
```

### **Step 5: Nginx Configuration**

#### **5.1 Install Nginx**
```bash
sudo yum install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### **5.2 Configure Nginx**
Create `/etc/nginx/conf.d/bioping.conf`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### **5.3 Restart Nginx**
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### **Step 6: SSL Certificate (Optional)**

#### **6.1 Install Certbot**
```bash
sudo yum install certbot python3-certbot-nginx -y
```

#### **6.2 Get SSL Certificate**
```bash
sudo certbot --nginx -d your-domain.com
```

### **Step 7: Data Persistence Setup**

#### **7.1 Create Data Directories**
```bash
# Create persistent data directories
sudo mkdir -p /home/ec2-user/data
sudo mkdir -p /home/ec2-user/backups

# Set permissions
sudo chown -R ec2-user:ec2-user /home/ec2-user/data
sudo chown -R ec2-user:ec2-user /home/ec2-user/backups
```

#### **7.2 Setup Auto Backup**
```bash
# Create backup script
sudo nano /home/ec2-user/backup.sh
```

Add to backup script:
```bash
#!/bin/bash
cd /home/ec2-user/ravan/server
npm run backup
```

```bash
# Make executable
chmod +x /home/ec2-user/backup.sh

# Add to crontab (daily backup)
crontab -e
# Add: 0 2 * * * /home/ec2-user/backup.sh
```

### **Step 8: Monitoring and Logs**

#### **8.1 PM2 Monitoring**
```bash
# Monitor application
pm2 monit

# View logs
pm2 logs bioping-backend

# Restart if needed
pm2 restart bioping-backend
```

#### **8.2 Nginx Logs**
```bash
# View access logs
sudo tail -f /var/log/nginx/access.log

# View error logs
sudo tail -f /var/log/nginx/error.log
```

### **Step 9: Testing**

#### **9.1 Test Endpoints**
```bash
# Test backend
curl http://your-ec2-ip:3001/api/health

# Test frontend
curl http://your-ec2-ip
```

#### **9.2 Test Email OTP**
1. Go to: `http://your-domain.com/signup`
2. Fill form with real email
3. Check email for OTP
4. Verify signup process

### **Step 10: Security Checklist**

#### **10.1 Firewall**
```bash
# Configure firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

#### **10.2 Environment Variables**
- ✅ JWT_SECRET changed
- ✅ Email credentials set
- ✅ CORS configured
- ✅ Production mode enabled

#### **10.3 Data Backup**
- ✅ Auto backup configured
- ✅ Data persistence working
- ✅ Backup verification

### **Step 11: Domain Configuration**

#### **11.1 DNS Setup**
- Point domain to EC2 IP
- A record: `your-domain.com` → `your-ec2-ip`
- CNAME: `www.your-domain.com` → `your-domain.com`

#### **11.2 SSL Certificate**
```bash
# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### **Step 12: Final Verification**

#### **12.1 Application URLs**
- **Frontend**: `https://your-domain.com`
- **Admin**: `https://your-domain.com/admin/login`
- **API**: `https://your-domain.com/api`

#### **12.2 Admin Access**
- Email: `universalx0242@gmail.com`
- Password: `password`

#### **12.3 Data Persistence**
- Excel uploads survive restarts
- User data permanent
- Auto backup working

## 🎯 **Deployment Checklist**

- ✅ EC2 instance running
- ✅ Node.js installed
- ✅ Application deployed
- ✅ Nginx configured
- ✅ SSL certificate installed
- ✅ Email OTP working
- ✅ Admin panel accessible
- ✅ Data persistence working
- ✅ Auto backup configured
- ✅ Monitoring setup

## 📞 **Support**

If you encounter issues:
1. Check PM2 logs: `pm2 logs bioping-backend`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Test endpoints: `curl http://localhost:3001/api/health`
4. Verify email: `npm run test-email`

**Your application is now ready for production!** 🚀 