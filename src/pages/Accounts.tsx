import React, { useEffect, useState } from 'react';
import { 
  Plus,
  Banknote, // For cash
  CreditCard, // For visa/debit
  Wallet, // For general wallet/default
  Bitcoin, // For crypto
  CircleDollarSign, // For PayPal
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Account } from '../lib/supabase';

const ACCOUNT_TYPES = [
  { id: 'cash', name: 'Cash', icon: Banknote, color: 'text-green-500' },
  { id: 'paypal', name: 'PayPal', icon: CircleDollarSign, color: 'text-blue-500' },
  { id: 'crypto', name: 'Crypto', icon: Bitcoin, color: 'text-orange-500' },
  { id: 'visa', name: 'Visa', icon: CreditCard, color: 'text-indigo-500' },
  { id: 'debit', name: 'Debit Card', icon: CreditCard, color: 'text-purple-500' },
];

function generateAccountNumber(type: string): string {
  const prefix = type.toUpperCase().slice(0, 2);
  const random = Math.random().toString().slice(2, 10);
  return `${prefix}${random}`;
}

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'cash',
    balance: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const accountNumber = generateAccountNumber(formData.type);
      
      const { error } = await supabase
        .from('accounts')
        .insert([{
          user_id: user.id,
          name: formData.name,
          type: formData.type,
          account_number: accountNumber,
          balance: Number(formData.balance),
        }]);

      if (error) throw error;

      setSuccess('Account created successfully');
      setFormData({ name: '', type: 'cash', balance: '' });
      setShowForm(false);
      fetchAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const getTotalBalance = () => {
    return accounts.reduce((sum, account) => sum + Number(account.balance), 0);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Accounts</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage your financial accounts
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Account
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-8 bg-card dark:bg-card-dark shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Add New Account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-md text-sm">
                {success}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Account Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm dark:bg-gray-700 dark:text-gray-100"
                required
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Account Type
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm dark:bg-gray-700 dark:text-gray-100"
                required
              >
                {ACCOUNT_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="balance" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Initial Balance
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                id="balance"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm dark:bg-gray-700 dark:text-gray-100"
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-8 bg-card dark:bg-card-dark shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Total Balance</h2>
        <p className="text-3xl font-bold text-secondary">
          ${getTotalBalance().toFixed(2)}
        </p>
      </div>

      <div className="bg-card dark:bg-card-dark shadow rounded-lg overflow-hidden">
        <div className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Account
              </div>
              <div className="col-span-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Type
              </div>
              <div className="col-span-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Account Number
              </div>
              <div className="col-span-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Balance
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
            {accounts.map((account) => {
              const accountType = ACCOUNT_TYPES.find(t => t.id === account.type) || { 
                icon: Wallet, 
                color: 'text-gray-400',
                name: 'Unknown'
              };
              const AccountIcon = accountType.icon;
              
              return (
                <div key={account.id} className="px-6 py-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3">
                      <div className="flex items-center">
                        <AccountIcon className={`h-5 w-5 mr-2 ${accountType.color}`} />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {account.name}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-3">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {account.type}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {account.account_number}
                      </span>
                    </div>
                    <div className="col-span-3 text-right">
                      <span className="text-sm font-medium text-success">
                        ${Number(account.balance).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {accounts.length === 0 && (
              <div className="text-center py-12">
                <Wallet className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No accounts</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new account.</p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-secondary hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}