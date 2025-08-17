import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  // Application
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  name: process.env.APP_NAME || 'TBI-Prop',
  version: process.env.APP_VERSION || '1.0.0',
  
  // Feature flags
  features: {
    mockData: false, // Always disabled
    aiAnalysis: process.env.ENABLE_AI_ANALYSIS !== 'false',
    geocoding: process.env.ENABLE_GEOCODING !== 'false',
    autoParsing: process.env.ENABLE_AUTO_PARSING === 'true',
    websocket: process.env.ENABLE_WEBSOCKET !== 'false',
    adminDashboard: process.env.ENABLE_ADMIN_DASHBOARD !== 'false',
  },
  
  // CORS
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
  
  // Rate limiting
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60000,
    limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100,
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    format: process.env.LOG_FORMAT || 'json',
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING !== 'false',
    enablePerformanceMonitoring: process.env.ENABLE_PERFORMANCE_MONITORING !== 'false',
  },
  
  // Admin
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    jwtSecret: process.env.ADMIN_JWT_SECRET || 'default-secret-change-in-production',
    jwtExpiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '24h',
  },
}));