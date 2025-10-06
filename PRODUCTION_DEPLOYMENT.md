# Production Deployment Guide

This guide covers deploying the All India Logistics application to production.

## Prerequisites

- Node.js 18+ installed
- MongoDB database (MongoDB Atlas recommended)
- Domain names for frontend and backend
- SSL certificates (handled by hosting provider)

## Environment Setup

1. **Copy environment template:**
   ```bash
   cp env.example .env
   ```

2. **Configure environment variables:**
   ```bash
   # Database
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/all-india-logistics?retryWrites=true&w=majority
   
   # Server
   PORT=8080
   NODE_ENV=production
   
   # CORS (Update with your actual frontend URL)
   CORS_ORIGIN=https://your-frontend-domain.com
   
   # JWT (Generate a strong secret)
   JWT_SECRET=your-super-secure-jwt-secret-key-change-this-in-production
   JWT_EXPIRE=7d
   
   # Application Password (Generate a new secure password hash)
   APP_PASSWORD_HASH=your-secure-password-hash-here
   
   # File Upload
   UPLOADS_DIR=/app/uploads
   
   # API Keys
   GEMINI_API_KEY=your-gemini-api-key-here
   VITE_GSTIN_API_KEY=your-gstin-api-key-here
   
   # Google Cloud (if using GCS)
   GOOGLE_APPLICATION_CREDENTIALS=/app/credentials.json
   GOOGLE_CLOUD_PROJECT=your-project-id
   ```

3. **Frontend environment variables:**
   ```bash
   # Create .env file in root directory
   VITE_API_URL=https://your-backend-domain.com
   VITE_GSTIN_API_KEY=your-gstin-api-key-here
   ```

## Deployment Options

### Option 1: Traditional VPS/Server

1. **Install dependencies:**
   ```bash
   npm install
   cd backend && npm install
   ```

2. **Build the application:**
   ```bash
   ./deploy.sh
   ```

3. **Start the backend:**
   ```bash
   cd backend
   npm start
   ```

4. **Serve the frontend:**
   ```bash
   # Using a web server like nginx or serve
   npx serve -s dist -l 3000
   ```

### Option 2: Docker Deployment

1. **Build Docker images:**
   ```bash
   # Frontend
   docker build -t ailc-frontend .
   
   # Backend
   docker build -t ailc-backend ./backend
   ```

2. **Run containers:**
   ```bash
   # Backend
   docker run -d --name ailc-backend -p 8080:8080 --env-file .env ailc-backend
   
   # Frontend
   docker run -d --name ailc-frontend -p 3000:3000 ailc-frontend
   ```

### Option 3: Cloud Platform Deployment

#### Google Cloud Run

1. **Deploy backend:**
   ```bash
   gcloud run deploy ailc-backend \
     --source ./backend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

2. **Deploy frontend:**
   ```bash
   gcloud run deploy ailc-frontend \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

#### Netlify (Frontend) + Render (Backend)

1. **Deploy backend to Render:**
   - Connect your GitHub repository
   - Set build command: `cd backend && npm run build`
   - Set start command: `cd backend && npm start`
   - Add environment variables

2. **Deploy frontend to Netlify:**
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variables

## Security Checklist

- [ ] Change default JWT secret
- [ ] Change default application password
- [ ] Use HTTPS in production
- [ ] Configure proper CORS origins
- [ ] Set up proper file upload limits
- [ ] Enable database authentication
- [ ] Use environment variables for all secrets
- [ ] Set up proper logging and monitoring

## Monitoring and Maintenance

1. **Health checks:**
   - Backend: `https://your-backend-domain.com/health`
   - Frontend: Check if the app loads correctly

2. **Logs:**
   - Monitor application logs for errors
   - Set up log aggregation if needed

3. **Database:**
   - Regular backups
   - Monitor performance
   - Set up alerts for issues

## Troubleshooting

### Common Issues

1. **CORS errors:**
   - Ensure CORS_ORIGIN is set correctly
   - Check that frontend URL matches exactly

2. **Database connection issues:**
   - Verify MONGODB_URI is correct
   - Check network connectivity
   - Ensure database user has proper permissions

3. **File upload issues:**
   - Check UPLOADS_DIR permissions
   - Verify file size limits
   - Ensure directory exists

### Support

For issues and questions, please check the main README.md file or contact the development team.
