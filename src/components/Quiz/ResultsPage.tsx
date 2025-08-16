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
      console.log('=== RESULTS PAGE DEBUG START ===');
      console.log('Result ID from URL:', resultId);
      
      if (!resultId) {
        console.error('No result ID provided');
        setError('Invalid result ID');
        setLoading(false);
        return;
      }

      try {
        // Extract response ID from result ID (format: responseId-timestamp)
        const responseId = parseInt(resultId.split('-')[0]);
        console.log('Extracted response ID:', responseId);

        if (isNaN(responseId)) {
          console.error('Invalid response ID format:', resultId);
          setError('Invalid result ID format');
          setLoading(false);
          return;
        }

        console.log('Fetching quiz response for ID:', responseId);

        // Test database connection first
        const { data: testData, error: testError } = await supabase
          .from('quiz_responses')
          .select('count(*)')
          .limit(1);

        if (testError) {
          console.error('Database connection test failed:', testError);
          setError('Database connection error');
          setLoading(false);
          return;
        }

        console.log('Database connection test passed');

        // Fetch quiz response
        const { data: response, error: responseError } = await supabase
          .from('quiz_responses')
          .select('*')
          .eq('id', responseId)
          .single();

        if (responseError) {
          console.error('Error fetching quiz response:', responseError);
          console.error('Response error details:', {
            message: responseError.message,
            details: responseError.details,
            hint: responseError.hint,
            code: responseError.code
          });
          setError(`Results not found: ${responseError.message}`);
          setLoading(false);
          return;
        }

        console.log('Quiz response found:', response);

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
          console.error('Answers error details:', {
            message: answersError.message,
            details: answersError.details,
            hint: answersError.hint,
            code: answersError.code
          });
          setError(`Failed to load answers: ${answersError.message}`);
          setLoading(false);
          return;
        }

        console.log('Quiz answers found:', answers?.length || 0, 'answers');
        console.log('Quiz answers data:', answers);

        // Transform answers back to the format expected by QuizResults
        const answersObj: Record<string, string> = {};

        if (answers && answers.length > 0) {
          answers.forEach(answer => {
            answersObj[answer.question_id.toString()] = answer.answer_text;
            if (answer.additional_info) {
              answersObj[`${answer.question_id}_details`] = answer.additional_info;
            }
          });
        }

        // Prepare user info with validation
        const userInfo = {
          name: response?.name || 'Unknown',
          email: response?.email || 'unknown@example.com',
          contact: response?.contact || '0000000000',
          age: (response?.age || 0).toString()
        };

        console.log('Prepared data for QuizResults:', { answersObj, userInfo });

        setQuizData({
          answers: answersObj,
          userInfo,
          selectedFile: null // File won't be available for existing results
        });

        console.log('=== RESULTS PAGE LOAD SUCCESS ===');

      } catch (error) {
        console.error('=== RESULTS PAGE LOAD ERROR ===');
        console.error('Error loading results:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        console.error('Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          resultId,
          timestamp: new Date().toISOString()
        });
        setError(`Failed to load results: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    // Wrap in try-catch to handle any unhandled promise rejections
    loadResultsData().catch(error => {
      console.error('Unhandled error in loadResultsData:', error);
      setError('Unexpected error occurred');
      setLoading(false);
    });
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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-center items-center">
              <div
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => window.open('https://nutrasage.in', '_blank')}
              >
                <img
                  src="https://cdn.shopify.com/s/files/1/0707/7766/7749/files/Logo_3.png?v=1745153339"
                  alt="NutraSage"
                  className="h-12 md:h-16 w-auto"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Error Content */}
        <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
          <div className="text-center p-8 max-w-md mx-auto">
            <div className="text-6xl mb-4">😞</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Results Not Found</h2>
            <p className="text-gray-600 mb-4 text-sm">
              {error || 'The results you\'re looking for could not be found.'}
            </p>
            
            {/* Debug info for development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-left text-xs">
                <div className="font-semibold text-red-800 mb-1">Debug Info:</div>
                <div className="text-red-700">Result ID: {resultId || 'None'}</div>
                <div className="text-red-700">Error: {error || 'No specific error'}</div>
                <div className="text-red-700">URL: {window.location.href}</div>
              </div>
            )}
            
            <div className="space-y-3">
              <button
                onClick={() => navigate('/')}
                className="bg-[#913177] text-white px-6 py-3 rounded-lg hover:bg-[#7d2b65] transition-colors w-full"
              >
                Take New Assessment
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors w-full text-sm"
              >
                Try Again
              </button>
              
              <div className="text-xs text-gray-500 mt-4">
                Need help? Contact us at{' '}
                <a href="tel:+917093619881" className="text-[#913177] font-semibold">
                  +91 7093619881
                </a>
              </div>
            </div>
          </div>
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