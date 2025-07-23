// Production Configuration for GoDaddy VPS
module.exports = {
  NODE_ENV: 'production',
  PORT: process.env.PORT || 3001,
  
  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI || 'your_mongodb_atlas_connection_string',
  
  // JWT Secret
  JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
  
  // Email Configuration
  EMAIL_USER: process.env.EMAIL_USER || 'your_email@gmail.com',
  EMAIL_PASS: process.env.EMAIL_PASS || 'your_app_password',
  
  // Admin Credentials
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@bioping.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'your_admin_password',
  
  // CORS Configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'https://yourdomain.com'
}; 