
export const checkSupabaseConnection = async () => {
  try {
    console.log('🔍 Checking Supabase connection...');
    console.log('Environment variables:');
    console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Present' : '❌ Missing');
    console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing');
    
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase environment variables');
    }

    // Dynamic import to avoid circular dependencies
    const { supabase } = await import('./supabase');
    
    // Test basic connection
    const { count, error } = await supabase
      .from('quiz_responses')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Supabase connection successful');
    return { success: true, count };
    
  } catch (error) {
    console.error('❌ Connection check failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
