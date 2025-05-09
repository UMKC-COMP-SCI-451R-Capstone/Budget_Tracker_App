import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { format, startOfMonth, endOfMonth } from 'date-fns';
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
  Cell
} from 'recharts';
import { supabase } from '../lib/supabase';
import type { Expense, Account } from '../lib/supabase';

// Define a color palette for different types of entries
const COLORS = {
  // Income categories
  income: [
    '#10B981', // Emerald
    '#059669',
    '#047857',
    '#065F46',
    '#064E3B',
  ],
  // Expense categories
  expense: [
    '#EF4444', // Red
    '#DC2626',
    '#B91C1C',
    '#991B1B',
    '#7F1D1D',
  ],
  // Account colors
  account: [
    '#6366F1', // Indigo
    '#4F46E5',
    '#4338CA',
    '#3730A3',
    '#312E81',
  ],
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [categoryData, setCategoryData] = useState<Array<{
    name: string;
    value: number;
    type: 'income' | 'expense' | 'account';
    color: string;
  }>>([]);
  const location = useLocation();

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('expenses')
        .select(`
          *,
          categories (
            name,
            type
          )
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Fetch accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id);

      if (accountsError) throw accountsError;

      setTransactions(transactionsData);
      setAccounts(accountsData || []);

      // Calculate totals and category breakdown
      const { expenses, income, categoryTotals } = transactionsData.reduce(
        (acc, transaction) => {
          const amount = Number(transaction.amount);
          const type = transaction.categories?.type || 'expense';
          const categoryName = transaction.categories?.name || 'Uncategorized';

          if (type === 'income') {
            acc.income += amount;
          } else {
            acc.expenses += amount;
          }

          if (!acc.categoryTotals[type]) {
            acc.categoryTotals[type] = {};
          }
          acc.categoryTotals[type][categoryName] = (acc.categoryTotals[type][categoryName] || 0) + amount;

          return acc;
        },
        { expenses: 0, income: 0, categoryTotals: {} as Record<string, Record<string, number>> }
      );

      // Add account balances to total income
      const accountsTotal = (accountsData || []).reduce((sum, account) => sum + Number(account.balance), 0);
      
      setTotalExpenses(expenses);
      setTotalIncome(income + accountsTotal);

      // Prepare category data for charts with colors
      const expenseCategories = Object.entries(categoryTotals.expense || {}).map(([name, value], index) => ({
        name: `${name}`,
        value: Number(value),
        type: 'expense' as const,
        color: COLORS.expense[index % COLORS.expense.length],
      }));

      const incomeCategories = Object.entries(categoryTotals.income || {}).map(([name, value], index) => ({
        name: `${name}`,
        value: Number(value),
        type: 'income' as const,
        color: COLORS.income[index % COLORS.income.length],
      }));

      setCategoryData([...expenseCategories, ...incomeCategories]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [location.pathname]); // Refresh when route changes

  useEffect(() => {
    // Refresh data when the window regains focus or when expenses are updated
    const handleFocus = () => {
      fetchData();
    };

    const handleExpenseUpdate = () => {
      fetchData();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('expenseUpdated', handleExpenseUpdate);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('expenseUpdated', handleExpenseUpdate);
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-text-primary-dark">Dashboard</h1>
        <p className="mt-2 text-sm text-text-secondary dark:text-text-secondary-dark">
          Overview for {format(new Date(), 'MMMM yyyy')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card dark:bg-card-dark p-6 rounded-lg shadow-card dark:shadow-card-dark">
          <h2 className="text-lg font-medium text-text-primary dark:text-text-primary-dark mb-4">Total Income</h2>
          <p className="text-3xl font-bold text-success dark:text-success-dark">
            ${totalIncome.toFixed(2)}
          </p>
          <p className="mt-2 text-sm text-text-secondary dark:text-text-secondary-dark">
            Including account balances
          </p>
        </div>

        <div className="bg-card dark:bg-card-dark p-6 rounded-lg shadow-card dark:shadow-card-dark">
          <h2 className="text-lg font-medium text-text-primary dark:text-text-primary-dark mb-4">Total Expenses</h2>
          <p className="text-3xl font-bold text-error dark:text-error-dark">
            ${totalExpenses.toFixed(2)}
          </p>
        </div>

        <div className="bg-card dark:bg-card-dark p-6 rounded-lg shadow-card dark:shadow-card-dark">
          <h2 className="text-lg font-medium text-text-primary dark:text-text-primary-dark mb-4">Net Balance</h2>
          <p className={`text-3xl font-bold ${
            totalIncome - totalExpenses >= 0 ? 'text-success dark:text-success-dark' : 'text-error dark:text-error-dark'
          }`}>
            ${(totalIncome - totalExpenses).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card dark:bg-card-dark p-6 rounded-lg shadow-card dark:shadow-card-dark">
          <h2 className="text-lg font-medium text-text-primary dark:text-text-primary-dark mb-4">Income vs Expenses</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Income', value: totalIncome },
                    { name: 'Expenses', value: totalExpenses }
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => 
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  <Cell fill={COLORS.income[0]} />
                  <Cell fill={COLORS.expense[0]} />
                </Pie>
                <Tooltip 
                  formatter={(value) => `$${Number(value).toFixed(2)}`}
                  contentStyle={{
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    color: 'var(--text-primary)',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card dark:bg-card-dark p-6 rounded-lg shadow-card dark:shadow-card-dark">
          <h2 className="text-lg font-medium text-text-primary dark:text-text-primary-dark mb-4">Category Breakdown</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  tick={{ fontSize: 12, fill: 'var(--text-primary)' }}
                />
                <YAxis tick={{ fill: 'var(--text-primary)' }} />
                <Tooltip 
                  formatter={(value) => `$${Number(value).toFixed(2)}`}
                  contentStyle={{
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    color: 'var(--text-primary)',
                  }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                />
                <Legend 
                  wrapperStyle={{ color: 'var(--text-primary)' }}
                />
                <Bar 
                  dataKey="value" 
                  name="Amount"
                  fill="#8884d8"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card dark:bg-card-dark rounded-lg shadow-card dark:shadow-card-dark">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-text-primary dark:text-text-primary-dark">Recent Transactions</h2>
              <Link
                to="/expenses"
                className="text-sm font-medium text-secondary dark:text-secondary-dark hover:text-secondary/80 dark:hover:text-secondary-dark/80"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {transactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between py-3 border-b border-input-border dark:border-input-border-dark last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary dark:text-text-primary-dark">{transaction.description}</p>
                    <p className="text-sm text-text-secondary dark:text-text-secondary-dark">
                      {format(new Date(transaction.date), 'MMM d, yyyy')} • {transaction.categories?.name}
                    </p>
                  </div>
                  <p className={`text-sm font-medium ${
                    transaction.categories?.type === 'income' 
                      ? 'text-success dark:text-success-dark' 
                      : 'text-error dark:text-error-dark'
                  }`}>
                    {transaction.categories?.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card dark:bg-card-dark rounded-lg shadow-card dark:shadow-card-dark">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-text-primary dark:text-text-primary-dark">Account Balances</h2>
              <Link
                to="/accounts"
                className="text-sm font-medium text-secondary dark:text-secondary-dark hover:text-secondary/80 dark:hover:text-secondary-dark/80"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between py-3 border-b border-input-border dark:border-input-border-dark last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary dark:text-text-primary-dark">{account.name}</p>
                    <p className="text-sm text-text-secondary dark:text-text-secondary-dark capitalize">{account.type}</p>
                  </div>
                  <p className="text-sm font-medium text-success dark:text-success-dark">
                    ${Number(account.balance).toFixed(2)}
                  </p>
                </div>
              ))}
              {accounts.length === 0 && (
                <p className="text-sm text-text-secondary dark:text-text-secondary-dark text-center py-4">No accounts found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}