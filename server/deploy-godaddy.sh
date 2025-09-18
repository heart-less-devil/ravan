#!/bin/bash

# GoDaddy VPS Deployment Script
echo "Starting deployment to GoDaddy VPS..."

# Install dependencies
npm install --production

# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

echo "Deployment completed!"
echo "Check status with: pm2 status"
echo "View logs with: pm2 logs bioping-backend" 