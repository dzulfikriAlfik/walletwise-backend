/**
 * System categories (available to all users)
 * Custom categories are stored per-user in the Category model
 */

export const SYSTEM_CATEGORIES = {
  income: ['salary', 'freelance', 'investment', 'other_income'],
  expense: [
    'food',
    'transport',
    'entertainment',
    'bills',
    'shopping',
    'health',
    'education',
    'other_expense',
  ],
} as const

export const SYSTEM_CATEGORY_LABELS: Record<string, string> = {
  salary: 'Salary',
  freelance: 'Freelance',
  investment: 'Investment',
  other_income: 'Other Income',
  food: 'Food & Drink',
  transport: 'Transport',
  entertainment: 'Entertainment',
  bills: 'Bills',
  shopping: 'Shopping',
  health: 'Health',
  education: 'Education',
  other_expense: 'Other Expense',
}

export function isSystemCategory(value: string): boolean {
  return (
    SYSTEM_CATEGORIES.income.includes(value as (typeof SYSTEM_CATEGORIES.income)[number]) ||
    SYSTEM_CATEGORIES.expense.includes(value as (typeof SYSTEM_CATEGORIES.expense)[number])
  )
}
