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
      merchants: {
        Row: {
          business_color: string
          business_logo: string
          business_name: string
          created_at: string | null
          email: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          business_color?: string
          business_logo?: string
          business_name: string
          created_at?: string | null
          email?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          business_color?: string
          business_logo?: string
          business_name?: string
          created_at?: string | null
          email?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          notifications_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          notifications_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          notifications_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
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
      users: {
        Row: {
          id: string
        }
        Insert: {
          id: string
        }
        Update: {
          id?: string
        }
        Relationships: []
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
