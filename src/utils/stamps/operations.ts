
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  AppError, 
  ErrorType, 
  handleError, 
  handleSupabaseError 
} from "@/utils/errors";
import { StampResponse, RedeemResponse, StampIssuingOptions } from "./types";

/**
 * Issue stamps to a customer
 */
export const issueStampsToCustomer = async (
  options: StampIssuingOptions
): Promise<StampResponse> => {
  try {
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
    throw handleError(error, ErrorType.STAMP_ISSUE_FAILED, "Failed to issue stamps");
  }
};

/**
 * Redeem a reward
 */
export const redeemStampReward = async (rewardCode: string): Promise<RedeemResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('redeem-reward', {
      body: { rewardCode }
    });

    if (error) {
      throw handleSupabaseError(error, "redeeming reward", ErrorType.STAMP_REDEEM_FAILED);
    }

    if (!data.success) {
      throw new AppError(
        ErrorType.STAMP_REDEEM_FAILED,
        data.error || "Failed to redeem reward"
      );
    }

    return data;
  } catch (error) {
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
