import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Environment Debug:');
console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing');
console.log('All env vars:', import.meta.env);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables.');
  console.error('Expected: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  console.error('Please add them in the Secrets section of Replit');
}

// Always create the client, even with empty values to prevent errors
const client = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage
    }
  }
);

// If environment variables are missing, replace with dummy functions
if (!supabaseUrl || !supabaseAnonKey) {
  const dummyAuth = {
    signUp: () => Promise.resolve({ data: null, error: { message: 'Environment variables not configured' } }),
    signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Environment variables not configured' } }),
    signOut: () => Promise.resolve({ error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  };
  // @ts-ignore
  client.auth = dummyAuth;
}

export const supabase = client;

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