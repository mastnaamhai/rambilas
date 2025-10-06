# Simple Deployment Guide

## Quick Setup

1. **Copy environment file:**
   ```bash
   cp env.example .env
   ```

2. **Update your environment variables in `.env`:**
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - Generate a strong secret (32+ characters)
   - `VITE_GSTIN_API_KEY` - Your GST API key
   - `APP_PASSWORD_HASH` - Generate a password hash

3. **Install dependencies:**
   ```bash
   npm install
   cd backend && npm install
   ```

4. **Build and start:**
   ```bash
   npm run build
   cd backend && npm start
   ```

## Configuration

- **CORS**: Set to `*` to allow any domain, or specify your domain
- **API URL**: Leave empty to use relative `/api` path (works with any domain)
- **Database**: Use your MongoDB connection string
- **Port**: Default is 8080, change if needed

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | ✅ |
| `JWT_SECRET` | JWT signing secret (32+ chars) | ✅ |
| `CORS_ORIGIN` | Allowed origins (* for any) | ✅ |
| `VITE_GSTIN_API_KEY` | GST API key | ✅ |
| `APP_PASSWORD_HASH` | App access password hash | ✅ |

That's it! Your app will work on any domain without hardcoded URLs.
