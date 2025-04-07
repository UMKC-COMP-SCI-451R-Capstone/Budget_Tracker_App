import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ExpenseForm from '../components/ExpenseForm';
import type { Expense, Category, Account } from '../lib/supabase';

export default function EditExpense() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<Expense | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch transaction
        const { data: transactionData, error: transactionError } = await supabase
          .from('expenses')
          .select(`
            *,
            categories (
              id, 
              name,
              type
            )
          `)
          .eq('id', id)
          .single();

        if (transactionError) throw transactionError;
        setTransaction(transactionData);

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id);

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleTransactionUpdated = () => {
    // Dispatch the transactionUpdated event to refresh the dashboard data
    window.dispatchEvent(new CustomEvent('transactionUpdated'));
    // Navigate back to the expenses list
    navigate('/expenses');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">Transaction not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-8">Edit Transaction</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <ExpenseForm 
            transaction={transaction} 
            categories={categories} 
            onSuccess={handleTransactionUpdated}
            onCancel={() => navigate('/expenses')}
          />
        </div>
      </div>
    </div>
  );
}