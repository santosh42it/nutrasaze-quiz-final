import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Renamed for clarity

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (session?.user) {
          setIsAuthenticated(true);
        } else {
          // Check if user was remembered and if remember preference is still valid
          const wasRemembered = localStorage.getItem('nutrasage_remember_admin') === 'true';
          const rememberExpiry = localStorage.getItem('nutrasage_remember_expiry');
          const isRememberValid = rememberExpiry && Date.now() < parseInt(rememberExpiry);
          
          if (wasRemembered && isRememberValid) {
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshedSession?.user && !refreshError) {
              setIsAuthenticated(true);
              return;
            } else {
              // Clear expired or invalid remember me data
              localStorage.removeItem('nutrasage_remember_admin');
              localStorage.removeItem('nutrasage_admin_email');
              localStorage.removeItem('nutrasage_remember_expiry');
            }
          } else if (wasRemembered && !isRememberValid) {
            // Remember me expired, clear the data
            localStorage.removeItem('nutrasage_remember_admin');
            localStorage.removeItem('nutrasage_admin_email');
            localStorage.removeItem('nutrasage_remember_expiry');
          }
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
      } else if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};