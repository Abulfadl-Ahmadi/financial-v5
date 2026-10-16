import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { financialServices } from './services';
import { Expense, ExpenseCategory, ExpenseCategoryLabels } from './types';
import { ExpenseModal } from './ExpenseModal';

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'ALL'>('ALL');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const data = await financialServices.getExpenses();
      setExpenses(data);
    } catch (error) {
      console.error('Failed to fetch expenses', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSaveExpense = async (data: any) => {
    try {
      if (editingExpense) {
        await financialServices.updateExpense(editingExpense.id, data);
      } else {
        await financialServices.createExpense(data);
      }
      setIsModalOpen(false);
      setEditingExpense(undefined);
      fetchExpenses();
    } catch (error) {
      console.error('Failed to save expense', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('آیا از حذف این هزینه مطمئن هستید؟')) {
      try {
        await financialServices.deleteExpense(id);
        fetchExpenses();
      } catch (error) {
        console.error('Failed to delete expense', error);
      }
    }
  };

  const filteredExpenses = categoryFilter === 'ALL' 
    ? expenses 
    : expenses.filter(e => e.category === categoryFilter);

  return (
    <div className="p-6 rtl" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">مدیریت هزینه‌های جاری کارگاه</h1>
        <Button onClick={() => { setEditingExpense(undefined); setIsModalOpen(true); }}>
          ثبت هزینه جدید
        </Button>
      </div>

      <div className="mb-4 w-64">
        <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val as any)} dir="rtl">
          <SelectTrigger>
            <SelectValue placeholder="فیلتر دسته‌بندی" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">همه موارد</SelectItem>
            {Object.entries(ExpenseCategoryLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">تاریخ</TableHead>
              <TableHead className="text-right">دسته‌بندی</TableHead>
              <TableHead className="text-right">شرح</TableHead>
              <TableHead className="text-right">مبلغ (تومان)</TableHead>
              <TableHead className="text-right">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">در حال بارگذاری...</TableCell>
              </TableRow>
            ) : filteredExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">هیچ هزینه‌ای یافت نشد.</TableCell>
              </TableRow>
            ) : (
              filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{expense.date}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ExpenseCategoryLabels[expense.category]}</Badge>
                  </TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell>{expense.amount.toLocaleString('fa-IR')} تومان</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => { setEditingExpense(expense); setIsModalOpen(true); }}
                      >
                        ویرایش
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDelete(expense.id)}
                      >
                        حذف
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ExpenseModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingExpense(undefined); }}
        onSave={handleSaveExpense}
        initialData={editingExpense}
      />
    </div>
  );
}
