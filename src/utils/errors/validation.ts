
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

// Need to import ErrorType and handleError for tryCatch function
import { ErrorType } from './types';
import { handleError } from './handlers';
