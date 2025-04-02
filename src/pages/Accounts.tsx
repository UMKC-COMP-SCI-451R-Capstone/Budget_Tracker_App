import React, { useEffect, useState } from 'react';
import { 
  Plus,
  Banknote, // For cash
  CreditCard, // For visa/debit
  Wallet, // For general wallet/default
  Bitcoin, // For crypto
  CircleDollarSign, // For PayPal
  PencilIcon,
  TrashIcon,
  ArrowRightLeft, // For transfers
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
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferData, setTransferData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    action: 'transfer', // 'transfer' or 'add'
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Clear success message after 3 seconds
  useEffect(() => {
    let successTimeout: NodeJS.Timeout;
    let formTimeout: NodeJS.Timeout;

    if (success) {
      // Clear success message after 3 seconds
      successTimeout = setTimeout(() => {
        setSuccess('');
      }, 3000);

      // Close forms after success with slight delay
      if (showForm || showTransferForm) {
        formTimeout = setTimeout(() => {
          if (showForm) setShowForm(false);
          if (showTransferForm) setShowTransferForm(false);
          setEditingAccount(null);
        }, 2000);
      }
    }

    // Cleanup timeouts on component unmount or when success changes
    return () => {
      clearTimeout(successTimeout);
      clearTimeout(formTimeout);
    };
  }, [success, showForm, showTransferForm]);

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

      if (editingAccount) {
        const { error } = await supabase
          .from('accounts')
          .update({
            name: formData.name,
            type: formData.type,
          })
          .eq('id', editingAccount.id);

        if (error) throw error;
        setSuccess('Account updated successfully');
      } else {
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
      }

      setFormData({ name: '', type: 'cash', balance: '' });
      
      // Don't close the form immediately - it will be closed by the useEffect timer
      // setShowForm(false);
      // setEditingAccount(null);
      
      fetchAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance.toString(),
    });
    setShowForm(true);
    setShowTransferForm(false);
    setSuccess(''); // Clear any previous success messages
    setError(''); // Clear any previous error messages
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setAccounts(accounts.filter(account => account.id !== id));
      setSuccess('Account deleted successfully');
      
      // Set a timeout to clear the success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error deleting account:', error);
      setError('Failed to delete account');
      
      // Set a timeout to clear the error message after 3 seconds
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const amount = Number(transferData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      if (transferData.action === 'transfer') {
        if (transferData.fromAccountId === transferData.toAccountId) {
          throw new Error('Cannot transfer to the same account');
        }

        const fromAccount = accounts.find(a => a.id === transferData.fromAccountId);
        if (!fromAccount) throw new Error('Source account not found');
        
        if (fromAccount.balance < amount) {
          throw new Error('Insufficient balance for transfer');
        }

        // Update from account (subtract amount)
        const { error: fromError } = await supabase
          .from('accounts')
          .update({ balance: fromAccount.balance - amount })
          .eq('id', transferData.fromAccountId);
        
        if (fromError) throw fromError;

        // Update to account (add amount)
        const toAccount = accounts.find(a => a.id === transferData.toAccountId);
        if (!toAccount) throw new Error('Destination account not found');
        
        const { error: toError } = await supabase
          .from('accounts')
          .update({ balance: toAccount.balance + amount })
          .eq('id', transferData.toAccountId);
        
        if (toError) throw toError;
        
        setSuccess(`Successfully transferred $${amount.toFixed(2)} from ${fromAccount.name} to ${toAccount.name}`);
      } else if (transferData.action === 'add') {
        const account = accounts.find(a => a.id === transferData.toAccountId);
        if (!account) throw new Error('Account not found');
        
        const { error } = await supabase
          .from('accounts')
          .update({ balance: account.balance + amount })
          .eq('id', transferData.toAccountId);
        
        if (error) throw error;
        
        setSuccess(`Successfully added $${amount.toFixed(2)} to ${account.name}`);
      }

      setTransferData({
        fromAccountId: '',
        toAccountId: '',
        amount: '',
        action: 'transfer',
      });
      
      // Don't close the form immediately - it will be closed by the useEffect timer
      // setShowTransferForm(false);
      
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
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingAccount(null);
              setFormData({ name: '', type: 'cash', balance: '' });
              setShowTransferForm(false);
              setSuccess(''); // Clear any previous success messages
              setError(''); // Clear any previous error messages
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Account
          </button>
          {accounts.length >= 1 && (
            <button
              onClick={() => {
                setShowTransferForm(!showTransferForm);
                setShowForm(false);
                setEditingAccount(null);
                setTransferData({
                  fromAccountId: accounts[0]?.id || '',
                  toAccountId: accounts.length > 1 ? accounts[1]?.id || '' : accounts[0]?.id || '',
                  amount: '',
                  action: 'transfer'
                });
                setSuccess(''); // Clear any previous success messages
                setError(''); // Clear any previous error messages
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
            >
              <ArrowRightLeft className="h-5 w-5 mr-2" />
              Transfer/Add Funds
            </button>
          )}
        </div>
      </div>

      {/* Global success message that appears anywhere on the page */}
      {!showForm && !showTransferForm && success && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-md text-sm transition-opacity duration-300">
          {success}
        </div>
      )}

      {/* Global error message that appears anywhere on the page */}
      {!showForm && !showTransferForm && error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm transition-opacity duration-300">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-8 bg-card dark:bg-card-dark shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            {editingAccount ? 'Edit Account' : 'Add New Account'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm transition-opacity duration-300">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-md text-sm transition-opacity duration-300">
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

            {!editingAccount && (
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
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingAccount(null);
                  setSuccess('');
                  setError('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
              >
                {editingAccount ? 'Update Account' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showTransferForm && (
        <div className="mb-8 bg-card dark:bg-card-dark shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            {transferData.action === 'transfer' ? 'Transfer Between Accounts' : 'Add Funds to Account'}
          </h2>
          <form onSubmit={handleTransferSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm transition-opacity duration-300">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-md text-sm transition-opacity duration-300">
                {success}
              </div>
            )}

            <div>
              <label htmlFor="action" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Action
              </label>
              <select
                id="action"
                value={transferData.action}
                onChange={(e) => setTransferData({ ...transferData, action: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="transfer">Transfer Between Accounts</option>
                <option value="add">Add Funds to Account</option>
              </select>
            </div>

            {transferData.action === 'transfer' && (
              <div>
                <label htmlFor="fromAccountId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  From Account
                </label>
                <select
                  id="fromAccountId"
                  value={transferData.fromAccountId}
                  onChange={(e) => setTransferData({ ...transferData, fromAccountId: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm dark:bg-gray-700 dark:text-gray-100"
                  required
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} (${Number(account.balance).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="toAccountId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {transferData.action === 'transfer' ? 'To Account' : 'Account'}
              </label>
              <select
                id="toAccountId"
                value={transferData.toAccountId}
                onChange={(e) => setTransferData({ ...transferData, toAccountId: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm dark:bg-gray-700 dark:text-gray-100"
                required
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} (${Number(account.balance).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                id="amount"
                value={transferData.amount}
                onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm dark:bg-gray-700 dark:text-gray-100"
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowTransferForm(false);
                  setSuccess('');
                  setError('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
              >
                {transferData.action === 'transfer' ? 'Transfer' : 'Add Funds'}
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
              <div className="col-span-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Type
              </div>
              <div className="col-span-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Account Number
              </div>
              <div className="col-span-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Balance
              </div>
              <div className="col-span-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
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
                    <div className="col-span-2">
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
                    <div className="col-span-2 text-right">
                      <span className="text-sm font-medium text-success">
                        ${Number(account.balance).toFixed(2)}
                      </span>
                    </div>
                    <div className="col-span-2 text-right space-x-3">
                      <button
                        onClick={() => handleEdit(account)}
                        className="text-text-primary dark:text-text-primary-dark hover:text-gray-700 dark:hover:text-gray-300"
                        aria-label="Edit account"
                      >
                        <PencilIcon className="h-5 w-5 inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="text-text-primary dark:text-text-primary-dark hover:text-gray-700 dark:hover:text-gray-300"
                        aria-label="Delete account"
                      >
                        <TrashIcon className="h-5 w-5 inline" />
                      </button>
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