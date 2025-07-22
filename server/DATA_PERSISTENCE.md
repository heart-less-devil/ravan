# Data Persistence System

## Overview
The application now uses file-based data persistence to ensure data survives server restarts, refreshes, and deployments.

## Data Files
All data is stored in JSON files in the `server/data/` directory:

- `biotechData.json` - Excel upload data
- `users.json` - Registered users
- `verificationCodes.json` - Email verification codes
- `uploadedFiles.json` - File upload history

## Features

### ✅ **Automatic Data Loading**
- Data is automatically loaded when server starts
- No data loss on server restart

### ✅ **Automatic Data Saving**
- Data is saved immediately after any changes
- Periodic saves every 5 minutes
- Data saved on server shutdown

### ✅ **Backup System**
- Daily backups in `server/backups/` directory
- Manual backup: `npm run backup`
- Automatic backup: `npm run backup-daily`

### ✅ **AWS Deployment Ready**
- Data persists across deployments
- No database required for basic functionality
- Easy to migrate to MongoDB later

## File Structure
```
server/
├── data/
│   ├── biotechData.json
│   ├── users.json
│   ├── verificationCodes.json
│   └── uploadedFiles.json
├── backups/
│   └── YYYY-MM-DD/
│       ├── biotechData.json
│       ├── users.json
│       ├── verificationCodes.json
│       └── uploadedFiles.json
└── backup.js
```

## Usage

### Starting Server
```bash
cd server
npm start
```
Data will be automatically loaded from files.

### Manual Backup
```bash
cd server
npm run backup
```

### View Data Files
```bash
cd server/data
ls -la *.json
```

## AWS Deployment

### 1. Data Persistence
- Data files will persist in AWS EC2 instance
- Survives server restarts and deployments
- No data loss during updates

### 2. Backup Strategy
- Set up daily automated backups
- Store backups in S3 for redundancy
- Easy data recovery if needed

### 3. Scaling Considerations
- For high traffic, consider MongoDB
- Current system works for small-medium scale
- Easy migration path to database

## Security
- Data files are stored locally on server
- No sensitive data exposed in logs
- Backup files are date-stamped
- Easy to implement encryption if needed

## Monitoring
- Console logs show data loading/saving
- File sizes indicate data growth
- Backup completion notifications
- Error logging for data operations 