
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QuizResults } from './QuizResults';
import { supabase } from '../../lib/supabase';

interface ResultsPageProps {}

export const ResultsPage: React.FC<ResultsPageProps> = () => {
  const { resultId } = useParams<{ resultId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<{
    answers: Record<string, string>;
    userInfo: {
      name: string;
      email: string;
      contact: string;
      age: string;
    };
    selectedFile?: File | null;
  } | null>(null);

  useEffect(() => {
    const loadResultsData = async () => {
      if (!resultId) {
        setError('Invalid result ID');
        setLoading(false);
        return;
      }

      try {
        // Extract response ID from result ID (format: responseId-timestamp)
        const responseId = parseInt(resultId.split('-')[0]);
        
        if (isNaN(responseId)) {
          setError('Invalid result ID format');
          setLoading(false);
          return;
        }

        console.log('Loading results for response ID:', responseId);

        // Fetch quiz response
        const { data: response, error: responseError } = await supabase
          .from('quiz_responses')
          .select('*')
          .eq('id', responseId)
          .single();

        if (responseError) {
          console.error('Error fetching quiz response:', responseError);
          setError('Results not found');
          setLoading(false);
          return;
        }

        // Fetch quiz answers
        const { data: answers, error: answersError } = await supabase
          .from('quiz_answers')
          .select(`
            question_id,
            answer_text,
            additional_info,
            file_url
          `)
          .eq('response_id', responseId);

        if (answersError) {
          console.error('Error fetching quiz answers:', answersError);
          setError('Failed to load complete results');
          setLoading(false);
          return;
        }

        // Transform answers back to the format expected by QuizResults
        const answersObj: Record<string, string> = {};
        
        answers?.forEach(answer => {
          answersObj[answer.question_id.toString()] = answer.answer_text;
          if (answer.additional_info) {
            answersObj[`${answer.question_id}_details`] = answer.additional_info;
          }
        });

        // Prepare user info
        const userInfo = {
          name: response.name,
          email: response.email,
          contact: response.contact,
          age: response.age.toString()
        };

        console.log('Loaded results data:', { answersObj, userInfo });

        setQuizData({
          answers: answersObj,
          userInfo,
          selectedFile: null // File won't be available for existing results
        });

      } catch (error) {
        console.error('Error loading results:', error);
        setError('Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    loadResultsData();
  }, [resultId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#913177] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-[#913177] font-semibold">Loading your results...</div>
        </div>
      </div>
    );
  }

  if (error || !quizData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Results Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error || 'The results you\'re looking for could not be found.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-[#913177] text-white px-6 py-3 rounded-lg hover:bg-[#7d2b65] transition-colors"
          >
            Take New Assessment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header indicating this is a saved result */}
      <div className="bg-gradient-to-r from-[#913177] to-[#b54394] text-white py-3">
        <div className="container mx-auto px-4 text-center">
          <div className="text-sm font-medium">
            📋 Saved Assessment Results • {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
      
      <QuizResults 
        answers={quizData.answers}
        userInfo={quizData.userInfo}
        selectedFile={quizData.selectedFile}
        isViewingExistingResults={true}
      />
    </div>
  );
};
