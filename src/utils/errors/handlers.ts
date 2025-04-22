import { toast } from "sonner";
import { ErrorType } from './types';
import { AppError } from './AppError';

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
  
  // Handle transaction type constraint errors properly
  if (error.code === "23514" && error.message?.includes("stamp_transactions_type_check")) {
    return new AppError(
      ErrorType.DATABASE_ERROR,
      "There was an issue with the transaction type. Please try again or contact support if the issue persists.",
      error,
      { operation }
    );
  }
  
  // Handle DB constraint violation errors
  if (error.code === "23514") {
    return new AppError(
      ErrorType.DATABASE_ERROR,
      "There's an issue with the database constraints. Please contact support.",
      error,
      { operation }
    );
  }
  
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
