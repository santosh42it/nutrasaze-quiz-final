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
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-3 sm:p-6 border-b border-[#e9d6e4]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h1 className="text-2xl sm:text-[32px] [font-family:'DM_Serif_Display',Helvetica] text-[#1d0917] tracking-[2px]">Admin Panel</h1>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
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
                { key: 'responses', label: 'Quiz Responses' },
                { key: 'questions', label: 'Quiz Questions' },
                { key: 'tags', label: 'Tags' },
                { key: 'products', label: 'Products' }
              ].map((tab) => (
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
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-3 sm:p-6">
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