import { ErrorType } from './types';

/**
 * User-friendly messages for each error type
 */
export const ErrorMessages: Record<ErrorType, string> = {
  // Authentication errors
  [ErrorType.AUTH_EMAIL_NOT_CONFIRMED]: "Please check your email to confirm your account",
  [ErrorType.AUTH_INVALID_CREDENTIALS]: "Invalid email or password",
  [ErrorType.AUTH_USER_NOT_FOUND]: "User not found",
  [ErrorType.AUTH_EMAIL_IN_USE]: "An account with this email already exists",
  [ErrorType.AUTH_WEAK_PASSWORD]: "Password must be at least 6 characters",
  [ErrorType.AUTH_INVALID_RESET_TOKEN]: "Invalid password reset token",
  [ErrorType.AUTH_EMAIL_SEND_FAILED]: "Failed to send email. Please try again later.",
  [ErrorType.AUTH_SESSION_EXPIRED]: "Your session has expired. Please log in again.",
  [ErrorType.AUTH_MISSING_EMAIL]: "Email is required",
  [ErrorType.AUTH_MISSING_PASSWORD]: "Password is required",
  [ErrorType.AUTH_PASSWORD_MISMATCH]: "Passwords do not match",
  
  // Stamp card errors
  [ErrorType.STAMP_CARD_NOT_FOUND]: "Stamp card not found",
  [ErrorType.STAMP_CARD_INACTIVE]: "This stamp card is inactive",
  [ErrorType.STAMP_CARD_EXPIRED]: "This stamp card has expired",
  [ErrorType.STAMP_ISSUE_FAILED]: "Failed to issue stamps. Please try again.",
  [ErrorType.STAMP_REDEEM_FAILED]: "Failed to redeem reward. Please try again.",
  [ErrorType.STAMP_INSUFFICIENT]: "Insufficient stamps to redeem reward",
  
  // QR Code errors
  [ErrorType.QR_CODE_INVALID]: "Invalid QR code",
  [ErrorType.QR_CODE_EXPIRED]: "This QR code has expired",
  [ErrorType.QR_CODE_USED]: "This QR code has already been used",
  [ErrorType.QR_CODE_GENERATION_FAILED]: "Failed to generate QR code",
  
  // Validation errors
  [ErrorType.VALIDATION_ERROR]: "Invalid input. Please check your data.",
  
  // Network/API errors
  [ErrorType.NETWORK_ERROR]: "Network error. Please check your connection.",
  [ErrorType.API_ERROR]: "API error. Please try again later.",
  [ErrorType.RATE_LIMIT_EXCEEDED]: "Rate limit exceeded. Please try again later.",
  
  // Server errors
  [ErrorType.SERVER_ERROR]: "Server error. Please try again later.",
  [ErrorType.DATABASE_ERROR]: "Database error. Please try again later.",
  
  // Generic errors
  [ErrorType.UNKNOWN_ERROR]: "An unexpected error occurred",
  [ErrorType.UNAUTHORIZED]: "You don't have permission to access this resource",
  [ErrorType.PERMISSION_DENIED]: "You don't have permission to perform this action",
  
  // Offline-related errors
  [ErrorType.OFFLINE_MODE]: "You're offline. This action will be performed when you reconnect.",
  [ErrorType.OFFLINE_STORAGE_ERROR]: "Failed to store data for offline use. Check your device storage.",
  [ErrorType.OFFLINE_SYNC_FAILED]: "Failed to sync offline data. Please try again later."
};
