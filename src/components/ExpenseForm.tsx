import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  CreditCard, 
  Calendar, 
  FileText, 
  DollarSign,
  Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type ExpenseFormProps = {
  expense?: {
    id: string;
    amount: number;
    category_id: string;
    date: string;
    description: string;
  };
  categories: Array<{
    id: string;
    name: string;
  }>;
  initialData?: {
    amount?: string;
    date?: string;
    description?: string;
  };
  onSuccess?: () => void;
};

export default function ExpenseForm({ expense, categories, initialData, onSuccess }: ExpenseFormProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    amount: expense?.amount || '',
    category_id: expense?.category_id || '',
    date: expense?.date ? format(new Date(expense.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    description: expense?.description || '',
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

      const expenseData = {
        amount,
        category_id: formData.category_id,
        date: formData.date,
        description: formData.description.trim() || 'Scanned Receipt',
        user_id: user.id,
        payment_method: 'cash', // Default payment method for scanned receipts
        tags: [], // Empty tags array for scanned receipts
      };

      if (expense) {
        const { error: updateError } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', expense.id);
        
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('expenses')
          .insert([expenseData]);
        
        if (insertError) throw insertError;
      }

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/expenses');
      }
    } catch (err) {
      console.error('Error saving expense:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving the expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Amount
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <DollarSign className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="number"
            step="0.01"
            id="amount"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="block w-full pl-10 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm dark:bg-gray-700 dark:text-gray-100"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Category
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <CreditCard className="h-5 w-5 text-gray-400" />
          </div>
          <select
            id="category"
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            className="block w-full pl-10 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm dark:bg-gray-700 dark:text-gray-100"
            required
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Date
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="date"
            id="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="block w-full pl-10 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm dark:bg-gray-700 dark:text-gray-100"
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
            <FileText className="h-5 w-5 text-gray-400" />
          </div>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="block w-full pl-10 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            expense ? 'Update Expense' : 'Add Expense'
          )}
        </button>
      </div>
    </form>
  );
}