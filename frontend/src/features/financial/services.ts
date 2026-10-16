import { apiClient } from '@/lib/api-client';
import { Expense, ExpenseFormData, ProfitabilitySummary } from './types';

export const financialServices = {
  getExpenses: async (): Promise<Expense[]> => {
    const response = await apiClient.get('/financial/expenses');
    return response.data;
  },

  createExpense: async (data: ExpenseFormData): Promise<Expense> => {
    const payload = {
      title: data.title || data.description || `${data.category} Expense`,
      category: data.category,
      amount: data.amount,
      date_jalali: data.date_jalali || data.date,
      account_id: data.account_id || null,
      notes: data.notes || data.description || null,
    };
    const response = await apiClient.post('/financial/expenses', payload);
    return response.data;
  },

  updateExpense: async (id: number, data: ExpenseFormData): Promise<Expense> => {
    const payload = {
      title: data.title || data.description || undefined,
      category: data.category,
      amount: data.amount,
      date_jalali: data.date_jalali || data.date,
      account_id: data.account_id !== undefined ? data.account_id : undefined,
      notes: data.notes || data.description || undefined,
    };
    const response = await apiClient.put(`/financial/expenses/${id}`, payload);
    return response.data;
  },

  deleteExpense: async (id: number): Promise<void> => {
    await apiClient.delete(`/financial/expenses/${id}`);
  },

  getProfitabilitySummary: async (): Promise<ProfitabilitySummary> => {
    const response = await apiClient.get('/financial/profitability-summary');
    return response.data;
  },
};
