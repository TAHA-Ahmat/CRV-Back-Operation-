import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/crv',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpiration: process.env.JWT_EXPIRATION || '24h',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 1 * 60 * 1000,  // 1 minute
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 200,     // 200 req/min

  // Google Drive Configuration
  googleDriveCredentialsPath: process.env.GOOGLE_DRIVE_CREDENTIALS_PATH || './config/archivagebonsdecommande.json',
  googleDriveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID || ''
};
