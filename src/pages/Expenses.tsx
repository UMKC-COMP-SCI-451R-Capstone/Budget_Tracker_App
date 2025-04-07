import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Plus, FileSpreadsheet, File as FilePdf, Receipt, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ExpenseList from '../components/ExpenseList';
import ExpenseForm from '../components/ExpenseForm';
import ReceiptScanner from '../components/ReceiptScanner';
import type { Expense, Category, Account } from '../lib/supabase';


export default function Expenses() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Expense[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [showAddReceipt, setShowAddReceipt] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [scannedData, setScannedData] = useState<{
    amount?: string;
    date?: string;
    description?: string;
    account_id?: string;
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
      setTransactions(transactionsData || []);

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

  const handleDelete = async (id: string) => {
    try {
      // First get the transaction to handle account balance adjustment
      const { data: transaction, error: fetchError } = await supabase
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
        
      if (fetchError) throw fetchError;
      
      // If the transaction has an account_id, adjust the account balance
      if (transaction && transaction.account_id) {
        // Get the account
        const { data: account, error: accountError } = await supabase
          .from('accounts')
          .select('*')
          .eq('id', transaction.account_id)
          .single();
          
        if (accountError) throw accountError;
        
        // Adjust the account balance (add back expense or remove income)
        const adjustment = transaction.categories?.type === 'income'
          ? -transaction.amount // Remove income
          : transaction.amount;  // Add back expense
        
        // Update the account balance
        const { error: updateError } = await supabase
          .from('accounts')
          .update({ balance: account.balance + adjustment })
          .eq('id', transaction.account_id);
          
        if (updateError) throw updateError;
      }
      
      // Now delete the transaction
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Update the UI
      setTransactions(transactions.filter(t => t.id !== id));
      setSelectedTransactions(selectedTransactions.filter(tId => tId !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleSelectTransaction = (id: string) => {
    setSelectedTransactions(prev => 
      prev.includes(id) 
        ? prev.filter(tId => tId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedTransactions(
      selectedTransactions.length === transactions.length
        ? []
        : transactions.map(t => t.id)
    );
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.text('Transaction Report', 20, 20);
    
    const selectedTransactionData = transactions
      .filter(
        (transaction) =>
          selectedTransactions.length === 0 || selectedTransactions.includes(transaction.id)
      )
      .map((transaction) => [
        format(new Date(transaction.date), "MMM d, yyyy"),
        transaction.description,
        transaction.categories?.name || "Uncategorized",
        transaction.categories?.type === "income"
          ? `+$${transaction.amount.toFixed(2)}`
          : `-$${transaction.amount.toFixed(2)}`,
      ]);

    autoTable(doc, {
      head: [['Date', 'Description', 'Category', 'Amount']],
      body: selectedTransactionData,
      startY: 30,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [3, 59, 74] },
    });

    const totalAmount = transactions
      .filter(transaction => selectedTransactions.length === 0 || selectedTransactions.includes(transaction.id))
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    const finalY = (doc as any).lastAutoTable.finalY || 30;
    doc.text(`Total: $${totalAmount.toFixed(2)}`, 20, finalY + 10);

    doc.save('transaction-report.pdf');
  };

  const exportToExcel = () => {
    const selectedTransactionData = transactions
      .filter(
        (transaction) =>
          selectedTransactions.length === 0 || selectedTransactions.includes(transaction.id)
      )
      .map((transaction) => ({
        Date: format(new Date(transaction.date), "MMM d, yyyy"),
        Description: transaction.description,
        Category: transaction.categories?.name || "Uncategorized",
        Type: transaction.categories?.type || "expense",
        Amount:
          transaction.categories?.type === "income"
            ? `+$${transaction.amount.toFixed(2)}`
            : `-$${transaction.amount.toFixed(2)}`,
      }));

    const ws = XLSX.utils.json_to_sheet(selectedTransactionData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, 'transaction-report.xlsx');
  };

  const handleTransactionAdded = () => {
    // Dispatch the transactionUpdated event to refresh the dashboard data
    window.dispatchEvent(new CustomEvent('transactionUpdated'));
    // Close the form and refresh transactions
    setShowAddTransaction(false);
    setShowAddReceipt(false);
    fetchData();
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
          <h1 className="text-2xl font-semibold text-text-primary dark:text-text-primary-dark">Transactions</h1>
          <p className="mt-2 text-sm text-text-secondary dark:text-text-secondary-dark">
            A list of all your transactions
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={exportToPDF}
            className="inline-flex items-center px-4 py-2 border border-input-border dark:border-input-border-dark rounded-md shadow-sm text-sm font-medium text-text-primary dark:text-text-primary-dark bg-card dark:bg-card-dark hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary dark:focus:ring-secondary-dark"
          >
            <FilePdf className="h-5 w-5 mr-2 text-text-secondary dark:text-text-secondary-dark" />
            Export PDF
          </button>
          <button
            onClick={exportToExcel}
            className="inline-flex items-center px-4 py-2 border border-input-border dark:border-input-border-dark rounded-md shadow-sm text-sm font-medium text-text-primary dark:text-text-primary-dark bg-card dark:bg-card-dark hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary dark:focus:ring-secondary-dark"
          >
            <FileSpreadsheet className="h-5 w-5 mr-2 text-text-secondary dark:text-text-secondary-dark" />
            Export Excel
          </button>
          <button
            onClick={() => {
              setShowAddTransaction(true);
              setShowAddReceipt(false);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary dark:bg-secondary-dark hover:bg-secondary/90 dark:hover:bg-secondary-dark/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary dark:focus:ring-secondary-dark"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Transaction
          </button>
          <button
            onClick={() => {
              setShowAddReceipt(true);
              setShowAddTransaction(false);
            }}
            className="inline-flex items-center px-4 py-2 border border-input-border dark:border-input-border-dark rounded-md shadow-sm text-sm font-medium text-text-primary dark:text-text-primary-dark bg-card dark:bg-card-dark hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary dark:focus:ring-secondary-dark"
          >
            <Receipt className="h-5 w-5 mr-2 text-text-secondary dark:text-text-secondary-dark" />
            Scan Receipt
          </button>
        </div>
      </div>

      {showAddTransaction && (
        <div className="mb-8 bg-card dark:bg-card-dark shadow rounded-lg p-6">
          <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-6">Add New Transaction</h2>
          <ExpenseForm 
            categories={categories}
            onSuccess={handleTransactionAdded}
          />
        </div>
      )}

      {showAddReceipt && (
        <div className="mb-8 bg-card dark:bg-card-dark shadow rounded-lg p-6">
          <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-6">Scan Receipt</h2>
          <ReceiptScanner onScanComplete={setScannedData} />
          {scannedData && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Create Transaction from Receipt</h3>
              <ExpenseForm 
                categories={categories} 
                initialData={scannedData}
                onSuccess={handleTransactionAdded}
              />
            </div>
          )}
        </div>
      )}

      <div className="bg-card dark:bg-card-dark shadow-card dark:shadow-card-dark rounded-lg">
        {transactions.length > 0 ? (
          <>
            <div className="px-6 py-4 border-b border-input-border dark:border-input-border-dark">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedTransactions.length === transactions.length}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-secondary dark:text-secondary-dark focus:ring-secondary dark:focus:ring-secondary-dark border-input-border dark:border-input-border-dark rounded"
                />
                <span className="ml-2 text-sm text-text-secondary dark:text-text-secondary-dark">
                  {selectedTransactions.length === 0
                    ? 'Select all'
                    : `Selected ${selectedTransactions.length} of ${transactions.length}`}
                </span>
              </div>
            </div>
            <ExpenseList 
              expenses={transactions} 
              onDelete={handleDelete}
              selectedExpenses={selectedTransactions}
              onSelectExpense={handleSelectTransaction}
            />
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-text-secondary dark:text-text-secondary-dark">No transactions found</p>
            <div className="mt-4 flex justify-center space-x-4">
              <button
                onClick={() => setShowAddTransaction(true)}
                className="inline-flex items-center text-sm font-medium text-secondary dark:text-secondary-dark hover:text-secondary/80 dark:hover:text-secondary-dark/80"
              >
                <Plus className="h-5 w-5 mr-1" />
                Add transaction manually
              </button>
              <button
                onClick={() => setShowAddReceipt(true)}
                className="inline-flex items-center text-sm font-medium text-secondary dark:text-secondary-dark hover:text-secondary/80 dark:hover:text-secondary-dark/80"
              >
                <Receipt className="h-5 w-5 mr-1" />
                Scan a receipt
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}