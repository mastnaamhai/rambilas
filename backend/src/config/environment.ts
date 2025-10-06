import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface EnvironmentConfig {
  // Database
  mongodbUri: string;
  
  // Server
  port: number;
  nodeEnv: string;
  
  // CORS
  corsOrigin: string | string[];
  
  // JWT
  jwtSecret: string;
  
  // API Keys
  gstinApiKey?: string;
}

const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET'
] as const;

// Validate required environment variables
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Validate JWT secret strength in production
if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET === 'your-super-secret-jwt-key-here-change-this-in-production') {
  throw new Error('JWT_SECRET must be changed from default value in production');
}

export const config: EnvironmentConfig = {
  // Database
  mongodbUri: process.env.MONGODB_URI!,
  
  // Server
  port: parseInt(process.env.PORT || '8080', 10),
  nodeEnv: process.env.NODE_ENV || 'production',
  
  // CORS - Production only
  corsOrigin: process.env.CORS_ORIGIN || '*',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET!,
  
  // API Keys
  gstinApiKey: process.env.VITE_GSTIN_API_KEY,
};

export default config;









