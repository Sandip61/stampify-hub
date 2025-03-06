
// Types for stamps functionality
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

export interface QRCodeGenerationOptions {
  cardId: string;
  expiresInHours?: number;
  isSingleUse?: boolean;
  securityLevel?: "L" | "M" | "Q" | "H";
}

export interface StampIssuingOptions {
  qrCode?: string;
  cardId?: string;
  customerId?: string;
  customerEmail?: string;
  count?: number;
  method: "direct" | "qr";
}
