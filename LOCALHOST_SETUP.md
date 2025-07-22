# 🏠 Localhost Development Setup

## **📋 Quick Start (3 Steps)**

### **Step 1: Install Dependencies**
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### **Step 2: Start Both Frontend & Backend**
```bash
# This will start both frontend and backend simultaneously
npm run dev
```

### **Step 3: Open Your Browser**
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001

## **🎯 Alternative: Run Separately**

### **Frontend Only:**
```bash
npm start
```
Frontend will run on: http://localhost:3000

### **Backend Only:**
```bash
npm run server
```
Backend will run on: http://localhost:3001

## **🔧 Environment Setup**

### **Create .env file in root directory:**
```bash
# Frontend environment variables
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ENV=development
```

### **Create .env file in server directory:**
```bash
# Backend environment variables
JWT_SECRET=your-local-jwt-secret-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
NODE_ENV=development
PORT=3001
```

## **📱 Available Scripts**

```bash
# Start both frontend and backend
npm run dev

# Start only frontend
npm start

# Start only backend
npm run server

# Build for production
npm run build

# Test
npm test
```

## **🔍 Testing Your Setup**

### **Frontend (http://localhost:3000):**
- ✅ Home page loads
- ✅ Navigation works
- ✅ Login/Signup forms
- ✅ PDF viewer
- ✅ Admin panel

### **Backend (http://localhost:3001):**
- ✅ Health check: http://localhost:3001/api/health
- ✅ Login: POST http://localhost:3001/api/auth/login
- ✅ Signup: POST http://localhost:3001/api/auth/signup

## **🚨 Troubleshooting**

### **Port Already in Use:**
```bash
# Kill process on port 3000
npx kill-port 3000

# Kill process on port 3001
npx kill-port 3001
```

### **Dependencies Issues:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# For server
cd server
rm -rf node_modules package-lock.json
npm install
cd ..
```

### **CORS Issues:**
- Backend is already configured for localhost:3000
- Check if both servers are running

### **Database Issues:**
- Data is stored in JSON files in `server/data/`
- Files are automatically created on first run

## **🎯 Development Workflow**

1. **Start development:** `npm run dev`
2. **Make changes** to your code
3. **Frontend auto-reloads** on save
4. **Backend auto-reloads** (if using nodemon)
5. **Test changes** in browser

## **📁 File Structure for Development**

```
ravan/
├── src/                 # Frontend React code
├── server/              # Backend Node.js code
├── public/              # Static files
├── package.json         # Frontend dependencies
├── server/package.json  # Backend dependencies
└── .env                 # Environment variables
```

## **✅ Success Indicators**

- ✅ Frontend loads at http://localhost:3000
- ✅ Backend responds at http://localhost:3001
- ✅ Login/Signup works
- ✅ PDF viewer works
- ✅ Admin panel accessible
- ✅ No console errors

**Your app is now running locally!** 🎉 