
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
  message?: string;
  stamps?: {
    count: number;
    issuedAt: string;
    offlineOperationId?: string;
  };
  cardInfo?: {
    id: string;
    totalStampsRequired: number;
    currentStamps: number;
    name?: string;
    business_logo?: string;
    business_color?: string;
  };
  customerInfo?: {
    id: string;
    email?: string;
    name?: string;
  };
  transaction?: {
    id: string;
    type: 'stamp' | 'reward' | 'redeem';
    timestamp?: string;
    created_at?: string;
    card_id?: string;
    customer_id?: string;
    merchant_id?: string;
    count?: number;
  };
  offlineMode?: boolean;
  
  // Original response from server
  stampCard?: {
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
  rewardEarned?: boolean;
  rewardCode?: string | null;
}

export interface RedeemResponse {
  success: boolean;
  message?: string;
  reward: string;
  customerInfo: {
    id: string;
    email?: string;
    name?: string;
  };
  transaction: {
    id: string;
    card_id?: string;
    customer_id?: string;
    merchant_id?: string;
    type?: 'redeem';
    reward_code?: string;
    timestamp?: string;
    redeemed_at: string;
  };
  offlineMode?: boolean;
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
