
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(
  'https://ctutwgntxhpuxtfkkdiy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0dXR3Z250eGhwdXh0ZmtrZGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwMTc5NzAsImV4cCI6MjA1NjU5Mzk3MH0.0z2LAalJDYlExlM4jbMWwz1l3RZ7oPohVbHjsADT8GE'
);
