# 🚀 Deployment Guide - React Router Version 2

## Project: version2-472816

This guide will help you deploy the updated application with React Router to your Google Cloud project.

## 📦 What's New in This Version

✅ **React Router Implementation**
- Browser back/forward buttons now work
- URL synchronization with application state
- Deep linking support (bookmarkable URLs)
- Clean, SEO-friendly URLs
- No page reloads during navigation

✅ **All Routes Available:**
- `/dashboard` - Main dashboard
- `/lorry-receipts` - Lorry receipts list
- `/lorry-receipts/create` - Create new LR
- `/lorry-receipts/edit/:id` - Edit existing LR
- `/lorry-receipts/view/:id` - View LR PDF
- `/invoices` - Invoices list
- `/invoices/create` - Create new invoice
- `/invoices/create-from-lr/:lrId` - Create invoice from LR
- `/invoices/edit/:id` - Edit existing invoice
- `/invoices/view/:id` - View invoice PDF
- `/payments` - Pending payments
- `/ledger` - Basic ledger
- `/enhanced-ledger` - Enhanced ledger
- `/ledger/client/:customerId` - Client ledger PDF
- `/ledger/company` - Company ledger PDF
- `/clients` - Clients management
- `/truck-hiring` - Truck hiring notes
- `/truck-hiring/view/:id` - View THN PDF
- `/settings` - Application settings

## 🎯 Deployment Options

### Option 1: Google Cloud Console (Recommended)

1. **Go to Google Cloud Console**
   - Navigate to: https://console.cloud.google.com/
   - Select project: `version2-472816`

2. **Enable Required APIs**
   - Go to "APIs & Services" → "Library"
   - Enable: Cloud Run API, Container Registry API, Cloud Build API

3. **Upload Docker Image**
   - Go to "Container Registry" → "Images"
   - Click "Push Image"
   - Upload the file: `all-india-logistics-routing-v2.tar.gz`

4. **Deploy to Cloud Run**
   - Go to "Cloud Run" → "Create Service"
   - Select the uploaded image
   - Configure:
     - Service name: `all-india-logistics`
     - Region: `asia-south1` (Mumbai)
     - Port: `8080`
     - Memory: `1 GiB`
     - CPU: `1`
     - Max instances: `10`
     - Min instances: `0`
     - Concurrency: `80`
     - Timeout: `300 seconds`
     - Allow unauthenticated invocations: `Yes`

### Option 2: Google Cloud Shell

1. **Open Cloud Shell**
   - Go to: https://console.cloud.google.com/cloudshell
   - Select project: `version2-472816`

2. **Upload Project Files**
   ```bash
   # Upload the entire project folder to Cloud Shell
   # Then run:
   chmod +x deploy.sh
   ./deploy.sh
   ```

### Option 3: Local Deployment (if you have gcloud CLI)

1. **Install Google Cloud CLI**
   ```bash
   # Download from: https://cloud.google.com/sdk/docs/install
   ```

2. **Authenticate and Deploy**
   ```bash
   gcloud auth login
   gcloud config set project version2-472816
   chmod +x deploy.sh
   ./deploy.sh
   ```

## 🔧 Environment Variables

Set these in Cloud Run console:

```
NODE_ENV=production
PORT=8080
CORS_ORIGIN=https://your-service-url
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
```

## 🧪 Testing After Deployment

1. **Test Basic Navigation**
   - Visit your deployed URL
   - Login with your credentials
   - Navigate between different pages

2. **Test Browser Navigation**
   - Use browser back/forward buttons
   - Verify URLs update correctly
   - Test bookmarking specific pages

3. **Test Deep Linking**
   - Try direct URLs like: `/lorry-receipts`, `/invoices/create`
   - Verify pages load correctly

## 📱 Mobile Testing

- Test on mobile devices
- Verify responsive navigation works
- Check mobile bottom navigation

## 🚨 Troubleshooting

### Common Issues:

1. **404 Errors on Refresh**
   - This is normal for SPA routing
   - Cloud Run should handle this automatically

2. **CORS Issues**
   - Update CORS_ORIGIN environment variable
   - Set it to your deployed service URL

3. **Database Connection**
   - Ensure MongoDB URI is correct
   - Check network connectivity

## 📊 Performance

- **Bundle Size**: ~626KB (gzipped: ~159KB)
- **Load Time**: Optimized for production
- **Memory Usage**: 1GB allocated
- **Concurrency**: 80 requests per instance

## 🔄 Rollback Plan

If you need to rollback:
1. Go to Cloud Run console
2. Select your service
3. Go to "Revisions"
4. Select previous revision
5. Click "Manage Traffic"
6. Set traffic to 100% for previous revision

## 📞 Support

If you encounter any issues:
1. Check Cloud Run logs
2. Verify environment variables
3. Test locally first
4. Check network connectivity

## 🎉 Success!

Once deployed, your users will have:
- ✅ Working browser back/forward buttons
- ✅ Bookmarkable URLs
- ✅ Better navigation experience
- ✅ No page reloads
- ✅ Clean, professional URLs

---

**Deployment Package**: `all-india-logistics-routing-v2.tar.gz` (62MB)
**Project ID**: `version2-472816`
**Service Name**: `all-india-logistics`
**Region**: `asia-south1` (Mumbai)