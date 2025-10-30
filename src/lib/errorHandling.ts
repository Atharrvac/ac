/**
 * Comprehensive error handling and loading states system
 */

export interface AppError {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
  context?: Record<string, any>;
}

export interface LoadingState {
  isLoading: boolean;
  progress?: number;
  stage?: string;
  message?: string;
}

// Error codes and messages
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  CONNECTION_LOST: 'CONNECTION_LOST',
  
  // Authentication errors
  AUTH_FAILED: 'AUTH_FAILED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  
  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  DATA_NOT_FOUND: 'DATA_NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // File upload errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  
  // Business logic errors
  INSUFFICIENT_COINS: 'INSUFFICIENT_COINS',
  ITEM_NOT_AVAILABLE: 'ITEM_NOT_AVAILABLE',
  BOOKING_CONFLICT: 'BOOKING_CONFLICT',
  
  // AI detection errors
  AI_DETECTION_FAILED: 'AI_DETECTION_FAILED',
  IMAGE_PROCESSING_FAILED: 'IMAGE_PROCESSING_FAILED',
  UNSUPPORTED_IMAGE: 'UNSUPPORTED_IMAGE',
  
  // Unknown errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export const ERROR_MESSAGES = {
  [ERROR_CODES.NETWORK_ERROR]: 'Network connection failed. Please check your internet connection.',
  [ERROR_CODES.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
  [ERROR_CODES.CONNECTION_LOST]: 'Connection lost. Attempting to reconnect...',
  
  [ERROR_CODES.AUTH_FAILED]: 'Authentication failed. Please sign in again.',
  [ERROR_CODES.TOKEN_EXPIRED]: 'Your session has expired. Please sign in again.',
  [ERROR_CODES.PERMISSION_DENIED]: 'You don\'t have permission to perform this action.',
  
  [ERROR_CODES.DATABASE_ERROR]: 'Database error occurred. Please try again later.',
  [ERROR_CODES.DATA_NOT_FOUND]: 'Requested data not found.',
  [ERROR_CODES.DUPLICATE_ENTRY]: 'This entry already exists.',
  
  [ERROR_CODES.VALIDATION_FAILED]: 'Please check your input and try again.',
  [ERROR_CODES.INVALID_INPUT]: 'Invalid input provided.',
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: 'Please fill in all required fields.',
  
  [ERROR_CODES.FILE_TOO_LARGE]: 'File size is too large. Maximum size is 10MB.',
  [ERROR_CODES.INVALID_FILE_TYPE]: 'Invalid file type. Please upload an image file.',
  [ERROR_CODES.UPLOAD_FAILED]: 'File upload failed. Please try again.',
  
  [ERROR_CODES.INSUFFICIENT_COINS]: 'You don\'t have enough EcoCoins for this reward.',
  [ERROR_CODES.ITEM_NOT_AVAILABLE]: 'This item is currently not available.',
  [ERROR_CODES.BOOKING_CONFLICT]: 'This time slot is no longer available.',
  
  [ERROR_CODES.AI_DETECTION_FAILED]: 'AI detection failed. Please try with a clearer image.',
  [ERROR_CODES.IMAGE_PROCESSING_FAILED]: 'Failed to process image. Please try again.',
  [ERROR_CODES.UNSUPPORTED_IMAGE]: 'Image format not supported. Please use JPG or PNG.',
  
  [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
} as const;

// Error recovery suggestions
export const ERROR_RECOVERY = {
  [ERROR_CODES.NETWORK_ERROR]: [
    'Check your internet connection',
    'Try refreshing the page',
    'Switch to a different network if available'
  ],
  [ERROR_CODES.AUTH_FAILED]: [
    'Sign out and sign in again',
    'Clear browser cache and cookies',
    'Contact support if the problem persists'
  ],
  [ERROR_CODES.FILE_TOO_LARGE]: [
    'Compress your image',
    'Use a different image',
    'Try taking a new photo with lower resolution'
  ],
  [ERROR_CODES.AI_DETECTION_FAILED]: [
    'Take a clearer photo with better lighting',
    'Make sure the item is clearly visible',
    'Try a different angle or remove any obstructions'
  ],
} as const;

// Loading state messages
export const LOADING_MESSAGES = {
  INITIALIZING: 'Initializing...',
  CONNECTING: 'Connecting to server...',
  AUTHENTICATING: 'Authenticating...',
  LOADING_DATA: 'Loading data...',
  UPLOADING: 'Uploading file...',
  PROCESSING: 'Processing...',
  AI_ANALYZING: 'AI analyzing image...',
  SAVING: 'Saving changes...',
  DELETING: 'Deleting...',
  SCHEDULING: 'Scheduling pickup...',
  REDEEMING: 'Redeeming reward...',
} as const;

/**
 * Create a standardized error object
 */
export const createError = (
  code: keyof typeof ERROR_CODES,
  details?: string,
  context?: Record<string, any>
): AppError => ({
  code,
  message: ERROR_MESSAGES[code],
  details,
  timestamp: new Date(),
  context,
});

/**
 * Handle different types of errors and convert to AppError
 */
export const handleError = (error: unknown, context?: Record<string, any>): AppError => {
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return createError(ERROR_CODES.NETWORK_ERROR, error.message, context);
    }
    
    // Supabase errors
    if (error.message.includes('JWT') || error.message.includes('auth')) {
      return createError(ERROR_CODES.AUTH_FAILED, error.message, context);
    }
    
    // Database errors
    if (error.message.includes('database') || error.message.includes('relation')) {
      return createError(ERROR_CODES.DATABASE_ERROR, error.message, context);
    }
    
    // Validation errors
    if (error.message.includes('validation') || error.message.includes('required')) {
      return createError(ERROR_CODES.VALIDATION_FAILED, error.message, context);
    }
    
    // File upload errors
    if (error.message.includes('file') || error.message.includes('upload')) {
      return createError(ERROR_CODES.UPLOAD_FAILED, error.message, context);
    }
    
    // Default to unknown error
    return createError(ERROR_CODES.UNKNOWN_ERROR, error.message, context);
  }
  
  // If error is a string
  if (typeof error === 'string') {
    return createError(ERROR_CODES.UNKNOWN_ERROR, error, context);
  }
  
  // Default fallback
  return createError(ERROR_CODES.UNKNOWN_ERROR, 'An unexpected error occurred', context);
};

/**
 * Retry mechanism for failed operations
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }
  
  throw lastError!;
};

/**
 * Timeout wrapper for operations
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number = 30000
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(createError(ERROR_CODES.TIMEOUT_ERROR)), timeoutMs)
    ),
  ]);
};

/**
 * Safe async operation wrapper
 */
export const safeAsync = async <T>(
  operation: () => Promise<T>,
  onError?: (error: AppError) => void
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    const appError = handleError(error);
    if (onError) {
      onError(appError);
    } else {
      console.error('Operation failed:', appError);
    }
    return null;
  }
};

/**
 * Loading state manager
 */
export class LoadingStateManager {
  private listeners: Set<(state: LoadingState) => void> = new Set();
  private currentState: LoadingState = { isLoading: false };

  subscribe(listener: (state: LoadingState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  setState(state: Partial<LoadingState>) {
    this.currentState = { ...this.currentState, ...state };
    this.listeners.forEach(listener => listener(this.currentState));
  }

  start(message?: string, stage?: string) {
    this.setState({ isLoading: true, message, stage, progress: 0 });
  }

  progress(progress: number, stage?: string) {
    this.setState({ progress, stage });
  }

  finish() {
    this.setState({ isLoading: false, progress: 100, stage: undefined, message: undefined });
  }

  getState() {
    return this.currentState;
  }
}

export default {
  createError,
  handleError,
  withRetry,
  withTimeout,
  safeAsync,
  LoadingStateManager,
  ERROR_CODES,
  ERROR_MESSAGES,
  ERROR_RECOVERY,
  LOADING_MESSAGES,
};
