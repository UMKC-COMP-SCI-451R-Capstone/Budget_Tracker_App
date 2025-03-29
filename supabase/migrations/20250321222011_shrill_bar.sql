/*
  # Initial Schema for Expense Tracker

  1. New Tables
    - users (managed by Supabase Auth)
    - categories
      - id (uuid, primary key)
      - name (text)
      - type (text)
      - user_id (uuid, foreign key)
      - created_at (timestamp)
    - expenses
      - id (uuid, primary key)
      - amount (decimal)
      - category_id (uuid, foreign key)
      - date (date)
      - description (text)
      - payment_method (text)
      - receipt_url (text, optional)
      - tags (text array)
      - user_id (uuid, foreign key)
      - created_at (timestamp)
    - budgets
      - id (uuid, primary key)
      - category_id (uuid, foreign key)
      - amount (decimal)
      - start_date (date)
      - end_date (date)
      - user_id (uuid, foreign key)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(name, user_id)
);

-- Create expenses table
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount decimal NOT NULL CHECK (amount > 0),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  description text,
  payment_method text,
  receipt_url text,
  tags text[],
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create budgets table
CREATE TABLE budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  amount decimal NOT NULL CHECK (amount > 0),
  start_date date NOT NULL,
  end_date date NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CHECK (start_date <= end_date)
);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own expenses"
  ON expenses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own budgets"
  ON budgets
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert default categories
INSERT INTO categories (name, type, user_id)
VALUES 
  ('Food & Dining', 'expense', NULL),
  ('Transportation', 'expense', NULL),
  ('Shopping', 'expense', NULL),
  ('Entertainment', 'expense', NULL),
  ('Bills & Utilities', 'expense', NULL),
  ('Health & Medical', 'expense', NULL),
  ('Travel', 'expense', NULL),
  ('Education', 'expense', NULL),
  ('Income', 'income', NULL);