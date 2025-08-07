// Production configuration for deployment
// This file should be used for setting environment variables in your deployment platform

module.exports = {
  // Database
  MONGODB_URI: 'mongodb+srv://universal:universal07@cluster0.f2z1iic.mongodb.net/bioping?retryWrites=true&w=majority&appName=Cluster0',
  
  // JWT
  JWT_SECRET: 'bioping-super-secure-jwt-secret-key-2025-very-long-and-random-string',
  
  // Stripe
  STRIPE_SECRET_KEY: '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',
  STRIPE_WEBHOOK_SECRET: 'whsec_your_webhook_secret_here',
  
  // Email
  EMAIL_USER: 'universalx0242@gmail.com',
  EMAIL_PASS: 'your_gmail_app_password_here',
  
  // Server
  PORT: '10000',
  NODE_ENV: 'production'
}; 