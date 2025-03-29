/*
  # Add RLS policies for profiles table

  1. Security
    - Enable RLS on profiles table if not already enabled
    - Add policies for authenticated users to:
      - Read their own profile
      - Update their own profile
      - Insert their own profile
    
  Note: Uses DO blocks to safely check for existing policies
*/

-- Enable RLS (idempotent)
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;

-- Safely create policies using DO blocks
DO $$
BEGIN
    -- Create read policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can read own profile'
    ) THEN
        CREATE POLICY "Users can read own profile"
        ON profiles
        FOR SELECT
        TO authenticated
        USING (auth.uid() = id);
    END IF;

    -- Create update policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile"
        ON profiles
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);
    END IF;

    -- Create insert policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can insert own profile'
    ) THEN
        CREATE POLICY "Users can insert own profile"
        ON profiles
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = id);
    END IF;
END
$$;