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
        <div className="flex flex-col gap-4 sm:gap-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="[font-family:'DM_Serif_Display',Helvetica] text-[24px] sm:text-[32px] text-[#1d0917] tracking-[1px] sm:tracking-[2px]">
              Admin Panel
            </h1>
            <Button
              onClick={() => supabase.auth.signOut()}
              className="bg-[#913177] text-white hover:bg-[#913177]/90 w-full sm:w-auto"
            >
              Sign Out
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-4 border-b border-[#e9d6e4] overflow-x-auto pb-2">
            {[
              { id: 'responses', label: 'Quiz Responses' },
              { id: 'questions', label: 'Quiz Questions' },
              { id: 'tags', label: 'Tags' },
              { id: 'products', label: 'Products' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-3 sm:px-4 py-2 font-desktop-body-m-bold transition-colors whitespace-nowrap text-sm sm:text-base ${
                  activeTab === tab.id
                    ? 'text-[#913177] border-b-2 border-[#913177]'
                    : 'text-[#1d0917] hover:text-[#913177]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:gap-8">
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