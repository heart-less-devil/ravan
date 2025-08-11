# BioPing - Business Development Platform

A comprehensive platform for business development professionals in the biotech and pharmaceutical industries.

## Features

- **BD Tracker**: Track and manage business development opportunities
- **BD Insights**: Access to strategic resources and industry insights
- **User Management**: Secure authentication and user profiles
- **PDF Resources**: Comprehensive collection of BD resources and guides

## Tech Stack

- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Hosting**: GoDaddy (Frontend), Render (Backend)

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm start`

## Deployment

- **Frontend**: Deployed on GoDaddy hosting
- **Backend**: Deployed on Render cloud platform
- **PDFs**: Served from Render backend with proper CORS and X-Frame-Options headers

## Recent Updates

- Fixed PDF loading issues on live website
- Enhanced SimplePDFViewer component with iframe support
- Updated X-Frame-Options to ALLOWALL for cross-domain embedding
- Added fallback URL support for PDF loading
- Improved error handling and debugging information

# Force redeploy - PDF fixes applied

# Force Render redeploy - Server X-Frame-Options headers need deployment

# Added Project Name field to BD Tracker - Backend updated

# Fixed BD Tracker POST/PUT endpoints - Project Name validation working

# Enhanced BD Tracker dropdowns - CDA and Priority fields with proper options

# Fixed BD Tracker edit functionality - Deep copy prevents data corruption

# Updated sidebar navigation - "Search" changed to "Advanced Search" 