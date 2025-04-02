import React, { useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useAISuggestions } from '../hooks/useAISuggestions';
import AISuggestions from '../components/AISuggestions';
import type { Expense, Category } from '../lib/supabase';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

type ExpenseWithCategory = Expense & {
  categories: Category;
};

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<ExpenseWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const { suggestions, loading: aiLoading, error: aiError } = useAISuggestions(expenses);

  useEffect(() => {
    fetchData();
  }, [dateRange, selectedCategory]);

  useEffect(() => {
    // Refresh data when expenses are updated
    const handleExpenseUpdate = () => {
      fetchData();
    };

    window.addEventListener('expenseUpdated', handleExpenseUpdate);
    return () => window.removeEventListener('expenseUpdated', handleExpenseUpdate);
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch expenses
      let query = supabase
        .from('expenses')
        .select(`
          *,
          categories (
            id,
            name,
            type
          )
        `)
        .eq('user_id', user.id)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)
        .order('date', { ascending: true });

      if (selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }

      const { data: expensesData, error: expensesError } = await query;

      if (expensesError) throw expensesError;
      setExpenses(expensesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDailyExpenses = () => {
    const dailyTotals = expenses.reduce((acc, expense) => {
      const date = format(parseISO(expense.date), 'MMM dd');
      acc[date] = (acc[date] || 0) + Number(expense.amount);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(dailyTotals).map(([date, amount]) => ({
      date,
      amount,
    }));
  };

  const getCategoryExpenses = () => {
    const categoryTotals = expenses.reduce((acc, expense) => {
      const categoryName = expense.categories?.name || 'Uncategorized';
      acc[categoryName] = (acc[categoryName] || 0) + Number(expense.amount);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  };

  const getAverageExpense = () => {
    if (expenses.length === 0) return 0;
    return getTotalExpenses() / expenses.length;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Expense Reports</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Analyze your spending patterns and trends
        </p>
      </div>

      <div className="bg-card dark:bg-card-dark shadow rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Category
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card dark:bg-card-dark p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Total Expenses</h2>
          <p className="text-3xl font-bold text-secondary">
            ${getTotalExpenses().toFixed(2)}
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Average per expense: ${getAverageExpense().toFixed(2)}
          </p>
        </div>

        <div className="bg-card dark:bg-card-dark p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Number of Transactions</h2>
          <p className="text-3xl font-bold text-secondary">{expenses.length}</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            In selected date range
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card dark:bg-card-dark p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Daily Expenses</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getDailyExpenses()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                <Legend />
                <Bar dataKey="amount" fill="#8884d8" name="Amount" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card dark:bg-card-dark p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Expenses by Category</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={getCategoryExpenses()} 
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                <Legend />
                <Bar 
                  dataKey="value" 
                  name="Amount"
                >
                  {getCategoryExpenses().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <AISuggestions
          suggestions={suggestions}
          loading={aiLoading}
          error={aiError}
        />
      </div>
    </div>
  );
}