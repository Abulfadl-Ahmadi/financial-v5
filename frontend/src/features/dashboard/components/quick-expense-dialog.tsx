import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { financialServices } from '@/features/financial/services'
import { type ExpenseCategory } from '@/features/financial/types'

interface QuickExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const expenseCategories: { value: ExpenseCategory; label: string }[] = [
  { value: 'RENT', label: 'Rent (اجاره کارگاه)' },
  { value: 'ELECTRICITY', label: 'Electricity Utility (قبض برق)' },
  { value: 'GAS', label: 'Gas & Steam Boiler Utility (قبض گاز و دیگ بخار)' },
  { value: 'WATER', label: 'Water Utility (قبض آب)' },
  { value: 'SUPPLIES', label: 'Sewing Supplies & Oil (نخ، سوزن، روغن چرخ)' },
  { value: 'MAINTENANCE', label: 'Machinery, Boiler & Wiring Maintenance (تعمیرات چرخ و سیم‌کشی)' },
  { value: 'WELFARE', label: 'Welfare & Kitchen (چای، قند و پذیرایی)' },
  { value: 'CLEANING', label: 'Cleaning & Sanitation (نظافت کارگاه)' },
  { value: 'OTHER', label: 'Other Miscellaneous Expenses (سایر هزینه‌ها)' },
]

export function QuickExpenseDialog({
  open,
  onOpenChange,
  onSuccess,
}: QuickExpenseDialogProps) {
  const [category, setCategory] = useState<ExpenseCategory>('SUPPLIES')
  const [amount, setAmount] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [date, setDate] = useState<string>('1405/06/01')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Please enter a valid expense amount.')
      return
    }

    try {
      setLoading(true)
      await financialServices.createExpense({
        category,
        amount: Number(amount),
        description: description || `${category} Expense`,
        date: date || '1405/06/01',
      })
      toast.success('Expense recorded successfully.')
      setAmount('')
      setDescription('')
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      toast.error('Failed to record expense.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[440px]'>
        <DialogHeader>
          <DialogTitle>Log Operational Expense</DialogTitle>
          <DialogDescription>
            Record workshop expenses across utilities, supplies, maintenance, or staff welfare.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 py-2'>
          <div className='space-y-1.5'>
            <Label htmlFor='expense-category'>Expense Category</Label>
            <Select
              value={category}
              onValueChange={(val) => setCategory(val as ExpenseCategory)}
            >
              <SelectTrigger id='expense-category'>
                <SelectValue placeholder='Select category' />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='expense-amount'>Amount (Tomans)</Label>
            <Input
              id='expense-amount'
              type='number'
              placeholder='e.g. 1500000'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='expense-date'>Jalali Date</Label>
            <Input
              id='expense-date'
              placeholder='1405/06/01'
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='expense-desc'>Notes / Description</Label>
            <Input
              id='expense-desc'
              placeholder='e.g. 10 spools polyester thread + 5 packs needles'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <DialogFooter className='pt-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={loading}>
              {loading ? 'Saving...' : 'Record Expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
