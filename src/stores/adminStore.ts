import create from 'zustand';
import { supabase } from '../lib/supabase';
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
        .select('*')
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

  deleteProduct: async (id) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await get().fetchProducts();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
}));