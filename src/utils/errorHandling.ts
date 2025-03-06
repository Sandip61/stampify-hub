import { toast } from "sonner";

/**
 * Types of errors that can occur in the application
 */
export enum ErrorType {
  // Authentication errors
  AUTH_EMAIL_NOT_CONFIRMED = "AUTH_EMAIL_NOT_CONFIRMED",
  AUTH_INVALID_CREDENTIALS = "AUTH_INVALID_CREDENTIALS",
  AUTH_USER_NOT_FOUND = "AUTH_USER_NOT_FOUND",
  AUTH_EMAIL_IN_USE = "AUTH_EMAIL_IN_USE",
  AUTH_WEAK_PASSWORD = "AUTH_WEAK_PASSWORD",
  AUTH_INVALID_RESET_TOKEN = "AUTH_INVALID_RESET_TOKEN",
  
  // Profile errors
  PROFILE_NOT_FOUND = "PROFILE_NOT_FOUND",
  PROFILE_UPDATE_FAILED = "PROFILE_UPDATE_FAILED",
  
  // Merchant errors
  MERCHANT_NOT_FOUND = "MERCHANT_NOT_FOUND",
  MERCHANT_UPDATE_FAILED = "MERCHANT_UPDATE_FAILED",
  MERCHANT_INVALID_DATA = "MERCHANT_INVALID_DATA",
  
  // Stamp card errors
  STAMP_CARD_NOT_FOUND = "STAMP_CARD_NOT_FOUND",
  STAMP_CARD_CREATE_FAILED = "STAMP_CARD_CREATE_FAILED",
  STAMP_CARD_UPDATE_FAILED = "STAMP_CARD_UPDATE_FAILED",
  
  // QR code errors
  QR_CODE_INVALID = "QR_CODE_INVALID",
  QR_CODE_EXPIRED = "QR_CODE_EXPIRED",
  QR_CODE_ALREADY_USED = "QR_CODE_ALREADY_USED",
  QR_CODE_GENERATION_FAILED = "QR_CODE_GENERATION_FAILED",
  
  // Data operations errors
  DATA_FETCH_FAILED = "DATA_FETCH_FAILED",
  DATA_CREATE_FAILED = "DATA_CREATE_FAILED",
  DATA_UPDATE_FAILED = "DATA_UPDATE_FAILED",
  DATA_DELETE_FAILED = "DATA_DELETE_FAILED",
  
  // Stamp operation errors
  STAMP_ISSUE_FAILED = "STAMP_ISSUE_FAILED",
  STAMP_REDEEM_FAILED = "STAMP_REDEEM_FAILED",
  
  // General errors
  NETWORK_ERROR = "NETWORK_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  PERMISSION_DENIED = "PERMISSION_DENIED"
}

/**
 * Application error class with standardized structure
 */
export class AppError extends Error {
  public type: ErrorType;
  public originalError?: Error | unknown;
  public context?: Record<string, any>;

  constructor(
    type: ErrorType,
    message: string,
    originalError?: Error | unknown,
    context?: Record<string, any>
  ) {
    super(message);
    this.type = type;
    this.originalError = originalError;
    this.context = context;
    this.name = "AppError";
  }

  /**
   * Get user-friendly message based on error type
   */
  public getUserFriendlyMessage(): string {
    return getUserFriendlyErrorMessage(this.type, this.message);
  }
}

/**
 * Maps error types to user-friendly messages
 */
export const getUserFriendlyErrorMessage = (
  errorType: ErrorType,
  fallbackMessage?: string
): string => {
  const messages: Record<ErrorType, string> = {
    [ErrorType.AUTH_EMAIL_NOT_CONFIRMED]:
      "Please check your email to confirm your account before logging in",
    [ErrorType.AUTH_INVALID_CREDENTIALS]:
      "Invalid email or password. Please try again",
    [ErrorType.AUTH_USER_NOT_FOUND]:
      "Account not found. Please check your email or create a new account",
    [ErrorType.AUTH_EMAIL_IN_USE]:
      "An account with this email already exists",
    [ErrorType.AUTH_WEAK_PASSWORD]:
      "Password is too weak. It should be at least 6 characters long",
    [ErrorType.AUTH_INVALID_RESET_TOKEN]:
      "Invalid or expired password reset link. Please request a new one",
    [ErrorType.PROFILE_NOT_FOUND]:
      "User profile not found",
    [ErrorType.PROFILE_UPDATE_FAILED]:
      "Failed to update profile. Please try again",
    [ErrorType.MERCHANT_NOT_FOUND]:
      "Merchant account not found",
    [ErrorType.MERCHANT_UPDATE_FAILED]:
      "Failed to update merchant account. Please try again",
    [ErrorType.MERCHANT_INVALID_DATA]:
      "Invalid merchant data provided",
    [ErrorType.STAMP_CARD_NOT_FOUND]:
      "Stamp card not found",
    [ErrorType.STAMP_CARD_CREATE_FAILED]:
      "Failed to create stamp card. Please try again",
    [ErrorType.STAMP_CARD_UPDATE_FAILED]:
      "Failed to update stamp card. Please try again",
    [ErrorType.QR_CODE_INVALID]:
      "Invalid QR code. Please try scanning again",
    [ErrorType.QR_CODE_EXPIRED]:
      "This QR code has expired. Please request a new one",
    [ErrorType.QR_CODE_ALREADY_USED]:
      "This QR code has already been used",
    [ErrorType.QR_CODE_GENERATION_FAILED]:
      "Failed to generate QR code. Please try again",
    [ErrorType.STAMP_ISSUE_FAILED]:
      "Failed to issue stamps. Please try again",
    [ErrorType.STAMP_REDEEM_FAILED]:
      "Failed to redeem reward. Please try again",
    [ErrorType.DATA_FETCH_FAILED]:
      "Failed to fetch data. Please try again or check your connection",
    [ErrorType.DATA_CREATE_FAILED]:
      "Failed to create record. Please try again",
    [ErrorType.DATA_UPDATE_FAILED]:
      "Failed to update record. Please try again",
    [ErrorType.DATA_DELETE_FAILED]:
      "Failed to delete record. Please try again",
    [ErrorType.NETWORK_ERROR]:
      "Network error. Please check your connection and try again",
    [ErrorType.UNKNOWN_ERROR]:
      "An unexpected error occurred. Please try again",
    [ErrorType.VALIDATION_ERROR]:
      "Please check the information you provided and try again",
    [ErrorType.PERMISSION_DENIED]:
      "You don't have permission to perform this action"
  };

  return messages[errorType] || fallbackMessage || "Something went wrong. Please try again";
};

/**
 * Handle errors consistently across the application
 */
export const handleError = (
  error: Error | AppError | unknown,
  defaultType: ErrorType = ErrorType.UNKNOWN_ERROR,
  defaultMessage: string = "An unexpected error occurred"
): AppError => {
  console.error("Error occurred:", error);
  
  // If it's already an AppError, return it
  if (error instanceof AppError) {
    // Always display the toast with user-friendly message
    toast.error(error.getUserFriendlyMessage());
    return error;
  }
  
  // If it's a regular Error, convert it to an AppError
  if (error instanceof Error) {
    // Try to map Supabase errors to our error types
    if (error.message.includes("Email not confirmed")) {
      const appError = new AppError(
        ErrorType.AUTH_EMAIL_NOT_CONFIRMED,
        "Please check your email to confirm your account",
        error
      );
      toast.error(appError.getUserFriendlyMessage());
      return appError;
    }
    
    if (error.message.includes("Invalid login credentials")) {
      const appError = new AppError(
        ErrorType.AUTH_INVALID_CREDENTIALS,
        "Invalid email or password",
        error
      );
      toast.error(appError.getUserFriendlyMessage());
      return appError;
    }
    
    if (error.message.includes("User already registered")) {
      const appError = new AppError(
        ErrorType.AUTH_EMAIL_IN_USE,
        "An account with this email already exists",
        error
      );
      toast.error(appError.getUserFriendlyMessage());
      return appError;
    }
    
    // For unknown errors, create a generic AppError
    const appError = new AppError(
      defaultType,
      error.message || defaultMessage,
      error
    );
    toast.error(appError.getUserFriendlyMessage());
    return appError;
  }
  
  // For other unknown types, create a generic AppError
  const appError = new AppError(
    defaultType,
    defaultMessage,
    error
  );
  toast.error(appError.getUserFriendlyMessage());
  return appError;
};

/**
 * Process Supabase errors with better context
 */
export const handleSupabaseError = (
  error: any,
  operation: string,
  defaultType: ErrorType = ErrorType.UNKNOWN_ERROR
): AppError => {
  if (!error) {
    return new AppError(
      defaultType,
      `Unknown error during ${operation}`
    );
  }

  // Log detailed error for debugging
  console.error(`Supabase error during ${operation}:`, error);
  
  // Map common Supabase error codes/messages to our error types
  if (error.code === "23505" || error.message?.includes("already exists")) {
    return new AppError(
      ErrorType.AUTH_EMAIL_IN_USE,
      "An account with this email already exists",
      error,
      { operation }
    );
  }
  
  if (error.code === "23503" || error.message?.includes("violates foreign key constraint")) {
    return new AppError(
      ErrorType.VALIDATION_ERROR,
      "Invalid reference to a resource that doesn't exist",
      error,
      { operation }
    );
  }
  
  if (error.code === "42P01" || error.message?.includes("relation") && error.message?.includes("does not exist")) {
    return new AppError(
      ErrorType.UNKNOWN_ERROR,
      "Database schema error",
      error,
      { operation }
    );
  }
  
  if (error.code === "42501" || error.message?.includes("permission denied")) {
    return new AppError(
      ErrorType.PERMISSION_DENIED,
      "You don't have permission to perform this action",
      error,
      { operation }
    );
  }
  
  // Default case for unrecognized errors
  return new AppError(
    defaultType,
    error.message || `Error during ${operation}`,
    error,
    { operation }
  );
};

/**
 * Validate form inputs and return structured errors
 */
export const validateForm = <T extends Record<string, any>>(
  data: T,
  rules: {
    [K in keyof T]?: {
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp;
      validate?: (value: T[K]) => boolean | string;
    };
  }
): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  Object.entries(rules).forEach(([field, rule]) => {
    const value = data[field];
    
    // Required check
    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      errors[field] = `${field} is required`;
      return;
    }
    
    // Skip other validations if value is empty and not required
    if (!value && !rule.required) {
      return;
    }
    
    // String validations
    if (typeof value === 'string') {
      // Min length
      if (rule.minLength && value.length < rule.minLength) {
        errors[field] = `${field} must be at least ${rule.minLength} characters`;
        return;
      }
      
      // Max length
      if (rule.maxLength && value.length > rule.maxLength) {
        errors[field] = `${field} must be at most ${rule.maxLength} characters`;
        return;
      }
      
      // Pattern
      if (rule.pattern && !rule.pattern.test(value)) {
        errors[field] = `${field} has an invalid format`;
        return;
      }
    }
    
    // Custom validation
    if (rule.validate) {
      const result = rule.validate(value);
      if (result !== true) {
        errors[field] = typeof result === 'string' ? result : `${field} is invalid`;
      }
    }
  });
  
  return errors;
};

/**
 * Check if an email is valid
 */
export const isValidEmail = (email: string): boolean => {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
};

/**
 * Try to execute an async operation with proper error handling
 */
export const tryCatch = async <T>(
  operation: () => Promise<T>,
  errorType: ErrorType = ErrorType.UNKNOWN_ERROR,
  errorMessage: string = "Operation failed"
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    throw handleError(error, errorType, errorMessage);
  }
};
