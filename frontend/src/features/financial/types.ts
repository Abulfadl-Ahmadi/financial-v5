export type ExpenseCategory =
  | 'RENT'
  | 'ELECTRICITY'
  | 'WATER'
  | 'GAS'
  | 'SUPPLIES'
  | 'MAINTENANCE'
  | 'WELFARE'
  | 'CLEANING'
  | 'OTHER';

export const ExpenseCategoryLabels: Record<ExpenseCategory, string> = {
  RENT: 'اجاره',
  ELECTRICITY: 'برق',
  WATER: 'آب',
  GAS: 'گاز و دیگ بخار',
  SUPPLIES: 'ملزومات دوخت و روغن',
  MAINTENANCE: 'تعمیرات و سیم‌کشی',
  WELFARE: 'چای و پذیرایی',
  CLEANING: 'نظافت',
  OTHER: 'سایر',
};

export interface Expense {
  id: number;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date_jalali: string;
  account?: {
    id: number;
    card_number: string;
    bank_name: string;
    user_full_name?: string;
  } | null;
  notes?: string | null;
  // Backward compatibility aliases
  date?: string;
  description?: string;
}

export interface ExpenseFormData {
  title?: string;
  category: ExpenseCategory;
  amount: number;
  date_jalali?: string;
  account_id?: number | null;
  notes?: string | null;
  // Backward compatibility aliases
  description?: string;
  date?: string;
}

export interface OverheadBreakdownItem {
  category: ExpenseCategory;
  amount: number;
  percentage: number;
}

export interface ProfitabilitySummary {
  totalRevenue: number;
  totalPayroll: number;
  totalOverhead: number;
  netProfit: number;
  overheadBreakdown: OverheadBreakdownItem[];
}

export interface CapacityMetrics {
  activeMachines: number;
  totalMachines: number;
  samProduced: number;
  availableMinutes: number;
  efficiencyScore: number;
  averageTurnaroundTimeDays: number;
}

export interface GrowthSimulation {
  newTailors: number;
  projectedMonthlyPiecesIncrease: number; 
  projectedMonthlyPiecesBase: number;
  projectedNetRevenue: number;
  additionalPayroll: number;
  additionalOverhead: number;
}
