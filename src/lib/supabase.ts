import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Category = {
  id: string;
  name: string;
  type: string;
  user_id: string | null;
  created_at: string;
};

export type Expense = {
  id: string;
  amount: number;
  category_id: string;
  date: string;
  description: string;
  payment_method: string;
  receipt_url?: string;
  tags: string[];
  user_id: string;
  created_at: string;
};

export type Budget = {
  id: string;
  category_id: string;
  amount: number;
  start_date: string;
  end_date: string;
  user_id: string;
  created_at: string;
};

export type Account = {
  id: string;
  user_id: string;
  name: string;
  type: 'cash' | 'paypal' | 'crypto' | 'visa' | 'debit';
  account_number: string;
  balance: number;
  created_at: string;
  updated_at: string;
};