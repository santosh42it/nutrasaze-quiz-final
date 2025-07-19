
import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../../stores/adminStore';
import { QuestionManager } from './QuestionManager';
import { TagManager } from './TagManager';
import { ProductManager } from './ProductManager';
import { ResponsesReport } from './ResponsesReport';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabase';

export const AdminPanel: React.FC = () => {
  const { fetchQuestions, fetchOptions, fetchTags, fetchProducts } = useAdminStore();
  const [activeTab, setActiveTab] = useState<'questions' | 'tags' | 'products' | 'responses'>('responses');

  useEffect(() => {
    fetchQuestions();
    fetchOptions();
    fetchTags();
    fetchProducts();
  }, []);

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
              <Button
                onClick={() => supabase.auth.signOut()}
                className="bg-[#913177] text-white hover:bg-[#913177]/90 w-full sm:w-auto text-sm sm:text-base px-3 sm:px-4 py-2"
              >
                Sign Out
              </Button>
            </div>

            {/* Tab Navigation - Mobile Optimized */}
            <div className="w-full">
              <div className="flex flex-wrap gap-1 sm:gap-2 border-b border-[#e9d6e4] pb-2 overflow-x-auto">
                {[
                  { id: 'responses', label: 'Responses', shortLabel: 'Responses' },
                  { id: 'questions', label: 'Questions', shortLabel: 'Questions' },
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
            {activeTab === 'responses' && <ResponsesReport />}
            {activeTab === 'questions' && <QuestionManager />}
            {activeTab === 'tags' && <TagManager />}
            {activeTab === 'products' && <ProductManager />}
          </div>
        </div>
      </div>
    </div>
  );
};
