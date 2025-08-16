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
  isViewingExistingResults?: boolean; // Added prop to control saving
}

export const QuizResults: React.FC<QuizResultsProps> = ({ 
  answers, 
  userInfo, 
  selectedFile,
  isViewingExistingResults = false // Default to false
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [questions, setQuestions] = useState<Array<{ id: number; question_text: string }>>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [answerKey, setAnswerKey] = useState<any>(null); // State to store the matched answer key
  const [resultId, setResultId] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string>('');

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
      console.log('=== PRODUCT RECOMMENDATION DEBUG START ===');
      console.log('All user answers:', answers);
      console.log('Available questions in state:', questions.length);

      // First, ensure we have questions loaded
      let questionsToUse = questions;
      if (questionsToUse.length === 0) {
        console.log('Loading questions for product recommendations...');
        const { data: fetchedQuestions, error: questionsError } = await supabase
          .from('questions')
          .select('id, question_text')
          .eq('status', 'active')
          .order('order_index');

        if (questionsError) {
          console.error('Error fetching questions:', questionsError);
          throw questionsError;
        }

        questionsToUse = fetchedQuestions || [];
        setQuestions(questionsToUse);
        console.log('Loaded questions:', questionsToUse.length);
      }

      // Get questions with their options and tags
      const { data: questionsWithTags, error: questionsError } = await supabase
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
        console.error('Error fetching questions with tags:', questionsError);
        throw questionsError;
      }

      console.log('Questions with tags loaded:', questionsWithTags?.length);

      // Collect all unique tags from user's answers
      const userTags = new Set<string>();
      const answerTagMapping: { [key: string]: string[] } = {};

      // Process each answer to extract tags
      for (const [questionId, answerValue] of Object.entries(answers)) {
        // Skip detail keys, empty values, and user info fields
        if (questionId.includes('_details') || 
            !answerValue || 
            String(answerValue).trim() === '' ||
            ['name', 'email', 'contact', 'age'].includes(questionId)) {
          continue;
        }

        console.log(`Processing answer - Question ID: ${questionId}, Answer: "${answerValue}"`);

        // Find the question
        const questionIdNum = parseInt(questionId);
        const question = questionsWithTags?.find(q => q.id === questionIdNum);

        if (!question) {
          console.log(`❌ Question not found for ID: ${questionId}`);
          continue;
        }

        console.log(`Found question: "${question.question_text}"`);
        console.log(`Available options:`, question.question_options?.map(opt => opt.option_text) || []);

        // Find the selected option
        const selectedOption = question.question_options?.find(opt => 
          opt.option_text.trim().toLowerCase() === String(answerValue).trim().toLowerCase()
        );

        if (!selectedOption) {
          console.log(`❌ Option not found for answer: "${answerValue}"`);
          console.log('Available options:', question.question_options?.map(opt => opt.option_text));
          continue;
        }

        console.log(`✅ Found selected option: "${selectedOption.option_text}"`);

        // Extract tags from the selected option
        const tagsForThisAnswer: string[] = [];
        if (selectedOption.option_tags && selectedOption.option_tags.length > 0) {
          selectedOption.option_tags.forEach((optionTag: any) => {
            if (optionTag.tags && optionTag.tags.name) {
              const tagName = optionTag.tags.name.trim();
              userTags.add(tagName);
              tagsForThisAnswer.push(tagName);
              console.log(`  ✅ Added tag: "${tagName}"`);
            }
          });
        }

        answerTagMapping[`Q${questionId}: ${answerValue}`] = tagsForThisAnswer;
      }

      console.log('=== TAG COLLECTION SUMMARY ===');
      console.log('Answer to Tag Mapping:', answerTagMapping);
      console.log('All unique user tags collected:', Array.from(userTags));
      console.log('Total unique tags:', userTags.size);

      // If no tags found, use fallback products
      if (userTags.size === 0) {
        console.log('❌ No tags found - using fallback products');
        await setFallbackProducts();
        return;
      }

      // Create sorted tag combination for answer key matching
      const sortedTags = Array.from(userTags).sort().join(',');
      console.log('=== ANSWER KEY MATCHING ===');
      console.log('User tag combination (sorted):', `"${sortedTags}"`);

      // Get all answer keys first for debugging
      const { data: allAnswerKeys, error: allKeysError } = await supabase
        .from('answer_key')
        .select('*')
        .order('id');

      if (allKeysError) {
        console.error('Error fetching answer keys:', allKeysError);
        throw allKeysError;
      }

      console.log('=== ALL ANSWER KEYS ===');
      console.log('Total answer keys:', allAnswerKeys?.length || 0);
      allAnswerKeys?.forEach((key, index) => {
        const isExactMatch = key.tag_combination === sortedTags;
        console.log(`${index + 1}. ${isExactMatch ? '🎯' : '  '} ID:${key.id} - "${key.tag_combination}" -> ${key.recommended_products}`);
      });

      // Look for exact match
      const exactMatch = allAnswerKeys?.find(key => key.tag_combination === sortedTags);

      let selectedAnswerKey = null;

      if (exactMatch) {
        console.log('🎯 EXACT MATCH FOUND:', exactMatch.tag_combination);
        selectedAnswerKey = exactMatch;
      } else {
        console.log('⚠️ No exact match found, looking for subset matches...');

        // Find subset matches (user tags are subset of answer key tags)
        const userTagsArray = Array.from(userTags);
        let bestSubsetMatch = null;
        let bestPartialMatch = null;
        let maxPartialMatches = 0;

        allAnswerKeys?.forEach(key => {
          const keyTags = new Set(key.tag_combination.split(',').map(tag => tag.trim()));
          const matchCount = userTagsArray.filter(tag => keyTags.has(tag)).length;

          // Check if user tags are a subset of this key's tags
          const isSubset = userTagsArray.every(tag => keyTags.has(tag));

          console.log(`Checking "${key.tag_combination}": ${matchCount}/${userTagsArray.length} matches, subset: ${isSubset}`);

          if (isSubset && matchCount === userTagsArray.length) {
            // This is a valid subset match
            if (!bestSubsetMatch || keyTags.size < new Set(bestSubsetMatch.tag_combination.split(',')).size) {
              bestSubsetMatch = key;
              console.log(`  ✅ Better subset match: ${key.tag_combination}`);
            }
          }

          // Track best partial match as fallback
          if (matchCount > maxPartialMatches) {
            maxPartialMatches = matchCount;
            bestPartialMatch = key;
          }
        });

        if (bestSubsetMatch) {
          console.log('✅ Using best subset match:', bestSubsetMatch.tag_combination);
          selectedAnswerKey = bestSubsetMatch;
        } else if (bestPartialMatch && maxPartialMatches > 0) {
          console.log('⚠️ Using best partial match:', bestPartialMatch.tag_combination, `(${maxPartialMatches} matching tags)`);
          selectedAnswerKey = bestPartialMatch;
        }
      }

      if (!selectedAnswerKey) {
        console.log('❌ No suitable answer key found - using fallback products');
        await setFallbackProducts();
        return;
      }

      // Set the matched answer key
      setAnswerKey(selectedAnswerKey);
      console.log('=== SELECTED ANSWER KEY ===');
      console.log('Answer Key ID:', selectedAnswerKey.id);
      console.log('Tag Combination:', selectedAnswerKey.tag_combination);
      console.log('Recommended Products:', selectedAnswerKey.recommended_products);

      // Get products based on the answer key
      const productNames = selectedAnswerKey.recommended_products
        .split(',')
        .map(name => name.trim())
        .filter(name => name.length > 0);

      console.log('=== PRODUCT MATCHING ===');
      console.log('Product names from answer key:', productNames);

      // Fetch all active products
      const { data: allProducts, error: productsError } = await supabase
        .from('products')
        .select('id, name, description, image_url, url, mrp, srp, is_active, shopify_variant_id')
        .eq('is_active', true)
        .order('name');

      if (productsError) {
        console.error('Error fetching products:', productsError);
        throw productsError;
      }

      console.log('All available products:', allProducts?.map(p => p.name) || []);

      // Match products by name
      const matchedProducts: any[] = [];
      const unmatchedProductNames: string[] = [];

      productNames.forEach(productName => {
        const product = allProducts?.find(p => 
          p.name.toLowerCase().trim() === productName.toLowerCase().trim()
        );

        if (product) {
          matchedProducts.push(product);
          console.log(`✅ Matched: "${productName}" -> "${product.name}"`);
        } else {
          unmatchedProductNames.push(productName);
          console.log(`❌ Not matched: "${productName}"`);
        }
      });

      console.log('Matched products:', matchedProducts.length);
      console.log('Unmatched product names:', unmatchedProductNames);

      // Use only the matched products from answer key
      const finalProducts = matchedProducts;

      if (finalProducts.length === 0) {
        console.log('⚠️ No products matched from answer key, using fallback');
        await setFallbackProducts();
        return;
      }

      console.log('=== FINAL PRODUCTS ===');
      finalProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} (₹${product.srp || product.mrp})`);
      });

      setRecommendedProducts(finalProducts);
      console.log('=== PRODUCT RECOMMENDATION COMPLETE ===');

    } catch (error) {
      console.error('Error in getRecommendedProducts:', error);
      await setFallbackProducts();
    }
  };

  // Helper function to set fallback products
  const setFallbackProducts = async () => {
    console.log('Setting fallback products...');

    try {
      // Try to get products from database first
      const { data: dbProducts, error } = await supabase
        .from('products')
        .select('id, name, description, image_url, url, mrp, srp, is_active, shopify_variant_id')
        .eq('is_active', true)
        .order('id')
        .limit(3);

      if (!error && dbProducts && dbProducts.length >= 3) {
        console.log('Using database fallback products:', dbProducts.map(p => p.name));
        setRecommendedProducts(dbProducts);
        return;
      }
    } catch (error) {
      console.error('Error fetching database fallback products:', error);
    }

    // Use hardcoded fallback
    console.log('Using hardcoded fallback products');
    const hardcodedProducts = [
      { 
        id: 999, 
        name: "Daily Energy Boost", 
        description: "Natural energy enhancement for daily vitality", 
        mrp: 1299, 
        srp: 999, 
        image_url: null, 
        is_active: true, 
        shopify_variant_id: null, 
        url: '#' 
      },
      { 
        id: 998, 
        name: "Stress Relief Complex", 
        description: "Adaptogenic herbs for stress management", 
        mrp: 1199, 
        srp: 899, 
        image_url: null, 
        is_active: true, 
        shopify_variant_id: null, 
        url: '#' 
      },
      { 
        id: 997, 
        name: "Recovery & Immunity", 
        description: "Support natural healing and immune function", 
        mrp: 1399, 
        srp: 1099, 
        image_url: null, 
        is_active: true, 
        shopify_variant_id: null, 
        url: '#' 
      }
    ];
    setRecommendedProducts(hardcodedProducts);
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

      // Generate unique result ID and URL
      const uniqueResultId = `${responseData.id}-${Date.now()}`;
      setResultId(uniqueResultId);

      // Create shareable result URL
      const baseUrl = window.location.origin;
      const shareableUrl = `${baseUrl}/results/${uniqueResultId}`;
      setResultUrl(shareableUrl);

      // Store result URL in localStorage for future reference
      localStorage.setItem('nutrasage_last_result_url', shareableUrl);
      localStorage.setItem('nutrasage_last_result_id', uniqueResultId);

      // Update browser URL without page reload
      window.history.replaceState(null, '', shareableUrl);

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

  // Urgency timer state with persistence
  const [timeRemaining, setTimeRemaining] = useState(() => {
    // Check if there's a stored timer for this session
    const storedTimer = localStorage.getItem('nutrasage_offer_timer');
    const storedTimestamp = localStorage.getItem('nutrasage_offer_timestamp');

    if (storedTimer && storedTimestamp) {
      const elapsed = Math.floor((Date.now() - parseInt(storedTimestamp)) / 1000);
      const remaining = parseInt(storedTimer) - elapsed;

      // If timer hasn't expired, use remaining time
      if (remaining > 0) {
        return remaining;
      }
    }

    // Start new 6-hour timer for more realistic urgency
    const newTimer = 6 * 60 * 60; // 6 hours in seconds
    localStorage.setItem('nutrasage_offer_timer', newTimer.toString());
    localStorage.setItem('nutrasage_offer_timestamp', Date.now().toString());
    return newTimer;
  });

  // Timer effect for urgency countdown with persistence
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          // Update localStorage every minute to reduce writes
          if (newTime % 60 === 0) {
            localStorage.setItem('nutrasage_offer_timer', newTime.toString());
            localStorage.setItem('nutrasage_offer_timestamp', Date.now().toString());
          }
          return newTime;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else {
      // Timer expired - could show different message or reset
      localStorage.removeItem('nutrasage_offer_timer');
      localStorage.removeItem('nutrasage_offer_timestamp');
    }
  }, [timeRemaining]);

  // Format time remaining with more realistic display
  const formatTimeRemaining = () => {
    if (timeRemaining <= 0) {
      return "EXPIRED";
    }

    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;

    // Show different format based on time remaining
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Get urgency message based on time remaining
  const getUrgencyMessage = () => {
    if (timeRemaining <= 0) {
      return "OFFER EXPIRED - Contact support for availability";
    } else if (timeRemaining < 3600) { // Less than 1 hour
      return "⚡ HURRY! Only minutes left!";
    } else if (timeRemaining < 7200) { // Less than 2 hours
      return "🔥 Limited time offer ending soon!";
    } else {
      return "⏰ Special pricing ends soon!";
    }
  };

  useEffect(() => {
    // Only save if it's not an existing result view and we haven't initiated save
    if (!isViewingExistingResults && !isSubmitted && !isSubmitting && !hasInitiatedSave.current) {
      hasInitiatedSave.current = true;
      console.log('Initiating quiz save...');

      // Use async function with proper error handling
      const initiateSave = async () => {
        try {
          await saveResponses();
          console.log('Quiz save completed successfully');
        } catch (error) {
          console.error('Error in saveResponses:', error);
          setIsSubmitting(false);
          hasInitiatedSave.current = false; // Allow retry on error

          // Set fallback products if save fails but we still want to show results
          try {
            await setFallbackProducts();
          } catch (fallbackError) {
            console.error('Error setting fallback products:', fallbackError);
          }
        }
      };

      // Properly handle the promise to prevent unhandled rejections
      initiateSave().catch((error) => {
        console.error('Unhandled error in initiateSave:', error);
        setIsSubmitting(false);
        hasInitiatedSave.current = false;

        // Try to set fallback products
        setFallbackProducts().catch(fallbackError => {
          console.error('Error setting fallback products after save failure:', fallbackError);
        });
      });
    }
  }, [isViewingExistingResults, isSubmitted, isSubmitting]); // Added dependencies

  // Separate useEffect to load products when viewing existing results
  useEffect(() => {
    if (isViewingExistingResults && recommendedProducts.length === 0) {
      console.log('Loading products for existing results view...');

      // First load questions if not already loaded
      const loadDataForExistingResults = async () => {
        try {
          console.log('=== EXISTING RESULTS DATA LOAD START ===');

          // Load questions first if not already loaded
          if (questions.length === 0) {
            console.log('Loading questions for existing results...');

            try {
              const { data: fetchedQuestions, error: questionsError } = await supabase
                .from('questions')
                .select('id, question_text')
                .eq('status', 'active')
                .order('order_index');

              if (questionsError) {
                console.error('Error loading questions:', questionsError);
                // Continue without questions - we'll use fallback products
              } else if (fetchedQuestions && fetchedQuestions.length > 0) {
                setQuestions(fetchedQuestions);
                console.log('Questions loaded for existing results:', fetchedQuestions.length);
              } else {
                console.warn('No questions found in database');
              }
            } catch (questionError) {
              console.error('Exception loading questions:', questionError);
              // Continue without questions
            }
          }

          // Then load products
          console.log('Loading recommended products...');
          try {
            await getRecommendedProducts();
            console.log('Recommended products loaded successfully');
          } catch (productError) {
            console.error('Error getting recommended products:', productError);
            // Fallback to default products
            console.log('Setting fallback products due to recommendation error');
            await setFallbackProducts();
          }

          console.log('=== EXISTING RESULTS DATA LOAD COMPLETE ===');
        } catch (error) {
          console.error('=== EXISTING RESULTS DATA LOAD ERROR ===');
          console.error('Error loading data for existing results:', error);
          console.error('Error details:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : 'No stack',
            timestamp: new Date().toISOString()
          });

          // Set fallback products on error
          try {
            console.log('Setting fallback products after error...');
            await setFallbackProducts();
            console.log('Fallback products set successfully');
          } catch (fallbackError) {
            console.error('Critical error: Could not set fallback products:', fallbackError);
            // At this point, we should show some error message to the user
            // but we don't want to crash the entire component
          }
        }
      };

      // Properly handle the promise to prevent unhandled rejections
      loadDataForExistingResults().catch(error => {
        console.error('=== CRITICAL ERROR IN loadDataForExistingResults ===');
        console.error('Unhandled error in loadDataForExistingResults:', error);
        console.error('Error type:', typeof error);
        console.error('Error constructor:', error?.constructor?.name);

        // Last resort fallback
        setFallbackProducts().catch(fallbackError => {
          console.error('=== CRITICAL FALLBACK ERROR ===');
          console.error('Error setting fallback products:', fallbackError);

          // Set some minimal products manually to prevent blank screen
          setRecommendedProducts([
            { 
              id: 999, 
              name: "Essential Wellness Kit", 
              description: "Your personalized supplement selection", 
              mrp: 1299, 
              srp: 999, 
              image_url: null, 
              is_active: true, 
              shopify_variant_id: null, 
              url: 'https://nutrasage.in' 
            }
          ]);
        });
      });
    }
  }, [isViewingExistingResults, recommendedProducts.length, questions.length]);

  // Calculate pricing based on answer key discount with fallback values
  const originalPrice = recommendedProducts.length > 0 ? 
    recommendedProducts.reduce((total, product) => total + (product.mrp || 1299), 0) : 
    3297; // Fallback total MRP

  const answerKeyDiscount = answerKey?.discount_percentage || 0;

  const totalPrice = recommendedProducts.length > 0 ? 
    (answerKeyDiscount > 0 ? 
      Math.round(originalPrice * (1 - answerKeyDiscount / 100)) : 
      recommendedProducts.reduce((total, product) => total + (product.srp || product.mrp || 999), 0)) :
    2497; // Fallback total price

  const discountPercentage = originalPrice > 0 ? 
    (answerKeyDiscount || Math.round(((originalPrice - totalPrice) / originalPrice) * 100)) : 
    25; // Fallback discount percentage

  // Generate Buy Now URL with Shopify variant IDs
  const generateBuyNowUrl = () => {
    if (recommendedProducts.length === 0) return '#';

    const variantParts = recommendedProducts
      .filter(product => product.shopify_variant_id)
      .map(product => `${product.shopify_variant_id}:1`)
      .join(',');

    if (!variantParts) return '#';

    let url = `https://nutrasage.in/cart/${variantParts}`;

    // Add discount code if available
    if (answerKey?.coupon_code) {
      url += `?discount=${answerKey.coupon_code}`;
    }

    return url;
  };

  const buyNowUrl = generateBuyNowUrl();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logo */}
      <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-center items-center">
            <div className="text-center mb-8">
              <img 
                src="https://cdn.shopify.com/s/files/1/0707/7766/7749/files/Logo_3.png?v=1745153339" 
                alt="NutraSage" 
                className="h-12 md:h-16 w-auto"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 pb-24 md:pb-8 pt-24">
        <div className="max-w-4xl mx-auto">

          {/* Assessment Report Card */}
          <Card className="mb-6 border-0 shadow-sm bg-white">
            <CardContent className="p-6 md:p-8">
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-2">Assessment Report</div>

                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  Hello {extractedUserInfo?.name || 'User'}!
                </h2>

                <div className="bg-gradient-to-r from-[#913177] to-[#b54394] text-white rounded-lg p-6 mb-6">
                  <div className="text-lg md:text-xl font-semibold mb-2">
                    🎯 Your Personalized Health Journey
                  </div>
                  <div className="text-sm opacity-90 mb-4">
                    Stage 1 of your transformation • Results expected in 3-4 weeks
                  </div>

                  {/* Enhanced Progress Bar */}
                  <div className="bg-white/20 rounded-full p-1 mb-3">
                    <div className="bg-white h-3 rounded-full flex items-center justify-end pr-2" style={{width: '85%'}}>
                      <span className="text-[#913177] text-xs font-bold">85%</span>
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    Health Improvement Possibility
                  </div>
                </div>

                {/* Health Analysis */}
                <div className="bg-green-50 rounded-lg p-6 mb-4 text-left">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Health Analysis</h3>
                  <div className="text-gray-800 text-sm leading-relaxed">
                    Based on your quiz responses, we've identified key areas for improvement. 
                    Your personalized supplement plan targets nutritional gaps and lifestyle factors 
                    that can significantly enhance your overall wellness and energy levels.
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


                  {/* Enhanced Transformation Kit Title */}
                  <div className="bg-gradient-to-r from-[#913177] via-[#b54394] to-[#913177] rounded-xl p-6 mb-6 relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

                    {/* Content */}
                    <div className="relative z-10 text-center">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <span className="text-2xl">🎯</span>
                        <div className="h-px bg-white/30 flex-1 max-w-[50px]"></div>
                        <span className="text-xs font-semibold text-white/80 tracking-wider uppercase">
                          STAGE 1
                        </span>
                        <div className="h-px bg-white/30 flex-1 max-w-[50px]"></div>
                        <span className="text-2xl">🎯</span>
                      </div>

                      <h4 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2 leading-tight">
                        Your Personalized 1-Month
                      </h4>
                      <div className="text-2xl md:text-3xl lg:text-4xl font-black text-white mb-3 tracking-wide">
                        TRANSFORMATION KIT
                      </div>

                      <div className="flex items-center justify-center gap-4 text-white/90 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                          <span>Custom Formula</span>
                        </div>
                        <div className="w-px h-4 bg-white/30"></div>
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                          <span>Science-Backed</span>
                        </div>
                        <div className="w-px h-4 bg-white/30"></div>
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                          <span>Lab-Tested</span>
                        </div>
                      </div>
                    </div>
                  </div>

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
                      // This should not appear if our fallback logic above works correctly
                      <div className="text-center p-6 text-gray-500">
                        <p>Loading your personalized recommendations...</p>
                      </div>
                    )}
                  </div>


                </div>

                {/* Right Column - Pricing Summary (Desktop) */}
                <div className="w-full md:w-80">
                  <div className="bg-white border border-[#913177]/20 rounded-lg p-6 md:sticky md:top-4 shadow-lg">
                    {/* Urgency Banner with Live Timer */}
                    <div className={`text-white text-center py-3 px-3 rounded-lg mb-4 border-2 ${
                      timeRemaining <= 0 
                        ? 'bg-gradient-to-r from-gray-500 to-gray-600 border-gray-300' 
                        : timeRemaining < 3600 
                        ? 'bg-gradient-to-r from-red-600 to-red-700 border-red-400 animate-pulse' 
                        : 'bg-gradient-to-r from-red-500 to-red-600 border-red-300'
                    }`}>
                      <div className="text-sm font-bold mb-1">{getUrgencyMessage()}</div>
                      <div className="text-xl font-mono font-black tracking-wider mb-1">
                        {formatTimeRemaining()}
                      </div>
                      <div className="text-xs opacity-90">
                        {timeRemaining <= 0 
                          ? "📞 Call +91 7093619881 for current pricing" 
                          : "💊 Your personalized formula is reserved!"
                        }
                      </div>
                    </div>

                    <div className="text-center mb-6">
                      <div className="text-sm text-[#913177] font-semibold mb-2">🎯 EXCLUSIVELY YOURS</div>
                      <div className="text-lg font-bold text-[#1d0917] mb-1">Your Total Investment</div>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-3xl font-bold text-[#913177]">₹{totalPrice}</span>
                        {originalPrice > totalPrice && (
                          <span className="text-xl text-[#6d6d6e] line-through">₹{originalPrice}</span>
                        )}
                      </div>
                      <div className="text-sm text-[#6d6d6e]">(Inclusive of all taxes)</div>
                      {discountPercentage > 0 && (
                        <div className="bg-gradient-to-r from-[#913177] to-[#b54394] text-white px-3 py-2 rounded-full text-sm font-bold mt-3 inline-block">
                          🔥 SAVE ₹{originalPrice - totalPrice} ({discountPercentage}% OFF)
                        </div>
                      )}

                      {/* Value Proposition */}
                      <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-3 mt-4">
                        <div className="text-sm font-semibold text-green-800">💰 INCREDIBLE VALUE</div>
                        <div className="text-xs text-green-700 mt-1">
                          Regular consultation fee: ₹2000 + Products: ₹{originalPrice} = ₹{originalPrice + 2000}
                        </div>
                        <div className="text-xs text-green-700 font-bold">
                          You pay only: ₹{totalPrice} (Save ₹{originalPrice + 2000 - totalPrice}!)
                        </div>
                      </div>
                    </div>

                    {/* Desktop Buy Now Button */}
                    <Button 
                      onClick={() => {
                        if (buyNowUrl && buyNowUrl !== '#') {
                          // Open in same tab to avoid cart refresh issues
                          window.location.href = buyNowUrl;
                        }
                      }}
                      className="w-full h-14 text-lg font-bold bg-gradient-to-r from-[#913177] to-[#b54394] hover:from-[#7d2b65] hover:to-[#9d3b80] text-white rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 hidden md:block text-center flex items-center justify-center"
                    >
                      Buy Now
                    </Button>



                    {/* Urgency Message */}
                    <div className="text-center mt-3 hidden md:block">
                      <div className={`text-xs font-semibold ${
                        timeRemaining <= 0 
                          ? 'text-gray-600' 
                          : timeRemaining < 3600 
                          ? 'text-red-600 animate-bounce' 
                          : 'text-red-600'
                      }`}>
                        {timeRemaining <= 0 
                          ? "⏰ OFFER EXPIRED" 
                          : `🔥 OFFER EXPIRES IN ${formatTimeRemaining()}`
                        }
                      </div>
                    </div>

                    {/* Features */}
                    <div className="mt-6 space-y-3">
                      {[
                        "👨‍⚕️ FREE expert consultation (Worth ₹2000)",
                        "🚚 Secure & fast delivery (2-3 days)",
                        "📞 24/7 WhatsApp support",
                        "🔬 Lab-tested, certified supplements"
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

          {/* Take Assessment Again */}
          <Card className="mb-6 border-0 shadow-sm bg-white">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-[#1d0917] mb-3">
                Want to Update Your Assessment?
              </h3>
              <p className="text-sm text-[#6d6d6e] mb-4">
                Your health needs change over time. Take the assessment again to get updated recommendations.
              </p>
              <Button 
                onClick={() => window.location.href = '/'}
                className="bg-white border-2 border-[#913177] text-[#913177] hover:bg-[#913177] hover:text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300"
              >
                🔄 Take Assessment Again
              </Button>
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
            <Button 
              onClick={() => {
                if (buyNowUrl && buyNowUrl !== '#') {
                  // Open in same tab to avoid cart refresh issues
                  window.location.href = buyNowUrl;
                }
              }}
              className="px-4 h-12 text-sm font-bold bg-gradient-to-r from-[#913177] to-[#b54394] hover:from-[#7d2b65] hover:to-[#9d3b80] text-white rounded-lg shadow-md flex items-center justify-center"
            >
              Buy Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};