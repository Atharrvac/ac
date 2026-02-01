/**
 * Environment configuration with validation
 * Ensures all required environment variables are present
 */

interface EnvironmentConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
  };
  features: {
    enableAnalytics: boolean;
    enableErrorTracking: boolean;
    enablePerformanceMonitoring: boolean;
  };
  limits: {
    maxFileSize: number; // in bytes
    maxDetectionsPerHour: number;
    maxRedemptionsPerDay: number;
    maxBookingsPerWeek: number;
  };
  api: {
    timeout: number; // in milliseconds
    retryAttempts: number;
    retryDelay: number; // in milliseconds
  };
}

class EnvironmentService {
  private static instance: EnvironmentService;
  private config: EnvironmentConfig;

  private constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  static getInstance(): EnvironmentService {
    if (!EnvironmentService.instance) {
      EnvironmentService.instance = new EnvironmentService();
    }
    return EnvironmentService.instance;
  }

  private loadConfig(): EnvironmentConfig {
    const env = import.meta.env.MODE || 'development';

    return {
      supabase: {
        url: import.meta.env.VITE_SUPABASE_URL || '',
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      },
      app: {
        name: 'EcoSmart Cycle',
        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        environment: env as 'development' | 'staging' | 'production',
      },
      features: {
        enableAnalytics: env === 'production',
        enableErrorTracking: env === 'production' || env === 'staging',
        enablePerformanceMonitoring: env === 'production',
      },
      limits: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxDetectionsPerHour: 50,
        maxRedemptionsPerDay: 20,
        maxBookingsPerWeek: 10,
      },
      api: {
        timeout: 30000, // 30 seconds
        retryAttempts: 3,
        retryDelay: 1000, // 1 second
      },
    };
  }

  private validateConfig() {
    const errors: string[] = [];

    if (!this.config.supabase.url) {
      errors.push('VITE_SUPABASE_URL is required');
    }

    if (!this.config.supabase.anonKey) {
      errors.push('VITE_SUPABASE_ANON_KEY is required');
    }

    // Validate URL format
    if (this.config.supabase.url && !this.isValidUrl(this.config.supabase.url)) {
      errors.push('VITE_SUPABASE_URL must be a valid URL');
    }

    if (errors.length > 0) {
      const errorMessage = `Environment configuration errors:\n${errors.join('\n')}`;
      console.error(errorMessage);
      
      if (this.config.app.environment === 'production') {
        throw new Error(errorMessage);
      }
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  getConfig(): Readonly<EnvironmentConfig> {
    return Object.freeze({ ...this.config });
  }

  get supabaseUrl(): string {
    return this.config.supabase.url;
  }

  get supabaseAnonKey(): string {
    return this.config.supabase.anonKey;
  }

  get appName(): string {
    return this.config.app.name;
  }

  get appVersion(): string {
    return this.config.app.version;
  }

  get environment(): string {
    return this.config.app.environment;
  }

  get isDevelopment(): boolean {
    return this.config.app.environment === 'development';
  }

  get isProduction(): boolean {
    return this.config.app.environment === 'production';
  }

  get isStaging(): boolean {
    return this.config.app.environment === 'staging';
  }

  isFeatureEnabled(feature: keyof EnvironmentConfig['features']): boolean {
    return this.config.features[feature];
  }

  getLimit(limit: keyof EnvironmentConfig['limits']): number {
    return this.config.limits[limit];
  }

  getApiConfig(): EnvironmentConfig['api'] {
    return { ...this.config.api };
  }
}

// Export singleton instance
export const env = EnvironmentService.getInstance();

// Export config for direct access
export const config = env.getConfig();
