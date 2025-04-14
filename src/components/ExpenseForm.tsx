import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Calendar, 
  FileText, 
  DollarSign,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Account, Category } from '../lib/supabase';

type ExpenseFormProps = {
  transaction?: {
    id: string;
    amount: number;
    category_id: string;
    date: string;
    description: string;
    account_id?: string;
  };
  categories: Array<Category>;
  initialData?: {
    amount?: string;
    date?: string;
    description?: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function ExpenseForm({ transaction, categories, initialData, onSuccess, onCancel }: ExpenseFormProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedCategoryType, setSelectedCategoryType] = useState<string>('expense');
  const [formData, setFormData] = useState({
    amount: transaction?.amount || '',
    category_id: transaction?.category_id || '',
    date: transaction?.date ? format(new Date(transaction.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    description: transaction?.description || '',
    account_id: transaction?.account_id || '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        amount: initialData.amount || prev.amount,
        date: initialData.date || prev.date,
        description: initialData.description || prev.description,
      }));
    }
  }, [initialData]);

  // Fetch accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', user.id)
          .order('name');

        if (error) throw error;
        setAccounts(data || []);

        // Set default account if none selected and accounts exist
        if (!formData.account_id && data && data.length > 0) {
          setFormData(prev => ({
            ...prev,
            account_id: data[0].id
          }));
        }
      } catch (error) {
        console.error('Error fetching accounts:', error);
      }
    };

    fetchAccounts();
  }, []);

  // Update category type when category selection changes
  useEffect(() => {
    if (formData.category_id) {
      const selectedCategory = categories.find(cat => cat.id === formData.category_id);
      if (selectedCategory) {
        setSelectedCategoryType(selectedCategory.type);
      }
    }
  }, [formData.category_id, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Ensure amount is a valid number
      const amount = Number(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      // Ensure category is selected
      if (!formData.category_id) {
        throw new Error('Please select a category');
      }

      // Ensure date is valid
      if (!formData.date) {
        throw new Error('Please select a date');
      }

      // Ensure account is selected
      if (!formData.account_id) {
        throw new Error('Please select an account');
      }

      const transactionData = {
        amount,
        category_id: formData.category_id,
        date: formData.date,
        description: formData.description.trim() || '',
        user_id: user.id,
        payment_method: 'cash',
        tags: [],
        account_id: formData.account_id,
      };

      // Get the selected category to determine whether to add or subtract from account
      const selectedCategory = categories.find(cat => cat.id === formData.category_id);
      if (!selectedCategory) {
        throw new Error('Selected category not found');
      }

      // Get the selected account
      const selectedAccount = accounts.find(acc => acc.id === formData.account_id);
      if (!selectedAccount) {
        throw new Error('Selected account not found');
      }

      // Start a transaction to update both transaction and account
      if (transaction) {
        // For updates, need to handle previous account balance if account changed
        // Get the current transaction data to see if the account or category type changed
        console.log('Updating transaction with ID:', transaction.id);

        // First check if we have a valid session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw new Error(`Authentication error: ${sessionError.message}`);
        }

        if (!sessionData.session) {
          console.error('No active session found');
          throw new Error('You must be logged in to perform this action');
        }

        console.log('Session is valid, proceeding with update');

        const { data: currentTransaction, error: transactionDataError } = await supabase
          .from('expenses')
          .select(`
            *,
            categories (
              id,
              name,
              type
            )
          `)
          .eq('id', transaction.id)
          .single();

        if (transactionDataError) throw transactionDataError;
        
        // Update the transaction record
        const { error: updateError } = await supabase
          .from('expenses')
          .update({
            amount: transactionData.amount,
            category_id: transactionData.category_id,
            date: transactionData.date,
            description: transactionData.description,
            payment_method: transactionData.payment_method,
            tags: transactionData.tags,
            account_id: transactionData.account_id
          })
          .eq('id', transaction.id);
        
        if (updateError) throw updateError;

        // Handle account balance changes
        // If account changed, need to revert old account balance and update new account
        if (currentTransaction.account_id !== formData.account_id) {
          // Revert changes to old account
          if (currentTransaction.account_id) {
            const { data: oldAccount, error: oldAccountError } = await supabase
              .from('accounts')
              .select('*')
              .eq('id', currentTransaction.account_id)
              .single();

            if (!oldAccountError && oldAccount) {
              // Adjust old account balance (add back expense or remove income)
              const oldAdjustment = currentTransaction.categories.type === 'income' 
                ? -currentTransaction.amount
                : currentTransaction.amount;
              
              const { error: oldBalanceError } = await supabase
                .from('accounts')
                .update({ balance: oldAccount.balance + oldAdjustment })
                .eq('id', currentTransaction.account_id);
                
              if (oldBalanceError) throw oldBalanceError;
            }
          }
          
          // Apply changes to new account
          // Adjust new account balance
          const newAdjustment = selectedCategory.type === 'income'
            ? amount  // Add income
            : -amount; // Subtract expense
            
          // Check if transaction would cause negative balance
          if (selectedAccount.balance + newAdjustment < 0) {
            throw new Error(`Insufficient balance in ${selectedAccount.name} account`);
          }
          
          const { error: newBalanceError } = await supabase
            .from('accounts')
            .update({ balance: selectedAccount.balance + newAdjustment })
            .eq('id', formData.account_id);
            
          if (newBalanceError) throw newBalanceError;
        } 
        // If account is the same but amount or category type changed
        else if (
          currentTransaction.amount !== amount || 
          currentTransaction.categories.type !== selectedCategory.type
        ) {
          // Calculate the net change to apply
          let netChange = 0;
          
          // Remove the effect of the old transaction
          if (currentTransaction.categories.type === 'income') {
            netChange -= currentTransaction.amount; // Remove old income
          } else {
            netChange += currentTransaction.amount; // Add back old expense
          }
          
          // Apply the effect of the new transaction
          if (selectedCategory.type === 'income') {
            netChange += amount; // Add new income
          } else {
            netChange -= amount; // Subtract new expense
          }
          
          // Check if adjustment would cause negative balance
          if (selectedAccount.balance + netChange < 0) {
            throw new Error(`Insufficient balance in ${selectedAccount.name} account`);
          }
          
          // Update the account balance
          const { error: balanceUpdateError } = await supabase
            .from('accounts')
            .update({ balance: selectedAccount.balance + netChange })
            .eq('id', formData.account_id);
            
          if (balanceUpdateError) throw balanceUpdateError;
        }
      } else {
        // For new transactions
        // First check if we have a valid session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw new Error(`Authentication error: ${sessionError.message}`);
        }

        if (!sessionData.session) {
          console.error('No active session found');
          throw new Error('You must be logged in to perform this action');
        }

        console.log('About to insert transaction with data:', transactionData);

        // Insert the transaction record with the session token in the Authorization header
        const { error: insertError } = await supabase
          .from('expenses')
          .insert({
            amount: transactionData.amount,
            category_id: transactionData.category_id,
            date: transactionData.date,
            description: transactionData.description,
            user_id: transactionData.user_id,
            payment_method: transactionData.payment_method,
            tags: transactionData.tags,
            account_id: transactionData.account_id
          });
        
        if (insertError) throw insertError;

        // Update account balance
        const adjustment = selectedCategory.type === 'income'
          ? amount  // Add income
          : -amount; // Subtract expense
          
        // Check if transaction would cause negative balance
        if (selectedAccount.balance + adjustment < 0) {
          throw new Error(`Insufficient balance in ${selectedAccount.name} account`);
        }
        
        const { error: balanceError } = await supabase
          .from('accounts')
          .update({ balance: selectedAccount.balance + adjustment })
          .eq('id', formData.account_id);
          
        if (balanceError) throw balanceError;
      }

      if (onSuccess) {
        // Run the onSuccess callback provided by the parent
        onSuccess();
      } else {
        navigate('/expenses');
      }
    } catch (err) {
      console.error('Error saving transaction:', err);
      // Check if we have a Supabase error object with details
      if (err && typeof err === 'object' && 'code' in err && 'message' in err) {
        const supaError = err as { code: string; message: string; details?: string; hint?: string };
        console.error('Supabase error details:', {
          code: supaError.code,
          message: supaError.message,
          details: supaError.details,
          hint: supaError.hint
        });
        setError(`Database error: ${supaError.message}${supaError.hint ? ` (Hint: ${supaError.hint})` : ''}`);
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred while saving the transaction');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Category
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <select
            id="category"
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            className="block w-full px-3 py-2 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm dark:bg-gray-700 dark:text-gray-100"
            required
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="account" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Account
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <select
            id="account"
            value={formData.account_id}
            onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
            className="block w-full px-3 py-2 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm dark:bg-gray-700 dark:text-gray-100"
            required
          >
            <option value="">Select an account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} (${Number(account.balance).toFixed(2)})
              </option>
            ))}
          </select>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {selectedCategoryType === 'income' 
            ? 'Income will be added to this account'
            : 'Expense will be deducted from this account'}
        </p>
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Amount
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <DollarSign className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="number"
            step="0.01"
            id="amount"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="block w-full pl-14 pr-3 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm dark:bg-gray-700 dark:text-gray-100"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Date
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="date"
            id="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="block w-full pl-14 pr-3 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm dark:bg-gray-700 dark:text-gray-100"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Description
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FileText className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="block w-full pl-14 pr-3 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {transaction ? 'Updating...' : 'Saving...'}
            </>
          ) : (
            transaction ? 'Update' : 'Save'
          )}
        </button>
      </div>
    </form>
  );
}