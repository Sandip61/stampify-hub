export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      customer_stamp_cards: {
        Row: {
          card_id: string
          created_at: string | null
          current_stamps: number
          customer_id: string
          id: string
          updated_at: string | null
        }
        Insert: {
          card_id: string
          created_at?: string | null
          current_stamps?: number
          customer_id: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          card_id?: string
          created_at?: string | null
          current_stamps?: number
          customer_id?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_stamp_cards_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "stamp_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      stamp_cards: {
        Row: {
          business_color: string | null
          business_logo: string | null
          created_at: string | null
          description: string | null
          expiry_days: number | null
          id: string
          is_active: boolean | null
          merchant_id: string
          name: string
          reward: string
          total_stamps: number
          updated_at: string | null
        }
        Insert: {
          business_color?: string | null
          business_logo?: string | null
          created_at?: string | null
          description?: string | null
          expiry_days?: number | null
          id?: string
          is_active?: boolean | null
          merchant_id: string
          name: string
          reward: string
          total_stamps?: number
          updated_at?: string | null
        }
        Update: {
          business_color?: string | null
          business_logo?: string | null
          created_at?: string | null
          description?: string | null
          expiry_days?: number | null
          id?: string
          is_active?: boolean | null
          merchant_id?: string
          name?: string
          reward?: string
          total_stamps?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      stamp_qr_codes: {
        Row: {
          card_id: string
          code: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_single_use: boolean | null
          is_used: boolean | null
          merchant_id: string
        }
        Insert: {
          card_id: string
          code: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_single_use?: boolean | null
          is_used?: boolean | null
          merchant_id: string
        }
        Update: {
          card_id?: string
          code?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_single_use?: boolean | null
          is_used?: boolean | null
          merchant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stamp_qr_codes_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "stamp_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      stamp_transactions: {
        Row: {
          card_id: string
          count: number | null
          customer_id: string
          id: string
          merchant_id: string
          reward_code: string | null
          timestamp: string | null
          type: string
        }
        Insert: {
          card_id: string
          count?: number | null
          customer_id: string
          id?: string
          merchant_id: string
          reward_code?: string | null
          timestamp?: string | null
          type: string
        }
        Update: {
          card_id?: string
          count?: number | null
          customer_id?: string
          id?: string
          merchant_id?: string
          reward_code?: string | null
          timestamp?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stamp_transactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "stamp_cards"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
