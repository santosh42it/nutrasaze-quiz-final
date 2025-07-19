import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.');
  // Create a dummy client to prevent errors
  const dummyClient = {
    auth: {
      signUp: () => Promise.resolve({ data: null, error: { message: 'Environment variables not configured' } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Environment variables not configured' } }),
      signOut: () => Promise.resolve({ error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null })
    }
  };
  // @ts-ignore
  window.supabaseClient = dummyClient;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
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