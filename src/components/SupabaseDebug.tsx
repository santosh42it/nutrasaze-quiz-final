
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const SupabaseDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const runDiagnostics = async () => {
      const info: any = {
        envVars: {
          url: import.meta.env.VITE_SUPABASE_URL,
          hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
          hasServiceKey: !!import.meta.env.VITE_SUPABASE_SERVICE_KEY,
          anonKeyPreview: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
        },
        tests: {}
      };

      // Test 1: Basic connection
      try {
        const { data, error } = await supabase
          .from('answer_key')
          .select('id')
          .limit(1);
        
        info.tests.basicConnection = {
          success: !error,
          error: error?.message,
          errorCode: error?.code,
          dataLength: data?.length || 0
        };
      } catch (err) {
        info.tests.basicConnection = {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }

      // Test 2: Count query
      try {
        const { count, error } = await supabase
          .from('answer_key')
          .select('*', { count: 'exact', head: true });
        
        info.tests.countQuery = {
          success: !error,
          error: error?.message,
          count
        };
      } catch (err) {
        info.tests.countQuery = {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }

      // Test 3: Auth status
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        info.auth = {
          hasSession: !!session,
          user: session?.user?.email,
          error: error?.message
        };
      } catch (err) {
        info.auth = {
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }

      setDebugInfo(info);
    };

    runDiagnostics();
  }, []);

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="font-bold text-lg mb-4">Supabase Connection Diagnostics</h3>
      <pre className="text-xs overflow-auto bg-white p-2 rounded">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
};
