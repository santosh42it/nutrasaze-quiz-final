
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../../stores/adminStore';
import { QuestionManager } from './QuestionManager';
import { TagManager } from './TagManager';
import { ProductManager } from './ProductManager';
import { ResponsesReport } from './ResponsesReport';
import { Button } from '../ui/button';
import { supabase, testConnection, setupDatabase } from '../../lib/supabase';

export const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { fetchQuestions, fetchOptions, fetchTags, fetchProducts, error, questions } = useAdminStore();
  const [activeTab, setActiveTab] = useState<'questions' | 'tags' | 'products' | 'responses'>('questions');
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'disconnected' | 'setup_required'>('checking');
  const [isSettingUp, setIsSettingUp] = useState(false);

  useEffect(() => {
    checkDatabaseConnection();
  }, []);

  const checkDatabaseConnection = async () => {
    console.log('Checking database connection...');
    const { connected, error } = await testConnection();
    
    if (error?.message?.includes('Missing Supabase credentials')) {
      setDbStatus('setup_required');
      return;
    }
    
    setDbStatus(connected ? 'connected' : 'disconnected');
    
    if (connected) {
      console.log('Database connected, fetching data...');
      await Promise.all([
        fetchQuestions(),
        fetchOptions(),
        fetchTags(),
        fetchProducts()
      ]);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/admin/login');
    } catch (error) {
      console.error('Sign out error:', error);
      // Force navigation even if signout fails
      navigate('/admin/login');
    }
  };

  const handleSetupDatabase = async () => {
    setIsSettingUp(true);
    try {
      const result = await setupDatabase();
      if (result.success) {
        await checkDatabaseConnection();
      } else {
        console.error('Setup failed:', result.error);
      }
    } catch (error) {
      console.error('Database setup error:', error);
    } finally {
      setIsSettingUp(false);
    }
  };

  const getStatusDisplay = () => {
    switch (dbStatus) {
      case 'connected':
        return { text: 'DB Connected', color: 'bg-green-500' };
      case 'disconnected':
        return { text: 'DB Disconnected', color: 'bg-red-500' };
      case 'setup_required':
        return { text: 'Setup Required', color: 'bg-yellow-500' };
      default:
        return { text: 'Checking...', color: 'bg-yellow-500' };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="min-h-screen bg-[#fff4fc]">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-6 lg:py-8">
        <div className="flex flex-col gap-3 sm:gap-6 lg:gap-8">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <h1 className="[font-family:'DM_Serif_Display',Helvetica] text-xl sm:text-2xl lg:text-3xl text-[#1d0917] tracking-[1px] sm:tracking-[2px] font-bold">
                Admin Panel
              </h1>
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <span className={`w-2 h-2 rounded-full ${statusDisplay.color}`}></span>
                  <span className="text-[#1d0917]">{statusDisplay.text}</span>
                  {dbStatus === 'connected' && (
                    <span className="text-[#1d0917] text-xs">({questions.length} questions)</span>
                  )}
                </div>
                
                {dbStatus === 'setup_required' && (
                  <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 rounded text-xs">
                    Please set up your Supabase credentials in .env file
                  </div>
                )}
                
                {(dbStatus === 'disconnected' || dbStatus === 'setup_required') && (
                  <Button
                    onClick={handleSetupDatabase}
                    disabled={isSettingUp || dbStatus === 'setup_required'}
                    className="bg-blue-500 text-white hover:bg-blue-600 text-xs sm:text-sm px-2 sm:px-3 py-1"
                  >
                    {isSettingUp ? 'Setting up...' : 'Setup DB'}
                  </Button>
                )}
                
                <Button
                  onClick={handleSignOut}
                  className="bg-[#913177] text-white hover:bg-[#913177]/90 w-full sm:w-auto text-sm sm:text-base px-3 sm:px-4 py-2"
                >
                  Sign Out
                </Button>
              </div>
            </div>

            {/* Tab Navigation - Mobile Optimized */}
            <div className="w-full">
              <div className="flex flex-wrap gap-1 sm:gap-2 border-b border-[#e9d6e4] pb-2 overflow-x-auto">
                {[
                  { id: 'questions', label: 'Questions', shortLabel: 'Questions' },
                  { id: 'responses', label: 'Responses', shortLabel: 'Responses' },
                  { id: 'tags', label: 'Tags', shortLabel: 'Tags' },
                  { id: 'products', label: 'Products', shortLabel: 'Products' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`px-2 sm:px-3 lg:px-4 py-2 font-medium transition-colors whitespace-nowrap text-xs sm:text-sm lg:text-base min-w-0 flex-shrink-0 rounded-t-lg ${
                      activeTab === tab.id
                        ? 'text-[#913177] border-b-2 border-[#913177] bg-[#fff4fc]'
                        : 'text-[#1d0917] hover:text-[#913177] hover:bg-[#fff4fc]/50'
                    }`}
                  >
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.shortLabel}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="w-full overflow-hidden">
            {dbStatus === 'setup_required' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-yellow-800 mb-2">Database Setup Required</h3>
                <p className="text-yellow-700 text-sm mb-3">
                  To use the admin panel, you need to set up a Supabase project:
                </p>
                <ol className="text-yellow-700 text-sm list-decimal ml-4 space-y-1">
                  <li>Go to <a href="https://supabase.com" target="_blank" className="underline">supabase.com</a> and create a new project</li>
                  <li>Copy your project URL and anon key</li>
                  <li>Update the .env file with your credentials</li>
                  <li>Refresh the page</li>
                </ol>
              </div>
            )}
            
            {dbStatus === 'connected' && (
              <>
                {activeTab === 'questions' && <QuestionManager />}
                {activeTab === 'responses' && <ResponsesReport />}
                {activeTab === 'tags' && <TagManager />}
                {activeTab === 'products' && <ProductManager />}
              </>
            )}
            
            {dbStatus === 'disconnected' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2">Database Connection Failed</h3>
                <p className="text-red-700 text-sm">
                  Cannot connect to the database. Please check your Supabase credentials and try the "Setup DB" button.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
