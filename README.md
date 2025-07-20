# BioPing - Complete Application

A full-stack React application with backend authentication and dashboard functionality.

## Features

### Frontend
- ✅ Pixel-perfect BioPing homepage
- ✅ Complete dashboard interface
- ✅ Authentication system
- ✅ Responsive design
- ✅ Modern UI with animations

### Backend
- ✅ Express.js server
- ✅ JWT authentication
- ✅ Protected routes
- ✅ API endpoints for dashboard data
- ✅ Password hashing with bcrypt

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Environment File

Create a `.env` file in the root directory:

```env
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

### 3. Start the Application

#### Development Mode (Both Frontend and Backend)
```bash
npm run dev
```

#### Or Start Separately:

**Backend Server:**
```bash
npm run server
```

**Frontend Development Server:**
```bash
npm start
```

## Login Credentials

Use these demo credentials to access the dashboard:

- **Email:** `amankk0007@gmail.com`
- **Password:** `Wildboy07@`

## Application Structure

### Frontend Routes
- `/` - Homepage (public)
- `/login` - Login page (public)
- `/dashboard` - Main dashboard (protected)
- `/dashboard/search` - Search interface (protected)
- `/dashboard/saved-searches` - Saved searches (protected)
- `/dashboard/resources/*` - Resource pages (protected)

### Backend API Endpoints
- `POST /api/auth/login` - User authentication
- `GET /api/auth/profile` - Get user profile (protected)
- `GET /api/dashboard/*` - Dashboard data endpoints (protected)

### Dashboard Features
- **Main Dashboard** - Overview with BioPing database info
- **Search** - Advanced search interface with filters
- **Saved Searches** - View saved search queries
- **Definitions** - Industry terminology and explanations
- **Self Coaching Tips** - Professional development resources
- **Free Content** - Available resources and consulting
- **Legal Disclaimer** - Terms and conditions
- **Contact** - Support information

## Technology Stack

### Frontend
- React 18
- React Router DOM
- Framer Motion (animations)
- Lucide React (icons)
- Tailwind CSS (styling)

### Backend
- Express.js
- JWT (authentication)
- bcryptjs (password hashing)
- CORS (cross-origin requests)
- express-validator (input validation)

## Development Notes

- The backend runs on `http://localhost:5000`
- The frontend runs on `http://localhost:3000`
- JWT tokens are stored in localStorage
- All dashboard routes require authentication
- The application uses dummy data for demonstration

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Protected API routes
- Input validation
- CORS configuration

## File Structure

```
ravan/
├── src/
│   ├── components/
│   │   ├── Header.js
│   │   └── Footer.js
│   ├── pages/
│   │   ├── Home.js
│   │   ├── Dashboard.js
│   │   ├── Login.js
│   │   └── ...
│   ├── img/
│   │   └── image.webp
│   └── App.js
├── server/
│   └── index.js
├── package.json
└── README.md
```

## Getting Started

1. Clone the repository
2. Run `npm install`
3. Create `.env` file with the provided configuration
4. Run `npm run dev` to start both frontend and backend
5. Navigate to `http://localhost:3000`
6. Use the demo credentials to login and access the dashboard

The application is now ready to use with full authentication and dashboard functionality! 