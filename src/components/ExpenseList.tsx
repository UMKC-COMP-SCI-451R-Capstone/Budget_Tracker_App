import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Pencil, Trash2, Calendar, FileText, DollarSign } from 'lucide-react';
import type { Expense } from '../lib/supabase';

type ExpenseListProps = {
  expenses: Expense[];
  onDelete: (id: string) => void;
  selectedExpenses: string[];
  onSelectExpense: (id: string) => void;
};

export default function ExpenseList({ expenses, onDelete, selectedExpenses, onSelectExpense }: ExpenseListProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-input-border dark:divide-input-border-dark">
        <thead className="bg-background dark:bg-background-dark">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider w-8">
              <span className="sr-only">Select</span>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-card dark:bg-card-dark divide-y divide-input-border dark:divide-input-border-dark">
          {expenses.map((expense) => (
            <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={selectedExpenses.includes(expense.id)}
                  onChange={() => onSelectExpense(expense.id)}
                  className="h-4 w-4 text-secondary dark:text-secondary-dark focus:ring-secondary dark:focus:ring-secondary-dark border-input-border dark:border-input-border-dark rounded"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-text-secondary-dark">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-text-secondary dark:text-text-secondary-dark" />
                  {format(new Date(expense.date), 'MMM d, yyyy')}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary dark:text-text-primary-dark">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-text-secondary dark:text-text-secondary-dark" />
                  {expense.description}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary dark:text-text-primary-dark">
                {expense.categories?.name || 'Uncategorized'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary dark:text-text-primary-dark">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1 text-text-secondary dark:text-text-secondary-dark" />
                  {expense.amount.toFixed(2)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Link
                  to={`/expenses/${expense.id}/edit`}
                  className="text-secondary dark:text-secondary-dark hover:text-secondary/80 dark:hover:text-secondary-dark/80 mr-4 transition-colors"
                >
                  <Pencil className="h-5 w-5 inline" />
                </Link>
                <button
                  onClick={() => onDelete(expense.id)}
                  className="text-error dark:text-error-dark hover:text-error/80 dark:hover:text-error-dark/80 transition-colors"
                >
                  <Trash2 className="h-5 w-5 inline" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}