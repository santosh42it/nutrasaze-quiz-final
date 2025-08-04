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

  // Define generic question keys that should be saved in quiz_responses table
  const GENERIC_QUESTION_KEYS = ['name', 'email', 'contact', 'age', 'gender'];

  // Extract user info from answers if userInfo is empty
  const extractedUserInfo = useMemo(() => {
    console.log('=== USER INFO EXTRACTION DEBUG ===');
    console.log('Raw answers:', answers);
    console.log('Raw userInfo:', userInfo);
    console.log('Answer keys:', Object.keys(answers));
    console.log('Answer values:', Object.values(answers));

    // Initialize extracted info
    const extracted = {
      name: '',
      email: '',
      contact: '',
      age: '0',
      gender: ''
    };

    // First try to get from userInfo if available
    if (userInfo.name && userInfo.name.trim()) extracted.name = userInfo.name.trim();
    if (userInfo.email && userInfo.email.trim()) extracted.email = userInfo.email.trim();
    if (userInfo.contact && userInfo.contact.trim()) extracted.contact = userInfo.contact.trim();
    if (userInfo.age && userInfo.age !== '0' && userInfo.age.trim()) extracted.age = userInfo.age.trim();

    // Then try to extract from answers using multiple strategies
    Object.entries(answers).forEach(([key, value]) => {
      if (!value || typeof value !== 'string' || !value.trim()) return;

      const cleanValue = value.trim();
      console.log(`Processing answer: ${key} = ${cleanValue}`);

      // Strategy 1: Direct key matching (including database IDs)
      if (key === 'name' || key === '1' || key === 'name') extracted.name = cleanValue;
      else if (key === 'email' || key === '2' || key === 'email') extracted.email = cleanValue;
      else if (key === 'contact' || key === '3' || key === 'contact') extracted.contact = cleanValue;
      else if (key === 'age' || key === '4' || key === 'age') extracted.age = cleanValue;
      else if (key === 'gender' || key === '5' || key === 'gender') extracted.gender = cleanValue;

      // Strategy 2: Content-based detection with improved patterns
      else if (!extracted.email && cleanValue.includes('@') && cleanValue.includes('.')) {
        console.log('Detected email by content:', cleanValue);
        extracted.email = cleanValue;
      }
      else if (!extracted.contact && /^[6-9]\d{9}$/.test(cleanValue)) {
        console.log('Detected contact by content:', cleanValue);
        extracted.contact = cleanValue;
      }
      else if (!extracted.age && /^\d{1,3}$/.test(cleanValue)) {
        const ageNum = parseInt(cleanValue);
        if (ageNum > 0 && ageNum <= 120) {
          console.log('Detected age by content:', cleanValue);
          extracted.age = cleanValue;
        }
      }
      else if (!extracted.name && cleanValue.length > 1 && /^[a-zA-Z\s\.]+$/.test(cleanValue) && !cleanValue.includes('@')) {
        // If it looks like a name (letters, spaces, dots, more than 1 char, no @)
        console.log('Detected name by content:', cleanValue);
        extracted.name = cleanValue;
      }
      else if (!extracted.gender && (cleanValue.toLowerCase() === 'male' || cleanValue.toLowerCase() === 'female' || cleanValue.toLowerCase() === 'other')) {
        console.log('Detected gender by content:', cleanValue);
        extracted.gender = cleanValue;
      }
    });

    console.log('Final extracted info:', extracted);
    return extracted;
  }, [userInfo, answers]);

  const saveResponses = async () => {
    try {
      setIsSubmitting(true);
      console.log('=== QUIZ SAVE DEBUG ===');
      console.log('User Info:', userInfo);
      console.log('Raw Answers Object:', answers);
      console.log('Answers Keys:', Object.keys(answers));
      console.log('Answers Count:', Object.keys(answers).length);
      console.log('Extracted User Info:', extractedUserInfo);
      console.log('Generic Question Keys:', GENERIC_QUESTION_KEYS);

      // Separate generic questions from quiz questions
      const genericAnswers: Record<string, string> = {};
      const quizAnswers: Record<string, string> = {};

      Object.entries(answers).forEach(([key, value]) => {
        if (GENERIC_QUESTION_KEYS.includes(key)) {
          genericAnswers[key] = value;
        } else if (!key.includes('_details')) {
          quizAnswers[key] = value;
        }
      });

      console.log('Generic answers:', genericAnswers);
      console.log('Quiz answers:', quizAnswers);

      // Validate required generic fields
      const missingFields = [];

      if (!extractedUserInfo?.name?.trim() || extractedUserInfo.name.length < 2) {
        missingFields.push('name');
        console.error('Name validation failed:', extractedUserInfo?.name);
      }
      if (!extractedUserInfo?.email?.trim() || !extractedUserInfo.email.includes('@')) {
        missingFields.push('email');
        console.error('Email validation failed:', extractedUserInfo?.email);
      }
      if (!extractedUserInfo?.contact?.trim() || extractedUserInfo.contact.length !== 10) {
        missingFields.push('contact');
        console.error('Contact validation failed:', extractedUserInfo?.contact);
      }
      if (!extractedUserInfo?.age?.trim() || extractedUserInfo.age === '0' || parseInt(extractedUserInfo.age) < 1) {
        missingFields.push('age');
        console.error('Age validation failed:', extractedUserInfo?.age);
      }

      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        throw new Error(`Missing required fields: ${missingFields.join(', ')}. Please ensure all personal information questions are answered correctly.`);
      }

      // Additional validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(extractedUserInfo.email)) {
        throw new Error('Please enter a valid email address');
      }

      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(extractedUserInfo.contact)) {
        throw new Error('Please enter a valid 10-digit phone number');
      }

      const age = parseInt(extractedUserInfo.age);
      if (isNaN(age) || age < 1 || age > 120) {
        throw new Error('Please enter a valid age between 1 and 120');
      }

      // Insert quiz response with generic information
      console.log('Inserting quiz response with generic info...');
      const insertData: any = {
        name: extractedUserInfo.name.trim(),
        email: extractedUserInfo.email.trim(),
        contact: extractedUserInfo.contact.trim(),
        age: parseInt(extractedUserInfo.age.toString()) || 0
      };

      // Add gender if available
      if (extractedUserInfo.gender && extractedUserInfo.gender.trim()) {
        insertData.gender = extractedUserInfo.gender.trim();
      }

      console.log('Data being inserted into quiz_responses:', insertData);

      const { data: responseData, error: responseError } = await supabase
        .from('quiz_responses')
        .insert(insertData)
        .select()
        .single();

      if (responseError) {
        console.error('Error saving quiz response:', responseError);
        throw new Error(`Failed to save quiz response: ${responseError.message}`);
      }

      console.log('Quiz response saved successfully:', responseData);

      // Now save the quiz questions (non-generic questions) as quiz_answers
      if (Object.keys(quizAnswers).length === 0) {
        console.log('No quiz questions to save, only generic info saved');
        setIsSubmitted(true);
        return;
      }

      // Get active questions from database for proper mapping
      console.log('Fetching questions from database for quiz answers...');
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('id, question_text')
        .eq('status', 'active')
        .order('order_index');

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        setIsSubmitted(true);
        return;
      }

      console.log('Questions from database:', questionsData);

      // Filter questions to exclude generic ones for quiz_answers
      const quizQuestions = questionsData?.filter(q => {
        const text = q.question_text.toLowerCase();
        return !(
          text.includes('name') || 
          text.includes('email') || 
          text.includes('contact') || 
          text.includes('phone') || 
          text.includes('age') ||
          text.includes('gender')
        );
      }) || [];

      console.log('Filtered quiz questions (non-generic):', quizQuestions);

      const answersToInsert = [];

      // Handle file upload if there's a selected file
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

      // Map quiz answers to database questions
      const quizAnswerEntries = Object.entries(quizAnswers);
      console.log('Quiz answer entries to process:', quizAnswerEntries);

      quizAnswerEntries.forEach(([answerKey, answerValue], index) => {
        if (!answerValue || answerValue.trim() === '') return;

        // Try to map to the corresponding quiz question by index
        const questionIndex = index;
        const correspondingQuestion = quizQuestions[questionIndex];

        if (correspondingQuestion) {
          // Check if this question should have the uploaded file attached
          let fileUrl = null;
          const questionText = correspondingQuestion.question_text.toLowerCase();
          const shouldAttachFile = questionText.includes('blood test') ||
                                 questionText.includes('upload') ||
                                 questionText.includes('file') ||
                                 answerValue.toLowerCase().includes('upload') ||
                                 answerValue.toLowerCase().includes('yes') && questionText.includes('lab');

          if (shouldAttachFile && uploadedFileUrl) {
            fileUrl = uploadedFileUrl;
            console.log(`Attaching file to question: ${correspondingQuestion.question_text}`);
          }

          answersToInsert.push({
            response_id: responseData.id,
            question_id: correspondingQuestion.id,
            answer_text: String(answerValue).substring(0, 500),
            additional_info: answers[`${answerKey}_details`] ? String(answers[`${answerKey}_details`]).substring(0, 1000) : null,
            file_url: fileUrl
          });

          console.log(`Mapped answer "${answerKey}" to question "${correspondingQuestion.question_text}"`);
        } else {
          console.warn(`No corresponding question found for answer key: ${answerKey} at index ${questionIndex}`);
        }
      });

      console.log('Quiz answers to insert:', answersToInsert);

      if (answersToInsert.length > 0) {
        const { error: answersError } = await supabase
          .from('quiz_answers')
          .insert(answersToInsert);

        if (answersError) {
          console.error('Error saving quiz answers:', answersError);
          throw new Error(`Failed to save quiz answers: ${answersError.message}`);
        } else {
          console.log('Quiz answers saved successfully');
        }
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error in saveResponses:', error);

      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }

      alert(`There was an error saving your quiz response: ${errorMessage}. Please check that all required fields are filled and try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection in QuizResults:', event.reason);
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    if (!isSubmitted) {
      saveResponses().catch((error) => {
        console.error('Error in saveResponses caught by useEffect:', error);
        setIsSubmitting(false);
      });
    }

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [isSubmitted, extractedUserInfo]);

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
                    {extractedUserInfo?.gender && (
                      <>
                        <span>•</span>
                        <span>Gender: {extractedUserInfo.gender}</span>
                      </>
                    )}
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