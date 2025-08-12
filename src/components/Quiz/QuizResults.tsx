
import React, { useEffect, useState, useMemo } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { supabase } from "../../lib/supabase";
import type { QuizResponse, QuizAnswer, Product } from "../../types/database";

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
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);

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

    // Process answers with priority order for name extraction
    const answerEntries = Object.entries(answers);
    
    // First pass: Extract based on question mappings and known keys
    answerEntries.forEach(([key, value]) => {
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
      // Fallback to legacy key matching for compatibility - prioritize name extraction
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

    // Second pass: Content-based detection only if we still don't have the required fields
    if (!extracted.name || !extracted.email || !extracted.contact || extracted.age === '0') {
      console.log('Running content-based detection...');
      
      // Sort answers by key to prioritize earlier questions for name
      const sortedAnswers = answerEntries.sort((a, b) => {
        const aNum = parseInt(a[0]) || 999;
        const bNum = parseInt(b[0]) || 999;
        return aNum - bNum;
      });

      sortedAnswers.forEach(([key, value]) => {
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
        // Name detection (be more restrictive and prioritize first valid name found)
        else if (!extracted.name && cleanValue.length >= 2 && /^[a-zA-Z][a-zA-Z\s\.]*$/.test(cleanValue) && 
                 !cleanValue.includes('@') && !cleanValue.includes('+') && !/\d/.test(cleanValue) &&
                 !['Male', 'Female', 'Other', 'Yes', 'No', 'male', 'female', 'other', 'yes', 'no'].includes(cleanValue)) {
          console.log('Detected name by pattern:', cleanValue);
          extracted.name = cleanValue;
        }
      });
    }

    console.log('Final extracted info:', extracted);
    return extracted;
  }, [userInfo, answers, questions]);

  // Function to get recommended products based on quiz answers
  const getRecommendedProducts = async () => {
    try {
      console.log('=== PRODUCT RECOMMENDATION DEBUG ===');
      console.log('Getting recommended products based on quiz answers...');
      console.log('All user answers:', answers);
      
      // First, get all the user's answers and their associated tags
      const { data: fetchedQuestions, error: questionsError } = await supabase
        .from('questions')
        .select(`
          id, 
          question_text,
          question_options (
            id,
            option_text,
            option_tags (
              tag_id,
              tags (
                name
              )
            )
          )
        `)
        .eq('status', 'active');

      if (questionsError) {
        console.error('Error fetching questions for recommendations:', questionsError);
        return;
      }

      console.log('Total questions fetched:', fetchedQuestions?.length);

      // Collect all unique tags from user's answers
      const userTags = new Set<string>();
      const answerTagMapping: { [key: string]: string[] } = {};
      
      Object.entries(answers).forEach(([questionId, answerValue]) => {
        // Skip detail keys and empty values
        if (questionId.includes('_details') || !answerValue || answerValue.trim() === '') {
          return;
        }

        console.log(`Processing answer - Question ID: ${questionId}, Answer: "${answerValue}"`);
        
        const question = fetchedQuestions?.find(q => q.id === parseInt(questionId));
        if (question && question.question_options) {
          console.log(`Found question: "${question.question_text}"`);
          console.log(`Available options for this question:`, question.question_options.map(opt => opt.option_text));
          
          // Find the selected option with exact matching
          const selectedOption = question.question_options.find(opt => 
            opt.option_text.trim().toLowerCase() === answerValue.trim().toLowerCase()
          );
          
          if (selectedOption) {
            console.log(`Found selected option: "${selectedOption.option_text}"`);
            console.log(`Option tags:`, selectedOption.option_tags);
            
            const tagsForThisAnswer: string[] = [];
            
            if (selectedOption.option_tags && selectedOption.option_tags.length > 0) {
              selectedOption.option_tags.forEach((optionTag: any) => {
                if (optionTag.tags && optionTag.tags.name) {
                  userTags.add(optionTag.tags.name);
                  tagsForThisAnswer.push(optionTag.tags.name);
                  console.log(`Added tag: "${optionTag.tags.name}"`);
                }
              });
            } else {
              console.log('No tags found for this option');
            }
            
            answerTagMapping[`Q${questionId}: ${answerValue}`] = tagsForThisAnswer;
          } else {
            console.log(`❌ Could not find matching option for answer: "${answerValue}"`);
            console.log('Available options:', question.question_options.map(opt => `"${opt.option_text}"`));
          }
        } else {
          console.log(`❌ Could not find question with ID: ${questionId}`);
        }
      });

      console.log('=== TAG COLLECTION SUMMARY ===');
      console.log('Answer to Tag Mapping:', answerTagMapping);
      console.log('All unique user tags collected:', Array.from(userTags));
      console.log('Total unique tags:', userTags.size);

      if (userTags.size === 0) {
        console.log('❌ No tags found for user answers - will show default products');
        // Show default products when no tags are found
        const { data: defaultProducts, error: defaultError } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .limit(3);

        if (!defaultError && defaultProducts) {
          console.log('Using default products:', defaultProducts.map(p => p.name));
          setRecommendedProducts(defaultProducts);
        }
        return;
      }

      // Sort tags alphabetically to match the answer key format
      const sortedTags = Array.from(userTags).sort().join(',');
      console.log('=== ANSWER KEY MATCHING ===');
      console.log('User tag combination (sorted):', sortedTags);

      // Get all answer keys for debugging
      console.log('Fetching all answer keys...');
      const { data: allAnswerKeys, error: allKeysError } = await supabase
        .from('answer_key')
        .select('*');

      console.log('All available answer key combinations:');
      console.log('Total answer keys found:', allAnswerKeys?.length || 0);
      allAnswerKeys?.forEach((key, index) => {
        console.log(`  ${index + 1}. ID:${key.id} - "${key.tag_combination}" -> ${key.recommended_products}`);
        if (key.tag_combination === sortedTags) {
          console.log(`  ✅ EXACT MATCH FOUND in all keys list: ID ${key.id}`);
        }
      });

      // Look for exact match first
      console.log(`Looking for exact match with: "${sortedTags}"`);
      console.log('Querying answer_key table...');
      
      let { data: answerKeyData, error: answerKeyError } = await supabase
        .from('answer_key')
        .select('*')
        .eq('tag_combination', sortedTags);

      console.log('Query result - data:', answerKeyData);
      console.log('Query result - error:', answerKeyError);
      console.log('Data length:', answerKeyData?.length || 0);

      // Handle the data array from the query
      const exactMatch = answerKeyData && answerKeyData.length > 0 ? answerKeyData[0] : null;
      
      if (answerKeyError || !exactMatch) {
        console.log('❌ No exact match found');
        console.log('Looking for subset matches...');
        
        // Find the best matching answer key (highest number of matching tags)
        let bestMatch = null;
        let maxMatches = 0;
        let exactSubsetMatch = null;

        allAnswerKeys?.forEach(key => {
          const keyTags = new Set(key.tag_combination.split(',').map(tag => tag.trim()));
          const userTagsArray = Array.from(userTags);
          const matchCount = userTagsArray.filter(tag => keyTags.has(tag)).length;
          
          console.log(`Checking key "${key.tag_combination}": ${matchCount}/${userTagsArray.length} tags match`);
          
          // Check if user tags are a subset of this key's tags
          const isSubset = userTagsArray.every(tag => keyTags.has(tag));
          
          if (isSubset && matchCount === userTagsArray.length) {
            console.log(`✅ Found exact subset match: "${key.tag_combination}"`);
            if (!exactSubsetMatch || keyTags.size < new Set(exactSubsetMatch.tag_combination.split(',')).size) {
              exactSubsetMatch = key;
            }
          }
          
          // Also track the best partial match
          if (matchCount > maxMatches && matchCount > 0) {
            maxMatches = matchCount;
            bestMatch = key;
          }
        });

        // Prefer exact subset match over partial match
        if (exactSubsetMatch) {
          console.log('✅ Using exact subset match:', exactSubsetMatch.tag_combination);
          answerKeyData = [exactSubsetMatch];
        } else if (bestMatch) {
          console.log('✅ Using best partial match:', bestMatch.tag_combination, 'with', maxMatches, 'matching tags');
          answerKeyData = [bestMatch];
        }
      } else {
        console.log('✅ Found exact match:', exactMatch.tag_combination);
        answerKeyData = [exactMatch];
      }

      const finalAnswerKey = answerKeyData && answerKeyData.length > 0 ? answerKeyData[0] : null;
      if (finalAnswerKey && finalAnswerKey.recommended_products) {
        const productNames = finalAnswerKey.recommended_products.split(',').map(name => name.trim());
        console.log('=== PRODUCT MATCHING ===');
        console.log('Recommended product names from answer key:', productNames);
        console.log('Using answer key:', finalAnswerKey.tag_combination, '->', finalAnswerKey.recommended_products);

        // Get all products for debugging
        const { data: allProducts, error: allProductsError } = await supabase
          .from('products')
          .select('id, name, description, image_url, url, mrp, srp, is_active')
          .eq('is_active', true);

        if (allProductsError) {
          console.error('Error fetching all products:', allProductsError);
          return;
        }

        console.log('All available products in database:', allProducts?.map(p => p.name));

        // Try exact name matching first
        const exactMatches = allProducts?.filter(product => 
          productNames.some(name => name.toLowerCase() === product.name.toLowerCase())
        ) || [];

        console.log('Product matching results:');
        productNames.forEach(name => {
          const match = allProducts?.find(p => p.name.toLowerCase() === name.toLowerCase());
          console.log(`  "${name}" -> ${match ? `Found: "${match.name}"` : 'NOT FOUND'}`);
        });

        console.log('Final exact matches:', exactMatches.map(p => p.name));

        if (exactMatches.length > 0) {
          console.log('✅ Using exact product matches');
          setRecommendedProducts(exactMatches);
        } else {
          // If no exact matches, try partial matching
          console.log('⚠️ No exact matches, trying partial matching...');
          const partialMatches = allProducts?.filter(product => 
            productNames.some(name => 
              product.name.toLowerCase().includes(name.toLowerCase()) ||
              name.toLowerCase().includes(product.name.toLowerCase())
            )
          ) || [];

          console.log('Partial matches found:', partialMatches.map(p => p.name));

          if (partialMatches.length > 0) {
            console.log('✅ Using partial product matches');
            setRecommendedProducts(partialMatches);
          } else {
            console.log('❌ No matches found, using first 3 active products as fallback');
            const fallbackProducts = allProducts?.slice(0, 3) || [];
            console.log('Fallback products:', fallbackProducts.map(p => p.name));
            setRecommendedProducts(fallbackProducts);
          }
        }
      } else {
        console.log('❌ No matching answer key found, showing default products');
        const { data: defaultProducts, error: defaultError } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .limit(3);

        if (!defaultError && defaultProducts) {
          console.log('Using default products:', defaultProducts.map(p => p.name));
          setRecommendedProducts(defaultProducts);
        }
      }

      console.log('=== RECOMMENDATION COMPLETE ===');
    } catch (error) {
      console.error('Error getting recommended products:', error);
    }
  };

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

        let actualQuestionId = null;
        let question = null;

        // Direct mapping by question ID (most reliable)
        const directQuestionId = parseInt(answerKey);
        if (!isNaN(directQuestionId) && fetchedQuestions) {
          question = fetchedQuestions.find(q => q.id === directQuestionId);
          if (question) {
            actualQuestionId = question.id;
            console.log(`Direct mapping: key "${answerKey}" -> question ID ${actualQuestionId} (${question.question_text})`);
          }
        }

        // If direct mapping failed, try legacy key mapping patterns
        if (!actualQuestionId && fetchedQuestions) {
          // Legacy key mapping based on question patterns and IDs from database
          if (answerKey === '38' || answerKey === 'name') {
            question = fetchedQuestions.find(q => q.id === 38 || q.question_text.toLowerCase().includes('name'));
          } else if (answerKey === '39' || answerKey === 'email') {
            question = fetchedQuestions.find(q => q.id === 39 || q.question_text.toLowerCase().includes('email'));
          } else if (answerKey === '3' || answerKey === 'contact') {
            question = fetchedQuestions.find(q => q.id === 3 || (q.question_text.toLowerCase().includes('contact') || q.question_text.toLowerCase().includes('phone')));
          } else if (answerKey === '41' || answerKey === 'age') {
            question = fetchedQuestions.find(q => q.id === 41 || q.question_text.toLowerCase().includes('age'));
          } else if (answerKey === '6' || answerKey === 'gender') {
            question = fetchedQuestions.find(q => q.id === 6 || q.question_text.toLowerCase().includes('gender'));
          } else if (answerKey === '7' || answerKey === 'mental_stress') {
            question = fetchedQuestions.find(q => q.id === 7 || (q.question_text.toLowerCase().includes('stress') || q.question_text.toLowerCase().includes('anxious')));
          } else if (answerKey === '8' || answerKey === 'energy_levels') {
            question = fetchedQuestions.find(q => q.id === 8 || q.question_text.toLowerCase().includes('energy'));
          } else if (answerKey === '9' || answerKey === 'joint_pain') {
            question = fetchedQuestions.find(q => q.id === 9 || (q.question_text.toLowerCase().includes('joint') || q.question_text.toLowerCase().includes('pain')));
          } else if (answerKey === '10' || answerKey === 'skin_condition') {
            question = fetchedQuestions.find(q => q.id === 10 || q.question_text.toLowerCase().includes('skin'));
          } else if (answerKey === '11' || answerKey === 'sleep_quality') {
            question = fetchedQuestions.find(q => q.id === 11 || q.question_text.toLowerCase().includes('sleep'));
          } else if (answerKey === '12' || answerKey === 'digestive_issues') {
            question = fetchedQuestions.find(q => q.id === 12 || (q.question_text.toLowerCase().includes('digestive') || q.question_text.toLowerCase().includes('bloating')));
          } else if (answerKey === '13' || answerKey === 'physical_activity') {
            question = fetchedQuestions.find(q => q.id === 13 || (q.question_text.toLowerCase().includes('active') || q.question_text.toLowerCase().includes('exercise')));
          } else if (answerKey === '14' || answerKey === 'supplements') {
            question = fetchedQuestions.find(q => q.id === 14 || q.question_text.toLowerCase().includes('supplement'));
          } else if (answerKey === '15' || answerKey === 'health_conditions') {
            question = fetchedQuestions.find(q => q.id === 15 || (q.question_text.toLowerCase().includes('health condition') || q.question_text.toLowerCase().includes('allergies')));
          } else if (answerKey === '16' || answerKey === 'blood_test') {
            question = fetchedQuestions.find(q => q.id === 16 || q.question_text.toLowerCase().includes('blood test'));
          }

          if (question) {
            actualQuestionId = question.id;
            console.log(`Legacy mapping: key "${answerKey}" -> question ID ${actualQuestionId} (${question.question_text})`);
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

      // Get recommended products after successful save
      await getRecommendedProducts();
      
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

      // Catch any unhandled promise rejections
      initiateSave().catch((error) => {
        console.error('Unhandled error in initiateSave:', error);
        setIsSubmitting(false);
        hasInitiatedSave.current = false;
      });
    }
  }, []); // Remove dependencies to ensure it only runs once on mount

  // Calculate total price
  const totalPrice = recommendedProducts.reduce((total, product) => total + (product.srp || product.mrp || 999), 0);
  const originalPrice = recommendedProducts.reduce((total, product) => total + (product.mrp || product.srp || 1299), 0);
  const discountPercentage = Math.round(((originalPrice - totalPrice) / originalPrice) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-[#1d0917]">NutraSage</h1>
            <div className="text-sm text-gray-600">Assessment Report</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto">

          {/* Assessment Report Card */}
          <Card className="mb-6 border-0 shadow-sm bg-white">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-start gap-6">
                {/* Left Column - Report Details */}
                <div className="flex-1">
                  <div className="text-sm text-gray-500 mb-2">Assessment Report</div>
                  
                  <div className="mb-4">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                      {extractedUserInfo?.name || 'User'},
                    </h2>
                    <div className="text-gray-600 mb-2">You Are Currently On</div>
                    <div className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                      Stage 1 Of Personalized Health Journey
                    </div>
                    
                    <div className="text-gray-600 mb-2">Start Seeing Results In</div>
                    <div className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                      3-4 Weeks
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="bg-green-100 rounded-full p-3 mb-3">
                        <div className="bg-green-500 h-2 rounded-full" style={{width: '85%'}}></div>
                      </div>
                      <div className="text-center text-sm font-medium text-green-700">
                        Health Improvement Possibility 85%
                      </div>
                    </div>

                    {/* Health Analysis */}
                    <div className="bg-green-50 rounded-lg p-4 mb-4">
                      <div className="text-gray-800 text-sm leading-relaxed">
                        Based on your quiz responses, we've identified key areas for improvement. 
                        Your personalized supplement plan targets nutritional gaps and lifestyle factors 
                        that can significantly enhance your overall wellness and energy levels.
                      </div>
                    </div>

                    {/* Root Causes */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Wellness Root Causes</h3>
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg flex-1">
                          <div className="w-8 h-8 bg-gray-200 rounded-full mb-2 flex items-center justify-center">
                            🥗
                          </div>
                          <div className="text-xs text-gray-700 text-center">Nutrition</div>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg flex-1">
                          <div className="w-8 h-8 bg-gray-200 rounded-full mb-2 flex items-center justify-center">
                            🏃‍♂️
                          </div>
                          <div className="text-xs text-gray-700 text-center">Lifestyle</div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Right Column - Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-[#913177] to-[#b54394] rounded-full flex items-center justify-center">
                    <span className="text-white text-2xl md:text-3xl font-bold">
                      {extractedUserInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Section */}
          <Card className="mb-6 border-0 shadow-sm bg-white">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-8">
                
                {/* Left Column - Products List */}
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-[#1d0917] mb-4">
                    Start Your Journey With Just 1 Month Kit
                  </h3>
                  
                  <div className="space-y-4">
                    {recommendedProducts.length > 0 ? recommendedProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center gap-4 p-3 bg-gradient-to-r from-[#fff4fc] to-white rounded-lg shadow-sm border border-[#913177]/10">
                        <img
                          src={product.image_url || "https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=400"}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=400";
                          }}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-[#1d0917] text-sm">{product.name}</div>
                          <div className="text-xs text-[#6d6d6e]">
                            {product.description?.substring(0, 50)}...
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-[#913177]">₹{product.srp || product.mrp || '999'}</div>
                        </div>
                      </div>
                    )) : (
                      // Fallback products
                      [
                        { name: "Daily Energy Boost", description: "Natural energy enhancement", price: "₹999" },
                        { name: "Stress Relief Complex", description: "Adaptogenic herbs for stress", price: "₹899" },
                        { name: "Recovery & Immunity", description: "Support natural healing", price: "₹1099" }
                      ].map((product, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 bg-gradient-to-r from-[#fff4fc] to-white rounded-lg shadow-sm border border-[#913177]/10">
                          <img
                            src="https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=400"
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-[#1d0917] text-sm">{product.name}</div>
                            <div className="text-xs text-[#6d6d6e]">{product.description}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-[#913177]">{product.price}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Certification */}
                  <div className="mt-6 text-center text-xs text-[#6d6d6e] bg-gradient-to-r from-[#fff4fc] to-white rounded-lg p-3">
                    All of our products are GMP & ISO 9001 certified
                  </div>
                </div>

                {/* Right Column - Pricing Summary (Desktop) */}
                <div className="w-full md:w-80">
                  <div className="bg-white border border-[#913177]/20 rounded-lg p-6 md:sticky md:top-4 shadow-sm">
                    <div className="text-center mb-6">
                      <div className="text-lg font-bold text-[#1d0917] mb-1">Subtotal</div>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-2xl font-bold text-[#913177]">₹{totalPrice}</span>
                        {originalPrice > totalPrice && (
                          <span className="text-lg text-[#6d6d6e] line-through">₹{originalPrice}</span>
                        )}
                      </div>
                      <div className="text-sm text-[#6d6d6e]">(Inclusive of all taxes)</div>
                      {discountPercentage > 0 && (
                        <div className="inline-block bg-gradient-to-r from-[#913177] to-[#b54394] text-white px-2 py-1 rounded-full text-xs font-medium mt-2">
                          {discountPercentage}% OFF
                        </div>
                      )}
                    </div>

                    {/* Desktop Buy Now Button */}
                    <Button className="w-full h-12 text-lg font-bold bg-gradient-to-r from-[#913177] to-[#b54394] hover:from-[#7d2b65] hover:to-[#9d3b80] text-white rounded-lg shadow-md transform hover:scale-105 transition-all duration-300 hidden md:block">
                      Buy Now
                    </Button>

                    {/* Features */}
                    <div className="mt-6 space-y-3">
                      {[
                        "30-day money back guarantee",
                        "Free expert consultation",
                        "Secure & fast delivery",
                        "Custom meal plan included"
                      ].map((feature, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-[#913177] rounded-full flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-sm text-[#6d6d6e]">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="text-center text-sm text-[#6d6d6e] space-y-1">
            <p>Our experts will review your responses and contact you within 24 hours.</p>
            <p>
              Questions? Email us at <span className="text-[#913177] font-semibold">support@nutrasage.com</span> or call{' '}
              <span className="text-[#913177] font-semibold">+91 7093619881</span>
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Buy Now Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#913177]/20 p-4 md:hidden z-50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm text-[#6d6d6e]">Total</div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-[#913177]">₹{totalPrice}</span>
              {originalPrice > totalPrice && (
                <span className="text-sm text-[#6d6d6e] line-through">₹{originalPrice}</span>
              )}
            </div>
          </div>
          <Button className="px-8 h-12 text-lg font-bold bg-gradient-to-r from-[#913177] to-[#b54394] hover:from-[#7d2b65] hover:to-[#9d3b80] text-white rounded-lg shadow-md">
            Buy Now
          </Button>
        </div>
      </div>
    </div>
  );
};
