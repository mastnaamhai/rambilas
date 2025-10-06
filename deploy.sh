#!/bin/bash

# Production Deployment Script
# This script builds and deploys the application for production

set -e

echo "🚀 Starting production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found. Please create one based on env.example"
    exit 1
fi

# Build frontend
print_status "Building frontend..."
npm run build

# Build backend
print_status "Building backend..."
cd backend
npm run build
cd ..

print_status "Build completed successfully!"

# Optional: Docker build (uncomment if using Docker)
# print_status "Building Docker images..."
# docker build -t ailc-frontend .
# docker build -t ailc-backend ./backend

print_status "Deployment preparation completed!"
print_warning "Remember to:"
print_warning "1. Set up your production environment variables"
print_warning "2. Configure your database connection"
print_warning "3. Set up proper CORS origins"
print_warning "4. Configure your domain names in the environment files"
