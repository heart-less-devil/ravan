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

# Fixed BD Tracker table - Added Priority column, improved dropdown styling, fixed edit functionality

# Fixed BDTrackerPage - Added Project Name column, updated validation and search logic

# Fixed sidebar navigation - "Advance Search" corrected to "Advanced Search"

# Enhanced delete functionality - Added debugging and better error handling

# Fixed update functionality - Added validation, debugging, and proper form reset

# Fixed select dropdown styling - Better padding, colors, and text visibility

# Fixed backend ID format handling - Support for both id and _id formats

# Fixed admin panel access - Multiple admin emails supported

# Fixed admin panel routing - Added dashboard admin routes

# Enhanced BD Tracker with mobile-responsive design - Phone/PC compatible layout

# Enhanced mobile responsiveness - Added scroll hints and better mobile layout

# Fixed BD Tracker edit functionality - Only one row edits at a time, fixed ID format handling

# Documented 404 error fix - Frontend deployment issue on GoDaddy hosting

# Fixed box widths to 350px - Both Current Plan and Upgrade Your Plan boxes now have consistent width

# Fixed double arrows in BD Tracker dropdowns - Removed custom arrows to prevent duplication

# Enhanced dropdown styling - Better padding, borders, and text visibility for all BD Tracker dropdowns

# Fixed dropdown width - Set min-width to 200px for better text visibility in all dropdowns

# Adjusted dropdown width - Reduced from 200px to 150px for better proportions

# Fixed table layout - Actions column overflow and horizontal scrolling issues resolved

# Fixed edit mode overflow - Compact dropdowns and inputs prevent table expansion beyond container

# Simplified dropdown placeholders - Changed from verbose text to simple "Select" for cleaner UI

# Optimized column widths - Outreach Dates and Contact Function made narrower, CDA and Priority made wider for better text visibility

# Fixed email overflow - Added text truncation and width constraints to prevent email from overflowing containers

# Reduced email text size - Changed from text-sm to text-xs for more compact display in profile cards

# Removed debug information - Cleaned up BD Insights page by removing development debug section and console logs

# Optimized login page layout - Moved logo higher and reduced spacing for better alignment with right side content 