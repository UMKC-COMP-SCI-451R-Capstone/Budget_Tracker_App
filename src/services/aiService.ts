import OpenAI from 'openai';

let openai: OpenAI | null = null;

export function initializeAI(apiKey: string) {
  openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });
}

export async function generateExpenseInsights(data: {
  expenses: Array<{
    amount: number;
    category: string;
    date: string;
    description: string;
  }>;
  totalExpenses: number;
  averageExpense: number;
  topCategories: Array<{ name: string; amount: number }>;
  monthlyTrend: Array<{ month: string; amount: number }>;
}) {
  if (!openai) {
    throw new Error('AI service not initialized');
  }

  const prompt = `
    As a financial advisor, analyze this expense data and provide actionable insights:
    
    Total Expenses: $${data.totalExpenses}
    Average Expense: $${data.averageExpense}
    
    Top spending categories:
    ${data.topCategories.map(cat => `- ${cat.name}: $${cat.amount}`).join('\n')}
    
    Monthly trend:
    ${data.monthlyTrend.map(trend => `- ${trend.month}: $${trend.amount}`).join('\n')}
    
    Recent expenses:
    ${data.expenses.slice(0, 5).map(exp => 
      `- $${exp.amount} on ${exp.description} (${exp.category})`
    ).join('\n')}
    
    Provide 3-5 specific, actionable recommendations to help optimize spending, including:
    1. Identify potential areas of overspending
    2. Suggest specific ways to reduce expenses
    3. Point out any concerning patterns or trends
    4. Recommend budgeting strategies
    Keep each recommendation concise but specific.
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a helpful financial advisor providing specific, actionable advice based on expense data analysis."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 500
  });

  return response.choices[0].message.content;
}