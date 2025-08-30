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
        console.log('Testing database connection...');
        const { count: testCount, error: testError } = await supabase
          .from('quiz_responses')
          .select('*', { count: 'exact', head: true });

        if (testError) {
          console.error('Database connection test failed:', testError);
          console.error('Connection error details:', {
            message: testError.message,
            details: testError.details,
            hint: testError.hint,
            code: testError.code,
            supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
            hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
          });
          setError(`Database connection error: ${testError.message}`);
          setLoading(false);
          return;
        }

        console.log('Database connection test passed, count result:', testCount);

        // Fetch quiz response with retry mechanism
        console.log('Fetching quiz response with ID:', responseId);
        let response = null;
        let responseError = null;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries && !response) {
          const { data: responseData, error: fetchError } = await supabase
            .from('quiz_responses')
            .select('*')
            .eq('id', responseId)
            .single();

          if (fetchError) {
            retryCount++;
            console.log(`Attempt ${retryCount} failed:`, fetchError.message);

            if (retryCount < maxRetries) {
              console.log(`Retrying in ${retryCount * 1000}ms...`);
              await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
            } else {
              responseError = fetchError;
            }
          } else {
            response = responseData;
          }
        }

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

        // Ensure we have valid data before setting
        if (Object.keys(answersObj).length === 0 && !userInfo.name) {
          console.warn('No valid data found, using fallback');
          // Create minimal fallback data to prevent blank screen
          setQuizData({
            answers: { '1': 'Sample answer' }, // Minimal fallback
            userInfo: {
              name: response?.name || 'User',
              email: response?.email || 'user@example.com',
              contact: response?.contact || '9999999999',
              age: (response?.age || 25).toString()
            },
            selectedFile: null
          });
        } else {
          setQuizData({
            answers: answersObj,
            userInfo,
            selectedFile: null // File won't be available for existing results
          });
        }

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
        <div className="text-center p-4">
          <div className="w-12 h-12 border-4 border-[#913177] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-[#913177] font-semibold mb-2">Loading your results...</div>
          <div className="text-sm text-gray-600">Please wait while we fetch your personalized recommendations</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
          {/* NutraSage Logo */}
          <div className="mb-6">
            <img 
              src="https://nutrasage.in/wp-content/uploads/2024/06/cropped-NutraSage-Logo-1024x366.png" 
              alt="NutraSage" 
              className="h-12 mx-auto"
            />
          </div>

          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Results Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>

          {/* Debug Info */}
          <div className="mb-6 p-4 bg-red-50 rounded-lg text-left">
            <h3 className="font-semibold text-red-800 mb-2">Debug Info:</h3>
            <p className="text-sm text-red-700">Result ID: {resultId}</p>
            <p className="text-sm text-red-700">Extracted Response ID: {resultId ? resultId.split('-')[0] : 'N/A'}</p>
            <p className="text-sm text-red-700">Error: {error}</p>
            <p className="text-sm text-red-700">URL: {window.location.href}</p>
            <p className="text-sm text-red-700">Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? 'Connected' : 'Not found'}</p>
            <p className="text-sm text-red-700">Environment: {import.meta.env.MODE}</p>
          </div>

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
          </div>

          <p className="text-sm text-gray-500 mt-6">
            Need help? Contact us at{' '}
            <a href="tel:+917093619881" className="text-[#913177] font-semibold">
              +91 7093619881
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Additional safety check before rendering
  if (!quizData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-4">
          <div className="w-12 h-12 border-4 border-[#913177] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-[#913177] font-semibold">Preparing your results...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header indicating this is a saved result */}
      <div className="bg-gradient-to-r from-[#913177] to-[#b54394] text-white py-3">
        <div className="container mx-auto px-4 text-center">
          <div className="text-sm font-medium">
            📋 Saved Assessment Results • {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Error boundary wrapper for QuizResults */}
      <div className="relative">
        {quizData && (
          <QuizResults 
            answers={quizData.answers || {}}
            userInfo={quizData.userInfo || { name: 'User', email: 'user@example.com', contact: '9999999999', age: '25' }}
            selectedFile={quizData.selectedFile}
            isViewingExistingResults={true}
          />
        )}
      </div>
    </div>
  );
};