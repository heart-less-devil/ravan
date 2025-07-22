# BioPing - Biotech Business Development Platform

A comprehensive platform for biotech business development professionals to connect with potential partners.

## Features

- 🔐 **Secure Authentication**: Email verification with OTP
- 👥 **User Management**: Signup, login, and user profiles
- 🔍 **Advanced Search**: Search biotech companies by various criteria
- 📊 **Admin Panel**: Complete admin interface for data management
- 📧 **Email Integration**: Automated email notifications
- 🛡️ **Admin Security**: Restricted admin access to specific email
- 💾 **Data Persistence**: Permanent file-based storage for all data
- 🔄 **Auto Backup**: Automatic data saving and backup system

## Setup Instructions

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

### 2. Email Configuration

For email OTP functionality, you need to configure Gmail:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. **Update the .env file** in the server directory:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
JWT_SECRET=your-super-secret-jwt-key
PORT=3001
```

### 3. Start the Application

```bash
# Start the backend server (from server directory)
cd server
npm start

# Start the frontend (from root directory)
npm start
```

### 4. Data Management

```bash
# Create backup of all data
cd server
npm run backup

# View data files
cd server/data
ls -la *.json
```

## Admin Access

- **Admin Email**: `universalx0242@gmail.com`
- **Admin Password**: `password`
- **Admin URL**: `http://localhost:3000/admin/login`

Only users with the email `universalx0242@gmail.com` can access the admin panel.

## API Endpoints

### Authentication
- `POST /api/auth/send-verification` - Send OTP email
- `POST /api/auth/verify-email` - Verify email code
- `POST /api/auth/create-account` - Create user account
- `POST /api/auth/login` - User login

### Admin (Protected)
- `GET /api/admin/biotech-data` - Get all biotech data
- `POST /api/admin/upload-excel` - Upload Excel files
- `DELETE /api/admin/delete-records` - Delete records
- `GET /api/admin/stats` - Get admin statistics
- `GET /api/admin/users` - Get all users

### Search
- `POST /api/search-biotech` - Search biotech companies
- `POST /api/get-contacts` - Get contact details (paid feature)

## Development

- **Frontend**: React with Tailwind CSS
- **Backend**: Node.js with Express
- **Authentication**: JWT tokens
- **Email**: Nodemailer with Gmail
- **File Upload**: Multer for Excel files
- **Data Storage**: File-based JSON persistence
- **Backup System**: Automated data backups

## Security Features

- JWT-based authentication
- Admin-only access to sensitive endpoints
- Email verification for new users
- Password hashing with bcrypt
- CORS protection
- Input validation with express-validator

## Deployment

The application is ready for deployment to AWS or any cloud platform. Make sure to:

1. Set up environment variables
2. Configure email settings
3. Set up data persistence (files are automatically created)
4. Configure CORS for your domain
5. Set up SSL certificates
6. Set up automated backups (optional)

### AWS Deployment Benefits:
- ✅ **Data Persistence**: Excel uploads survive server restarts
- ✅ **No Database Required**: File-based storage works immediately
- ✅ **Easy Scaling**: Can migrate to MongoDB when needed
- ✅ **Automatic Backups**: Data is saved every 5 minutes
- ✅ **Crash Recovery**: Data survives server crashes

## Support

For any issues or questions, please contact the development team. 