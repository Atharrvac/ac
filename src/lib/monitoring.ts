/**
 * Production monitoring and logging system
 * Integrates with error tracking services and provides structured logging
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  error?: Error;
  stack?: string;
}

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class MonitoringService {
  private static instance: MonitoringService;
  private sessionId: string;
  private performanceMarks: Map<string, number> = new Map();

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeErrorTracking();
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  private initializeErrorTracking() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.logError('Uncaught error', event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('Unhandled promise rejection', event.reason, {
        promise: event.promise,
      });
    });
  }

  /**
   * Log messages with different severity levels
   */
  log(level: LogLevel, message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      sessionId: this.sessionId,
    };

    // Console output with appropriate method
    const consoleMethod = level === LogLevel.ERROR || level === LogLevel.CRITICAL ? 'error' :
                         level === LogLevel.WARN ? 'warn' : 'log';
    
    console[consoleMethod](`[${level.toUpperCase()}] ${message}`, context || '');

    // Send to external monitoring service in production
    if (import.meta.env.PROD) {
      this.sendToMonitoringService(entry);
    }

    // Store in local storage for debugging (last 100 entries)
    this.storeLogEntry(entry);
  }

  logDebug(message: string, context?: Record<string, any>) {
    if (import.meta.env.DEV) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  logInfo(message: string, context?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context);
  }

  logWarn(message: string, context?: Record<string, any>) {
    this.log(LogLevel.WARN, message, context);
  }

  logError(message: string, error?: Error | unknown, context?: Record<string, any>) {
    const entry: LogEntry = {
      level: LogLevel.ERROR,
      message,
      timestamp: new Date(),
      context,
      sessionId: this.sessionId,
      error: error instanceof Error ? error : undefined,
      stack: error instanceof Error ? error.stack : undefined,
    };

    console.error(`[ERROR] ${message}`, error, context || '');

    if (import.meta.env.PROD) {
      this.sendToMonitoringService(entry);
    }

    this.storeLogEntry(entry);
  }

  logCritical(message: string, error?: Error | unknown, context?: Record<string, any>) {
    const entry: LogEntry = {
      level: LogLevel.CRITICAL,
      message,
      timestamp: new Date(),
      context,
      sessionId: this.sessionId,
      error: error instanceof Error ? error : undefined,
      stack: error instanceof Error ? error.stack : undefined,
    };

    console.error(`[CRITICAL] ${message}`, error, context || '');

    // Always send critical errors
    this.sendToMonitoringService(entry);
    this.storeLogEntry(entry);

    // Optionally alert user for critical errors
    if (import.meta.env.PROD) {
      this.alertCriticalError(message);
    }
  }

  /**
   * Performance monitoring
   */
  startPerformanceMark(name: string) {
    this.performanceMarks.set(name, performance.now());
  }

  endPerformanceMark(name: string, metadata?: Record<string, any>): number | null {
    const startTime = this.performanceMarks.get(name);
    if (!startTime) {
      this.logWarn(`Performance mark "${name}" not found`);
      return null;
    }

    const duration = performance.now() - startTime;
    this.performanceMarks.delete(name);

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: new Date(),
      metadata,
    };

    this.logDebug(`Performance: ${name}`, { duration: `${duration.toFixed(2)}ms`, ...metadata });

    // Send to monitoring service
    if (import.meta.env.PROD) {
      this.sendPerformanceMetric(metric);
    }

    return duration;
  }

  /**
   * Track user actions for analytics
   */
  trackEvent(eventName: string, properties?: Record<string, any>) {
    this.logInfo(`Event: ${eventName}`, properties);

    // Send to analytics service
    if (import.meta.env.PROD) {
      this.sendToAnalytics(eventName, properties);
    }
  }

  /**
   * Store log entries in localStorage for debugging
   */
  private storeLogEntry(entry: LogEntry) {
    try {
      const logs = this.getStoredLogs();
      logs.push({
        ...entry,
        timestamp: entry.timestamp.toISOString(),
        error: entry.error ? {
          message: entry.error.message,
          stack: entry.error.stack,
        } : undefined,
      });

      // Keep only last 100 entries
      const trimmedLogs = logs.slice(-100);
      localStorage.setItem('app_logs', JSON.stringify(trimmedLogs));
    } catch (error) {
      console.error('Failed to store log entry:', error);
    }
  }

  /**
   * Get stored logs from localStorage
   */
  getStoredLogs(): any[] {
    try {
      const logs = localStorage.getItem('app_logs');
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('Failed to retrieve logs:', error);
      return [];
    }
  }

  /**
   * Clear stored logs
   */
  clearLogs() {
    localStorage.removeItem('app_logs');
  }

  /**
   * Send to external monitoring service (Sentry, LogRocket, etc.)
   */
  private sendToMonitoringService(entry: LogEntry) {
    // TODO: Integrate with Sentry or similar service
    // Example:
    // if (window.Sentry) {
    //   window.Sentry.captureException(entry.error || new Error(entry.message), {
    //     level: entry.level,
    //     extra: entry.context,
    //   });
    // }
  }

  /**
   * Send performance metrics to monitoring service
   */
  private sendPerformanceMetric(metric: PerformanceMetric) {
    // TODO: Send to performance monitoring service
    // Example: Google Analytics, New Relic, etc.
  }

  /**
   * Send events to analytics service
   */
  private sendToAnalytics(eventName: string, properties?: Record<string, any>) {
    // TODO: Integrate with analytics service (Google Analytics, Mixpanel, etc.)
    // Example:
    // if (window.gtag) {
    //   window.gtag('event', eventName, properties);
    // }
  }

  /**
   * Alert user of critical errors
   */
  private alertCriticalError(message: string) {
    // Could show a modal or notification to the user
    console.error('CRITICAL ERROR:', message);
  }

  /**
   * Get system information for debugging
   */
  getSystemInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Export logs for debugging
   */
  exportLogs(): string {
    const logs = this.getStoredLogs();
    const systemInfo = this.getSystemInfo();
    
    return JSON.stringify({
      systemInfo,
      logs,
    }, null, 2);
  }
}

// Export singleton instance
export const monitoring = MonitoringService.getInstance();

// Convenience functions
export const logDebug = (message: string, context?: Record<string, any>) => 
  monitoring.logDebug(message, context);

export const logInfo = (message: string, context?: Record<string, any>) => 
  monitoring.logInfo(message, context);

export const logWarn = (message: string, context?: Record<string, any>) => 
  monitoring.logWarn(message, context);

export const logError = (message: string, error?: Error | unknown, context?: Record<string, any>) => 
  monitoring.logError(message, error, context);

export const logCritical = (message: string, error?: Error | unknown, context?: Record<string, any>) => 
  monitoring.logCritical(message, error, context);

export const trackEvent = (eventName: string, properties?: Record<string, any>) => 
  monitoring.trackEvent(eventName, properties);

export const startPerformance = (name: string) => 
  monitoring.startPerformanceMark(name);

export const endPerformance = (name: string, metadata?: Record<string, any>) => 
  monitoring.endPerformanceMark(name, metadata);
