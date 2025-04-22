
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
    
    // Profile related errors
    case ErrorType.PROFILE_NOT_FOUND:
      return "User profile not found. Please try again or contact support.";
    case ErrorType.PROFILE_UPDATE_FAILED:
      return "Failed to update profile. Please try again later.";
    
    // Merchant related errors
    case ErrorType.MERCHANT_NOT_FOUND:
      return "Merchant account not found. Please try again or contact support.";
    case ErrorType.MERCHANT_UPDATE_FAILED:
      return "Failed to update merchant information. Please try again later.";
    
    // Stamp related errors
    case ErrorType.STAMP_ISSUE_FAILED:
      return "Failed to issue stamps. Please try again later.";
    case ErrorType.STAMP_REDEEM_FAILED:
      return "Failed to redeem reward. Please verify the code and try again.";
    
    // QR code related errors
    case ErrorType.QR_CODE_INVALID:
      return "Invalid QR code. Please scan a valid stamp card QR code.";
    case ErrorType.QR_CODE_GENERATION_FAILED:
      return "Failed to generate QR code. Please try again later.";
    
    // Data operation errors
    case ErrorType.DATA_FETCH_FAILED:
      return "Failed to retrieve data. Please try again later.";
    case ErrorType.DATA_CREATE_FAILED:
      return "Failed to create data. Please try again later.";
    case ErrorType.DATA_UPDATE_FAILED:
      return "Failed to update data. Please try again later.";
    case ErrorType.DATA_DELETE_FAILED:
      return "Failed to delete data. Please try again later.";
    
    // Offline errors
    case ErrorType.OFFLINE_STORAGE_ERROR:
      return "Failed to store data for offline use. Please check your device storage.";
    
    // Authorization errors
    case ErrorType.UNAUTHORIZED:
      return "You need to be logged in to perform this action.";
    
    // Generic fallback message
    case ErrorType.UNKNOWN_ERROR:
    default:
      return "Something went wrong. Please try again or contact support.";
  }
}
