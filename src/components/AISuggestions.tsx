import React from 'react';
import { Lightbulb, Loader2 } from 'lucide-react';

type Suggestion = {
  id: string;
  text: string;
  type: 'saving' | 'warning' | 'tip';
};

type AISuggestionsProps = {
  suggestions: Suggestion[];
  loading: boolean;
  error: string | null;
};

export default function AISuggestions({ suggestions, loading, error }: AISuggestionsProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-secondary" />
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
          Analyzing your expenses...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!suggestions.length) {
    return null;
  }

  return (
    <div className="bg-card dark:bg-card-dark rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        <Lightbulb className="h-6 w-6 text-secondary mr-2" />
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          AI Smart Suggestions
        </h2>
      </div>
      <div className="space-y-4">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start">
              <div className="flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {suggestion.text}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}