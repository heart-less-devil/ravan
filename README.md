# BioPing - Complete User Signup System

A full-stack user signup system with email verification, MongoDB integration, and admin dashboard.

## 🚀 Features

### ✅ User Signup System
- **Complete signup form** with name, email, password, company, and role
- **Email verification** with 6-digit OTP sent via Nodemailer
- **Modal popup** for OTP entry with resend functionality
- **Password strength indicator** with real-time feedback
- **Form validation** with error handling

### ✅ Backend Features
- **Node.js + Express** server with MongoDB integration
- **JWT authentication** for secure sessions
- **Email verification** using Nodemailer and Gmail SMTP
- **Password hashing** with bcrypt
- **MongoDB Atlas** cloud database
- **Admin endpoints** for user management

### ✅ Admin Dashboard
- **User management** with view and delete functionality
- **User statistics** (total users, verified users, unique companies)
- **Real-time data** from MongoDB
- **Responsive design** with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **React.js** - User interface
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Router** - Navigation
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Nodemailer** - Email service
- **bcrypt** - Password hashing
- **JWT** - Authentication
- **Express Validator** - Input validation

## 📁 Project Structure

```
ravan/
├── src/
│   ├── components/
│   │   ├── Header.js
│   │   ├── Footer.js
│   │   └── VerificationModal.js
│   ├── pages/
│   │   ├── Signup.js
│   │   ├── Login.js
│   │   ├── AdminUsers.js
│   │   └── ...
│   └── App.js
├── server/
│   ├── models/
│   │   ├── User.js
│   │   └── VerificationCode.js
│   ├── config/
│   │   └── database.js
│   └── index.js
└── README.md
```

## 🗄️ Database Schema

### User Model
```javascript
{
  firstName: String (required),
  lastName: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  company: String (required),
  role: String (enum),
  isVerified: Boolean (default: false),
  isActive: Boolean (default: true),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### VerificationCode Model
```javascript
{
  email: String (required),
  code: String (required, 6 digits),
  expiresAt: Date (required),
  isUsed: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

## 🚀 Installation & Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd ravan
```

### 2. Install dependencies
```bash
# Frontend dependencies
npm install

# Backend dependencies
cd server
npm install
```

### 3. Environment Configuration

Create `.env` file in the `server` directory:
```env
# Server Configuration
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/biping-db?retryWrites=true&w=majority

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 4. Start the servers
```bash
# Start backend server
cd server
npm start

# Start frontend server (in new terminal)
npm start
```

## 📧 Email Setup

### Gmail Configuration
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password
3. Use the App Password in `EMAIL_PASS` (not your regular password)

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/send-verification` - Send OTP email
- `POST /api/auth/verify-email` - Verify OTP code
- `POST /api/auth/create-account` - Create user account
- `POST /api/auth/login` - User login

### Admin (Protected)
- `GET /api/admin/users` - Get all users
- `DELETE /api/admin/users/:id` - Delete user

## 🎯 Usage

### User Signup Flow
1. **Fill signup form** at `/signup`
2. **Click "Send Verification Code"**
3. **Check email** for 6-digit OTP
4. **Enter OTP** in modal popup
5. **Account created** and redirected to login

### Admin Dashboard
1. **Login** as admin user
2. **Navigate** to `/admin/users`
3. **View all users** with statistics
4. **Delete users** as needed

## 🔒 Security Features

- **Password hashing** with bcrypt
- **JWT authentication** for protected routes
- **Email verification** with OTP
- **Input validation** with express-validator
- **CORS protection** for cross-origin requests
- **Environment variables** for sensitive data

## 📊 Admin Features

- **User Statistics**: Total users, verified users, unique companies
- **User Management**: View, delete users
- **Real-time Data**: Live updates from MongoDB
- **Responsive Design**: Works on all devices

## 🐛 Troubleshooting

### Common Issues
1. **Email not sending**: Check Gmail credentials and App Password
2. **MongoDB connection error**: Verify connection string and network
3. **CORS errors**: Check server configuration
4. **JWT errors**: Verify JWT_SECRET in environment

### Debug Mode
The signup form includes comprehensive console logging for debugging:
- Form validation steps
- API call status
- Error messages
- User data flow

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Built with ❤️ using React, Node.js, and MongoDB** 