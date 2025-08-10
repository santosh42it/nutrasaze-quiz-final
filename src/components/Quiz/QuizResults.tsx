import React, { useEffect, useState, useMemo } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { supabase } from "../../lib/supabase";
import type { QuizResponse, QuizAnswer } from "../../types/database";

interface QuizResultsProps {
  answers: Record<string, string>;
  userInfo: {
    name: string;
    email: string;
    contact: string;
    age: string;
  };
  selectedFile?: File | null;
}

export const QuizResults: React.FC<QuizResultsProps> = ({ answers, userInfo, selectedFile }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [questions, setQuestions] = useState<Array<{ id: number; question_text: string }>>([]);


  // Extract user info from answers - improved logic to avoid mismatched data
  const extractedUserInfo = useMemo(() => {
    console.log('=== USER INFO EXTRACTION DEBUG ===');
    console.log('Raw answers:', answers);
    console.log('Raw userInfo:', userInfo);

    // Initialize extracted info - prioritize userInfo from QuizScreen
    const extracted = {
      name: userInfo.name && userInfo.name.trim() ? userInfo.name.trim() : '',
      email: userInfo.email && userInfo.email.trim() ? userInfo.email.trim() : '',
      contact: userInfo.contact && userInfo.contact.trim() ? userInfo.contact.trim() : '',
      age: userInfo.age && userInfo.age !== '0' && userInfo.age.trim() ? userInfo.age.trim() : '0'
    };

    // Always try to extract from answers as backup/primary source
    console.log('Extracting from answers...');
    
    // Direct key matching strategy - map by question IDs and keys
    // First, let's identify which questions contain what based on the database structure
    const questionMappings: Record<string, string> = {};
    
    // Map question IDs to field types based on actual database questions
    if (questions.length > 0) {
      questions.forEach(q => {
        const text = q.question_text.toLowerCase();
        if (text.includes('name')) questionMappings[q.id.toString()] = 'name';
        else if (text.includes('email')) questionMappings[q.id.toString()] = 'email';
        else if (text.includes('contact') || text.includes('phone')) questionMappings[q.id.toString()] = 'contact';
        else if (text.includes('age')) questionMappings[q.id.toString()] = 'age';
      });
    }

    console.log('Question mappings:', questionMappings);

    Object.entries(answers).forEach(([key, value]) => {
      if (!value || typeof value !== 'string' || !value.trim()) return;
      const cleanValue = value.trim();

      // Use the question mapping to determine field type
      const fieldType = questionMappings[key];
      
      if (fieldType === 'name' && (!extracted.name || extracted.name === '')) {
        console.log('Found name by question mapping, key:', key, '->', cleanValue);
        extracted.name = cleanValue;
      } else if (fieldType === 'email' && (!extracted.email || extracted.email === '')) {
        console.log('Found email by question mapping, key:', key, '->', cleanValue);
        extracted.email = cleanValue;
      } else if (fieldType === 'contact' && (!extracted.contact || extracted.contact === '')) {
        console.log('Found contact by question mapping, key:', key, '->', cleanValue);
        // Remove +91 prefix if present for validation
        extracted.contact = cleanValue.replace(/^\+91/, '');
      } else if (fieldType === 'age' && (extracted.age === '0' || !extracted.age)) {
        console.log('Found age by question mapping, key:', key, '->', cleanValue);
        extracted.age = cleanValue;
      }
      // Fallback to legacy key matching for compatibility
      else if ((key === '1' || key === 'name') && (!extracted.name || extracted.name === '')) {
        console.log('Found name by legacy key:', key, '->', cleanValue);
        extracted.name = cleanValue;
      } else if ((key === '2' || key === 'email') && (!extracted.email || extracted.email === '')) {
        console.log('Found email by legacy key:', key, '->', cleanValue);
        extracted.email = cleanValue;
      } else if ((key === '3' || key === 'contact') && (!extracted.contact || extracted.contact === '')) {
        console.log('Found contact by legacy key:', key, '->', cleanValue);
        // Remove +91 prefix if present for validation
        extracted.contact = cleanValue.replace(/^\+91/, '');
      } else if ((key === '4' || key === 'age') && (extracted.age === '0' || !extracted.age)) {
        console.log('Found age by legacy key:', key, '->', cleanValue);
        extracted.age = cleanValue;
      }
    });

    // Content-based detection as final fallback
    if (!extracted.name || !extracted.email || !extracted.contact || extracted.age === '0') {
      console.log('Running content-based detection...');
      Object.entries(answers).forEach(([key, value]) => {
        if (!value || typeof value !== 'string' || !value.trim()) return;
        const cleanValue = value.trim();

        // Email detection
        if (!extracted.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanValue)) {
          console.log('Detected email by pattern:', cleanValue);
          extracted.email = cleanValue;
        }
        // Contact detection (Indian mobile numbers with or without +91)
        else if (!extracted.contact && /^(\+91)?[6-9]\d{9}$/.test(cleanValue.replace(/\s+/g, ''))) {
          console.log('Detected contact by pattern:', cleanValue);
          extracted.contact = cleanValue.replace(/^\+91/, ''); // Remove +91 for validation
        }
        // Age detection
        else if ((!extracted.age || extracted.age === '0') && /^\d{1,3}$/.test(cleanValue)) {
          const ageNum = parseInt(cleanValue);
          if (ageNum > 0 && ageNum <= 120) {
            console.log('Detected age by pattern:', cleanValue);
            extracted.age = cleanValue;
          }
        }
        // Name detection (be more restrictive)
        else if (!extracted.name && cleanValue.length >= 2 && /^[a-zA-Z][a-zA-Z\s\.]*$/.test(cleanValue) && 
                 !cleanValue.includes('@') && !cleanValue.includes('+') && !/\d/.test(cleanValue)) {
          console.log('Detected name by pattern:', cleanValue);
          extracted.name = cleanValue;
        }
      });
    }

    console.log('Final extracted info:', extracted);
    return extracted;
  }, [userInfo, answers]);

  const saveResponses = async () => {
    // Prevent multiple submissions with more robust checking
    if (isSubmitting || isSubmitted) {
      console.log('Submission already in progress or completed, skipping...');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('=== QUIZ SAVE DEBUG ===');
      console.log('User Info:', userInfo);
      console.log('Raw Answers Object:', answers);
      console.log('Answers Keys:', Object.keys(answers));
      console.log('Answers Count:', Object.keys(answers).length);
      console.log('Extracted User Info:', extractedUserInfo);
      console.log('Detailed answers breakdown:');
      Object.entries(answers).forEach(([key, value]) => {
        console.log(`  Key: "${key}" -> Value: "${value}" (Type: ${typeof value})`);
      });
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL || 'Not found');
      console.log('Supabase Anon Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Not found');

      // Validate required fields with better error messages
      const missingFields = [];

      console.log('Validating extracted user info:', extractedUserInfo);

      if (!extractedUserInfo?.name?.trim() || extractedUserInfo.name.length < 2) {
        missingFields.push('name');
        console.error('Name validation failed:', extractedUserInfo?.name);
      }
      if (!extractedUserInfo?.email?.trim() || !extractedUserInfo.email.includes('@')) {
        missingFields.push('email');
        console.error('Email validation failed:', extractedUserInfo?.email);
      }
      const contactForValidation = extractedUserInfo?.contact?.replace(/^\+91/, '') || '';
      if (!contactForValidation.trim() || contactForValidation.length !== 10) {
        missingFields.push('contact');
        console.error('Contact validation failed:', extractedUserInfo?.contact, 'cleaned:', contactForValidation);
      }
      if (!extractedUserInfo?.age?.trim() || extractedUserInfo.age === '0' || parseInt(extractedUserInfo.age) < 1) {
        missingFields.push('age');
        console.error('Age validation failed:', extractedUserInfo?.age);
      }

      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        console.error('Field validation details:', {
          name: extractedUserInfo?.name || 'MISSING',
          email: extractedUserInfo?.email || 'MISSING',
          contact: extractedUserInfo?.contact || 'MISSING',
          age: extractedUserInfo?.age || 'MISSING'
        });

        // Debug: Show all available answers
        console.log('All available answers for debugging:');
        Object.entries(answers).forEach(([key, value]) => {
          console.log(`  ${key}: "${value}"`);
        });

        throw new Error(`Missing required fields: ${missingFields.join(', ')}. Please ensure all personal information questions are answered correctly.`);
      }

      // Additional validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(extractedUserInfo.email)) {
        throw new Error('Please enter a valid email address');
      }

      const phoneRegex = /^[0-9]{10}$/;
      // Use the existing contactForValidation variable from above
      if (!phoneRegex.test(contactForValidation)) {
        throw new Error('Please enter a valid 10-digit phone number');
      }

      const age = parseInt(extractedUserInfo.age);
      if (isNaN(age) || age < 1 || age > 120) {
        throw new Error('Please enter a valid age between 1 and 120');
      }

      // Test current user session
      console.log('Checking current session...');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('Session user:', sessionData?.session?.user?.id || 'No user');
      console.log('Session role:', sessionData?.session?.user?.role || 'anon');
      console.log('Session error:', sessionError);

      // Insert quiz response
      console.log('Inserting quiz response...');
      const insertData = {
        name: extractedUserInfo.name.trim(),
        email: extractedUserInfo.email.trim(),
        contact: extractedUserInfo.contact.trim(),
        age: parseInt(extractedUserInfo.age.toString()) || 0
      };
      console.log('Data being inserted:', insertData);
      console.log('Current timestamp:', new Date().toISOString());

      const { data: responseData, error: responseError } = await supabase
        .from('quiz_responses')
        .insert(insertData)
        .select()
        .single();

      if (responseError) {
        console.error('Error saving quiz response:', {
          error: responseError,
          message: responseError.message,
          details: responseError.details,
          hint: responseError.hint,
          code: responseError.code,
          insertData,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          supabaseConfig: {
            url: import.meta.env.VITE_SUPABASE_URL,
            hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
          }
        });
        throw new Error(`Failed to save quiz response: ${responseError.message}`);
      }

      console.log('Quiz response saved successfully:', responseData);

      // Filter and prepare answers for insertion
      const validAnswers = Object.entries(answers)
        .filter(([key, value]) => {
          // Skip detail keys and empty values
          if (key.includes('_details') || !value || value.trim() === '') {
            return false;
          }
          return true;
        });

      console.log('Valid answers to save:', validAnswers);
      console.log('Selected file for upload:', selectedFile ? selectedFile.name : 'No file');

      if (validAnswers.length === 0) {
        console.log('No valid answers to save, skipping answers insertion');
        setIsSubmitted(true);
        return;
      }

      // Fetch questions from the database to map answers correctly
      console.log('Fetching questions from database...');
      const { data: fetchedQuestions, error: questionsError } = await supabase
        .from('questions')
        .select('id, question_text')
        .eq('status', 'active')
        .order('order_index');

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        // Continue without saving answers if we can't get question IDs
        setIsSubmitted(true);
        return;
      }
      setQuestions(fetchedQuestions || []); // Store questions for answer mapping

      console.log('Questions from database:', fetchedQuestions);

      // Create a mapping from question text/type to database ID
      const questionIdMap: { [key: string]: number } = {};

      // Map based on question content patterns
      fetchedQuestions?.forEach(q => {
        const text = q.question_text.toLowerCase();
        if (text.includes('name')) questionIdMap['name'] = q.id;
        else if (text.includes('contact') || text.includes('phone')) questionIdMap['contact'] = q.id;
        else if (text.includes('email')) questionIdMap['email'] = q.id;
        else if (text.includes('age')) questionIdMap['age'] = q.id;
        else if (text.includes('gender')) questionIdMap['gender'] = q.id;
        else if (text.includes('stress') || text.includes('anxious')) questionIdMap['mental_stress'] = q.id;
        else if (text.includes('energy')) questionIdMap['energy_levels'] = q.id;
        else if (text.includes('joint') || text.includes('pain')) questionIdMap['joint_pain'] = q.id;
        else if (text.includes('skin')) questionIdMap['skin_condition'] = q.id;
        else if (text.includes('sleep')) questionIdMap['sleep_quality'] = q.id;
        else if (text.includes('digestive') || text.includes('bloating')) questionIdMap['digestive_issues'] = q.id;
        else if (text.includes('active') || text.includes('exercise')) questionIdMap['physical_activity'] = q.id;
        else if (text.includes('supplement')) questionIdMap['supplements'] = q.id;
        else if (text.includes('health condition') || text.includes('allergies')) questionIdMap['health_conditions'] = q.id;
        else if (text.includes('blood test')) questionIdMap['blood_test'] = q.id;
      });

      console.log('All questions from DB:', fetchedQuestions?.map(q => ({ id: q.id, text: q.question_text })));
      console.log('Question ID mapping created:', questionIdMap);
      console.log('User Info extracted:', extractedUserInfo);
      console.log('All answers to process:', Object.entries(answers));

      const answersToInsert = [];

      // First, handle file upload if there's a selected file
      let uploadedFileUrl = null;
      if (selectedFile) {
        try {
          console.log('Processing file upload:', selectedFile.name, 'Size:', selectedFile.size);
          const fileExt = selectedFile.name.split('.').pop();
          const fileName = `${responseData.id}_${Date.now()}.${fileExt}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('quiz-files')
            .upload(fileName, selectedFile);

          if (uploadError) {
            console.error('Error uploading file:', uploadError);
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('quiz-files')
              .getPublicUrl(fileName);
            uploadedFileUrl = publicUrl;
            console.log('File uploaded successfully:', uploadedFileUrl);
          }
        } catch (error) {
          console.error('Error in file upload process:', error);
        }
      }

      // Save quiz answers for all questions - ensure correct question ID mapping
      for (const [answerKey, answer] of Object.entries(answers)) {
        // Skip detail keys and empty values
        if (answerKey.includes('_details') || !answer || String(answer).trim() === '') {
          continue;
        }

        // First try to map by answer key to question ID
        let actualQuestionId = questionIdMap[answerKey];
        let question = null;

        // If not found by key mapping, try to find by question text patterns
        if (!actualQuestionId && fetchedQuestions) {
          // Create more specific mappings based on answer key patterns
          if (answerKey === 'name' || answerKey === '1') {
            question = fetchedQuestions.find(q => q.question_text.toLowerCase().includes('name'));
          } else if (answerKey === 'email' || answerKey === '2') {
            question = fetchedQuestions.find(q => q.question_text.toLowerCase().includes('email'));
          } else if (answerKey === 'contact' || answerKey === '3') {
            question = fetchedQuestions.find(q => q.question_text.toLowerCase().includes('contact') || q.question_text.toLowerCase().includes('phone'));
          } else if (answerKey === 'age' || answerKey === '4') {
            question = fetchedQuestions.find(q => q.question_text.toLowerCase().includes('age'));
          } else if (answerKey === 'gender' || answerKey === '6') {
            question = fetchedQuestions.find(q => q.question_text.toLowerCase().includes('gender'));
          } else if (answerKey === 'mental_stress' || answerKey === '7') {
            question = fetchedQuestions.find(q => q.question_text.toLowerCase().includes('stress') || q.question_text.toLowerCase().includes('anxious'));
          } else if (answerKey === 'energy_levels' || answerKey === '8') {
            question = fetchedQuestions.find(q => q.question_text.toLowerCase().includes('energy'));
          } else if (answerKey === 'joint_pain' || answerKey === '9') {
            question = fetchedQuestions.find(q => q.question_text.toLowerCase().includes('joint') || q.question_text.toLowerCase().includes('pain'));
          } else if (answerKey === 'skin_condition' || answerKey === '10') {
            question = fetchedQuestions.find(q => q.question_text.toLowerCase().includes('skin'));
          } else if (answerKey === 'sleep_quality' || answerKey === '11') {
            question = fetchedQuestions.find(q => q.question_text.toLowerCase().includes('sleep'));
          } else if (answerKey === 'digestive_issues' || answerKey === '12') {
            question = fetchedQuestions.find(q => q.question_text.toLowerCase().includes('digestive') || q.question_text.toLowerCase().includes('bloating'));
          } else if (answerKey === 'physical_activity' || answerKey === '13') {
            question = fetchedQuestions.find(q => q.question_text.toLowerCase().includes('active') || q.question_text.toLowerCase().includes('exercise'));
          } else if (answerKey === 'supplements' || answerKey === '14') {
            question = fetchedQuestions.find(q => q.question_text.toLowerCase().includes('supplement'));
          } else if (answerKey === 'health_conditions' || answerKey === '15') {
            question = fetchedQuestions.find(q => q.question_text.toLowerCase().includes('health condition') || q.question_text.toLowerCase().includes('allergies'));
          } else if (answerKey === 'blood_test' || answerKey === '16') {
            question = fetchedQuestions.find(q => q.question_text.toLowerCase().includes('blood test'));
          } else {
            // Try to parse as number and get from array index
            const questionIndex = parseInt(answerKey);
            if (!isNaN(questionIndex) && questionIndex >= 0 && questionIndex < fetchedQuestions.length) {
              question = fetchedQuestions[questionIndex];
            }
          }

          if (question) {
            actualQuestionId = question.id;
          }
        }

        if (!actualQuestionId) {
          console.warn(`Could not map answer key "${answerKey}" to any question. Skipping.`);
          continue;
        }
        // Extract answer text (always treat as string for simplicity)
        const answerText = String(answer).trim();
        let additionalInfo = null;
        let fileUrl = null;

        // Get additional info if it exists
        const detailsKey = `${answerKey}_details`;
        if (answers[detailsKey]) {
          additionalInfo = String(answers[detailsKey]).substring(0, 1000);
        }

        console.log(`Saving answer for question ID ${actualQuestionId} (key: "${answerKey}"): ${answerText}`);

        // Check if this question should have the uploaded file attached
        if (question) {
          const questionTextLower = question.question_text.toLowerCase();
          const shouldAttachFile = answerKey === 'blood_test' || 
                                 answerKey === '16' ||
                                 questionTextLower.includes('blood test') ||
                                 questionTextLower.includes('upload') ||
                                 questionTextLower.includes('file');

          if (shouldAttachFile && uploadedFileUrl) {
            fileUrl = uploadedFileUrl;
            console.log(`Attaching file to question: ${question.question_text}`);
          }
        }

        answersToInsert.push({
          response_id: responseData.id,
          question_id: actualQuestionId,
          answer_text: answerText.substring(0, 500),
          additional_info: additionalInfo,
          file_url: fileUrl
        });
      }

      console.log('Answers to insert:', answersToInsert);

      if (answersToInsert.length > 0) {
        const { error: answersError } = await supabase
          .from('quiz_answers')
          .insert(answersToInsert);

        if (answersError) {
          console.error('Error saving quiz answers:', answersError.message, answersError);
          throw new Error(`Failed to save quiz answers: ${answersError.message}`);
        } else {
          console.log('Quiz answers saved successfully');
        }
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error in saveResponses:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        extractedUserInfo,
        answersDebug: Object.keys(answers).length > 0 ? answers : 'No answers found'
      });

      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }

      // Show user-friendly error message
      alert(`There was an error saving your quiz response: ${errorMessage}. Please check that all required fields are filled and try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Use a ref to track if we've already initiated a save to prevent multiple calls
  const hasInitiatedSave = React.useRef(false);

  useEffect(() => {
    // Only save once when component mounts and not already submitted or submitting
    if (!isSubmitted && !isSubmitting && !hasInitiatedSave.current) {
      hasInitiatedSave.current = true;
      console.log('Initiating quiz save...');
      
      // Use async function with proper error handling
      const initiateSave = async () => {
        try {
          await saveResponses();
        } catch (error) {
          console.error('Error in saveResponses:', error);
          setIsSubmitting(false);
          hasInitiatedSave.current = false; // Allow retry on error
        }
      };

      initiateSave();
    }
  }, []); // Remove dependencies to ensure it only runs once on mount

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f4f6] to-white">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#1d0917]">NutraSage</h1>
            <div className="text-sm text-gray-600">Quiz Complete</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">

          {/* Success Message */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-[#1d0917] mb-4">
              Congratulations, {extractedUserInfo?.name || 'User'}!
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your personalized health assessment is complete. Based on your responses,
              we've created a custom wellness plan just for you.
            </p>
          </div>

          {/* User Info Card */}
          <Card className="mb-8 border-0 shadow-lg bg-white">
            <CardContent className="p-8">
              <div className="flex items-center gap-6 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#913177] to-[#b54394] rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {extractedUserInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#1d0917] mb-1">
                    {extractedUserInfo?.name || 'User'}
                  </h3>
                  <p className="text-gray-600">{extractedUserInfo?.email}</p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    <span>Age: {extractedUserInfo?.age}</span>
                    <span>•</span>
                    <span>Contact: {extractedUserInfo?.contact}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gradient-to-br from-[#f8f4f6] to-[#fff] rounded-xl">
                  <div className="text-3xl font-bold text-[#913177] mb-2">15+</div>
                  <div className="text-sm text-gray-600">Questions Answered</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-[#f8f4f6] to-[#fff] rounded-xl">
                  <div className="text-3xl font-bold text-[#913177] mb-2">3</div>
                  <div className="text-sm text-gray-600">Custom Supplements</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-[#f8f4f6] to-[#fff] rounded-xl">
                  <div className="text-3xl font-bold text-[#913177] mb-2">100%</div>
                  <div className="text-sm text-gray-600">Personalized</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommended Products */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-[#1d0917] text-center mb-8">
              Your Personalized Supplement Plan
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "Daily Energy Boost",
                  description: "Natural energy enhancement for sustained vitality throughout your day",
                  features: ["Increased Energy", "Mental Clarity", "Focus Enhancement"],
                  price: "₹999",
                  image: "https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=400"
                },
                {
                  title: "Stress Relief Complex",
                  description: "Adaptogenic herbs to help manage stress and promote emotional balance",
                  features: ["Stress Management", "Mood Support", "Better Sleep"],
                  price: "₹899",
                  image: "https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=400"
                },
                {
                  title: "Recovery & Immunity",
                  description: "Support your body's natural healing and immune system function",
                  features: ["Immune Support", "Recovery Aid", "Antioxidants"],
                  price: "₹1099",
                  image: "https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=400"
                }
              ].map((product, index) => (
                <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                  <div className="relative">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-[#913177] text-white px-3 py-1 rounded-full text-sm font-bold">
                      {product.price}
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-[#1d0917] mb-3">{product.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">{product.description}</p>
                    <div className="space-y-2">
                      {product.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-[#913177] rounded-full"></div>
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Pricing Section */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-[#f8f4f6]">
            <CardContent className="p-8 md:p-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-[#1d0917] mb-4">
                  Complete Wellness Package
                </h2>
                <p className="text-lg text-gray-600">
                  Everything you need to start your health transformation journey
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <div className="flex items-baseline gap-4">
                    <span className="text-5xl font-bold text-[#913177]">₹2,999</span>
                    <div>
                      <span className="text-lg text-gray-500 line-through">₹4,500</span>
                      <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-sm font-bold ml-2">
                        33% OFF
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600">per month</p>

                  <div className="space-y-4">
                    {[
                      "3 Custom Supplements (30-day supply)",
                      "Personalized Diet Plan",
                      "Custom Exercise Routine",
                      "Expert Consultation",
                      "Monthly Progress Tracking",
                      "Free Shipping & Support"
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-[#913177] rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  <div className="bg-white rounded-2xl p-8 shadow-lg">
                    <h3 className="text-2xl font-bold text-[#1d0917] mb-4">
                      Ready to Transform Your Health?
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Join thousands who have already started their wellness journey
                    </p>

                    <Button
                      className="w-full h-14 text-lg font-bold bg-gradient-to-r from-[#913177] to-[#b54394] hover:from-[#7a2a66] hover:to-[#9c3a81] text-white rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Processing...' : 'Start Your Journey - ₹2,999/month'}
                    </Button>

                    <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>30-day guarantee</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>Secure payment</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="text-center mt-8 space-y-2">
            <p className="text-gray-600">
              Our experts will review your responses and contact you within 24 hours to finalize your plan.
            </p>
            <p className="text-sm text-gray-500">
              Questions? Email us at <span className="text-[#913177] font-semibold">support@nutrasage.com</span> or call <span className="text-[#913177] font-semibold">+91-XXXX-XXXX</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};