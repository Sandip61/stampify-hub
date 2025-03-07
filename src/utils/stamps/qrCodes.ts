
import { supabase } from "@/integrations/supabase/client";
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
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      throw new AppError(
        ErrorType.UNAUTHORIZED,
        "You must be logged in to generate QR codes"
      );
    }

    const merchantId = authData.user.id;

    // Check if the card belongs to the merchant
    const { data: cardData, error: cardError } = await supabase
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
    const { data: qrCode, error: qrError } = await supabase
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
