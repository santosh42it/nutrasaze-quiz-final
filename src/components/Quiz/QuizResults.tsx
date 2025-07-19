import React, { useEffect, useState } from "react";
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

  const saveResponses = async () => {
    try {
      setIsSubmitting(true);
      console.log('=== QUIZ SAVE DEBUG ===');
      console.log('User Info:', userInfo);
      console.log('Answers Count:', Object.keys(answers).length);
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('Supabase Anon Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing');

      // Validate required fields
      if (!userInfo.name || !userInfo.email || !userInfo.contact || !userInfo.age) {
        console.error('Missing required fields:', { userInfo });
        throw new Error('Missing required user information');
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
        name: userInfo.name,
        email: userInfo.email,
        contact: userInfo.contact,
        age: parseInt(userInfo.age.toString()) || 0
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

      // Insert individual answers
      // Get actual question IDs from database
      console.log('Fetching question IDs from database...');
      const { data: questionsData, error: questionsError } = await supabase
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

      console.log('Questions from database:', questionsData);

      // Create a mapping from question text/type to database ID
      const questionIdMap: { [key: string]: number } = {};

      // Map based on question content patterns
      questionsData?.forEach(q => {
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

      console.log('Question ID mapping:', questionIdMap);

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

      for (const [questionId, answer] of validAnswers) {
        const mappedQuestionId = questionIdMap[questionId];
        if (!mappedQuestionId) {
          console.warn(`No mapping found for question ID: ${questionId}, using first available question ID`);
          answersToInsert.push({
            response_id: responseData.id,
            question_id: questionsData?.[0]?.id || 1,
            answer_text: `${questionId}: ${String(answer).substring(0, 500)}`,
            additional_info: answers[`${questionId}_details`] ? String(answers[`${questionId}_details`]).substring(0, 1000) : null,
            file_url: null
          });
          continue;
        }

        // Check if this question should have the uploaded file attached
        let fileUrl = null;
        const questionText = questionsData?.find(q => q.id === mappedQuestionId)?.question_text?.toLowerCase() || '';
        const shouldAttachFile = questionId === 'blood_test' || 
                               questionText.includes('blood test') || 
                               questionText.includes('upload') ||
                               questionText.includes('file') ||
                               String(answer).toLowerCase().includes('upload');

        if (shouldAttachFile && uploadedFileUrl) {
          fileUrl = uploadedFileUrl;
          console.log(`Attaching file to question: ${questionId} (${questionText})`);
        }

        answersToInsert.push({
          response_id: responseData.id,
          question_id: mappedQuestionId,
          answer_text: String(answer).substring(0, 500),
          additional_info: answers[`${questionId}_details`] ? String(answers[`${questionId}_details`]).substring(0, 1000) : null,
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
        stack: error instanceof Error ? error.stack : undefined
      });

      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }

      alert(`There was an error saving your quiz response: ${errorMessage}. Please check the console for more details and try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isSubmitted) {
      saveResponses();
    }
  }, []);

  return (
    <section className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-[#1d0917] text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="[font-family:'DM_Serif_Display',Helvetica] text-[32px] md:text-[48px] lg:text-[56px] font-normal tracking-[2px] md:tracking-[4px] leading-[36px] md:leading-[52px] lg:leading-[60px] mb-6">
              Your Personalized Health Plan is Ready!
            </h1>
            <p className="font-desktop-body-xl-regular text-[18px] md:text-[20px] lg:text-[24px] leading-[24px] md:leading-[28px] lg:leading-[32px] text-white/90 max-w-3xl mx-auto mb-8">
              Based on your responses, we've created a custom supplement plan tailored to your unique health needs and goals. Get ready to transform your wellness journey!
            </p>

            {/* User Info Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-16 h-16 bg-[#913177] rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {userInfo.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-bold">Hello, {userInfo.name}!</h3>
                  <p className="text-white/80">Your personalized plan is ready</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#913177] bg-white rounded-lg py-2">3</div>
                  <div className="text-sm mt-1">Custom Supplements</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#913177] bg-white rounded-lg py-2">30</div>
                  <div className="text-sm mt-1">Days Supply</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#913177] bg-white rounded-lg py-2">100%</div>
                  <div className="text-sm mt-1">Natural</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">

          {/* Recommendations Section */}
          <div className="mb-16">
            <h2 className="[font-family:'DM_Serif_Display',Helvetica] text-[32px] md:text-[40px] font-normal text-[#1d0917] text-center tracking-[2px] mb-12">
              Your Recommended Supplements
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Daily Energy & Focus Blend",
                  description: "Boost your energy levels and mental clarity throughout the day",
                  benefits: ["Increased Energy", "Better Focus", "Mental Clarity", "Reduced Fatigue"],
                  image: "https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=400",
                  price: "₹999"
                },
                {
                  title: "Stress Management Complex",
                  description: "Natural stress relief and mood support for better emotional balance",
                  benefits: ["Stress Relief", "Mood Support", "Better Sleep", "Anxiety Reduction"],
                  image: "https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=400",
                  price: "₹899"
                },
                {
                  title: "Sleep Support Formula",
                  description: "Improve sleep quality and recovery for optimal rest",
                  benefits: ["Better Sleep", "Faster Recovery", "Deep Rest", "Morning Freshness"],
                  image: "https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=400",
                  price: "₹1099"
                }
              ].map((product, index) => (
                <Card key={index} className="border-[#e9d6e4] rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-0">
                    <div className="relative">
                      <img 
                        src={product.image} 
                        alt={product.title}
                        className="w-full h-48 object-cover rounded-t-2xl"
                      />
                      <div className="absolute top-4 right-4 bg-[#913177] text-white px-3 py-1 rounded-full text-sm font-bold">
                        {product.price}
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="[font-family:'DM_Serif_Display',Helvetica] text-[20px] font-normal text-[#1d0917] mb-3 tracking-[1px]">
                        {product.title}
                      </h3>
                      <p className="font-desktop-body-m-regular text-[#3d3d3d] text-sm mb-4 leading-relaxed">
                        {product.description}
                      </p>

                      <div className="space-y-3">
                        <div className="text-sm font-semibold text-[#1d0917]">Key Benefits:</div>
                        <div className="grid grid-cols-2 gap-2">
                          {product.benefits.map((benefit, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-[#913177] rounded-full"></div>
                              <span className="text-xs text-[#3d3d3d]">{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Pricing Section */}
          <div className="bg-gradient-to-br from-[#fff4fc] to-white rounded-3xl p-8 md:p-12 shadow-xl">
            <div className="text-center mb-8">
              <h2 className="[font-family:'DM_Serif_Display',Helvetica] text-[32px] md:text-[40px] font-normal text-[#1d0917] tracking-[2px] mb-4">
                Complete Health Package
              </h2>
              <p className="font-desktop-body-l-regular text-[#3d3d3d] text-lg">
                Everything you need for optimal health and wellness
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

                {/* Pricing Info */}
                <div className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-4 mb-6">
                    <div>
                      <div className="text-5xl md:text-6xl font-bold text-[#913177]">₹2,999</div>
                      <div className="text-lg text-[#3d3d3d]">per month</div>
                    </div>
                    <div className="text-[#6d6d6e]">
                      <span className="line-through text-2xl">₹4,500</span>
                      <div className="bg-[#913177] text-white px-3 py-1 rounded-full text-sm font-bold mt-1">
                        33% OFF
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-[#913177] rounded-full flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <path d="M9 12l2 2 4-4"/>
                        </svg>
                      </div>
                      <span className="font-desktop-body-m-regular text-[#1d0917]">3 Custom Supplements (30-day supply)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-[#913177] rounded-full flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <path d="M9 12l2 2 4-4"/>
                        </svg>
                      </div>
                      <span className="font-desktop-body-m-regular text-[#1d0917]">Personalized Diet Plan</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-[#913177] rounded-full flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <path d="M9 12l2 2 4-4"/>
                        </svg>
                      </div>
                      <span className="font-desktop-body-m-regular text-[#1d0917]">Custom Exercise Routine</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-[#913177] rounded-full flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <path d="M9 12l2 2 4-4"/>
                        </svg>
                      </div>
                      <span className="font-desktop-body-m-regular text-[#1d0917]">Expert Consultation</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-[#913177] rounded-full flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <path d="M9 12l2 2 4-4"/>
                        </svg>
                      </div>
                      <span className="font-desktop-body-m-regular text-[#1d0917]">Monthly Progress Tracking</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-[#913177] rounded-full flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <path d="M9 12l2 2 4-4"/>
                        </svg>
                      </div>
                      <span className="font-desktop-body-m-regular text-[#1d0917]">Free Shipping & Support</span>
                    </div>
                  </div>
                </div>

                {/* CTA Section */}
                <div className="text-center">
                  <div className="bg-white rounded-2xl p-8 shadow-lg">
                    <h3 className="[font-family:'DM_Serif_Display',Helvetica] text-[24px] font-normal text-[#1d0917] mb-4 tracking-[1px]">
                      Ready to Transform Your Health?
                    </h3>
                    <p className="font-desktop-body-m-regular text-[#3d3d3d] mb-6">
                      Join thousands who have already started their wellness journey with NutraSage
                    </p>

                    <Button 
                      className="w-full h-16 rounded-2xl bg-[#913177] text-white font-desktop-body-m-bold text-lg shadow-lg hover:bg-[#913177]/90 transition-all duration-300 transform hover:scale-105"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Processing...' : 'Start Your Health Journey - ₹2,999/month'}
                    </Button>

                    <div className="flex items-center justify-center gap-6 mt-6 text-sm text-[#6d6d6e]">
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 12l2 2 4-4"/>
                          <circle cx="12" cy="12" r="10"/>
                        </svg>
                        <span>30-day money back</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <circle cx="12" cy="16" r="1"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        <span>Secure payment</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-center mt-12 space-y-4 max-w-3xl mx-auto">
            <p className="font-desktop-body-l-regular text-[#3d3d3d] text-lg">
              Our nutrition experts will review your responses and may contact you within 24 hours to finalize your personalized plan.
            </p>
            <p className="font-desktop-body-m-regular text-[#6d6d6e]">
              Questions? Contact our support team at <span className="text-[#913177] font-semibold">support@nutrasage.com</span> or call <span className="text-[#913177] font-semibold">+91-XXXX-XXXX</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};