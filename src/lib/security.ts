/**
 * Security utilities for production-ready application
 * Includes XSS prevention, CSRF protection, and secure data handling
 */

import { monitoring } from './monitoring';

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return input.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Sanitize user input by trimming and normalizing whitespace
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      monitoring.logWarn('Invalid URL protocol', { url, protocol: parsed.protocol });
      return null;
    }
    
    return parsed.toString();
  } catch (error) {
    monitoring.logWarn('Invalid URL format', { url });
    return null;
  }
}

/**
 * Generate CSRF token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Store CSRF token in session storage
 */
export function storeCsrfToken(token: string): void {
  try {
    sessionStorage.setItem('csrf_token', token);
  } catch (error) {
    monitoring.logError('Failed to store CSRF token', error);
  }
}

/**
 * Get CSRF token from session storage
 */
export function getCsrfToken(): string | null {
  try {
    return sessionStorage.getItem('csrf_token');
  } catch (error) {
    monitoring.logError('Failed to retrieve CSRF token', error);
    return null;
  }
}

/**
 * Validate CSRF token
 */
export function validateCsrfToken(token: string): boolean {
  const storedToken = getCsrfToken();
  return storedToken !== null && storedToken === token;
}

/**
 * Secure local storage wrapper with encryption
 */
export class SecureStorage {
  private static readonly PREFIX = 'secure_';

  /**
   * Simple XOR encryption (for basic obfuscation, not cryptographically secure)
   * In production, use Web Crypto API for proper encryption
   */
  private static encrypt(data: string, key: string): string {
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result);
  }

  private static decrypt(data: string, key: string): string {
    const decoded = atob(data);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  }

  static setItem(key: string, value: any): void {
    try {
      const serialized = JSON.stringify(value);
      const encrypted = this.encrypt(serialized, this.getEncryptionKey());
      localStorage.setItem(this.PREFIX + key, encrypted);
    } catch (error) {
      monitoring.logError('Failed to store secure item', error, { key });
    }
  }

  static getItem<T>(key: string): T | null {
    try {
      const encrypted = localStorage.getItem(this.PREFIX + key);
      if (!encrypted) return null;

      const decrypted = this.decrypt(encrypted, this.getEncryptionKey());
      return JSON.parse(decrypted) as T;
    } catch (error) {
      monitoring.logError('Failed to retrieve secure item', error, { key });
      return null;
    }
  }

  static removeItem(key: string): void {
    try {
      localStorage.removeItem(this.PREFIX + key);
    } catch (error) {
      monitoring.logError('Failed to remove secure item', error, { key });
    }
  }

  static clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      monitoring.logError('Failed to clear secure storage', error);
    }
  }

  private static getEncryptionKey(): string {
    // In production, this should be derived from user session or environment
    // For now, use a simple key (NOT SECURE FOR PRODUCTION)
    return 'eco-smart-cycle-key-2024';
  }
}

/**
 * Content Security Policy helpers
 */
export function getContentSecurityPolicy(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Adjust based on needs
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

/**
 * Rate limiting client-side check
 */
export class ClientRateLimiter {
  private requests: Map<string, number[]> = new Map();

  /**
   * Check if action is allowed based on rate limit
   */
  isAllowed(action: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(action) || [];

    // Remove old timestamps outside the window
    const validTimestamps = timestamps.filter(ts => now - ts < windowMs);

    if (validTimestamps.length >= maxRequests) {
      monitoring.logWarn('Client rate limit exceeded', { action, maxRequests, windowMs });
      return false;
    }

    // Add current timestamp
    validTimestamps.push(now);
    this.requests.set(action, validTimestamps);

    return true;
  }

  /**
   * Reset rate limit for an action
   */
  reset(action: string): void {
    this.requests.delete(action);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.requests.clear();
  }
}

// Export singleton instance
export const rateLimiter = new ClientRateLimiter();

/**
 * Validate file before upload
 */
export function validateFile(file: File, options: {
  maxSize?: number;
  allowedTypes?: string[];
}): { valid: boolean; error?: string } {
  const maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB default
  const allowedTypes = options.allowedTypes || ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${(maxSize / 1024 / 1024).toFixed(0)}MB limit`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'api_key', 'authorization'];
  const masked = { ...data };

  for (const key in masked) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      masked[key] = '***REDACTED***';
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }

  return masked;
}

/**
 * Generate secure random string
 */
export function generateSecureRandom(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash string using SHA-256
 */
export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}
