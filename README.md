# TranspoTruck - Logistics Management System

A comprehensive, production-ready logistics management application for creating and managing Lorry Receipts (LRs), Invoices, and Truck Hiring Notes with full lifecycle tracking and PDF generation capabilities.

## 🚀 Features

- **Lorry Receipt Management**: Create, edit, and track Lorry Receipts (LRs) with status updates
- **Invoice Generation**: Generate invoices with automatic GST calculations (CGST/SGST/IGST)
- **Truck Hiring Notes**: Manage truck hiring agreements and payments
- **Customer Management**: Comprehensive customer database with GST details
- **Vehicle Management**: Track vehicle information and assignments
- **Payment Tracking**: Record and track payments with multiple payment modes
- **PDF Generation**: Generate professional PDF documents for all documents
- **Responsive Design**: Mobile-optimized interface for field operations
- **Real-time Status Updates**: Automatic status updates based on business logic
- **Cloud-Native**: Optimized for Render and Netlify deployment

## 🛠 Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and building
- **Custom UI Components** for consistent design
- **PDF Generation** with jsPDF

### Backend
- **Node.js 18** with Express
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **JWT Authentication**
- **File Upload** with Multer

### Infrastructure
- **Render** for backend deployment
- **Netlify** for frontend deployment
- **MongoDB Atlas** for managed database

## 📁 Project Structure

```
transpotruck/
├── backend/                 # Backend API server
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utility functions
│   │   └── middleware/     # Express middleware
│   └── package.json
├── components/              # React components
│   ├── ui/                 # Reusable UI components
│   └── *.tsx              # Feature components
├── services/               # Frontend API services
├── hooks/                  # Custom React hooks
├── types.ts               # Shared TypeScript types
├── constants.ts           # Application constants
├── Dockerfile             # Multi-stage Docker build
├── cloudbuild.yaml        # Google Cloud Build config
└── deploy.sh              # Deployment script
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- **MongoDB Atlas** account
- **Google Cloud Platform** account
- **Docker** (for containerization)

### Local Development

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd transpotruck
   npm install
   cd backend && npm install
   ```

2. **Environment Setup**
   ```bash
   cp env.example .env
   # Edit .env with your MongoDB URI and other settings
   ```

3. **Start Development Servers**
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev
   
   # Terminal 2: Frontend
   npm run dev
   ```

4. **Access Application**
   - Frontend: http://localhost:5173 (development only)
   - Backend API: http://localhost:8080 (development only)
   - Health Check: http://localhost:8080/health (development only)

## 🚀 Production Deployment

### Using Render + Netlify (Recommended)

1. **Deploy Backend to Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Create new Web Service
   - Connect GitHub repository
   - Set Root Directory: `backend`
   - Add environment variables

2. **Deploy Frontend to Netlify**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Create new site from Git
   - Connect GitHub repository
   - Set Build Command: `npm run build`
   - Set Publish Directory: `dist`

### Environment Variables

Set these in Render and Netlify:

**Backend (Render):**
| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | ✅ |
| `JWT_SECRET` | JWT signing secret | ✅ |
| `CORS_ORIGIN` | Allowed CORS origins | ✅ |
| `PORT` | Server port | ✅ |

**Frontend (Netlify):**
| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | ✅ |
| `VITE_GSTIN_API_KEY` | GSTIN validation API key | ✅ |

## 🔧 Configuration

### Database Configuration
The application uses MongoDB with the following collections:
- `customers` - Customer information
- `vehicles` - Vehicle details
- `lorryreceipts` - Lorry Receipt documents
- `invoices` - Invoice documents
- `truckhiringnotes` - Truck Hiring Notes
- `payments` - Payment records
- `counters` - Auto-increment counters

### Security Features
- **JWT Authentication** for API access
- **CORS Protection** with configurable origins
- **Input Validation** using Zod schemas
- **File Upload Security** with type validation
- **Environment-based Configuration**

## 📊 API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Core Resources
- `GET/POST /api/customers` - Customer management
- `GET/POST /api/vehicles` - Vehicle management
- `GET/POST /api/lorryreceipts` - Lorry Receipt management
- `GET/POST /api/invoices` - Invoice management
- `GET/POST /api/truckhiringnotes` - THN management
- `GET/POST /api/payments` - Payment management

### Health & Monitoring
- `GET /health` - Application health check
- `GET /` - API status

## 🛠 Development

### Code Quality
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Strict TypeScript** configuration

### Build Process
- **Multi-stage Docker** build for optimization
- **Vite** for fast frontend builds
- **TypeScript compilation** for backend
- **Production optimizations** (minification, tree-shaking)

### Testing
```bash
# Run backend tests
cd backend && npm test

# Run frontend tests
npm test
```

## 📈 Performance Optimizations

- **Docker Multi-stage Build** for smaller images
- **Code Splitting** for faster loading
- **Lazy Loading** of components
- **Optimized Bundle Size** with Vite
- **Database Indexing** for faster queries
- **Connection Pooling** for MongoDB

## 🔒 Security Best Practices

- **Environment Variables** for sensitive data
- **JWT Token** expiration
- **Input Validation** on all endpoints
- **CORS** configuration
- **File Upload** restrictions
- **Non-root User** in Docker container

## 📝 License

This project is proprietary software for TranspoTruck Logistics Management.

## 🤝 Support

For technical support or questions, please contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Environment**: Production Ready