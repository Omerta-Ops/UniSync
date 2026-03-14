#!/bin/bash

echo "🚀 Unisync - Complete Setup Script"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
echo -e "${YELLOW}Checking PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${BLUE}PostgreSQL not found. Installing with Homebrew...${NC}"
    brew install postgresql@15
fi

# Start PostgreSQL if not running
brew services start postgresql@15

# Create database
echo -e "${BLUE}Creating database...${NC}"
psql postgres -c "CREATE DATABASE unisync;" 2>/dev/null || echo "Database might already exist"

# Install backend dependencies
echo -e "${BLUE}Installing backend dependencies...${NC}"
cd backend
npm install

# Run migrations
echo -e "${BLUE}Running database migrations...${NC}"
npm run migrate

# Go back to root
cd ..

# Install frontend dependencies
echo -e "${BLUE}Installing frontend dependencies...${NC}"
npm install

echo ""
echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo -e "${YELLOW}To start the application:${NC}"
echo ""
echo -e "${BLUE}Terminal 1 - Backend:${NC}"
echo "cd backend && npm run dev"
echo ""
echo -e "${BLUE}Terminal 2 - Frontend:${NC}"
echo "npm run dev"
echo ""
echo -e "${YELLOW}Backend will run on: http://localhost:9000${NC}"
echo -e "${YELLOW}Frontend will run on: http://localhost:5173${NC}"
echo ""
