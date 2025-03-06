
import { supabase } from "@/integrations/supabase/client";
import { 
  AppError, 
  ErrorType, 
  handleError, 
  handleSupabaseError 
} from "@/utils/errors";
import { QRCode, QRCodeGenerationOptions } from "./types";

/**
 * Generate a QR code for a stamp card
 */
export const generateStampQRCode = async (
  cardId: string,
  expiresInHours: number = 24,
  isSingleUse: boolean = false,
  securityLevel: "L" | "M" | "Q" | "H" = "M"
): Promise<{ qrCode: QRCode; qrValue: string }> => {
  try {
    if (expiresInHours < 1 || expiresInHours > 72) {
      throw new AppError(
        ErrorType.VALIDATION_ERROR,
        "Expiry hours must be between 1 and 72"
      );
    }

    const { data, error } = await supabase.functions.invoke('create-qr-code', {
      body: { cardId, expiresInHours, isSingleUse, securityLevel }
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

/**
 * Generate a QR code with more options
 */
export const generateQRCode = async (
  options: QRCodeGenerationOptions
): Promise<{ qrCode: QRCode; qrValue: string }> => {
  return generateStampQRCode(
    options.cardId,
    options.expiresInHours || 24,
    options.isSingleUse || false,
    options.securityLevel || "M"
  );
};

/**
 * Fetch active QR codes for a merchant's stamp card
 */
export const fetchActiveQRCodes = async (cardId: string): Promise<QRCode[]> => {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from("stamp_qr_codes")
      .select("*")
      .eq("card_id", cardId)
      .gt("expires_at", now)
      .eq("is_used", false)
      .order("created_at", { ascending: false });

    if (error) {
      throw handleSupabaseError(error, "fetching QR codes", ErrorType.DATA_FETCH_FAILED);
    }

    return data || [];
  } catch (error) {
    throw handleError(error, ErrorType.DATA_FETCH_FAILED, "Failed to fetch active QR codes");
  }
};

/**
 * Delete a QR code
 */
export const deleteQRCode = async (qrCodeId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("stamp_qr_codes")
      .delete()
      .eq("id", qrCodeId);

    if (error) {
      throw handleSupabaseError(error, "deleting QR code", ErrorType.DATA_DELETE_FAILED);
    }
  } catch (error) {
    throw handleError(error, ErrorType.DATA_DELETE_FAILED, "Failed to delete QR code");
  }
};
