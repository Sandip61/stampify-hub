
import { ErrorType } from "./types";

/**
 * Get a user-friendly error message for a given error type
 * @param errorType The error type
 * @returns A user-friendly error message
 */
export const getUserFriendlyErrorMessage = (errorType: ErrorType): string => {
  switch (errorType) {
    // Authentication errors
    case ErrorType.AUTH_EMAIL_NOT_CONFIRMED:
      return "Please confirm your email before signing in.";
    case ErrorType.AUTH_INVALID_CREDENTIALS:
      return "Invalid email or password. Please try again.";
    case ErrorType.AUTH_USER_NOT_FOUND:
      return "We couldn't find an account with that email.";
    case ErrorType.AUTH_EMAIL_IN_USE:
      return "An account with this email already exists.";
    case ErrorType.AUTH_WEAK_PASSWORD:
      return "Please use a stronger password.";
    case ErrorType.AUTH_INVALID_RESET_TOKEN:
      return "This password reset link is invalid or has expired.";
    case ErrorType.AUTH_EMAIL_SEND_FAILED:
      return "Failed to send the email. Please try again later.";
    case ErrorType.AUTH_SESSION_EXPIRED:
      return "Your session has expired. Please sign in again.";
    case ErrorType.AUTH_MISSING_EMAIL:
      return "Please enter your email address.";
    case ErrorType.AUTH_MISSING_PASSWORD:
      return "Please enter your password.";
    case ErrorType.AUTH_PASSWORD_MISMATCH:
      return "Passwords do not match.";
      
    // Profile errors
    case ErrorType.PROFILE_NOT_FOUND:
      return "Profile not found. Please try again or contact support.";
    case ErrorType.PROFILE_UPDATE_FAILED:
      return "Failed to update your profile. Please try again.";
      
    // Merchant errors
    case ErrorType.MERCHANT_NOT_FOUND:
      return "Merchant account not found. Please try again or contact support.";
    case ErrorType.MERCHANT_UPDATE_FAILED:
      return "Failed to update merchant information. Please try again.";
      
    // Stamp card errors
    case ErrorType.STAMP_CARD_NOT_FOUND:
      return "Stamp card not found. It may have been deleted or deactivated.";
    case ErrorType.STAMP_CARD_INACTIVE:
      return "This stamp card is no longer active.";
    case ErrorType.STAMP_CARD_EXPIRED:
      return "This stamp card has expired.";
    case ErrorType.STAMP_ISSUE_FAILED:
      return "Failed to issue stamps. Please try again.";
    case ErrorType.STAMP_REDEEM_FAILED:
      return "Failed to redeem your reward. Please try again or contact the merchant.";
    case ErrorType.STAMP_INSUFFICIENT:
      return "You don't have enough stamps to redeem this reward.";
      
    // QR Code errors
    case ErrorType.QR_CODE_INVALID:
      return "Invalid QR code. Please try scanning again or ask for a new code.";
    case ErrorType.QR_CODE_EXPIRED:
      return "This QR code has expired. Please ask for a new one.";
    case ErrorType.QR_CODE_USED:
      return "This QR code has already been used.";
    case ErrorType.QR_CODE_GENERATION_FAILED:
      return "Failed to generate a QR code. Please try again.";
      
    // Data operation errors
    case ErrorType.DATA_FETCH_FAILED:
      return "Failed to load data. Please check your connection and try again.";
    case ErrorType.DATA_UPDATE_FAILED:
      return "Failed to update data. Please try again.";
    case ErrorType.DATA_DELETE_FAILED:
      return "Failed to delete data. Please try again.";
    case ErrorType.DATA_CREATE_FAILED:
      return "Failed to create new data. Please try again.";
      
    // Validation errors
    case ErrorType.VALIDATION_ERROR:
      return "Please check your input and try again.";
      
    // Network/API errors
    case ErrorType.NETWORK_ERROR:
      return "Network error. Please check your connection and try again.";
    case ErrorType.API_ERROR:
      return "Something went wrong with our service. Please try again later.";
    case ErrorType.RATE_LIMIT_EXCEEDED:
      return "Too many requests. Please try again later.";
      
    // Server errors
    case ErrorType.SERVER_ERROR:
      return "Server error. Our team has been notified and we're working on it.";
    case ErrorType.DATABASE_ERROR:
      return "Database error. Please try again later.";
      
    // Generic errors
    case ErrorType.UNAUTHORIZED:
      return "You're not authorized to perform this action. Please sign in.";
    case ErrorType.PERMISSION_DENIED:
      return "You don't have permission to perform this action.";
      
    // Offline-related errors
    case ErrorType.OFFLINE_MODE:
      return "You're currently offline. Your changes will be saved and synced when you're back online.";
    case ErrorType.OFFLINE_STORAGE_ERROR:
      return "Failed to store data offline. Please check your device storage.";
    case ErrorType.OFFLINE_SYNC_FAILED:
      return "Failed to synchronize offline data. Please try again when you're online.";
      
    // Default case
    case ErrorType.UNKNOWN_ERROR:
    default:
      return "Something went wrong. Please try again or contact support.";
  }
};

// A mapping of error types to HTTP status codes
export const errorTypesToStatusCodes: Record<ErrorType, number> = {
  [ErrorType.AUTH_EMAIL_NOT_CONFIRMED]: 403,
  [ErrorType.AUTH_INVALID_CREDENTIALS]: 401,
  [ErrorType.AUTH_USER_NOT_FOUND]: 404,
  [ErrorType.AUTH_EMAIL_IN_USE]: 409,
  [ErrorType.AUTH_WEAK_PASSWORD]: 400,
  [ErrorType.AUTH_INVALID_RESET_TOKEN]: 400,
  [ErrorType.AUTH_EMAIL_SEND_FAILED]: 500,
  [ErrorType.AUTH_SESSION_EXPIRED]: 401,
  [ErrorType.AUTH_MISSING_EMAIL]: 400,
  [ErrorType.AUTH_MISSING_PASSWORD]: 400,
  [ErrorType.AUTH_PASSWORD_MISMATCH]: 400,
  
  [ErrorType.PROFILE_NOT_FOUND]: 404,
  [ErrorType.PROFILE_UPDATE_FAILED]: 500,
  
  [ErrorType.MERCHANT_NOT_FOUND]: 404,
  [ErrorType.MERCHANT_UPDATE_FAILED]: 500,
  
  [ErrorType.STAMP_CARD_NOT_FOUND]: 404,
  [ErrorType.STAMP_CARD_INACTIVE]: 403,
  [ErrorType.STAMP_CARD_EXPIRED]: 403,
  [ErrorType.STAMP_ISSUE_FAILED]: 500,
  [ErrorType.STAMP_REDEEM_FAILED]: 500,
  [ErrorType.STAMP_INSUFFICIENT]: 403,
  
  [ErrorType.QR_CODE_INVALID]: 400,
  [ErrorType.QR_CODE_EXPIRED]: 403,
  [ErrorType.QR_CODE_USED]: 403,
  [ErrorType.QR_CODE_GENERATION_FAILED]: 500,
  
  [ErrorType.DATA_FETCH_FAILED]: 500,
  [ErrorType.DATA_UPDATE_FAILED]: 500,
  [ErrorType.DATA_DELETE_FAILED]: 500,
  [ErrorType.DATA_CREATE_FAILED]: 500,
  
  [ErrorType.VALIDATION_ERROR]: 400,
  
  [ErrorType.NETWORK_ERROR]: 503,
  [ErrorType.API_ERROR]: 500,
  [ErrorType.RATE_LIMIT_EXCEEDED]: 429,
  
  [ErrorType.SERVER_ERROR]: 500,
  [ErrorType.DATABASE_ERROR]: 500,
  
  [ErrorType.UNKNOWN_ERROR]: 500,
  [ErrorType.UNAUTHORIZED]: 401,
  [ErrorType.PERMISSION_DENIED]: 403,
  
  [ErrorType.OFFLINE_MODE]: 503,
  [ErrorType.OFFLINE_STORAGE_ERROR]: 500,
  [ErrorType.OFFLINE_SYNC_FAILED]: 500
};
