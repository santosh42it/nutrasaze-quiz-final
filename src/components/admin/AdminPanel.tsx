import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../../stores/adminStore';
import { QuestionManager } from './QuestionManager';
import { TagManager } from './TagManager';
import { ProductManager } from './ProductManager';
import { ResponsesReport } from './ResponsesReport';
import { AnswerKeyManager } from './AnswerKeyManager';
import { SuperAdminToggle } from './SuperAdminToggle';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabase';

export const AdminPanel: React.FC = () => {
  const { fetchQuestions, fetchOptions, fetchTags, fetchProducts, fetchQuestionTags, fetchOptionTags, fetchAnswerKeys } = useAdminStore();
  const [activeTab, setActiveTab] = useState<'questions' | 'tags' | 'products' | 'responses' | 'answerkey'>('responses');
  const [superAdminEnabled, setSuperAdminEnabled] = useState(false);

  useEffect(() => {
    fetchQuestions();
    fetchOptions();
    fetchTags();
    fetchProducts();
    fetchQuestionTags();
    fetchOptionTags();
    fetchAnswerKeys();
  }, [fetchQuestions, fetchOptions, fetchTags, fetchProducts, fetchQuestionTags, fetchOptionTags, fetchAnswerKeys]);

  return (
    <div className="min-h-screen bg-[#fff4fc]">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-3 sm:p-6 border-b border-[#e9d6e4]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-[32px] [font-family:'DM_Serif_Display',Helvetica] text-[#1d0917] tracking-[2px]">Admin Panel</h1>
                <div className={`text-xs font-semibold px-2 py-1 rounded inline-block mt-1 ${
                  superAdminEnabled 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {superAdminEnabled ? '⚠️ EDIT MODE ENABLED' : '📊 REPORTING MODE'}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                <SuperAdminToggle
                  isEnabled={superAdminEnabled}
                  onToggle={(enabled) => {
                    setSuperAdminEnabled(enabled);
                    // Reset to responses tab when disabling edit mode
                    if (!enabled) {
                      setActiveTab('responses');
                    }
                  }}
                />
                <Button
                  onClick={() => supabase.auth.signOut()}
                  className="bg-[#913177] text-white hover:bg-[#913177]/90 text-sm"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="border-b border-[#e9d6e4]">
            <nav className="flex space-x-2 sm:space-x-8 px-3 sm:px-6 overflow-x-auto">
              {[
                { key: 'responses', label: 'Quiz Responses', alwaysVisible: true },
                { key: 'questions', label: 'Quiz Questions', alwaysVisible: false },
                { key: 'tags', label: 'Tags', alwaysVisible: false },
                { key: 'products', label: 'Products', alwaysVisible: false },
                { key: 'answerkey', label: 'Answer Key', alwaysVisible: false }
              ]
                .filter(tab => tab.alwaysVisible || superAdminEnabled)
                .map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-3 sm:py-4 px-2 sm:px-2 text-xs sm:text-sm font-desktop-body-m-bold transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'text-[#913177] border-b-2 border-[#913177]'
                      : 'text-[#1d0917] hover:text-[#913177] border-transparent'
                  }`}
                >
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
                </button>
              ))}
              {!superAdminEnabled && (
                <div className="py-3 sm:py-4 px-2 sm:px-2 text-xs sm:text-sm text-gray-400 italic whitespace-nowrap">
                  Enable Edit Mode to access management tabs
                </div>
              )}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-3 sm:p-6">
            {activeTab === 'responses' && <ResponsesReport />}
            {activeTab === 'questions' && superAdminEnabled && <QuestionManager />}
            {activeTab === 'tags' && superAdminEnabled && <TagManager />}
            {activeTab === 'products' && superAdminEnabled && <ProductManager />}
            {activeTab === 'answerkey' && superAdminEnabled && <AnswerKeyManager />}
            
            {/* Show access denied message for edit tabs when super admin is disabled */}
            {(activeTab !== 'responses' && !superAdminEnabled) && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔒</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Access Restricted</h3>
                <p className="text-gray-500">Enable Edit Mode to access this section</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};