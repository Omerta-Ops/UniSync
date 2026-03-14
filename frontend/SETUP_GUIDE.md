# Unisync - Complete Setup Guide

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

## Quick Start

### 1. Initial Setup

```bash
# Make setup script executable
chmod +x setup.sh

# Run setup script (automated)
./setup.sh
```

Or manually:

```bash
# Backend setup
cd backend
npm install
npm run migrate

# Frontend setup (in another terminal)
cd ..
npm install
```

### 2. Configure Environment

**Backend (.env file):**
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your database credentials:
```env
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_HOST=localhost
DATABASE_NAME=unisync
PORT=9000
```

### 3. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:9000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
# Runs on http://localhost:5173
```

## Features Implemented

✅ User Registration
- Email validation
- Password hashing with bcrypt
- Automatic user creation

✅ User Login
- Email/password authentication
- JWT token generation
- Refresh token mechanism

✅ Password Reset
- Forgot password flow
- Email verification
- Secure token-based reset

✅ User Profile Management
- Get current user info
- Update profile
- Change password

✅ Security
- Rate limiting
- CORS configuration
- SQL injection prevention
- Password hashing

✅ Error Handling
- Comprehensive error messages
- Input validation
- Request logging

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new account
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Complete password reset

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update profile

### Health
- `GET /health` - Health check

## Test the Application

### 1. Register a New User

Click "Click here to continue" on the main page, then "Sign up"

Enter:
- First Name: John
- Last Name: Doe
- Email: john@example.com
- Password: SecurePassword123

### 2. Login

Click "Sign in" and use the credentials from registration

### 3. Password Reset

Click "Forgot password?" and enter your email

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# Start PostgreSQL
brew services start postgresql@15

# Check status
brew services list
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::9000
```

**Solution:**
```bash
# Find process using port 9000
lsof -i :9000

# Kill the process
kill -9 <PID>
```

### Module Not Found
```
Error: Cannot find module 'express'
```

**Solution:**
```bash
# Reinstall dependencies
npm install

# In backend directory
cd backend
npm install
```

### Database Doesn't Exist
```
Error: database "unisync" does not exist
```

**Solution:**
```bash
# Create database
psql postgres -c "CREATE DATABASE unisync;"

# Run migrations
cd backend
npm run migrate
```

## Project Structure

```
unisync/
├── backend/
│   ├── src/
│   │   ├── server.js          # Express app
│   │   ├── config/
│   │   │   └── database.js    # Database connection
│   │   ├── middleware/        # Auth, validation, logging
│   │   ├── routes/            # API endpoints
│   │   ├── models/            # Database queries
│   │   ├── utils/             # Email, helpers
│   │   └── database/
│   │       └── migrations.js  # Database schema
│   ├── package.json
│   ├── .env                   # Environment variables
│   └── README.md
│
├── src/
│   ├── api/
│   │   └── client.ts          # API client
│   ├── hooks/
│   │   └── useAuth.ts         # Auth hook
│   ├── app/
│   │   ├── App.tsx
│   │   └── components/        # React components
│   └── styles/
│
├── index.html
├── package.json
└── vite.config.ts
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Development Tips

### View Logs
Backend logs are printed in the terminal running the server.

### Test API with cURL

```bash
# Register
curl -X POST http://localhost:9000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login
curl -X POST http://localhost:9000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'

# Get user (replace TOKEN)
curl http://localhost:9000/api/users/me \
  -H "Authorization: Bearer TOKEN"
```

### Hot Reload
Both frontend and backend support hot reload during development:
- Frontend: Changes auto-reload with Vite
- Backend: Changes auto-reload with Nodemon

### Environment Variables
For production, update these:
- `NODE_ENV=production`
- `JWT_SECRET` - Generate a strong secret
- `DATABASE_URL` - Production database URL
- `FRONTEND_URL` - Production frontend URL
- `EMAIL_*` - Real email credentials

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review API endpoints documentation
3. Check backend logs in terminal
4. Verify database connection
5. Ensure ports 5173 and 9000 are available

## Next Steps

1. ✅ Complete working authentication system
2. 🔄 Add email notifications (optional)
3. 🔄 Add OAuth integration (optional)
4. 🔄 Deploy to production (optional)
