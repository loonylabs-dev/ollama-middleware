// Base types and interfaces
export * from './client-info';
export * from './base-request.types';

// Configuration types
export interface OllamaModelConfig {
  name: string;
  baseUrl: string;
  bearerToken?: string;
  temperature: number;
  description?: string;
}

export type ModelsConfigMap = Record<string, OllamaModelConfig>;

// Logging types
export type AuthValidationType = 'none' | 'supabase' | 'static';

export interface AppConfig {
  server: {
    port: number;
    environment: string;
  };
  auth: {
    validationType: AuthValidationType;
    supabase?: {
      url: string | null;
      key: string | null;
      serviceKey: string | null;
    };
    staticKey?: {
      apiKey: string | null;
    };
  };
  logging: {
    level: string;
    console: {
      enabled: boolean;
      colorized: boolean;
    };
    database: {
      enabled: boolean;
      minLevel: string;
    };
  };
}