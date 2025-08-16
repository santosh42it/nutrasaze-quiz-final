
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Initialize form with remembered values
  useEffect(() => {
    const wasRemembered = localStorage.getItem('nutrasage_remember_admin') === 'true';
    const rememberedEmail = localStorage.getItem('nutrasage_admin_email');
    
    if (wasRemembered && rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check if user was remembered and if remember preference hasn't expired
      const wasRemembered = localStorage.getItem('nutrasage_remember_admin') === 'true';
      const rememberExpiry = localStorage.getItem('nutrasage_remember_expiry');
      const isRememberValid = rememberExpiry && Date.now() < parseInt(rememberExpiry);
      const isSessionOnly = sessionStorage.getItem('nutrasage_session_only') === 'true';
      
      if (session) {
        // If session exists and user chose remember me, keep them logged in
        if (wasRemembered && isRememberValid) {
          navigate('/admin');
          return;
        }
        // If session exists but it's session-only and browser was reopened, check if it's still valid
        if (isSessionOnly) {
          navigate('/admin');
          return;
        }
        // If session exists and remember me is valid
        if (wasRemembered && isRememberValid) {
          navigate('/admin');
          return;
        }
        // If session exists but remember me expired, clear data
        if (wasRemembered && !isRememberValid) {
          localStorage.removeItem('nutrasage_remember_admin');
          localStorage.removeItem('nutrasage_admin_email');
          localStorage.removeItem('nutrasage_remember_expiry');
          await supabase.auth.signOut();
        } else {
          navigate('/admin');
        }
      } else if (wasRemembered && isRememberValid) {
        // Try to refresh the session if user was remembered and it's still valid
        const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
        if (refreshedSession && !error) {
          navigate('/admin');
        } else {
          // If refresh failed, clear remember me data
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
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Store remember me preference and session persistence
      if (rememberMe) {
        localStorage.setItem('nutrasage_remember_admin', 'true');
        localStorage.setItem('nutrasage_admin_email', email);
        // Set a long expiry for remember me (30 days)
        localStorage.setItem('nutrasage_remember_expiry', (Date.now() + 30 * 24 * 60 * 60 * 1000).toString());
      } else {
        localStorage.removeItem('nutrasage_remember_admin');
        localStorage.removeItem('nutrasage_admin_email');
        localStorage.removeItem('nutrasage_remember_expiry');
        // If not remembering, set session to expire when browser closes
        sessionStorage.setItem('nutrasage_session_only', 'true');
      }

      navigate('/admin');
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff4fc] flex items-center justify-center">
        <div className="text-lg text-[#1d0917]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff4fc] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-[#e9d6e4]">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-[#913177] to-[#b8439a] rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="[font-family:'DM_Serif_Display',Helvetica] text-3xl font-extrabold text-[#1d0917] tracking-[1px]">
              Admin Portal
            </h2>
            <p className="mt-4 text-center text-sm text-[#6d6d6e] bg-[#fff4fc] rounded-lg p-3">
              Secure access to NutraSage administration
            </p>
          </div>
          
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#1d0917] mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  className="w-full px-4 py-3 border border-[#e9d6e4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#913177] focus:border-transparent text-[#1d0917] placeholder-[#6d6d6e]"
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#1d0917] mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  className="w-full px-4 py-3 border border-[#e9d6e4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#913177] focus:border-transparent text-[#1d0917] placeholder-[#6d6d6e]"
                  placeholder="Enter your password"
                  disabled={loading}
                />
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-[#913177] focus:ring-[#913177] border-[#e9d6e4] rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-[#6d6d6e]">
                  Keep me logged in (30 days)
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#913177] to-[#b8439a] text-white py-3 px-4 rounded-lg font-medium hover:from-[#7a2a66] hover:to-[#9f3a89] focus:outline-none focus:ring-2 focus:ring-[#913177] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in to Admin Panel'
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-[#6d6d6e]">
              Secured access to NutraSage administration
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
