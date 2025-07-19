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



// Network error interceptor
const interceptNetworkErrors = (promise: Promise<any>) => {
  return promise.catch((error) => {
    // Intercept and suppress network errors
    const errorMessage = error?.message || '';
    if (
      errorMessage.includes('ERR_CONNECTION_REFUSED') ||
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('NetworkError') ||
      errorMessage.includes('fetch')
    ) {
      // Return a safe error response instead of letting it propagate
      return { data: null, error: new Error('Network unavailable') };
    }
    // Re-throw non-network errors
    throw error;
  });
};

// Create a safe client with error handling
const createSafeClient = () => {
  try {
    if (!hasValidCredentials) {
      // Return a mock client that doesn't make real requests
      return {
        from: () => ({
          select: () => interceptNetworkErrors(Promise.resolve({ data: [], error: null })),
          insert: () => interceptNetworkErrors(Promise.resolve({ data: null, error: new Error('Supabase not configured') })),
          update: () => interceptNetworkErrors(Promise.resolve({ data: null, error: new Error('Supabase not configured') })),
          delete: () => interceptNetworkErrors(Promise.resolve({ data: null, error: new Error('Supabase not configured') })),
          eq: function() { return this; },
          order: function() { return this; },
        }),
        auth: {
          signInWithPassword: () => interceptNetworkErrors(Promise.resolve({ data: null, error: new Error('Supabase not configured') })),
          signOut: () => interceptNetworkErrors(Promise.resolve({ error: null })),
          getSession: () => interceptNetworkErrors(Promise.resolve({ data: { session: null }, error: null })),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        },
        storage: {
          from: () => ({
            upload: () => interceptNetworkErrors(Promise.resolve({ data: null, error: new Error('Supabase not configured') })),
            getPublicUrl: () => ({ data: { publicUrl: '' } }),
          }),
        },
      };
    }

    const client = createClient(supabaseUrl, supabaseAnonKey, {
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

    // Wrap client methods with error interception
    const originalFrom = client.from.bind(client);
    client.from = (table: string) => {
      const query = originalFrom(table);
      const originalSelect = query.select.bind(query);
      const originalInsert = query.insert.bind(query);
      const originalUpdate = query.update.bind(query);
      const originalDelete = query.delete.bind(query);
      
      return {
        ...query,
        select: (...args: any[]) => interceptNetworkErrors(originalSelect(...args)),
        insert: (...args: any[]) => interceptNetworkErrors(originalInsert(...args)),
        update: (...args: any[]) => interceptNetworkErrors(originalUpdate(...args)),
        delete: (...args: any[]) => interceptNetworkErrors(originalDelete(...args)),
      };
    };

    return client;
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