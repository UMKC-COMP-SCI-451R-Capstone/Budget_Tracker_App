import { useState, useEffect } from 'react';
import { generateExpenseInsights } from '../services/aiService';
import type { Expense } from '../lib/supabase';

export function useAISuggestions(expenses: Expense[]) {
  const [suggestions, setSuggestions] = useState<Array<{
    id: string;
    text: string;
    type: 'saving' | 'warning' | 'tip';
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateSuggestions = async () => {
      if (!expenses.length) return;

      setLoading(true);
      setError(null);

      try {
        // Calculate insights
        const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
        const averageExpense = totalExpenses / expenses.length;

        // Calculate top categories
        const categoryTotals = expenses.reduce((acc, exp) => {
          const category = exp.categories?.name || 'Uncategorized';
          acc[category] = (acc[category] || 0) + Number(exp.amount);
          return acc;
        }, {} as Record<string, number>);

        const topCategories = Object.entries(categoryTotals)
          .map(([name, amount]) => ({ name, amount }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);

        // Calculate monthly trend
        const monthlyTrend = expenses.reduce((acc, exp) => {
          const month = new Date(exp.date).toLocaleString('default', { month: 'long' });
          acc[month] = (acc[month] || 0) + Number(exp.amount);
          return acc;
        }, {} as Record<string, number>);

        const insights = await generateExpenseInsights({
          expenses: expenses.map(exp => ({
            amount: Number(exp.amount),
            category: exp.categories?.name || 'Uncategorized',
            date: exp.date,
            description: exp.description
          })),
          totalExpenses,
          averageExpense,
          topCategories,
          monthlyTrend: Object.entries(monthlyTrend).map(([month, amount]) => ({
            month,
            amount
          }))
        });

        // Convert insights into structured suggestions
        const parsedSuggestions = insights.split('\n')
          .filter(line => line.trim())
          .map((text, index) => ({
            id: `suggestion-${index}`,
            text: text.replace(/^\d+\.\s*/, '').trim(),
            type: 'tip' as const
          }));

        setSuggestions(parsedSuggestions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate suggestions');
      } finally {
        setLoading(false);
      }
    };

    generateSuggestions();
  }, [expenses]);

  return { suggestions, loading, error };
}