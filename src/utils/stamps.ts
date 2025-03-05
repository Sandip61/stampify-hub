
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  AppError, 
  ErrorType, 
  handleError, 
  handleSupabaseError 
} from "@/utils/errorHandling";

// Types
export interface QRCode {
  id: string;
  merchant_id: string;
  card_id: string;
  code: string;
  expires_at: string;
  created_at: string;
  is_single_use: boolean;
  is_used: boolean;
}

export interface StampResponse {
  success: boolean;
  stampCard: {
    id: string;
    card_id: string;
    customer_id: string;
    current_stamps: number;
    created_at: string;
    updated_at: string;
    card: {
      id: string;
      name: string;
      description: string;
      total_stamps: number;
      reward: string;
      business_logo: string;
      business_color: string;
    }
  };
  rewardEarned: boolean;
  rewardCode: string | null;
  transaction: {
    id: string;
    card_id: string;
    customer_id: string;
    merchant_id: string;
    type: string;
    count?: number;
    timestamp: string;
  };
}

export interface RedeemResponse {
  success: boolean;
  transaction: {
    id: string;
    card_id: string;
    customer_id: string;
    merchant_id: string;
    type: string;
    reward_code: string;
    timestamp: string;
    redeemed_at: string;
  };
  reward: string;
  customerInfo: {
    id: string;
  };
}

// Generate a QR code for a stamp card
export const generateStampQRCode = async (
  cardId: string,
  expiresInHours: number = 24,
  isSingleUse: boolean = false
): Promise<{ qrCode: QRCode; qrValue: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('create-qr-code', {
      body: { cardId, expiresInHours, isSingleUse }
    });

    if (error) {
      throw handleSupabaseError(error, "generating QR code", ErrorType.QR_CODE_GENERATION_FAILED);
    }

    if (!data.success) {
      throw new AppError(
        ErrorType.QR_CODE_GENERATION_FAILED,
        data.error || "Failed to generate QR code"
      );
    }

    return {
      qrCode: data.qrCode,
      qrValue: data.qrValue
    };
  } catch (error) {
    throw handleError(error, ErrorType.QR_CODE_GENERATION_FAILED, "Failed to generate QR code");
  }
};

// Issue stamps to a customer
export const issueStampsToCustomer = async (
  options: {
    qrCode?: string;
    cardId?: string;
    customerId?: string;
    customerEmail?: string;
    count?: number;
    method: "direct" | "qr";
  }
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

// Redeem a reward
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

// Helper function to scan QR codes (to be used with a QR scanner component)
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
