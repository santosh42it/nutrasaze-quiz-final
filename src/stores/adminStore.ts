import create from 'zustand';
import { db } from '../lib/supabase';
import type { Question, QuestionOption, Tag, Product } from '../types/database';

interface AdminStore {
  questions: Question[];
  options: QuestionOption[];
  tags: Tag[];
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchQuestions: () => Promise<void>;
  fetchOptions: () => Promise<void>;
  fetchTags: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  addQuestion: (question: Omit<Question, 'id'>) => Promise<void>;
  updateQuestion: (id: number, updates: Partial<Question>) => Promise<void>;
  deleteQuestion: (id: number) => Promise<void>;
  reorderQuestions: (questions: Question[]) => Promise<void>;
  addOption: (option: Omit<QuestionOption, 'id'>) => Promise<void>;
  updateOption: (id: number, updates: Partial<QuestionOption>) => Promise<void>;
  deleteOption: (id: number) => Promise<void>;
  addTag: (name: string) => Promise<void>;
  deleteTag: (id: number) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: number, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  questions: [],
  options: [],
  tags: [],
  products: [],
  loading: false,
  error: null,

  fetchQuestions: async () => {
    set({ loading: true, error: null });
    try {
      console.log('Fetching questions from database...');
      const { data, error } = await db.from('questions').select('*');

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Questions fetched:', data?.length || 0);
      const sortedQuestions = (data || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      set({ questions: sortedQuestions });
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error('Error fetching questions:', errorMessage);
      set({ error: errorMessage });
    } finally {
      set({ loading: false });
    }
  },

  reorderQuestions: async (reorderedQuestions: Question[]) => {
    try {
      // Update local state immediately for smooth UI
      set({ questions: reorderedQuestions });

      // Update each question's order_index in the database
      for (let i = 0; i < reorderedQuestions.length; i++) {
        const { error } = await db.from('questions')
          .update({ order_index: i })
          .eq('id', reorderedQuestions[i].id);

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
      const { data, error } = await db.from('question_options').select('*');

      if (error) throw error;
      const sortedOptions = (data || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      set({ options: sortedOptions });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchTags: async () => {
    set({ loading: true });
    try {
      const { data, error } = await db.from('tags').select('*');

      if (error) throw error;
      set({ tags: data || [] });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchProducts: async () => {
    set({ loading: true });
    try {
      const { data, error } = await db.from('products').select('*');

      if (error) throw error;
      set({ products: data || [] });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  addQuestion: async (question) => {
    try {
      const { error } = await db.from('questions').insert([question]);

      if (error) throw error;
      await get().fetchQuestions();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateQuestion: async (id, updates) => {
    try {
      const { error } = await db.from('questions').update(updates).eq('id', id);

      if (error) throw error;
      await get().fetchQuestions();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteQuestion: async (id) => {
    try {
      const { error } = await db.from('questions').delete().eq('id', id);

      if (error) throw error;
      await get().fetchQuestions();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  addOption: async (option) => {
    try {
      const { error } = await db.from('question_options').insert([option]);

      if (error) throw error;
      await get().fetchOptions();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateOption: async (id, updates) => {
    try {
      const { error } = await db.from('question_options').update(updates).eq('id', id);

      if (error) throw error;
      await get().fetchOptions();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteOption: async (id) => {
    try {
      const { error } = await db.from('question_options').delete().eq('id', id);

      if (error) throw error;
      await get().fetchOptions();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  addTag: async (name) => {
    try {
      const { error } = await db.from('tags').insert([{ name }]);

      if (error) throw error;
      await get().fetchTags();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteTag: async (id) => {
    try {
      const { error } = await db.from('tags').delete().eq('id', id);

      if (error) throw error;
      await get().fetchTags();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  addProduct: async (product) => {
    try {
      const { error } = await db.from('products').insert([product]);

      if (error) throw error;
      await get().fetchProducts();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateProduct: async (id, updates) => {
    try {
      const { error } = await db.from('products').update(updates).eq('id', id);

      if (error) throw error;
      await get().fetchProducts();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteProduct: async (id) => {
    try {
      const { error } = await db.from('products').delete().eq('id', id);

      if (error) throw error;
      await get().fetchProducts();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
}));