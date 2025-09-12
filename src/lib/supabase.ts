import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Environment Debug:');
console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Present' : '❌ Missing');
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Present' : '❌ Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your environment configuration.');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing');
  throw new Error('Missing Supabase environment variables. Please check your environment configuration.');
}

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'nutrasage-auth-token',
    flowType: 'pkce'
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey
    }
  }
});

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return !!session;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

// Helper function to get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Create admin user on application start
export const createAdminUser = async () => {
  try {
    // Check if environment variables are configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('Supabase environment variables not configured. Skipping admin user creation.');
      return;
    }

    const { data: { user }, error } = await supabase.auth.signUp({
      email: 'admin@nutrasage.com',
      password: 'admin123',
    });

    if (error && error.message !== 'User already registered') {
      console.error('Error creating admin user:', error);
    } else {
      console.log('Admin user created or already exists');
    }
  } catch (error) {
    console.error('Unexpected error creating admin user:', error);
  }
};

// Initialize secure storage system
export const initializeApplication = async () => {
  try {
    // Initialize secure storage
    const { initializeSecureStorage } = await import('../services/secureFileService');
    await initializeSecureStorage();
    
    // Create admin user
    await createAdminUser();
    
    console.log('🔐 Application initialized with secure storage');
  } catch (error) {
    console.error('Error initializing application:', error);
  }
};