import React, { useEffect, useState, useMemo } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { supabase } from "../../lib/supabase";
import type { QuizResponse, QuizAnswer, Product, Tag, Banner, Expectation } from "../../types/database";
import { TagDisplay } from './TagDisplay'; // Import TagDisplay component
import { ProductDetailModal } from './ProductDetailModal'; // Import ProductDetailModal component
import { useProgressiveSave } from "./useProgressiveSave"; // Import the hook for duplicate prevention
import { runCleanupWithNotification } from '../../utils/cleanupDuplicates';

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
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<Array<{ id: number; question_text: string }>>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [matchedTags, setMatchedTags] = useState<Tag[]>([]); // State to store matched tags
  const [answerKey, setAnswerKey] = useState<any>(null); // State to store the matched answer key
  const [resultId, setResultId] = useState<string>('');
  const [resultUrl, setResultUrl] = useState<string>('');
  const [activeBanner, setActiveBanner] = useState<Banner | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expectations, setExpectations] = useState<Expectation[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Progressive save integration
  const { saveData } = useProgressiveSave();

  // Use a ref to track if we've already initiated a save to prevent multiple calls
  const hasInitiatedSave = React.useRef(false);

  // Function to truncate HTML content and show first 5 lines
  const truncateDescription = (html: string, maxLines: number = 5): string => {
    if (!html) return '';

    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Get text content and split by lines/sentences
    const text = tempDiv.textContent || tempDiv.innerText || '';
    const words = text.split(' ');

    // Approximate 15-20 words per line for truncation
    const wordsPerLine = 15;
    const maxWords = maxLines * wordsPerLine;

    if (words.length <= maxWords) {
      return html;
    }

    // Take first portion of words and add ellipsis
    const truncatedText = words.slice(0, maxWords).join(' ') + '...';
    return truncatedText;
  };

  // Function to handle product view more
  const handleViewMore = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  // Extract user info from answers - improved logic to avoid mismatched data
  const extractedUserInfo = useMemo(() => {
    console.log('=== USER INFO EXTRACTION DEBUG ===');
    console.log('Raw answers:', answers);
    console.log('Raw userInfo:', userInfo);
    console.log('Progressive save data:', saveData);


    // First check if we have progressive save data to use
    let extracted = {
      name: userInfo.name?.trim() || answers.name?.trim() || saveData?.name?.trim() || '',
      email: userInfo.email?.trim() || answers.email?.trim() || saveData?.email?.trim() || '',
      contact: userInfo.contact?.trim() || answers.contact?.trim() || saveData?.contact?.trim() || '',
      age: userInfo.age?.trim() || answers.age?.trim() || (saveData?.age ? saveData.age.toString() : '') || '0'
    };

    // Also check question IDs for contact field (question 3 is typically contact)
    if (!extracted.contact && answers['3']) {
      extracted.contact = answers['3'].trim();
    }
    
    // If contact is still empty, try checking specific keys that might contain contact info
    if (!extracted.contact) {
        for (const key in answers) {
            const value = answers[key];
            if (value && typeof value === 'string') {
                // Check if key suggests contact info
                if (key.toLowerCase().includes('contact') || key.toLowerCase().includes('phone')) {
                    extracted.contact = value.trim();
                    break;
                }
                // Check if value looks like a phone number
                const cleanValue = value.replace(/[\s\-\(\)\+]/g, '');
                if (/^(?:\+?91)?[6-9]\d{9}$/.test(cleanValue)) {
                    extracted.contact = cleanValue.replace(/^\+?91/, '');
                    break;
                }
            }
        }
    }

    console.log('Initial extracted info:', extracted);

    // Enhanced validation with detailed error messages
    const missingFields = [];
    if (!extracted.name || extracted.name.length < 2) {
      missingFields.push('name');
    }
    if (!extracted.email || !extracted.email.includes('@')) {
      missingFields.push('email');
    }
    
    // More flexible contact validation
    let contactForValidation = '';
    if (extracted.contact) {
      contactForValidation = extracted.contact
        .replace(/^\+?91/, '')
        .replace(/[\s\-\(\)]/g, '')
        .trim();
    }
    
    if (!contactForValidation || !/^[6-9]\d{9}$/.test(contactForValidation)) {
      missingFields.push('contact');
    }
    
    if (!extracted.age || extracted.age === '0' || parseInt(extracted.age) < 1) {
      missingFields.push('age');
    }

    console.log('Validation check:', missingFields);

    // If we have progressive save data but validation fails, use the saved data anyway
    if (missingFields.length > 0 && saveData?.responseId) {
      console.log('Using progressive save data despite validation warnings');
      extracted = {
        name: saveData.name || extracted.name || 'User',
        email: saveData.email || extracted.email || 'user@example.com',
        contact: saveData.contact || extracted.contact || '9999999999',
        age: saveData.age ? saveData.age.toString() : extracted.age || '25'
      };
      // Clear missing fields since we're using saved data
      missingFields.length = 0;
    } else if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      console.log('All available answers:', answers);
      console.log('All available userInfo:', userInfo);
      console.log('Progressive save data:', saveData);
    }


    // Fallback to direct key matching and content-based detection if data is still missing
    if (!extracted.name || !extracted.email || !extracted.contact || extracted.age === '0') {
      console.log('Running fallback extraction methods...');

      // Map question IDs to field types based on database structure if available
      const questionMappings: Record<string, string> = {};
      if (questions.length > 0) {
        questions.forEach(q => {
          const text = q.question_text.toLowerCase();
          if (text.includes('name')) questionMappings[q.id.toString()] = 'name';
          else if (text.includes('email')) questionMappings[q.id.toString()] = 'email';
          else if (text.includes('contact') || text.includes('phone')) questionMappings[q.id.toString()] = 'contact';
          else if (text.includes('age')) questionMappings[q.id.toString()] = 'age';
        });
      }

      // Prioritize direct key matches and question mappings
      const answerEntries = Object.entries(answers);
      answerEntries.forEach(([key, value]) => {
        if (!value || typeof value !== 'string' || !value.trim()) return;
        const cleanValue = value.trim();

        // Use question mapping
        const fieldType = questionMappings[key];
        if (fieldType === 'name' && !extracted.name) extracted.name = cleanValue;
        else if (fieldType === 'email' && !extracted.email) extracted.email = cleanValue;
        else if (fieldType === 'contact' && !extracted.contact) extracted.contact = cleanValue.replace(/^\+91/, '').trim();
        else if (fieldType === 'age' && (!extracted.age || extracted.age === '0')) extracted.age = cleanValue;

        // Fallback to legacy key matching
        else if ((key === '1' || key === 'name') && !extracted.name) extracted.name = cleanValue;
        else if ((key === '2' || key === 'email') && !extracted.email) extracted.email = cleanValue;
        else if ((key === '3' || key === 'contact') && !extracted.contact) extracted.contact = cleanValue.replace(/^\+91/, '').trim();
        else if ((key === '4' || key === 'age') && (!extracted.age || extracted.age === '0')) extracted.age = cleanValue;
      });

      // Content-based detection for remaining empty fields
      if (!extracted.email || !extracted.contact || !extracted.name || extracted.age === '0') {
        const sortedAnswers = answerEntries.sort((a, b) => {
          const aNum = parseInt(a[0]) || 999;
          const bNum = parseInt(b[0]) || 999;
          return aNum - bNum;
        });

        sortedAnswers.forEach(([key, value]) => {
          if (!value || typeof value !== 'string' || !value.trim()) return;
          const cleanValue = value.trim();

          if (!extracted.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanValue)) {
            extracted.email = cleanValue;
          } else if (!extracted.contact && /^(\+91)?[6-9]\d{9}$/.test(cleanValue.replace(/\s+/g, ''))) {
            extracted.contact = cleanValue.replace(/^\+91/, '').replace(/\s+/g, '').trim();
          } else if ((!extracted.age || extracted.age === '0') && /^\d{1,3}$/.test(cleanValue)) {
            const ageNum = parseInt(cleanValue);
            if (ageNum > 0 && ageNum <= 120) extracted.age = cleanValue;
          } else if (!extracted.name && cleanValue.length >= 2 && /^[a-zA-Z][a-zA-Z\s\.]*$/.test(cleanValue) &&
                     !cleanValue.includes('@') && !cleanValue.includes('+') && !/\d/.test(cleanValue) &&
                     !['Male', 'Female', 'Other', 'Yes', 'No', 'male', 'female', 'other', 'yes', 'no'].includes(cleanValue.toLowerCase())) {
            extracted.name = cleanValue;
          }
        });
      }
    }

    console.log('Final extracted info:', extracted);
    return extracted;
  }, [userInfo, answers, questions, saveData]);


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
        setQuestions(fetchedQuestions || []); // Ensure questions are set in state
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
      const allSelectedOptionIds: number[] = []; // Store IDs of selected options

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
        allSelectedOptionIds.push(selectedOption.id); // Store the selected option ID

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

      // Get all tags for the matched options
      const { data: optionTagsData } = await supabase
        .from('option_tags')
        .select('tag_id')
        .in('option_id', allSelectedOptionIds);

      if (!optionTagsData) {
        console.log('No option tags found');
        await setFallbackProducts();
        return;
      }

      const selectedTagIds = [...new Set(optionTagsData.map(ot => ot.tag_id))];
      console.log('Selected tag IDs:', selectedTagIds);

      // Fetch the actual tag data to display
      const { data: tagsData } = await supabase
        .from('tags')
        .select('*')
        .in('id', selectedTagIds);

      if (tagsData) {
        setMatchedTags(tagsData); // Set the fetched tags to the state
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

  // Function to fetch active banner
  const fetchActiveBanner = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setActiveBanner(data);
      } else if (error) {
        console.error('Error fetching banner:', error);
      }
    } catch (error) {
      console.error('Exception fetching active banner:', error);
    }
  };

  // Function to fetch expectations
  const fetchExpectations = async () => {
    try {
      const { data, error } = await supabase
        .from('expectations')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (!error && data) {
        setExpectations(data);
      } else if (error) {
        console.error('Error fetching expectations:', error);
      }
    } catch (error) {
      console.error('Exception fetching expectations:', error);
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
      } else if (error) {
        console.error('Error fetching database fallback products:', error);
      }
    } catch (error) {
      console.error('Exception fetching database fallback products:', error);
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
      const contactForValidation = extractedUserInfo?.contact?.replace(/^\+91/, '').replace(/\s+/g, '') || '';
      if (!contactForValidation.trim() || !/^[6-9]\d{9}$/.test(contactForValidation)) {
        missingFields.push('contact');
        console.error('Contact validation failed:', extractedUserInfo?.contact, 'cleaned:', contactForValidation);
      }
      if (!extractedUserInfo?.age?.trim() || extractedUserInfo.age === '0' || parseInt(extractedUserInfo.age) < 1) {
        missingFields.push('age');
        console.error('Age validation failed:', extractedUserInfo?.age);
      }

      // Skip validation if we're viewing existing results or have progressive save data
      if (missingFields.length > 0 && !isViewingExistingResults && !saveData?.responseId) {
        console.error('Missing required fields:', missingFields);
        throw new Error(`Missing required fields: ${missingFields.join(', ')}. Please ensure all personal information questions are answered correctly.`);
      } else if (missingFields.length > 0) {
        console.log('Skipping validation due to existing results or progressive save');
      }

      // If we have progressive save data, don't create a new response
      if (saveData?.responseId) {
        console.log('Progressive save response exists, skipping new response creation');
        const uniqueResultId = `${saveData.responseId}-${Date.now()}`;
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

        setIsSubmitted(true);
        return; // Exit early, no need to save again
      }

      // Additional validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(extractedUserInfo.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Clean the contact number for validation - remove +91 prefix and any spaces
      const cleanedContact = extractedUserInfo.contact.replace(/^\+91/, '').replace(/\s+/g, '');
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(cleanedContact)) {
        throw new Error('Please enter a valid 10-digit phone number');
      }

      const age = parseInt(extractedUserInfo.age);
      if (isNaN(age) || age < 1 || age > 120) {
        throw new Error('Please enter a valid age between 1 and 120');
      }

      // Check if we have a progressive save response to update
      let responseData;
      if (saveData?.responseId) {
        console.log('Updating existing progressive response to completed...');
        const updateData = {
          name: extractedUserInfo.name.trim(),
          email: extractedUserInfo.email.trim(),
          contact: extractedUserInfo.contact.trim(),
          age: parseInt(extractedUserInfo.age.toString()) || 0,
          status: 'completed'
        };

        const { data: updatedResponse, error: updateError } = await supabase
          .from('quiz_responses')
          .update(updateData)
          .eq('id', saveData.responseId)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating quiz response:', updateError);
          throw new Error(`Failed to update quiz response: ${updateError.message}`);
        }

        responseData = updatedResponse;
        console.log('Quiz response updated successfully:', responseData);
      } else {
        // Fallback: create new response if no progressive save exists
        console.log('Creating new quiz response...');
        const insertData = {
          name: extractedUserInfo.name.trim(),
          email: extractedUserInfo.email.trim(),
          contact: extractedUserInfo.contact.trim(),
          age: parseInt(extractedUserInfo.age.toString()) || 0,
          status: 'completed'
        };

        const { data: newResponse, error: responseError } = await supabase
          .from('quiz_responses')
          .insert(insertData)
          .select()
          .single();

        if (responseError) {
          console.error('Error saving quiz response:', responseError);
          throw new Error(`Failed to save quiz response: ${responseError.message}`);
        }

        responseData = newResponse;
        console.log('Quiz response created successfully:', responseData);
      }

      // Generate unique result id and URL
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

      // Save quiz answers
      const validAnswers = Object.entries(answers)
        .filter(([key, value]) => {
          if (key.includes('_details') || !value || value.trim() === '') {
            return false;
          }
          return true;
        });

      if (validAnswers.length > 0) {
        // Fetch questions from the database to map answers correctly
        const { data: fetchedQuestions, error: questionsError } = await supabase
          .from('questions')
          .select('id, question_text')
          .eq('status', 'active')
          .order('order_index');

        if (!questionsError && fetchedQuestions) {
          setQuestions(fetchedQuestions);

          const answersToInsert = [];

          // Handle file upload if there's a selected file
          let uploadedFileUrl = null;
          if (selectedFile) {
            try {
              const fileExt = selectedFile.name.split('.').pop();
              const fileName = `${responseData.id}_${Date.now()}.${fileExt}`;

              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('quiz-files')
                .upload(fileName, selectedFile);

              if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage
                  .from('quiz-files')
                  .getPublicUrl(fileName);
                uploadedFileUrl = publicUrl;
              }
            } catch (error) {
              console.error('Error in file upload process:', error);
            }
          }

          // Save quiz answers
          for (const [answerKey, answer] of Object.entries(answers)) {
            if (answerKey.includes('_details') || !answer || String(answer).trim() === '') {
              continue;
            }

            let actualQuestionId = null;
            const directQuestionId = parseInt(answerKey);

            if (!isNaN(directQuestionId)) {
              const question = fetchedQuestions.find(q => q.id === directQuestionId);
              if (question) {
                actualQuestionId = question.id;
              }
            }

            if (!actualQuestionId) {
              console.warn(`Could not map answer key "${answerKey}" to any question. Skipping.`);
              continue;
            }

            const answerText = String(answer).trim();
            let additionalInfo = null;
            let fileUrl = null;

            const detailsKey = `${answerKey}_details`;
            if (answers[detailsKey]) {
              additionalInfo = String(answers[detailsKey]).substring(0, 1000);
            }

            const question = fetchedQuestions.find(q => q.id === actualQuestionId);
            if (question) {
              const questionTextLower = question.question_text.toLowerCase();
              const shouldAttachFile = answerKey === 'blood_test' || 
                                     answerKey === '16' ||
                                     questionTextLower.includes('blood test') ||
                                     questionTextLower.includes('upload') ||
                                     questionTextLower.includes('file');

              if (shouldAttachFile && uploadedFileUrl) {
                fileUrl = uploadedFileUrl;
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

          if (answersToInsert.length > 0) {
            const { error: answersError } = await supabase
              .from('quiz_answers')
              .insert(answersToInsert);

            if (answersError) {
              console.error('Error saving quiz answers:', answersError);
              throw new Error(`Failed to save quiz answers: ${answersError.message}`);
            }
          }
        }
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error in saveResponses:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      alert(`There was an error saving your quiz response: ${error instanceof Error ? error.message : 'Unknown error'}. Please check that all required fields are filled and try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to clean up duplicate responses
  const cleanupDuplicateResponses = async () => {
    try {
      const userEmail = extractedUserInfo?.email?.trim();
      if (!userEmail) return;

      const { data: duplicates, error: findError } = await supabase
        .from('quiz_responses')
        .select('id, created_at')
        .eq('email', userEmail)
        .order('created_at', { ascending: false });

      if (findError) {
        console.error('Error finding duplicates:', findError);
        return;
      }

      if (duplicates && duplicates.length > 1) {
        const toDelete = duplicates.slice(1).map(d => d.id);

        const { error: deleteError } = await supabase
          .from('quiz_responses')
          .delete()
          .in('id', toDelete);

        if (deleteError) {
          console.error('Error deleting duplicates:', deleteError);
        } else {
          console.log('Successfully cleaned up duplicate responses');
        }
      }
    } catch (error) {
      console.error('Error in cleanup:', error);
    }
  };

  // Main data loading effect
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('=== QUIZ RESULTS LOADING START ===');
        console.log('Is viewing existing results:', isViewingExistingResults);
        console.log('Progressive save data:', saveData);

        // If viewing existing results, just load the content
        if (isViewingExistingResults) {
          console.log('Loading data for existing results...');

          // Load questions first
          const { data: fetchedQuestions, error: questionsError } = await supabase
            .from('questions')
            .select('id, question_text')
            .eq('status', 'active')
            .order('order_index');

          if (!questionsError && fetchedQuestions) {
            setQuestions(fetchedQuestions);
          }

          // Load all data in parallel
          await Promise.allSettled([
            getRecommendedProducts(),
            fetchActiveBanner(),
            fetchExpectations(),
            cleanupDuplicateResponses()
          ]);

          setIsSubmitted(true);
          setIsLoading(false);
          return;
        }

        // For new quiz submissions
        const hasProgressiveResponse = saveData?.responseId && saveData.responseId > 0;

        if (hasProgressiveResponse && !hasInitiatedSave.current) {
          console.log('Progressive save response found, checking if already completed...');
          hasInitiatedSave.current = true;

          // Check if the progressive response is already completed
          const { data: responseStatus, error: statusError } = await supabase
            .from('quiz_responses')
            .select('status')
            .eq('id', saveData.responseId)
            .single();

          if (!statusError && responseStatus?.status === 'completed') {
            console.log('Progressive response already completed, skipping save...');
          } else {
            console.log('Progressive response not completed, updating status...');
            // Update the status to completed if it's still partial
            const { error: updateError } = await supabase
              .from('quiz_responses')
              .update({ status: 'completed' })
              .eq('id', saveData.responseId);

            if (updateError) {
              console.error('Error updating response status:', updateError);
            }
          }

          await Promise.allSettled([
            getRecommendedProducts(),
            fetchActiveBanner(),
            fetchExpectations(),
            cleanupDuplicateResponses()
          ]);

          setIsSubmitted(true);
        } else if (!hasProgressiveResponse && !hasInitiatedSave.current) {
          console.log('No progressive response found, creating new submission...');
          hasInitiatedSave.current = true;

          await cleanupDuplicateResponses();
          await saveResponses();

          await Promise.allSettled([
            getRecommendedProducts(),
            fetchActiveBanner(),
            fetchExpectations()
          ]);
        }

      } catch (error) {
        console.error('Error loading quiz results:', error);
        setError(error instanceof Error ? error.message : 'Failed to load results');

        // Load fallback data
        await Promise.allSettled([
          setFallbackProducts(),
          fetchActiveBanner(),
          fetchExpectations()
        ]);

        setIsSubmitted(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isViewingExistingResults, saveData?.responseId]);

  // Scroll to top when component loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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

  // Helper function for description preview
  const getDescriptionPreview = (html: string | null | undefined) => {
    if (!html) return 'A unique blend of natural ingredients to support your health goals.';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    return text.substring(0, 200) + (text.length > 200 ? '...' : '');
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#913177] mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-[#1d0917] mb-2">Analyzing Your Results</h2>
          <p className="text-gray-600">Creating your personalized recommendations...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-[#1d0917] mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-[#913177] text-white hover:bg-[#7d2b65]"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logo */}
      <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-center items-center">
            <div className="text-center">
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
      <div className="container mx-auto px-4 py-6 pb-24 md:pb-8 pt-20 md:pt-16">
        <div className="max-w-4xl mx-auto">

          {/* Compact Assessment Report Card */}
          <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-[#913177] to-[#b54394] text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
            <CardContent className="p-4 md:p-6 relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                {/* Left side - Welcome & Icon */}
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-white/80 text-xs md:text-sm font-medium">Assessment Complete</div>
                    <h2 className="text-lg md:text-2xl font-bold text-white">
                      Hello {extractedUserInfo?.name || 'User'}!
                    </h2>
                  </div>
                </div>

                {/* Right side - Health Analysis */}
                <div className="flex-1 bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm md:text-base font-semibold text-white mb-1">Your Personalized Health Analysis</h3>
                      <p className="text-white/90 text-xs md:text-sm leading-relaxed">
                        Based on your responses, we've created a targeted supplement plan to address your nutritional gaps and lifestyle factors for optimal wellness.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Banner Display */}
          {activeBanner && (
            <div className="mb-6">
              <img 
                src={activeBanner.image_url} 
                alt={activeBanner.name}
                className="w-full h-auto rounded-lg shadow-sm"
                onError={(e) => {
                  console.error('Banner image failed to load:', activeBanner.image_url);
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Your Key Health Focus Areas Section */}
          {matchedTags.length > 0 && (
            <Card className="mb-6 border-0 shadow-sm overflow-hidden" style={{backgroundColor: '#f0f8ff'}}>
              <CardContent className="p-6 md:p-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-[#1d0917] mb-3">
                    Your Key Health Focus Areas
                  </h2>
                  <p className="text-gray-600 text-sm md:text-base">
                    Based on your responses, we've identified these priority areas for your wellness journey
                  </p>
                </div>

                {/* Horizontal Scrolling Tags Container */}
                <div className="relative">
                  {/* Desktop scroll indicator - only show when scrolling is needed */}
                  {matchedTags.length > 4 && (
                    <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        Scroll
                      </div>
                    </div>
                  )}

                  {/* Scrollable tags container */}
                  <div className={`${matchedTags.length > 4 ? 'overflow-x-auto' : 'overflow-hidden'} pb-4 scrollbar-hide`}>
                    <div className={`flex gap-4 md:gap-6 px-1 ${matchedTags.length <= 4 ? 'justify-center' : ''}`} style={matchedTags.length > 4 ? { minWidth: 'max-content' } : {}}>
                      {matchedTags.map((tag, index) => {
                        // Generate gradient colors for each tag
                        const gradients = [
                          'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                          'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                          'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                          'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                          'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                          'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                          'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
                        ];

                        const tagGradient = gradients[index % gradients.length];

                        return (
                          <div
                            key={tag.id}
                            className="flex-shrink-0 group cursor-pointer transform hover:scale-105 transition-all duration-300"
                          >
                            <div 
                              className="w-28 h-28 md:w-32 md:h-32 rounded-2xl p-4 md:p-5 flex flex-col items-center justify-center text-white shadow-lg relative overflow-hidden"
                              style={{ background: tagGradient }}
                            >
                              {/* Background decoration */}
                              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8"></div>
                              <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/5 rounded-full -ml-6 -mb-6"></div>

                              {/* Icon container with proper SVG handling */}
                              <div className="w-10 h-10 md:w-12 md:h-12 mb-2 md:mb-3 flex items-center justify-center relative z-10">
                                {tag.icon_url ? (
                                  <div className="w-full h-full">
                                    <img
                                      src={tag.icon_url}
                                      alt={`${tag.name} icon`}
                                      className="w-full h-full object-contain filter brightness-0 invert"
                                      style={{
                                        filter: 'brightness(0) saturate(100%) invert(100%)'
                                      }}
                                      onError={(e) => {
                                        console.error('Tag icon failed to load:', tag.icon_url);
                                        // Fallback to default icon if image fails
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const fallbackIcon = target.nextElementSibling as HTMLElement;
                                        if (fallbackIcon) {
                                          fallbackIcon.style.display = 'block';
                                        }
                                      }}
                                    />
                                    {/* Fallback icon (hidden by default) */}
                                    <svg 
                                      className="w-full h-full text-white hidden" 
                                      fill="none" 
                                      stroke="currentColor" 
                                      viewBox="0 0 24 24"
                                    >
                                      <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={2} 
                                        d="M13 10V3L4 14h7v7l9-11h-7z" 
                                      />
                                    </svg>
                                  </div>
                                ) : (
                                  // Default icon if no icon_url
                                  <svg 
                                    className="w-full h-full text-white" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round" 
                                      strokeWidth={2} 
                                      d="M13 10V3L4 14h7v7l9-11h-7z" 
                                    />
                                  </svg>
                                )}
                              </div>

                              {/* Tag name */}
                              <div className="text-xs md:text-sm font-semibold text-center leading-tight relative z-10">
                                {tag.name}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mobile scroll indicator - only show when needed */}
                  {matchedTags.length > 2 && (
                    <div className="md:hidden flex justify-center mt-3">
                      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        Swipe to see more
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products Section with New Design */}
          <Card className="mb-6 border-0 shadow-sm bg-white">
            <CardContent className="p-6 md:p-8">
              <div className="text-center mb-8">
                <h1 className="[font-family:'DM_Serif_Display',Helvetica] text-4xl font-normal text-[#1d0917] mb-4">
                  Your Personalized Results
                </h1>
                <p className="text-lg text-gray-600 mb-6">
                  Based on your responses, here are our recommendations for you
                </p>
              </div>

              {/* Product Cards Row with Scrolling Indicators */}
              <div className="mb-8 relative">
                {recommendedProducts.length > 0 ? (
                  <div className="relative">
                    {/* Scrolling indicator for desktop - only show when needed */}
                    {recommendedProducts.length > 3 && (
                      <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 right-4 z-10 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-lg">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                          Scroll
                        </div>
                      </div>
                    )}

                    <div className="overflow-x-auto pb-4 scrollbar-hide">
                      <div className={`flex gap-4 md:gap-6 ${recommendedProducts.length <= 2 ? 'justify-center' : ''}`} style={recommendedProducts.length > 2 ? { minWidth: 'max-content' } : {}}>
                        {recommendedProducts.map((product, index) => (
                          <div 
                            key={product.id} 
                            className="flex-shrink-0 bg-white rounded-xl shadow-lg overflow-hidden w-64 sm:w-72 md:w-80 border border-gray-100"
                          >
                            {/* Product Image - 1:1 Aspect Ratio - Clickable */}
                            <div 
                              className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => handleViewMore(product)}
                            >
                              <img
                                src={product.image_url || "https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=400"}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=400";
                                }}
                              />
                            </div>

                            {/* Product Info */}
                            <div className="p-6 bg-white">
                              <h3 className="text-lg font-bold text-[#1d0917] mb-3">
                                {product.name}
                              </h3>
                              {/* Description */}
                              <div className="text-gray-600 text-sm mb-4">
                                {getDescriptionPreview(product.description)}
                                {product.description && product.description.length > 200 && (
                                  <button
                                    onClick={() => handleViewMore(product)}
                                    className="text-[#913177] hover:text-[#7a2a66] ml-1 underline"
                                  >
                                    View More
                                  </button>
                                )}
                              </div>

                              {/* Price */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-[#913177]">
                                    ₹{product.srp || product.mrp || '999'}
                                  </span>
                                  {product.mrp && product.srp && product.mrp > product.srp && (
                                    <span className="text-sm text-gray-500 line-through">
                                      ₹{product.mrp}
                                    </span>
                                  )}
                                </div>
                                <button 
                                  onClick={() => handleViewMore(product)}
                                  className="text-[#913177] font-semibold text-sm hover:text-[#7d2b65] transition-colors flex items-center gap-1"
                                >
                                  View more
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mobile scrolling indicator - only show when needed */}
                    {recommendedProducts.length > 2 && (
                      <div className="md:hidden flex justify-center mt-3">
                        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                          Swipe to see more
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-6 text-gray-500">
                    <p>Loading your personalized recommendations...</p>
                  </div>
                )}
              </div>

              {/* Pricing and Buy Now Section */}
              <div className="max-w-2xl mx-auto">
                {/* Total Price Summary */}
                <div>
                  <div className="bg-gradient-to-r from-[#f8f4f7] to-[#fff4fc] rounded-xl p-6 text-center">
                    <div className="text-4xl font-bold text-[#913177] mb-2">
                      ₹{totalPrice}
                      {originalPrice > totalPrice && (
                        <span className="text-2xl text-gray-500 line-through ml-3">₹{originalPrice}</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">MRP incl. of all taxes</div>
                    <div className="text-sm text-[#913177] font-medium mb-3">
                      2 months diet + exercise plan included with this package
                    </div>
                    {discountPercentage > 0 && (
                      <div className="text-lg font-bold text-[#913177] mb-6">
                        🔥 SAVE ₹{originalPrice - totalPrice} ({discountPercentage}% OFF)
                      </div>
                    )}
                    <Button 
                      onClick={() => {
                        if (buyNowUrl && buyNowUrl !== '#') {
                          window.location.href = buyNowUrl;
                        }
                      }}
                      className="w-full max-w-lg h-16 text-xl font-bold bg-gradient-to-r from-[#913177] to-[#b54394] hover:from-[#7d2b65] hover:to-[#9d3b80] text-white rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300"
                    >
                      Buy Now
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What's in your kit Section */}
          <Card className="mb-6 border-0 shadow-sm" style={{backgroundColor: '#E6EEFC'}}>
            <CardContent className="p-6 md:p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-[#1d0917] mb-8">
                  What's in your kit?
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                  {/* 2 months nutrition plan */}
                  <div className="bg-[#f8f9fa] rounded-xl p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <img 
                        src="https://cdn.shopify.com/s/files/1/0707/7766/7749/files/Orange.svg?v=1756607641" 
                        alt="Orange icon" 
                        className="w-6 h-6"
                        style={{ filter: 'brightness(0) saturate(100%) invert(26%) sepia(47%) saturate(1434%) hue-rotate(298deg) brightness(96%) contrast(96%)' }}
                        onError={(e) => {
                          console.error('Orange icon failed to load from CDN');
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallbackIcon = target.nextElementSibling as HTMLElement;
                          if (fallbackIcon) fallbackIcon.style.display = 'block';
                        }}
                      />
                      {/* Fallback SVG icon */}
                      <svg 
                        className="w-6 h-6 text-[#913177] hidden" 
                        fill="currentColor" 
                        viewBox="0 0 256 256"
                      >
                        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm44.49-116.49a12,12,0,0,1,0,17l-32,32a12,12,0,0,1-17,0l-16-16a12,12,0,1,1,17-17L132,123l23.51-23.52A12,12,0,0,1,172.49,99.51Z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-[#1d0917] font-medium">2 months nutrition plan</div>
                    </div>
                  </div>

                  {/* Personalised diet chart */}
                  <div className="bg-[#f8f9fa] rounded-xl p-6 flex items-center gap-4 relative">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <img 
                        src="https://cdn.shopify.com/s/files/1/0707/7766/7749/files/NotePencil.svg?v=1756607642" 
                        alt="Note pencil icon" 
                        className="w-6 h-6"
                        style={{ filter: 'brightness(0) saturate(100%) invert(26%) sepia(47%) saturate(1434%) hue-rotate(298deg) brightness(96%) contrast(96%)' }}
                        onError={(e) => {
                          console.error('NotePencil icon failed to load from CDN');
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallbackIcon = target.nextElementSibling as HTMLElement;
                          if (fallbackIcon) fallbackIcon.style.display = 'block';
                        }}
                      />
                      {/* Fallback SVG icon */}
                      <svg 
                        className="w-6 h-6 text-[#913177] hidden" 
                        fill="currentColor" 
                        viewBox="0 0 256 256"
                      >
                        <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64,24,84.68Z" />
                      </svg>
                    </div>
                    <div className="text-left flex-1">
                      <div className="text-[#1d0917] font-medium">Personalised diet chart</div>
                    </div>
                    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                      FREE
                    </div>
                  </div>

                  {/* Expert made exercise plan */}
                  <div className="bg-[#f8f9fa] rounded-xl p-6 flex items-center gap-4 relative">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <img 
                        src="https://cdn.shopify.com/s/files/1/0707/7766/7749/files/Barbell.svg?v=1756607640" 
                        alt="Barbell icon" 
                        className="w-6 h-6"
                        style={{ filter: 'brightness(0) saturate(100%) invert(26%) sepia(47%) saturate(1434%) hue-rotate(298deg) brightness(96%) contrast(96%)' }}
                        onError={(e) => {
                          console.error('Barbell icon failed to load from CDN');
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallbackIcon = target.nextElementSibling as HTMLElement;
                          if (fallbackIcon) fallbackIcon.style.display = 'block';
                        }}
                      />
                      {/* Fallback SVG icon */}
                      <svg 
                        className="w-6 h-6 text-[#913177] hidden" 
                        fill="currentColor" 
                        viewBox="0 0 256 256"
                      >
                        <path d="M248,120v16a8,8,0,0,1-8,8H224v24a16,16,0,0,1-16,16H192a16,16,0,0,1-16-16V144H80v24a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V144H16a8,8,0,0,1-8-8V120a8,8,0,0,1,8-8H32V88A16,16,0,0,1,48,72H64A16,16,0,0,1,80,88v24h96V88a16,16,0,0,1,16-16h16a16,16,0,0,1,16,16v24h16A8,8,0,0,1,248,120ZM64,88v80H48V88Zm144,80V88h16v80Z" />
                      </svg>
                    </div>
                    <div className="text-left flex-1">
                      <div className="text-[#1d0917] font-medium">Expert made exercise plan</div>
                    </div>
                    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                      FREE
                    </div>
                  </div>

                  {/* NutraSage support */}
                  <div className="bg-[#f8f9fa] rounded-xl p-6 flex items-center gap-4 relative">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <img 
                        src="https://cdn.shopify.com/s/files/1/0707/7766/7749/files/Headset.svg?v=1756607640" 
                        alt="Headset icon" 
                        className="w-6 h-6"
                        style={{ filter: 'brightness(0) saturate(100%) invert(26%) sepia(47%) saturate(1434%) hue-rotate(298deg) brightness(96%) contrast(96%)' }}
                        onError={(e) => {
                          console.error('Headset icon failed to load from CDN');
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallbackIcon = target.nextElementSibling as HTMLElement;
                          if (fallbackIcon) fallbackIcon.style.display = 'block';
                        }}
                      />
                      {/* Fallback SVG icon */}
                      <svg 
                        className="w-6 h-6 text-[#913177] hidden" 
                        fill="currentColor" 
                        viewBox="0 0 256 256"
                      >
                        <path d="M232,128v40a16,16,0,0,1-16,16H200a16,16,0,0,1-16-16V136a8,8,0,0,0-8-8H128a8,8,0,0,1,0-16h48a24,24,0,0,1,24,24v32h16V128A80,80,0,0,0,56,128v40h16V136a24,24,0,0,1,24-24h48a8,8,0,0,1,0,16H96a8,8,0,0,1-8,8v32a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V128a96,96,0,0,1,192,0Z" />
                      </svg>
                    </div>
                    <div className="text-left flex-1">
                      <div className="text-[#1d0917] font-medium">NutraSage support</div>
                    </div>
                    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                      FREE
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What can you expect Section */}
          <Card className="mb-6 border-0 shadow-sm bg-white">
            <CardContent className="p-6 md:p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-[#1d0917] mb-8">
                  What can you expect?
                </h2>

                {expectations.length > 0 ? (
                  <>
                    {/* Desktop Layout - Vertical stacked */}
                    <div className="hidden md:block max-w-4xl mx-auto space-y-4">
                      {expectations.map((expectation, index) => {
                        const backgroundColors = ['#F1ECD7', '#F3F6E3', '#F1ECD7'];
                        const backgroundColor = backgroundColors[index % backgroundColors.length];

                        return (
                          <div key={expectation.id} className="rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg group">
                            <div 
                              className="relative"
                              style={{ backgroundColor }}
                            >
                              {/* Full width image that changes on hover */}
                              <div className="relative h-48 md:h-56 overflow-hidden">
                                <img 
                                  src={expectation.image_url}
                                  alt={expectation.title}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=400";
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all duration-300"></div>
                              </div>

                              {/* Text content - always visible */}
                              <div className="p-6">
                                <h3 className="text-lg md:text-xl font-bold text-[#1d0917] mb-3">{expectation.title}</h3>
                                <p className="text-[#6d6d6e] text-sm md:text-base leading-relaxed">
                                  {expectation.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Mobile Layout - Horizontal scroll with 1.5 cards visible */}
                    <div className="md:hidden">
                      <div className="overflow-x-auto pb-4 scrollbar-hide px-4">
                        <div className="flex gap-4">
                          {expectations.map((expectation, index) => {
                            const backgroundColors = ['#F1ECD7', '#F3F6E3', '#F1ECD7'];
                            const backgroundColor = backgroundColors[index % backgroundColors.length];

                            return (
                              <div key={expectation.id} className="flex-shrink-0 w-[calc(70vw)] rounded-xl overflow-hidden" style={{ backgroundColor }}>
                                <div className="relative h-48 overflow-hidden">
                                  <img 
                                    src={expectation.image_url}
                                    alt={expectation.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=400";
                                    }}
                                  />
                                </div>
                                <div className="p-4">
                                  <h3 className="text-lg font-bold text-[#1d0917] mb-2">{expectation.title}</h3>
                                  <p className="text-[#6d6d6e] text-sm leading-relaxed">
                                    {expectation.description}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Mobile scroll indicator */}
                      {expectations.length > 1 && (
                        <div className="flex justify-center mt-3">
                          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                            Swipe to see more
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 text-gray-500">
                    <p>Loading expectations...</p>
                  </div>
                )}
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
            {/* Debug cleanup button - remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4">
                <Button 
                  onClick={() => runCleanupWithNotification(extractedUserInfo?.email)}
                  className="bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded text-xs"
                >
                  🧹 Clean Duplicates (Debug)
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Sticky Buy Now Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#913177]/20 p-3 md:hidden z-50">
          {/* Free extras callout */}
          <div className="text-center mb-3 bg-gradient-to-r from-[#e8f4fd] to-[#f0f8ff] rounded-lg p-2 border border-[#913177]/20">
            <div className="text-[#913177] font-bold text-xs mb-1">🎁 FREE INCLUDED</div>
            <div className="text-[#1d0917] text-xs">2 months diet + exercise plan included with this package</div>
          </div>

          <div className="flex items-center justify-between mb-4">
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
                  window.location.href = buyNowUrl;
                }
              }}
              className="px-6 h-14 text-base font-bold bg-gradient-to-r from-[#913177] to-[#b54394] hover:from-[#7d2b65] hover:to-[#9d3b80] text-white rounded-xl shadow-lg flex items-center justify-center"
            >
              🛒 Buy Now
            </Button>
          </div>
        </div>

        {/* Product Detail Modal */}
        <ProductDetailModal
          isOpen={isModalOpen}
          product={selectedProduct}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProduct(null);
          }}
        />
      </div>
    </div>
  );
};