import create from 'zustand';
import { supabase } from '../lib/supabase';
import type { Question, QuestionOption, Tag, Product, OptionTag } from '../types/database';

interface AdminStore {
  // State
  questions: Question[];
  options: QuestionOption[];
  tags: Tag[];
  products: Product[];
  optionTags: OptionTag[];
  loading: boolean;
  error: string | null;

  // Question methods
  fetchQuestions: () => Promise<void>;
  addQuestion: (question: Omit<Question, 'id'>) => Promise<void>;
  updateQuestion: (id: number, updates: Partial<Question>) => Promise<void>;
  deleteQuestion: (id: number) => Promise<void>;
  reorderQuestions: (questions: Question[]) => Promise<void>;

  // Option methods
  fetchOptions: () => Promise<void>;
  addOption: (option: Omit<QuestionOption, 'id'>) => Promise<void>;
  updateOption: (id: number, updates: Partial<QuestionOption>) => Promise<void>;
  deleteOption: (id: number) => Promise<void>;

  // Tag methods
  fetchTags: () => Promise<void>;
  addTag: (name: string) => Promise<void>;
  deleteTag: (id: number) => Promise<void>;

  // Product methods
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateProduct: (id: number, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;

  // Option Tags methods
  fetchOptionTags: () => Promise<void>;
  updateOptionTags: (optionId: number, tagIds: number[]) => Promise<void>;

  // Question Tags methods (deprecated - moved to options)
  fetchQuestionTags: () => Promise<void>;
  addQuestionTag: (questionId: number, tagId: number) => Promise<void>;
  removeQuestionTag: (questionId: number, tagId: number) => Promise<void>;
  updateQuestionTags: (questionId: number, tagIds: number[]) => Promise<void>;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  // Initial state
  questions: [],
  options: [],
  tags: [],
  products: [],
  optionTags: [],
  loading: false,
  error: null,

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

  fetchProducts: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_tags (
            tag_id,
            tags (
              id,
              name
            )
          )
        `)
        .order('name');

      if (error) throw error;
      set({ products: data });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  addQuestion: async (question) => {
    try {
      const { error } = await supabase
        .from('questions')
        .insert([question]);

      if (error) throw error;
      await get().fetchQuestions();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateQuestion: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('questions')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await get().fetchQuestions();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteQuestion: async (id) => {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await get().fetchQuestions();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  addOption: async (option) => {
    try {
      const { error } = await supabase
        .from('question_options')
        .insert([option]);

      if (error) throw error;
      await get().fetchOptions();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateOption: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('question_options')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await get().fetchOptions();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteOption: async (id) => {
    try {
      const { error } = await supabase
        .from('question_options')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await get().fetchOptions();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  addTag: async (name) => {
    try {
      const { error } = await supabase
        .from('tags')
        .insert([{ name }]);

      if (error) throw error;
      await get().fetchTags();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteTag: async (id) => {
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await get().fetchTags();
    } catch (error) {
      set({ error: (error as Error).message });
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

      set({ 
        products: get().products.filter(p => p.id !== id) 
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // Option Tags methods
  fetchOptionTags: async () => {
    try {
      const { data, error } = await supabase
        .from('option_tags')
        .select('*');

      if (error) throw error;
      set({ optionTags: data });
    } catch (error) {
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
  }
}));