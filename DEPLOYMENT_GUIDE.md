# BioPing Backend Deployment Guide

## Environment Variables to Set in Render Dashboard

After deploying to Render, set these environment variables in your service dashboard:

### Required Variables:
- `JWT_SECRET`: `bioping-super-secure-jwt-secret-key-2025-very-long-and-random-string`
- `NODE_ENV`: `production`
- `MONGODB_URI`: `mongodb+srv://universal:universal07@cluster0.f2z1iic.mongodb.net/bioping?retryWrites=true&w=majority&appName=Cluster0`
- `PORT`: `10000`

### Stripe Configuration:
- `STRIPE_SECRET_KEY`: `your_stripe_secret_key_here`
- `STRIPE_WEBHOOK_SECRET`: `whsec_your_webhook_secret_here`

### Email Configuration:
- `EMAIL_USER`: `universalx0242@gmail.com`
- `EMAIL_PASS`: `your_gmail_app_password_here`

## Deployment Steps:

1. Connect your GitHub repository to Render
2. Use the `render.yaml` file for configuration
3. Set the environment variables listed above
4. Deploy the service

## Server Health Check:
Once deployed, test the server at: `https://your-service-name.onrender.com/api/health` 