import { apiClient } from '@/lib/api-client';
import { Expense, ExpenseFormData, ProfitabilitySummary } from './types';

export const financialServices = {
  getExpenses: async (): Promise<Expense[]> => {
    const response = await apiClient.get('/financial/expenses');
    return response.data;
  },

  createExpense: async (data: ExpenseFormData): Promise<Expense> => {
    const response = await apiClient.post('/financial/expenses', data);
    return response.data;
  },

  updateExpense: async (id: number, data: ExpenseFormData): Promise<Expense> => {
    const response = await apiClient.put(`/financial/expenses/${id}`, data);
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
