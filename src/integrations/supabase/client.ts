
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://asachfstvrtecrvxfqth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzYWNoZnN0dnJ0ZWNydnhmcXRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3NTQzOTYsImV4cCI6MjA1NjMzMDM5Nn0.5GyMztM-wEwglKDJct8xmhgZF5JF4Kdkyb0utS3RImg'
);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          notifications_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string;
          notifications_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          notifications_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      merchants: {
        Row: {
          id: string;
          email: string;
          business_name: string;
          business_logo: string;
          business_color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          business_name: string;
          business_logo?: string;
          business_color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          business_name?: string;
          business_logo?: string;
          business_color?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
