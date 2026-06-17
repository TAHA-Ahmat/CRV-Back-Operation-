import dotenv from 'dotenv';

dotenv.config();

// ============================
//   VARIABLES OBLIGATOIRES
// ============================

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET manquant dans les variables d\'environnement.');
  console.error('Le serveur refuse de démarrer sans un secret JWT explicite.');
  process.exit(1);
}

if (!process.env.CORS_ORIGIN) {
  console.error('FATAL: CORS_ORIGIN manquant dans les variables d\'environnement.');
  console.error('Définissez une origine explicite (ex: http://localhost:5173).');
  process.exit(1);
}

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/crv',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiration: process.env.JWT_EXPIRATION || '24h',
  corsOrigin: process.env.CORS_ORIGIN,
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 1 * 60 * 1000,  // 1 minute
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 200,     // 200 req/min

  // Google Drive Configuration
  googleDriveCredentialsPath: process.env.GOOGLE_DRIVE_CREDENTIALS_PATH || './config/archivagebonsdecommande.json',
  googleDriveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID || '',
  googleClientEmail: process.env.GOOGLE_CLIENT_EMAIL || '',
  googlePrivateKey: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
};
