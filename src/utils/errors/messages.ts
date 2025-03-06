
import { ErrorType } from './types';

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
