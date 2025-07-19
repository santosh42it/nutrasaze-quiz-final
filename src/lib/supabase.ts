import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Debug environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Environment Check:');
console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Present' : '❌ Missing');
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Present' : '❌ Missing');
console.log('URL starts with https:', supabaseUrl?.startsWith('https://') ? '✅' : '❌');
console.log('URL contains supabase:', supabaseUrl?.includes('supabase') ? '✅' : '❌');
console.log('Key length:', supabaseAnonKey?.length || 0, '(should be > 100)');

// Check if we have proper Supabase credentials
const hasValidCredentials = supabaseUrl && supabaseAnonKey && 
  supabaseUrl.includes('supabase') && 
  supabaseAnonKey.length > 20;

if (!hasValidCredentials) {
  console.error('❌ Invalid or missing Supabase environment variables.');
  console.error('Expected: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  console.error('Please add them in the Secrets section of Replit');
  console.error('URL should contain "supabase" and key should be longer than 20 characters');
}

// Create a safe client with error handling
const createSafeClient = () => {
  try {
    if (!hasValidCredentials) {
      // Return a mock client that doesn't make real requests
      return {
        from: () => ({
          select: () => Promise.resolve({ data: [], error: null }),
          insert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
          update: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
          delete: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
          eq: function() { return this; },
          order: function() { return this; },
        }),
        auth: {
          signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
          signOut: () => Promise.resolve({ error: null }),
          getSession: () => Promise.resolve({ data: { session: null }, error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        },
        storage: {
          from: () => ({
            upload: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
            getPublicUrl: () => ({ data: { publicUrl: '' } }),
          }),
        },
      };
    }

    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    // Return the same mock client structure
    return {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: new Error('Supabase client error') }),
        update: () => Promise.resolve({ data: null, error: new Error('Supabase client error') }),
        delete: () => Promise.resolve({ data: null, error: new Error('Supabase client error') }),
        eq: function() { return this; },
        order: function() { return this; },
      }),
      auth: {
        signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase client error') }),
        signOut: () => Promise.resolve({ error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ data: null, error: new Error('Supabase client error') }),
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
        }),
      },
    };
  }
};

export const supabase = createSafeClient();

// Create admin user function
export const createAdminUser = async () => {
  try {
    if (!hasValidCredentials) {
      console.log('⚠️ Skipping admin user creation - Supabase not configured');
      return { data: null, error: new Error('Supabase not configured') };
    }

    // Check if admin user already exists
    const { data: existingUser, error: checkError } = await supabase.auth.getUser();
    if (existingUser && !checkError) {
      console.log('✅ Admin user already logged in');
      return { data: existingUser, error: null };
    }

    // Try to sign in with existing credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@nutrasage.com',
      password: 'nutrasage@123'
    });

    if (error && error.message.includes('Invalid login credentials')) {
      console.log('🔄 Admin user not found, this is expected on first run');
      return { data: null, error: null };
    }

    if (error) {
      console.warn('Admin user creation/login issue:', error.message);
      return { data: null, error };
    }

    console.log('✅ Admin user ready');
    return { data, error: null };
  } catch (error) {
    console.warn('Admin user setup warning:', error);
    return { data: null, error: error as Error };
  }
};