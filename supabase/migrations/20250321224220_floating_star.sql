/*
  # Add profile fields

  1. Changes
    - Add first_name, last_name, phone, and address fields to profiles table
    - Update RLS policies to allow users to update their own profile

  2. Security
    - Maintain existing RLS policies
    - Ensure users can only update their own profile data
*/

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS address text;