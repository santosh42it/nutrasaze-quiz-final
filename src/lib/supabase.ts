
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Check if we're using Replit PostgreSQL
const replicaDatabaseUrl = import.meta.env.VITE_DATABASE_URL || process.env.DATABASE_URL;
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Determine which database to use
const useReplicaDB = replicaDatabaseUrl && replicaDatabaseUrl !== 'placeholder';
const hasValidSupabaseCredentials = supabaseUrl !== 'https://placeholder.supabase.co' && supabaseAnonKey !== 'placeholder-key';

console.log('Database Config:', {
  useReplicaDB,
  hasValidSupabaseCredentials,
  replicaDatabaseUrl: !!replicaDatabaseUrl
});

// Create Supabase client (fallback for auth and if no PostgreSQL)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public'
  }
});

// PostgreSQL direct connection function
const executeQuery = async (query: string, params: any[] = []) => {
  if (!useReplicaDB) {
    throw new Error('PostgreSQL database not configured');
  }

  try {
    const response = await fetch('/api/db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, params }),
    });

    if (!response.ok) {
      throw new Error(`Database query failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Database operations wrapper
export const db = {
  from: (table: string) => ({
    select: async (columns = '*') => {
      if (useReplicaDB) {
        const result = await executeQuery(`SELECT ${columns} FROM ${table}`);
        return { data: result.rows, error: null };
      } else if (hasValidSupabaseCredentials) {
        return await supabase.from(table).select(columns);
      } else {
        return { data: null, error: new Error('No database configured') };
      }
    },
    insert: async (data: any) => {
      if (useReplicaDB) {
        const columns = Object.keys(data[0] || data).join(', ');
        const values = Array.isArray(data) ? data : [data];
        const placeholders = values.map((_, i) => 
          `(${Object.keys(values[0]).map((_, j) => `$${i * Object.keys(values[0]).length + j + 1}`).join(', ')})`
        ).join(', ');
        const flatValues = values.flatMap(v => Object.values(v));
        
        const result = await executeQuery(
          `INSERT INTO ${table} (${columns}) VALUES ${placeholders} RETURNING *`,
          flatValues
        );
        return { data: result.rows, error: null };
      } else if (hasValidSupabaseCredentials) {
        return await supabase.from(table).insert(data);
      } else {
        return { data: null, error: new Error('No database configured') };
      }
    },
    update: (data: any) => ({
      eq: async (column: string, value: any) => {
        if (useReplicaDB) {
          const setPart = Object.keys(data).map((key, i) => `${key} = $${i + 1}`).join(', ');
          const result = await executeQuery(
            `UPDATE ${table} SET ${setPart} WHERE ${column} = $${Object.keys(data).length + 1} RETURNING *`,
            [...Object.values(data), value]
          );
          return { data: result.rows, error: null };
        } else if (hasValidSupabaseCredentials) {
          return await supabase.from(table).update(data).eq(column, value);
        } else {
          return { data: null, error: new Error('No database configured') };
        }
      }
    }),
    delete: () => ({
      eq: async (column: string, value: any) => {
        if (useReplicaDB) {
          const result = await executeQuery(
            `DELETE FROM ${table} WHERE ${column} = $1 RETURNING *`,
            [value]
          );
          return { data: result.rows, error: null };
        } else if (hasValidSupabaseCredentials) {
          return await supabase.from(table).delete().eq(column, value);
        } else {
          return { data: null, error: new Error('No database configured') };
        }
      }
    })
  })
};

// Setup database function
export const setupDatabase = async () => {
  try {
    console.log('Setting up database tables...');

    const queries = [
      `CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        question_text TEXT NOT NULL,
        question_type VARCHAR(50) NOT NULL DEFAULT 'text',
        placeholder TEXT,
        has_text_area BOOLEAN DEFAULT false,
        has_file_upload BOOLEAN DEFAULT false,
        order_index INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );`,
      
      `CREATE TABLE IF NOT EXISTS question_options (
        id SERIAL PRIMARY KEY,
        question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
        option_text TEXT NOT NULL,
        option_value TEXT,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );`,
      
      `CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );`,
      
      `CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        image_url TEXT,
        price DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );`,
      
      `CREATE TABLE IF NOT EXISTS quiz_responses (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        contact TEXT NOT NULL,
        age INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );`,
      
      `CREATE TABLE IF NOT EXISTS quiz_answers (
        id SERIAL PRIMARY KEY,
        response_id INTEGER REFERENCES quiz_responses(id) ON DELETE CASCADE,
        question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
        answer_text TEXT NOT NULL,
        additional_info TEXT,
        file_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );`
    ];

    for (const query of queries) {
      if (useReplicaDB) {
        await executeQuery(query);
      } else if (hasValidSupabaseCredentials) {
        await supabase.rpc('exec', { sql: query });
      }
    }

    // Insert sample questions if none exist
    const { data: existingQuestions } = await db.from('questions').select('count(*)');
    
    if (!existingQuestions || existingQuestions.length === 0) {
      await db.from('questions').insert([
        {
          question_text: 'What is your name?',
          question_type: 'text',
          placeholder: 'Enter your full name',
          order_index: 0,
          status: 'active'
        },
        {
          question_text: 'What is your email?',
          question_type: 'email',
          placeholder: 'Enter your email address',
          order_index: 1,
          status: 'active'
        },
        {
          question_text: 'What is your contact number?',
          question_type: 'tel',
          placeholder: 'Enter your phone number',
          order_index: 2,
          status: 'active'
        },
        {
          question_text: 'What is your age?',
          question_type: 'number',
          placeholder: 'Enter your age',
          order_index: 3,
          status: 'active'
        }
      ]);
    }

    console.log('Database setup completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Database setup failed:', error);
    return { success: false, error };
  }
};

// Test database connection
export const testConnection = async () => {
  try {
    const { data, error } = await db.from('questions').select('count(*)');
    return { connected: !error, error };
  } catch (error) {
    return { connected: false, error };
  }
};

// Create admin user function (only for Supabase)
export const createAdminUser = async () => {
  if (!hasValidSupabaseCredentials) {
    return { data: null, error: 'Supabase not configured for auth' };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'admin@nutrasage.com',
      password: 'nutrasage@123'
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};
