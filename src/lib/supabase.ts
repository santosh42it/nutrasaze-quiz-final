
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Check if we have valid Supabase credentials
const hasValidCredentials = supabaseUrl !== 'https://placeholder.supabase.co' && supabaseAnonKey !== 'placeholder-key';

// Create real Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public'
  }
});

// Create admin user function
export const createAdminUser = async () => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'admin@nutrasage.com',
      password: 'nutrasage@123'
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Test database connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('questions').select('count(*)', { count: 'exact' });
    return { connected: !error, error };
  } catch (error) {
    return { connected: false, error };
  }
};
