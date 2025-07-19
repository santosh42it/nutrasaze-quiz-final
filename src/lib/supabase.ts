import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
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

// Create admin user
export const createAdminUser = async () => {
  const adminEmail = 'admin@nutrasage.com';
  const adminPassword = 'nutrasage@123';

  try {
    // First try to sign in with admin credentials
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });

    // If sign in succeeds, admin already exists
    if (signInData.user) {
      console.log('Admin user already exists');
      // Sign out after verification since this is just a check
      await supabase.auth.signOut();
      return;
    }

    // If sign in fails with anything other than invalid credentials, log the error
    if (signInError && !signInError.message.includes('Invalid login credentials')) {
      console.error('Error checking admin user:', signInError.message);
      return;
    }

    // If we reach here, admin doesn't exist, so create the account
    const { data, error } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: {
          role: 'admin'
        }
      }
    });

    if (error) {
      console.error('Error creating admin user:', error.message);
      return;
    }

    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Error in createAdminUser:', error);
  }
};