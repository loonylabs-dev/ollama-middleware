import * as dotenv from 'dotenv';
import { AppConfig, AuthValidationType } from '../types';

// Load environment variables
dotenv.config();

/**
 * Default application configuration with environment variable support
 */
const defaultConfig: AppConfig = {
  server: {
    port: Number(process.env.PORT) || 3000,
    environment: process.env.NODE_ENV || 'development'
  },
  auth: {
    // Default validation type - can be overridden by env var
    validationType: (process.env.AUTH_VALIDATION_TYPE as AuthValidationType) || 'none',
    
    // Supabase credentials from env (optional)
    supabase: {
      url: process.env.SUPABASE_URL || null,
      key: process.env.SUPABASE_KEY || null,
      serviceKey: process.env.SUPABASE_SERVICE_KEY || null
    },
    
    // Static key auth from env (optional)
    staticKey: {
      apiKey: process.env.STATIC_API_KEY || null
    }
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    console: {
      enabled: true,
      colorized: true
    },
    database: {
      enabled: process.env.NODE_ENV === 'production',
      minLevel: 'error'
    }
  }
};

// Export the config
export const appConfig: AppConfig = defaultConfig;