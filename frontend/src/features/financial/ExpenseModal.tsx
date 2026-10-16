import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExpenseCategory, ExpenseCategoryLabels, ExpenseFormData, Expense } from './types';
import { getTodayJalali } from '@/lib/jalali-date';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ExpenseFormData) => void;
  initialData?: Expense;
}

const PRESETS = [
  { label: 'روغن چرخ', category: 'SUPPLIES', description: 'روغن چرخ', amount: 0 },
  { label: 'چای و قند', category: 'WELFARE', description: 'چای و قند', amount: 0 },
  { label: 'تعویض لامپ', category: 'MAINTENANCE', description: 'تعویض لامپ', amount: 0 },
  { label: 'سرویس دیگ بخار', category: 'GAS', description: 'سرویس دیگ بخار', amount: 0 },
] as const;

export function ExpenseModal({ isOpen, onClose, onSave, initialData }: ExpenseModalProps) {
  const [category, setCategory] = useState<ExpenseCategory>('OTHER');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  useEffect(() => {
    if (initialData && isOpen) {
      setCategory(initialData.category);
      setAmount(initialData.amount);
      setDate(initialData.date || initialData.date_jalali || '');
      setDescription(initialData.description || initialData.title || '');
    } else if (isOpen) {
      setCategory('OTHER');
      setAmount('');
      setDate(getTodayJalali().formatted);
      setDescription('');
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === '') return;
    onSave({
      title: description || `${category} Expense`,
      category,
      amount: Number(amount),
      date_jalali: date || getTodayJalali().formatted,
      notes: description,
      date,
      description,
    });
  };

  const applyPreset = (preset: typeof PRESETS[number]) => {
    setCategory(preset.category);
    setDescription(preset.description);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>{initialData ? 'ویرایش هزینه' : 'ثبت هزینه جدید'}</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-2 flex-wrap mb-4">
          <span className="text-sm text-gray-500 w-full mb-1">موارد پرکاربرد:</span>
          {PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset)}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              دسته بندی
            </Label>
            <div className="col-span-3">
              <Select value={category} onValueChange={(val) => setCategory(val as ExpenseCategory)} dir="rtl">
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب دسته‌بندی" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ExpenseCategoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              مبلغ (تومان)
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
              className="col-span-3"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              تاریخ
            </Label>
            <Input
              id="date"
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="col-span-3"
              placeholder="1403/05/01"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              شرح
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          
          <DialogFooter>
            <Button type="submit">ذخیره</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
