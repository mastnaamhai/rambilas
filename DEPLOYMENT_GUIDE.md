# 🚀 TranspoTruck Deployment Guide

Complete guide for deploying your standalone TranspoTruck application to Render (backend) and Netlify (frontend).

## 📋 Prerequisites

- GitHub repository: `https://github.com/mastnaamhai/rambilas.git`
- MongoDB Atlas account
- Render account (free tier available)
- Netlify account (free tier available)

## 🔧 Backend Deployment (Render)

### Step 1: Create Render Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `mastnaamhai/rambilas`
4. Configure the service:
   - **Name**: `transpotruck-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

### Step 2: Set Environment Variables

In Render dashboard, go to Environment tab and add:

```bash
# Required Variables
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/transpotruck?retryWrites=true&w=majority
JWT_SECRET=your-super-secure-jwt-secret-key-change-this-in-production-min-32-chars
CORS_ORIGIN=https://your-netlify-app.netlify.app
APP_PASSWORD_HASH=your-secure-password-hash-here

# Optional Variables
GEMINI_API_KEY=your-gemini-api-key-here
VITE_GSTIN_API_KEY=your-gstin-api-key-here
```

### Step 3: Deploy

1. Click "Create Web Service"
2. Wait for deployment to complete
3. Note your backend URL: `https://transpotruck-backend.onrender.com`

## 🌐 Frontend Deployment (Netlify)

### Step 1: Create Netlify Site

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "New site from Git"
3. Connect GitHub repository: `mastnaamhai/rambilas`
4. Configure build settings:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   - **Branch**: `main`

### Step 2: Set Environment Variables

In Netlify dashboard, go to Site settings → Environment variables:

```bash
# Required Variables
VITE_API_URL=https://transpotruck-backend.onrender.com

# Optional Variables
VITE_GSTIN_API_KEY=your-gstin-api-key-here
VITE_APP_NAME=TranspoTruck
VITE_APP_VERSION=1.0.0
```

### Step 3: Deploy

1. Click "Deploy site"
2. Wait for deployment to complete
3. Note your frontend URL: `https://your-app-name.netlify.app`

## 🔄 Update CORS Configuration

After both deployments are complete:

1. Go to Render dashboard → Your backend service
2. Update `CORS_ORIGIN` environment variable with your actual Netlify URL
3. Redeploy the backend service

## 📁 Configuration Files

### Render Configuration (`render.yaml`)
```yaml
services:
  - type: web
    name: transpotruck-backend
    env: node
    plan: free
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      # ... other environment variables
```

### Netlify Configuration (`netlify.toml`)
```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"
  NPM_FLAGS = "--production=false"

# API redirects to backend
[[redirects]]
  from = "/api/*"
  to = "https://transpotruck-backend.onrender.com/api/:splat"
  status = 200
  force = true

# SPA fallback for client-side routing
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 🔐 Security Checklist

- [ ] Generate strong JWT secret (32+ characters)
- [ ] Use secure MongoDB connection string
- [ ] Set proper CORS origins
- [ ] Generate secure password hash for app access
- [ ] Enable HTTPS (automatic on both platforms)
- [ ] Set up proper environment variable encryption

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**: Update `CORS_ORIGIN` in Render with your Netlify URL
2. **Build Failures**: Check Node.js version compatibility
3. **Database Connection**: Verify MongoDB URI and network access
4. **Environment Variables**: Ensure all required variables are set

### Health Checks

- Backend: `https://transpotruck-backend.onrender.com/health`
- Frontend: `https://your-app-name.netlify.app`

## 📊 Monitoring

### Render
- View logs in Render dashboard
- Monitor resource usage
- Set up alerts for downtime

### Netlify
- View build logs in Netlify dashboard
- Monitor site performance
- Set up form notifications

## 🔄 Updates and Maintenance

### Deploying Updates
1. Push changes to GitHub main branch
2. Both platforms will auto-deploy
3. Monitor deployment logs for issues

### Environment Variable Updates
1. Update variables in respective dashboards
2. Redeploy services if needed

## 💰 Cost Estimation

### Free Tier Limits
- **Render**: 750 hours/month, sleeps after 15 minutes of inactivity
- **Netlify**: 100GB bandwidth/month, 300 build minutes/month

### Production Considerations
- Consider paid plans for production workloads
- Set up monitoring and alerting
- Implement backup strategies

---

**Need Help?** Check the logs in both platforms' dashboards for detailed error information.
