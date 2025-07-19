import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only log environment check once and only if there are issues
const hasValidCredentials = supabaseUrl && supabaseAnonKey && 
  supabaseUrl.includes('supabase') && 
  supabaseAnonKey.length > 20;

if (!hasValidCredentials) {
  console.warn('⚠️ Supabase credentials missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Secrets.');
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
      realtime: {
        params: {
          eventsPerSecond: 2
        }
      }
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
      return { data: null, error: new Error('Supabase not configured') };
    }

    // Check if admin user already exists (silently)
    const { data: existingUser, error: checkError } = await supabase.auth.getUser();
    if (existingUser && !checkError) {
      return { data: existingUser, error: null };
    }

    // Try to sign in with existing credentials (silently)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@nutrasage.com',
      password: 'nutrasage@123'
    });

    if (error && error.message.includes('Invalid login credentials')) {
      return { data: null, error: null };
    }

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};