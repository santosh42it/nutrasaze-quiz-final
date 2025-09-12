import create from 'zustand';
import { supabase } from '../lib/supabase';
import type { Question, QuestionOption, Tag, Product, AnswerKey, Expectation, OptionTag } from '../types/database';

// Response types
interface QuizResponse {
  id: string;
  name: string;
  email: string;
  contact: string;
  age: number;
  status: 'partial' | 'completed';
  created_at: string;
  updated_at: string;
}

interface DetailedResponse extends QuizResponse {
  answers?: any[];
}

interface ResponseFilters {
  status: 'all' | 'completed' | 'partial';
  search: string;
  dateFrom?: string;
  dateTo?: string;
  showDuplicatesOnly?: boolean;
}

interface ResponsesPagination {
  hasMore: boolean;
  cursor?: string;
  pageSize: number;
}

interface AdminStore {
  // State
  questions: Question[];
  options: QuestionOption[];
  tags: Tag[];
  products: Product[];
  optionTags: OptionTag[];
  questionTags: any[]; // Added for question tag management
  answerKeys: AnswerKey[]; // Added for answer key management
  loading: boolean;
  error: string | null;
  expectations: Expectation[];

  // Responses state
  responses: QuizResponse[];
  responsesLoading: boolean;
  responsesError: string | null;
  responsesPagination: ResponsesPagination;
  responsesFilters: ResponseFilters;
  responsesTotalCount: number;
  selectedResponses: Set<string>;
  bulkActionLoading: boolean;

  // Question methods
  fetchQuestions: () => Promise<void>;
  addQuestion: (question: Omit<Question, 'id'>) => Promise<{ data: Question | null; error: Error | null }>;
  updateQuestion: (id: number, updates: Partial<Question>) => Promise<{ data: Question | null; error: Error | null }>;
  deleteQuestion: (id: number) => Promise<void>;
  reorderQuestions: (questions: Question[]) => Promise<void>;

  // Option methods
  fetchOptions: () => Promise<void>;
  addOption: (option: Omit<QuestionOption, 'id'>) => Promise<{ data: QuestionOption | null; error: Error | null }>;
  updateOption: (id: number, updates: Partial<QuestionOption>) => Promise<{ data: QuestionOption | null; error: Error | null }>;
  deleteOption: (id: number) => Promise<void>;

  // Tag methods
  fetchTags: () => Promise<void>;
  addTag: (name: string, icon_url?: string, title?: string) => Promise<void>;
  updateTag: (id: number, name: string, icon_url?: string, title?: string) => Promise<void>;
  deleteTag: (id: number) => Promise<void>;

  // Product methods
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateProduct: (id: number, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;

  // Option Tags methods
  fetchOptionTags: () => Promise<void>;
  updateOptionTags: (optionId: number, tagIds: number[]) => Promise<void>;

  // Answer Key methods
  fetchAnswerKeys: () => Promise<void>;
  addAnswerKey: (answerKey: Partial<AnswerKey>) => Promise<void>;
  updateAnswerKey: (id: number, updates: Partial<AnswerKey>) => Promise<void>;
  deleteAnswerKey: (id: number) => Promise<void>;

  // Question Tags methods (deprecated - moved to options)
  fetchQuestionTags: () => Promise<void>;
  addQuestionTag: (questionId: number, tagId: number) => Promise<void>;
  removeQuestionTag: (questionId: number, tagId: number) => Promise<void>;
  updateQuestionTags: (questionId: number, tagIds: number[]) => Promise<void>;

  // Expectation methods
  fetchExpectations: () => Promise<void>;
  addExpectation: (expectation: Omit<Expectation, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateExpectation: (id: number, updates: Partial<Expectation>) => Promise<void>;
  deleteExpectation: (id: number) => Promise<void>;
  reorderExpectations: (expectations: Expectation[]) => Promise<void>;

  // Responses methods
  fetchResponses: (reset?: boolean) => Promise<void>;
  loadMoreResponses: () => Promise<void>;
  refreshResponses: () => Promise<void>;
  setResponsesFilters: (filters: Partial<ResponseFilters>) => void;
  clearResponsesFilters: () => void;
  setResponsesPageSize: (size: number) => void;
  getResponsesTotalCount: () => Promise<void>;
  
  // Bulk operations
  toggleResponseSelection: (id: string) => void;
  selectAllResponses: () => void;
  clearResponseSelection: () => void;
  bulkDeleteResponses: (ids: string[]) => Promise<void>;
  
  // Export
  exportResponsesCSV: () => Promise<void>;
  
  // Individual response operations
  deleteResponse: (id: string) => Promise<void>;
  getResponseDetails: (id: string) => Promise<DetailedResponse | null>;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  // Initial state
  questions: [],
  options: [],
  tags: [],
  products: [],
  optionTags: [],
  questionTags: [], // Initialize questionTags state
  answerKeys: [], // Initialize answerKeys state
  loading: false,
  error: null,
  expectations: [],

  // Responses initial state
  responses: [],
  responsesLoading: false,
  responsesError: null,
  responsesPagination: {
    hasMore: true,
    cursor: undefined,
    pageSize: 25
  },
  responsesFilters: {
    status: 'all',
    search: '',
    dateFrom: undefined,
    dateTo: undefined,
    showDuplicatesOnly: false
  },
  responsesTotalCount: 0,
  selectedResponses: new Set<string>(),
  bulkActionLoading: false,

  fetchQuestions: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('order_index');

      if (error) throw error;
      set({ questions: data });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  addQuestion: async (question: Omit<Question, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .insert([question])
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        questions: [...state.questions, data]
      }));

      return { data, error: null };
    } catch (error) {
      console.error('Error adding question:', error);
      return { data: null, error: error as Error };
    }
  },

  updateQuestion: async (id: number, updates: Partial<Question>) => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        questions: state.questions.map(question => 
          question.id === id ? { ...question, ...data } : question
        )
      }));

      return { data, error: null };
    } catch (error) {
      console.error('Error updating question:', error);
      return { data: null, error: error as Error };
    }
  },

  deleteQuestion: async (id: number) => {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        questions: state.questions.filter(question => question.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting question:', error);
      throw error;
    }
  },

  reorderQuestions: async (reorderedQuestions: Question[]) => {
    try {
      // Update local state immediately for smooth UI
      set({ questions: reorderedQuestions });

      // Update each question's order_index in the database
      const updates = reorderedQuestions.map((question, index) => ({
        id: question.id,
        order_index: index
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('questions')
          .update({ order_index: update.order_index })
          .eq('id', update.id);

        if (error) throw error;
      }
    } catch (error) {
      // Revert to original order on error
      get().fetchQuestions();
      set({ error: (error as Error).message });
    }
  },

  fetchOptions: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('question_options')
        .select('*')
        .order('order_index');

      if (error) throw error;
      set({ options: data });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  addOption: async (option: Partial<QuestionOption>) => {
    try {
      const { data, error } = await supabase
        .from('question_options')
        .insert([option])
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        options: [...state.options, data]
      }));

      return { data, error: null };
    } catch (error) {
      console.error('Error adding option:', error);
      return { data: null, error: error as Error };
    }
  },

  updateOption: async (id: number, updates: Partial<QuestionOption>) => {
    try {
      const { data, error } = await supabase
        .from('question_options')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        options: state.options.map(option => 
          option.id === id ? { ...option, ...data } : option
        )
      }));

      return { data, error: null };
    } catch (error) {
      console.error('Error updating option:', error);
      return { data: null, error: error as Error };
    }
  },

  deleteOption: async (id: number) => {
    try {
      const { error } = await supabase
        .from('question_options')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        options: state.options.filter(option => option.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting option:', error);
      throw error;
    }
  },

  fetchTags: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;
      set({ tags: data });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  addTag: async (name: string, icon_url?: string, title?: string) => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .insert([{ 
          name: name.trim(), 
          icon_url: icon_url?.trim() || null,
          title: title?.trim() || null
        }])
        .select()
        .single();

      if (error) throw error;

      set({ tags: [...get().tags, data] });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateTag: async (id: number, name: string, icon_url?: string, title?: string) => {
    try {
      const { error } = await supabase
        .from('tags')
        .update({ 
          name: name.trim(), 
          icon_url: icon_url?.trim() || null,
          title: title?.trim() || null
        })
        .eq('id', id);

      if (error) throw error;

      set({ 
        tags: get().tags.map(tag => tag.id === id ? { ...tag, name, icon_url, title } : tag)
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteTag: async (id: number) => {
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        tags: state.tags.filter(tag => tag.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting tag:', error);
      set({ error: (error as Error).message });
    }
  },

  fetchProducts: async () => {
    set({ loading: true });
    try {
      console.log('Fetching products from database...');

      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, image_url, url, mrp, srp, shopify_variant_id, is_active, created_at, updated_at')
        .order('created_at', { ascending: false });

      console.log('Products query result:', { data, error });

      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }

      console.log('Products fetched successfully:', data?.length || 0);
      set({ products: data || [] });
    } catch (error) {
      console.error('Products fetch error:', error);
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  addProduct: async (product) => {
    try {
      const { error } = await supabase
        .from('products')
        .insert([product]);

      if (error) throw error;
      await get().fetchProducts();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateProduct: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await get().fetchProducts();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteProduct: async (id: number) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        products: state.products.filter(product => product.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  // Option Tags methods
  fetchOptionTags: async () => {
    try {
      const { data, error } = await supabase
        .from('option_tags')
        .select('option_id, tag_id')
        .order('option_id');

      if (error) throw error;
      set({ optionTags: data || [] });
    } catch (error) {
      console.error('Error fetching option tags:', error);
      set({ error: (error as Error).message });
    }
  },

  updateOptionTags: async (optionId: number, tagIds: number[]) => {
    try {
      // Remove existing tags for this option
      const { error: deleteError } = await supabase
        .from('option_tags')
        .delete()
        .eq('option_id', optionId);

      if (deleteError) throw deleteError;

      // Add new tags
      if (tagIds.length > 0) {
        const optionTags = tagIds.map(tagId => ({
          option_id: optionId,
          tag_id: tagId
        }));

        const { data, error: insertError } = await supabase
          .from('option_tags')
          .insert(optionTags)
          .select();

        if (insertError) throw insertError;

        // Update local state
        set({ 
          optionTags: [
            ...get().optionTags.filter(ot => ot.option_id !== optionId),
            ...data
          ]
        });
      } else {
        // Just remove from local state if no tags
        set({ 
          optionTags: get().optionTags.filter(ot => ot.option_id !== optionId)
        });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // Answer Key methods
  fetchAnswerKeys: async () => {
    try {
      const { data, error } = await supabase
        .from('answer_key')
        .select('*')
        .order('tag_combination');

      if (error) throw error;
      set({ answerKeys: data || [] });
    } catch (error) {
      console.error('Error fetching answer keys:', error);
    }
  },

  addAnswerKey: async (answerKey: Partial<AnswerKey>) => {
    try {
      const { data, error } = await supabase
        .from('answer_key')
        .insert([answerKey])
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        answerKeys: [...state.answerKeys, data]
      }));
    } catch (error) {
      console.error('Error adding answer key:', error);
      throw error;
    }
  },

  updateAnswerKey: async (id: number, updates: Partial<AnswerKey>) => {
    try {
      const { data, error } = await supabase
        .from('answer_key')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        answerKeys: state.answerKeys.map(answerKey => 
          answerKey.id === id ? data : answerKey
        )
      }));
    } catch (error) {
      console.error('Error updating answer key:', error);
      throw error;
    }
  },

  deleteAnswerKey: async (id: number) => {
    try {
      const { error } = await supabase
        .from('answer_key')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        answerKeys: state.answerKeys.filter(answerKey => answerKey.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting answer key:', error);
      throw error;
    }
  },

  // Question Tags methods
  fetchQuestionTags: async () => {
    try {
      const { data, error } = await supabase
        .from('question_tags')
        .select('*');

      if (error) throw error;
      set({ questionTags: data });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  addQuestionTag: async (questionId: number, tagId: number) => {
    try {
      const { data, error } = await supabase
        .from('question_tags')
        .insert({ question_id: questionId, tag_id: tagId })
        .select()
        .single();

      if (error) throw error;

      set({ 
        questionTags: [...get().questionTags, data] 
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  removeQuestionTag: async (questionId: number, tagId: number) => {
    try {
      const { error } = await supabase
        .from('question_tags')
        .delete()
        .eq('question_id', questionId)
        .eq('tag_id', tagId);

      if (error) throw error;

      set({ 
        questionTags: get().questionTags.filter(
          qt => !(qt.question_id === questionId && qt.tag_id === tagId)
        ) 
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateQuestionTags: async (questionId: number, tagIds: number[]) => {
    try {
      // Remove existing tags for this question
      const { error: deleteError } = await supabase
        .from('question_tags')
        .delete()
        .eq('question_id', questionId);

      if (deleteError) throw deleteError;

      // Add new tags
      if (tagIds.length > 0) {
        const questionTags = tagIds.map(tagId => ({
          question_id: questionId,
          tag_id: tagId
        }));

        const { data, error: insertError } = await supabase
          .from('question_tags')
          .insert(questionTags)
          .select();

        if (insertError) throw insertError;

        // Update local state
        set({ 
          questionTags: [
            ...get().questionTags.filter(qt => qt.question_id !== questionId),
            ...data
          ]
        });
      } else {
        // Just remove from local state if no tags
        set({ 
          questionTags: get().questionTags.filter(qt => qt.question_id !== questionId)
        });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  fetchExpectations: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('expectations')
        .select('*')
        .order('order_index');

      if (error) throw error;
      set({ expectations: data });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  addExpectation: async (expectation) => {
    try {
      const { error } = await supabase
        .from('expectations')
        .insert([expectation]);

      if (error) throw error;
      await get().fetchExpectations();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateExpectation: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('expectations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await get().fetchExpectations();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteExpectation: async (id: number) => {
    try {
      const { error } = await supabase
        .from('expectations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        expectations: state.expectations.filter(expectation => expectation.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting expectation:', error);
      throw error;
    }
  },

  reorderExpectations: async (reorderedExpectations: Expectation[]) => {
    try {
      // Update local state immediately for smooth UI
      set({ expectations: reorderedExpectations });

      // Update each expectation's order_index in the database
      const updates = reorderedExpectations.map((expectation, index) => ({
        id: expectation.id,
        order_index: index
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('expectations')
          .update({ order_index: update.order_index })
          .eq('id', update.id);

        if (error) throw error;
      }
    } catch (error) {
      // Revert to original order on error
      get().fetchExpectations();
      set({ error: (error as Error).message });
    }
  },

  // ===== RESPONSES METHODS =====

  fetchResponses: async (reset = false) => {
    const state = get();
    
    try {
      set({ responsesLoading: true, responsesError: null });

      if (reset) {
        set({ 
          responses: [], 
          responsesPagination: { ...state.responsesPagination, cursor: undefined, hasMore: true },
          selectedResponses: new Set<string>()
        });
      }

      // Build query with filters
      let query = supabase
        .from('quiz_responses')
        .select('id, name, email, contact, age, status, created_at, updated_at')
        .order('created_at', { ascending: false });

      // Apply filters
      const { responsesFilters, responsesPagination } = get();
      
      if (responsesFilters.status !== 'all') {
        query = query.eq('status', responsesFilters.status);
      }

      if (responsesFilters.dateFrom) {
        query = query.gte('created_at', responsesFilters.dateFrom + 'T00:00:00');
      }
      if (responsesFilters.dateTo) {
        query = query.lte('created_at', responsesFilters.dateTo + 'T23:59:59');
      }

      // Search filter
      if (responsesFilters.search.trim()) {
        const searchTerm = responsesFilters.search.trim();
        query = query.or(
          `name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,contact.ilike.%${searchTerm}%`
        );
      }

      // Keyset pagination
      if (responsesPagination.cursor) {
        query = query.lt('created_at', responsesPagination.cursor);
      }

      query = query.limit(responsesPagination.pageSize);

      const { data, error } = await query;

      if (error) throw error;

      const responses = data || [];
      const hasMore = responses.length === responsesPagination.pageSize;
      const newCursor = responses.length > 0 ? responses[responses.length - 1].created_at : undefined;

      set(state => ({
        responses: reset ? responses : [...state.responses, ...responses],
        responsesPagination: {
          ...state.responsesPagination,
          hasMore,
          cursor: newCursor
        }
      }));

      // Fetch total count if reset or first load
      if (reset || state.responses.length === 0) {
        get().getResponsesTotalCount();
      }

    } catch (error) {
      console.error('Error fetching responses:', error);
      set({ responsesError: (error as Error).message });
    } finally {
      set({ responsesLoading: false });
    }
  },

  loadMoreResponses: async () => {
    const { responsesPagination } = get();
    if (!responsesPagination.hasMore) return;
    
    await get().fetchResponses(false);
  },

  refreshResponses: async () => {
    await get().fetchResponses(true);
  },

  setResponsesFilters: (filters: Partial<ResponseFilters>) => {
    set(state => ({
      responsesFilters: { ...state.responsesFilters, ...filters }
    }));
    // Auto-refresh with new filters
    setTimeout(() => get().fetchResponses(true), 100);
  },

  clearResponsesFilters: () => {
    set({
      responsesFilters: {
        status: 'all',
        search: '',
        dateFrom: undefined,
        dateTo: undefined,
        showDuplicatesOnly: false
      }
    });
    get().fetchResponses(true);
  },

  setResponsesPageSize: (size: number) => {
    set(state => ({
      responsesPagination: { ...state.responsesPagination, pageSize: size }
    }));
    get().fetchResponses(true);
  },

  getResponsesTotalCount: async () => {
    try {
      const { responsesFilters } = get();
      
      let query = supabase
        .from('quiz_responses')
        .select('id', { count: 'exact', head: true });

      // Apply same filters as main query
      if (responsesFilters.status !== 'all') {
        query = query.eq('status', responsesFilters.status);
      }

      if (responsesFilters.dateFrom) {
        query = query.gte('created_at', responsesFilters.dateFrom + 'T00:00:00');
      }
      if (responsesFilters.dateTo) {
        query = query.lte('created_at', responsesFilters.dateTo + 'T23:59:59');
      }

      if (responsesFilters.search.trim()) {
        const searchTerm = responsesFilters.search.trim();
        query = query.or(
          `name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,contact.ilike.%${searchTerm}%`
        );
      }

      const { count, error } = await query;

      if (error) throw error;

      set({ responsesTotalCount: count || 0 });
    } catch (error) {
      console.error('Error getting total count:', error);
    }
  },

  // Bulk operations
  toggleResponseSelection: (id: string) => {
    set(state => {
      const newSelection = new Set(state.selectedResponses);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return { selectedResponses: newSelection };
    });
  },

  selectAllResponses: () => {
    set(state => ({
      selectedResponses: new Set(state.responses.map(r => r.id))
    }));
  },

  clearResponseSelection: () => {
    set({ selectedResponses: new Set<string>() });
  },

  bulkDeleteResponses: async (ids: string[]) => {
    try {
      set({ bulkActionLoading: true });

      const { error } = await supabase
        .from('quiz_responses')
        .delete()
        .in('id', ids);

      if (error) throw error;

      // Update local state
      set(state => ({
        responses: state.responses.filter(r => !ids.includes(r.id)),
        selectedResponses: new Set<string>(),
        responsesTotalCount: Math.max(0, state.responsesTotalCount - ids.length)
      }));

    } catch (error) {
      console.error('Error bulk deleting responses:', error);
      set({ responsesError: (error as Error).message });
      throw error;
    } finally {
      set({ bulkActionLoading: false });
    }
  },

  exportResponsesCSV: async () => {
    try {
      set({ responsesLoading: true });
      
      const { responsesFilters } = get();
      
      // Fetch all responses matching current filters
      let query = supabase
        .from('quiz_responses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5000); // Cap at 5k for performance

      // Apply same filters
      if (responsesFilters.status !== 'all') {
        query = query.eq('status', responsesFilters.status);
      }

      if (responsesFilters.dateFrom) {
        query = query.gte('created_at', responsesFilters.dateFrom + 'T00:00:00');
      }
      if (responsesFilters.dateTo) {
        query = query.lte('created_at', responsesFilters.dateTo + 'T23:59:59');
      }

      if (responsesFilters.search.trim()) {
        const searchTerm = responsesFilters.search.trim();
        query = query.or(
          `name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,contact.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      // Generate CSV
      const csvContent = [
        // Headers
        ['ID', 'Name', 'Email', 'Contact', 'Age', 'Status', 'Created At', 'Updated At'].join(','),
        // Data rows
        ...(data || []).map(response => [
          response.id,
          `"${(response.name || '').replace(/"/g, '""')}"`,
          `"${(response.email || '').replace(/"/g, '""')}"`,
          `"${(response.contact || '').replace(/"/g, '""')}"`,
          response.age || '',
          response.status || '',
          response.created_at || '',
          response.updated_at || ''
        ].join(','))
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `quiz_responses_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

    } catch (error) {
      console.error('Error exporting CSV:', error);
      set({ responsesError: (error as Error).message });
      throw error;
    } finally {
      set({ responsesLoading: false });
    }
  },

  deleteResponse: async (id: string) => {
    try {
      const { error } = await supabase
        .from('quiz_responses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      set(state => ({
        responses: state.responses.filter(r => r.id !== id),
        selectedResponses: new Set([...state.selectedResponses].filter(selectedId => selectedId !== id)),
        responsesTotalCount: Math.max(0, state.responsesTotalCount - 1)
      }));

    } catch (error) {
      console.error('Error deleting response:', error);
      throw error;
    }
  },

  getResponseDetails: async (id: string) => {
    try {
      // Get response details
      const { data: response, error: responseError } = await supabase
        .from('quiz_responses')
        .select('*')
        .eq('id', id)
        .single();

      if (responseError) throw responseError;

      // Get answers with question text, ordered by question order_index
      const { data: answers, error: answersError } = await supabase
        .from('quiz_answers')
        .select(`
          *,
          questions (question_text, order_index)
        `)
        .eq('response_id', id)
        .order('question_id');

      if (answersError) {
        console.error('Error fetching answers:', answersError);
      }

      return {
        ...response,
        answers: answers || []
      } as DetailedResponse;

    } catch (error) {
      console.error('Error fetching response details:', error);
      return null;
    }
  }
}));