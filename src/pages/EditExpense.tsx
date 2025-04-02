import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ExpenseForm from '../components/ExpenseForm';
import type { Expense, Category, Account } from '../lib/supabase';

export default function EditExpense() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch expense
        const { data: expenseData, error: expenseError } = await supabase
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

        if (expenseError) throw expenseError;
        setExpense(expenseData);

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

  const handleExpenseUpdated = () => {
    // Dispatch the expenseUpdated event to refresh the dashboard data
    window.dispatchEvent(new CustomEvent('expenseUpdated'));
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

  if (!expense) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">Expense not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-8">Edit Expense</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <ExpenseForm 
            expense={expense} 
            categories={categories} 
            onSuccess={handleExpenseUpdated}
          />
        </div>
      </div>
    </div>
  );
}