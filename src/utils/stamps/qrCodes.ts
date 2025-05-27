
import { merchantSupabase } from "@/integrations/supabase/client";
import { QRCodeGenerationOptions, QRCode } from "./types";
import { AppError, ErrorType, handleError, handleSupabaseError } from "@/utils/errors";

/**
 * Generate a stamp QR code for a merchant
 */
export const generateStampQRCode = async (
  cardId: string,
  expiresInHours: number = 24,
  isSingleUse: boolean = false,
  securityLevel: "L" | "M" | "Q" | "H" = "M"
): Promise<{ qrCode: QRCode; qrValue: string }> => {
  try {
    // Validate inputs
    if (!cardId) {
      throw new AppError(
        ErrorType.VALIDATION_ERROR,
        "Card ID is required"
      );
    }

    if (expiresInHours < 1 || expiresInHours > 72) {
      throw new AppError(
        ErrorType.VALIDATION_ERROR,
        "Expiry hours must be between 1 and 72"
      );
    }

    // Get the current merchant
    const { data: authData, error: authError } = await merchantSupabase.auth.getUser();
    if (authError || !authData.user) {
      throw new AppError(
        ErrorType.UNAUTHORIZED,
        "You must be logged in to generate QR codes"
      );
    }

    const merchantId = authData.user.id;

    // Check if the card belongs to the merchant
    const { data: cardData, error: cardError } = await merchantSupabase
      .from("stamp_cards")
      .select("id")
      .eq("id", cardId)
      .eq("merchant_id", merchantId)
      .single();

    if (cardError || !cardData) {
      throw new AppError(
        ErrorType.UNAUTHORIZED,
        "You do not have permission to generate QR codes for this card"
      );
    }

    // Create expiry date
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    // Generate a random code
    const code = crypto.randomUUID();

    // Create the QR code in the database
    const { data: qrCode, error: qrError } = await merchantSupabase
      .from("stamp_qr_codes")
      .insert({
        merchant_id: merchantId,
        card_id: cardId,
        code,
        expires_at: expiresAt.toISOString(),
        is_single_use: isSingleUse
      })
      .select()
      .single();

    if (qrError || !qrCode) {
      throw handleSupabaseError(qrError, "generating QR code", ErrorType.QR_CODE_GENERATION_FAILED);
    }

    // Create the QR code value with timestamp for added security
    const qrValue = JSON.stringify({
      type: "stamp",
      code: qrCode.code,
      card_id: qrCode.card_id,
      merchant_id: qrCode.merchant_id,
      timestamp: Date.now() // Add current timestamp to prevent replay attacks
    });

    return { qrCode, qrValue };
  } catch (error) {
    throw handleError(error, ErrorType.QR_CODE_GENERATION_FAILED, "Failed to generate QR code");
  }
};

/**
 * Fetch active QR codes for a stamp card
 */
export const fetchActiveQRCodes = async (cardId: string): Promise<QRCode[]> => {
  try {
    // Validate input
    if (!cardId) {
      throw new AppError(
        ErrorType.VALIDATION_ERROR,
        "Card ID is required"
      );
    }

    // Get the current merchant
    const { data: authData, error: authError } = await merchantSupabase.auth.getUser();
    if (authError || !authData.user) {
      throw new AppError(
        ErrorType.UNAUTHORIZED,
        "You must be logged in to view QR codes"
      );
    }

    const merchantId = authData.user.id;

    // Check if the card belongs to the merchant
    const { data: cardData, error: cardError } = await merchantSupabase
      .from("stamp_cards")
      .select("id")
      .eq("id", cardId)
      .eq("merchant_id", merchantId)
      .single();

    if (cardError || !cardData) {
      throw new AppError(
        ErrorType.UNAUTHORIZED,
        "You do not have permission to view QR codes for this card"
      );
    }

    // Get active QR codes (not expired and not used if single-use)
    const now = new Date().toISOString();
    const { data: qrCodes, error: qrError } = await merchantSupabase
      .from("stamp_qr_codes")
      .select("*")
      .eq("card_id", cardId)
      .eq("merchant_id", merchantId)
      .gt("expires_at", now)
      .or("is_used.eq.false,is_single_use.eq.false")
      .order("created_at", { ascending: false });

    if (qrError) {
      throw handleSupabaseError(qrError, "fetching QR codes", ErrorType.DATA_FETCH_FAILED);
    }

    return qrCodes || [];
  } catch (error) {
    throw handleError(error, ErrorType.DATA_FETCH_FAILED, "Failed to fetch QR codes");
  }
};

/**
 * Delete a QR code
 */
export const deleteQRCode = async (qrCodeId: string): Promise<void> => {
  try {
    // Validate input
    if (!qrCodeId) {
      throw new AppError(
        ErrorType.VALIDATION_ERROR,
        "QR code ID is required"
      );
    }

    // Get the current merchant
    const { data: authData, error: authError } = await merchantSupabase.auth.getUser();
    if (authError || !authData.user) {
      throw new AppError(
        ErrorType.UNAUTHORIZED,
        "You must be logged in to delete QR codes"
      );
    }

    const merchantId = authData.user.id;

    // Check if the QR code belongs to the merchant
    const { data: qrData, error: qrError } = await merchantSupabase
      .from("stamp_qr_codes")
      .select("id, merchant_id")
      .eq("id", qrCodeId)
      .single();

    if (qrError || !qrData) {
      throw new AppError(
        ErrorType.DATA_FETCH_FAILED,
        "QR code not found"
      );
    }

    if (qrData.merchant_id !== merchantId) {
      throw new AppError(
        ErrorType.UNAUTHORIZED,
        "You do not have permission to delete this QR code"
      );
    }

    // Delete the QR code
    const { error: deleteError } = await merchantSupabase
      .from("stamp_qr_codes")
      .delete()
      .eq("id", qrCodeId);

    if (deleteError) {
      throw handleSupabaseError(deleteError, "deleting QR code", ErrorType.DATA_DELETE_FAILED);
    }
  } catch (error) {
    throw handleError(error, ErrorType.DATA_DELETE_FAILED, "Failed to delete QR code");
  }
};
