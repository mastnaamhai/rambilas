# Complete Deployment Guide: Render + Netlify

This guide will help you deploy your full-stack application with:
- **Backend**: Deployed on Render (Web Service)
- **Frontend**: Deployed on Netlify (Static Site)

## Prerequisites

1. **GitHub Repository**: Your code should be in a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
4. **MongoDB Atlas**: Database (already configured)

## Step 1: Prepare Your Repository

### 1.1 Update Environment Variables

Before deploying, update these files with your actual values:

**`production.env`** (Backend):
```env
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your-super-secure-jwt-secret-key-change-this-in-production-2024
CORS_ORIGIN=https://your-netlify-app.netlify.app
GEMINI_API_KEY=your-actual-gemini-api-key
```

**`env.production`** (Frontend):
```env
VITE_API_URL=https://your-render-app.onrender.com
VITE_GSTIN_API_KEY=cced6a34abe7b5e21f1979b24c3a6aad
VITE_GEMINI_API_KEY=your-actual-gemini-api-key
```

### 1.2 Update Configuration Files

**Update `netlify.toml`**:
Replace `https://your-render-app.onrender.com` with your actual Render URL after deployment.

**Update `render.yaml`**:
Replace `https://your-netlify-app.netlify.app` with your actual Netlify URL after deployment.

## Step 2: Deploy Backend to Render

### 2.1 Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:

**Basic Settings:**
- **Name**: `transpotruck-backend`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main`

**Build & Deploy:**
- **Build Command**: `cd backend && npm install && npm run build`
- **Start Command**: `cd backend && npm start`

**Environment Variables:**
Add these environment variables in Render dashboard:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your-super-secure-jwt-secret-key-change-this-in-production-2024
JWT_EXPIRE=7d
CORS_ORIGIN=https://your-netlify-app.netlify.app
PORT=10000
UPLOADS_DIR=/opt/render/project/backend/uploads
GEMINI_API_KEY=your-actual-gemini-api-key
VITE_GSTIN_API_KEY=cced6a34abe7b5e21f1979b24c3a6aad
GOOGLE_CLOUD_PROJECT=version2-472816
```

### 2.2 Deploy Backend

1. Click "Create Web Service"
2. Wait for deployment to complete
3. Note your Render URL (e.g., `https://transpotruck-backend.onrender.com`)

## Step 3: Deploy Frontend to Netlify

### 3.1 Update Frontend Configuration

Before deploying, update the API URL in your frontend:

**Update `env.production`**:
```env
VITE_API_URL=https://your-actual-render-url.onrender.com
```

**Update `netlify.toml`**:
```toml
[[redirects]]
  from = "/api/*"
  to = "https://your-actual-render-url.onrender.com/api/:splat"
  status = 200
  force = true
```

### 3.2 Deploy to Netlify

**Option A: Deploy from Git (Recommended)**

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "New site from Git"
3. Connect your GitHub repository
4. Configure build settings:

**Build Settings:**
- **Base directory**: Leave empty (root)
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: `18`

**Environment Variables:**
Add these in Netlify dashboard under Site settings → Environment variables:

```
NODE_ENV=production
VITE_API_URL=https://your-render-url.onrender.com
VITE_GSTIN_API_KEY=cced6a34abe7b5e21f1979b24c3a6aad
VITE_GEMINI_API_KEY=your-actual-gemini-api-key
```

**Option B: Deploy from Build Folder**

1. Build your frontend locally:
   ```bash
   npm run build
   ```
2. Drag and drop the `dist` folder to Netlify

### 3.3 Configure Custom Domain (Optional)

1. In Netlify dashboard, go to Site settings → Domain management
2. Add your custom domain
3. Configure DNS settings as instructed

## Step 4: Update CORS Configuration

After both deployments are complete:

1. **Update Render backend**:
   - Go to Render dashboard → Your service → Environment
   - Update `CORS_ORIGIN` to your actual Netlify URL
   - Redeploy the service

2. **Update Netlify redirects**:
   - Update `netlify.toml` with your actual Render URL
   - Redeploy the frontend

## Step 5: Test Your Deployment

### 5.1 Test Backend
- Visit: `https://your-render-url.onrender.com/health`
- Should return: `{"status":"OK","timestamp":"...","environment":"production"}`

### 5.2 Test Frontend
- Visit your Netlify URL
- Test login functionality
- Test API calls (should proxy to Render backend)

### 5.3 Test API Integration
- Check browser network tab for API calls
- Verify CORS is working (no CORS errors)
- Test file uploads if applicable

## Step 6: Production Optimizations

### 6.1 Render Optimizations

**Enable Auto-Deploy:**
- Go to Render dashboard → Your service → Settings
- Enable "Auto-Deploy" for automatic deployments on git push

**Set up Health Checks:**
- Your app already has a `/health` endpoint
- Render will automatically monitor this

**Database Connection:**
- Ensure MongoDB Atlas allows connections from Render's IP ranges
- Add `0.0.0.0/0` to IP whitelist for testing (restrict later)

### 6.2 Netlify Optimizations

**Enable Build Hooks:**
- Go to Site settings → Build & deploy → Build hooks
- Create a build hook for manual deployments

**Set up Form Handling:**
- If you have forms, configure Netlify Forms
- Go to Site settings → Forms

**Enable CDN:**
- Netlify automatically provides global CDN
- No additional configuration needed

## Step 7: Monitoring and Maintenance

### 7.1 Render Monitoring

**Logs:**
- View logs in Render dashboard
- Set up log forwarding if needed

**Metrics:**
- Monitor CPU, memory, and response times
- Set up alerts for downtime

### 7.2 Netlify Monitoring

**Analytics:**
- Enable Netlify Analytics in dashboard
- Monitor page views and performance

**Build Logs:**
- View build logs for deployment issues
- Set up notifications for failed builds

## Troubleshooting

### Common Issues

**1. CORS Errors:**
- Verify `CORS_ORIGIN` in Render matches your Netlify URL exactly
- Check for trailing slashes in URLs

**2. API Calls Failing:**
- Verify `VITE_API_URL` in Netlify environment variables
- Check that Render service is running and healthy

**3. Build Failures:**
- Check Node.js version compatibility
- Verify all dependencies are in package.json
- Check build logs for specific errors

**4. Database Connection Issues:**
- Verify MongoDB Atlas IP whitelist includes Render's IPs
- Check connection string format
- Ensure database user has proper permissions

**5. File Upload Issues:**
- Check upload directory permissions in Render
- Verify file size limits
- Consider using cloud storage for production

### Debug Commands

**Test Backend Locally:**
```bash
cd backend
npm run build
npm start
```

**Test Frontend Locally:**
```bash
npm run build
npm run preview
```

**Check Environment Variables:**
```bash
# In Render dashboard, check Environment tab
# In Netlify dashboard, check Environment variables
```

## Security Considerations

### 1. Environment Variables
- Never commit sensitive data to git
- Use strong, unique JWT secrets
- Rotate API keys regularly

### 2. CORS Configuration
- Restrict CORS origins to your actual domains
- Don't use wildcard (*) in production

### 3. Database Security
- Use strong database passwords
- Restrict IP access to Render's IP ranges
- Enable MongoDB Atlas security features

### 4. API Security
- Implement rate limiting (consider adding to backend)
- Validate all inputs
- Use HTTPS everywhere

## Cost Optimization

### Render
- Start with Starter plan ($7/month)
- Monitor usage and upgrade if needed
- Use auto-sleep for development

### Netlify
- Free tier includes 100GB bandwidth/month
- Upgrade to Pro ($19/month) for more features
- Monitor usage in dashboard

## Next Steps

1. **Set up monitoring**: Consider adding error tracking (Sentry)
2. **Implement CI/CD**: Automate deployments with GitHub Actions
3. **Add caching**: Implement Redis for session management
4. **Backup strategy**: Set up automated database backups
5. **SSL certificates**: Both Render and Netlify provide free SSL

## Support

- **Render Documentation**: https://render.com/docs
- **Netlify Documentation**: https://docs.netlify.com
- **MongoDB Atlas**: https://docs.atlas.mongodb.com

---

**Important Notes:**
- Replace all placeholder URLs with your actual deployment URLs
- Test thoroughly in staging before going live
- Keep your environment variables secure
- Monitor your deployments regularly
