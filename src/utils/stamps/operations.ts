
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  AppError, 
  ErrorType, 
  handleError, 
  handleSupabaseError 
} from "@/utils/errors";
import { StampResponse, RedeemResponse, StampIssuingOptions } from "./types";
import { 
  addToOfflineQueue, 
  OfflineOperationType, 
  OFFLINE_QUEUE_STAMPS, 
  OFFLINE_QUEUE_REDEMPTIONS, 
  isOnline 
} from "@/utils/offlineStorage";

/**
 * Issue stamps to a customer
 */
export const issueStampsToCustomer = async (
  options: StampIssuingOptions
): Promise<StampResponse> => {
  try {
    // Check if online
    if (!isOnline()) {
      // Store the operation for later syncing
      const operationId = addToOfflineQueue(
        OFFLINE_QUEUE_STAMPS, 
        OfflineOperationType.ISSUE_STAMP, 
        options
      );
      
      // Return a placeholder response
      toast.info("You're offline. Stamps will be issued when you reconnect.");
      
      return {
        success: true,
        message: "Stamps will be issued when online",
        stamps: {
          count: options.count || 1,
          issuedAt: new Date().toISOString(),
          offlineOperationId: operationId
        },
        cardInfo: {
          id: options.cardId || "offline-placeholder",
          totalStampsRequired: 10, // Default value
          currentStamps: options.count || 1 // Approximate
        },
        customerInfo: {
          id: options.customerId || "offline-placeholder",
          email: options.customerEmail
        },
        transaction: {
          id: operationId,
          type: "stamp",
          timestamp: new Date().toISOString()
        },
        offlineMode: true
      };
    }

    // Online mode - proceed with API call
    const { data, error } = await supabase.functions.invoke('issue-stamp', {
      body: options
    });

    if (error) {
      throw handleSupabaseError(error, "issuing stamps", ErrorType.STAMP_ISSUE_FAILED);
    }

    if (!data.success) {
      throw new AppError(
        ErrorType.STAMP_ISSUE_FAILED,
        data.error || "Failed to issue stamps"
      );
    }

    return data;
  } catch (error) {
    // If it's a network error, try to queue it for offline
    if (error instanceof Error && error.message.includes('fetch failed')) {
      try {
        const operationId = addToOfflineQueue(
          OFFLINE_QUEUE_STAMPS, 
          OfflineOperationType.ISSUE_STAMP, 
          options
        );
        
        toast.info("Network problem detected. Stamps will be issued when connection improves.");
        
        return {
          success: true,
          message: "Stamps will be issued when online",
          stamps: {
            count: options.count || 1,
            issuedAt: new Date().toISOString(),
            offlineOperationId: operationId
          },
          cardInfo: {
            id: options.cardId || "offline-placeholder",
            totalStampsRequired: 10, // Default value
            currentStamps: options.count || 1 // Approximate
          },
          customerInfo: {
            id: options.customerId || "offline-placeholder",
            email: options.customerEmail
          },
          transaction: {
            id: operationId,
            type: "stamp",
            timestamp: new Date().toISOString()
          },
          offlineMode: true
        };
      } catch (offlineError) {
        console.error("Failed to queue offline operation:", offlineError);
      }
    }
    
    throw handleError(error, ErrorType.STAMP_ISSUE_FAILED, "Failed to issue stamps");
  }
};

/**
 * Redeem a reward
 */
export const redeemStampReward = async (rewardCode: string): Promise<RedeemResponse> => {
  try {
    // Check if online
    if (!isOnline()) {
      // Store the operation for later syncing
      const operationId = addToOfflineQueue(
        OFFLINE_QUEUE_REDEMPTIONS, 
        OfflineOperationType.REDEEM_REWARD, 
        { rewardCode }
      );
      
      // Return a placeholder response
      toast.info("You're offline. Reward will be redeemed when you reconnect.");
      
      return {
        success: true,
        message: "Reward will be redeemed when online",
        reward: "Pending reward redemption",
        customerInfo: {
          id: "offline-placeholder",
          email: "offline@example.com"
        },
        transaction: {
          id: operationId,
          type: "redemption",
          card_id: "offline-placeholder",
          customer_id: "offline-placeholder",
          merchant_id: "offline-placeholder",
          reward_code: rewardCode,
          timestamp: new Date().toISOString(),
          redeemed_at: new Date().toISOString()
        },
        offlineMode: true
      };
    }

    // Validate the rewardCode format before sending to the server
    if (!rewardCode || typeof rewardCode !== 'string') {
      throw new AppError(
        ErrorType.VALIDATION_ERROR,
        "Reward code is required"
      );
    }

    // Standardize the code format (uppercase, no spaces)
    const formattedCode = rewardCode.trim().toUpperCase();
    
    if (formattedCode.length !== 6 || !/^[A-Z0-9]{6}$/.test(formattedCode)) {
      throw new AppError(
        ErrorType.VALIDATION_ERROR,
        "Invalid reward code format. Code should be 6 alphanumeric characters"
      );
    }

    const { data, error } = await supabase.functions.invoke('redeem-reward', {
      body: { rewardCode: formattedCode }
    });

    if (error) {
      throw handleSupabaseError(error, "redeeming reward", ErrorType.STAMP_REDEEM_FAILED);
    }

    if (!data.success) {
      // Check if we have a specific error type from the server
      if (data.errorType) {
        throw new AppError(
          data.errorType as ErrorType,
          data.error || "Failed to redeem reward"
        );
      } else {
        throw new AppError(
          ErrorType.STAMP_REDEEM_FAILED,
          data.error || "Failed to redeem reward"
        );
      }
    }

    return data;
  } catch (error) {
    // If it's a network error, try to queue it for offline
    if (error instanceof Error && error.message.includes('fetch failed')) {
      try {
        const operationId = addToOfflineQueue(
          OFFLINE_QUEUE_REDEMPTIONS, 
          OfflineOperationType.REDEEM_REWARD, 
          { rewardCode }
        );
        
        toast.info("Network problem detected. Reward will be redeemed when connection improves.");
        
        return {
          success: true,
          message: "Reward will be redeemed when online",
          reward: "Pending reward redemption",
          customerInfo: {
            id: "offline-placeholder",
            email: "offline@example.com"
          },
          transaction: {
            id: operationId,
            type: "redemption",
            card_id: "offline-placeholder",
            customer_id: "offline-placeholder",
            merchant_id: "offline-placeholder",
            reward_code: rewardCode,
            timestamp: new Date().toISOString(),
            redeemed_at: new Date().toISOString()
          },
          offlineMode: true
        };
      } catch (offlineError) {
        console.error("Failed to queue offline operation:", offlineError);
      }
    }
    
    throw handleError(error, ErrorType.STAMP_REDEEM_FAILED, "Failed to redeem reward");
  }
};

/**
 * Helper function to scan QR codes (to be used with a QR scanner component)
 */
export const processScannedQRCode = async (
  qrCode: string,
  customerId?: string,
  customerEmail?: string,
  count: number = 1
): Promise<StampResponse> => {
  try {
    if (!qrCode) {
      throw new AppError(
        ErrorType.QR_CODE_INVALID,
        "No QR code detected"
      );
    }
    
    if (!customerId && !customerEmail) {
      throw new AppError(
        ErrorType.VALIDATION_ERROR,
        "Customer ID or email is required"
      );
    }
    
    // Try to parse the QR code to add a timestamp if it doesn't have one
    try {
      const qrData = JSON.parse(qrCode);
      
      // Add timestamp to prevent replay attacks if not already present
      if (!qrData.timestamp) {
        qrData.timestamp = Date.now();
        qrCode = JSON.stringify(qrData);
      }
    } catch (e) {
      // If parsing fails, it's not a valid JSON QR code
      throw new AppError(
        ErrorType.QR_CODE_INVALID,
        "Invalid QR code format"
      );
    }
    
    return await issueStampsToCustomer({
      qrCode,
      customerId,
      customerEmail,
      count,
      method: "qr"
    });
  } catch (error) {
    throw handleError(error, ErrorType.QR_CODE_INVALID, "Failed to process QR code");
  }
};
