
import { ErrorType } from './types';

/**
 * Map error types to user-friendly messages
 */
export function getUserFriendlyErrorMessage(errorType: ErrorType): string {
  switch (errorType) {
    // Auth messages
    case ErrorType.AUTH_INVALID_CREDENTIALS:
      return "Invalid email or password. Please try again.";
    case ErrorType.AUTH_EMAIL_IN_USE:
      return "This email is already registered. Please use a different email or try to login.";
    case ErrorType.AUTH_EMAIL_NOT_CONFIRMED:
      return "Please check your email and confirm your account before logging in.";
    case ErrorType.AUTH_TOKEN_EXPIRED:
      return "Your session has expired. Please login again.";
    case ErrorType.AUTH_MISSING_CREDENTIALS:
      return "Please provide both email and password.";
    case ErrorType.AUTH_UNAUTHORIZED:
      return "You need to be logged in to perform this action.";
    
    // Validation messages
    case ErrorType.VALIDATION_ERROR:
      return "Please check the information you provided and try again.";
    
    // Resource messages
    case ErrorType.RESOURCE_NOT_FOUND:
      return "The requested resource was not found.";
    case ErrorType.RESOURCE_ALREADY_EXISTS:
      return "This resource already exists. Please try with different information.";
    
    // Permission messages
    case ErrorType.PERMISSION_DENIED:
      return "You don't have permission to perform this action.";
    
    // Network messages
    case ErrorType.NETWORK_ERROR:
      return "There was a problem connecting to the server. Please check your internet connection and try again.";
    
    // Database errors
    case ErrorType.DATABASE_ERROR:
      return "A database error occurred. Our team has been notified.";
    
    // Generic fallback message
    case ErrorType.UNKNOWN_ERROR:
    default:
      return "Something went wrong. Please try again or contact support.";
  }
}
