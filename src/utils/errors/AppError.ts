
import { ErrorType } from './types';
import { getUserFriendlyErrorMessage } from './messages';

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
