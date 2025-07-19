import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Create mock client for development without Supabase
const createMockClient = () => ({
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
    eq: function() { return this; },
    order: function() { return this; },
  }),
  auth: {
    signInWithPassword: () => Promise.resolve({ data: { user: { id: '1' }, session: { access_token: 'mock' } }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    getSession: () => Promise.resolve({ data: { session: { access_token: 'mock' } }, error: null }),
    getUser: () => Promise.resolve({ data: { user: { id: '1' } }, error: null }),
    onAuthStateChange: (callback: any) => {
      // Simulate authenticated state
      setTimeout(() => callback('SIGNED_IN', { access_token: 'mock' }), 100);
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
  },
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: { path: 'mock-path' }, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: 'https://placeholder.com/image.jpg' } }),
    }),
  },
});

// Use mock client for now
export const supabase = createMockClient();

// Create admin user function - simplified for development
export const createAdminUser = async () => {
  return { data: { user: { id: '1' } }, error: null };
};