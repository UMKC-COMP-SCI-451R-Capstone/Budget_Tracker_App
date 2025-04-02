/*
  Add account_id to expenses table to track which account is associated with each expense
  This will allow automatic updating of account balances when expenses are created, updated, or deleted
*/

-- Add the account_id column to the expenses table
ALTER TABLE expenses
ADD COLUMN account_id uuid REFERENCES accounts(id);

-- Create an index on account_id to improve query performance
CREATE INDEX IF NOT EXISTS expenses_account_id_idx ON expenses(account_id);

-- Comment on the column to document its purpose
COMMENT ON COLUMN expenses.account_id IS 'The account associated with this expense - balance will be updated when expenses are created or modified'; 

-- Set a default account for existing expenses
-- This function will set the first account for each user as the default account for their expenses
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT DISTINCT e.user_id 
    FROM expenses e 
    WHERE e.account_id IS NULL
  ) LOOP
    -- Get the first account for this user
    WITH first_account AS (
      SELECT id 
      FROM accounts 
      WHERE user_id = r.user_id 
      ORDER BY created_at 
      LIMIT 1
    )
    -- Update all expenses for this user that don't have an account_id
    UPDATE expenses 
    SET account_id = (SELECT id FROM first_account)
    WHERE user_id = r.user_id 
    AND account_id IS NULL;
  END LOOP;
END $$; 