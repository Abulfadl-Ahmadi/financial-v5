import { Card, CardContent } from '@/components/ui/card'
import { Expense } from '../data/schema'
import { expenseCategories } from '../data/data'
import { TomanIcon } from '@/components/ui/toman-icon'
import { DollarSign, PieChart, Receipt, TrendingUp } from 'lucide-react'

type ExpensesStatsCardsProps = {
  expenses: Expense[]
}

export function ExpensesStatsCards({ expenses }: ExpensesStatsCardsProps) {
  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const count = expenses.length
  const avgAmount = count > 0 ? Math.round(totalAmount / count) : 0

  // Find biggest category
  const catTotals: Record<string, number> = {}
  expenses.forEach((e) => {
    const cat = e.category || 'OTHER'
    catTotals[cat] = (catTotals[cat] || 0) + Number(e.amount)
  })

  let topCatKey = 'OTHER'
  let topCatMax = 0
  Object.entries(catTotals).forEach(([cat, val]) => {
    if (val > topCatMax) {
      topCatMax = val
      topCatKey = cat
    }
  })

  const topCatObj = expenseCategories.find((c) => c.value === topCatKey)
  const topCatName = topCatObj ? topCatObj.label.split('(')[0].trim() : 'Rent'

  return (
    <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
      {/* 1. Total Expenses */}
      <Card className='border-border/60 bg-card'>
        <CardContent className='p-4 flex items-center justify-between'>
          <div>
            <p className='text-xs font-medium text-muted-foreground'>Total Workshop Expenses</p>
            <h3 className='flex items-center gap-1 text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5'>
              <span>{totalAmount.toLocaleString()}</span>
              <TomanIcon className='size-4 text-muted-foreground' />
            </h3>
          </div>
          <div className='p-2.5 rounded-lg bg-rose-500/10 text-rose-600'>
            <DollarSign className='h-4 w-4' />
          </div>
        </CardContent>
      </Card>

      {/* 2. Top Category */}
      <Card className='border-border/60 bg-card'>
        <CardContent className='p-4 flex items-center justify-between'>
          <div>
            <p className='text-xs font-medium text-muted-foreground'>Top Expense Driver</p>
            <h3 className='text-base font-bold text-foreground truncate max-w-[180px] mt-0.5'>
              {topCatName}
            </h3>
            <p className='flex items-center gap-1 text-[11px] font-mono text-muted-foreground'>
              <span>{topCatMax.toLocaleString()}</span>
              <TomanIcon className='size-3 text-muted-foreground' />
              <span>({count > 0 ? Math.round((topCatMax / (totalAmount || 1)) * 100) : 0}%)</span>
            </p>
          </div>
          <div className='p-2.5 rounded-lg bg-amber-500/10 text-amber-600'>
            <PieChart className='h-4 w-4' />
          </div>
        </CardContent>
      </Card>

      {/* 3. Invoices Count */}
      <Card className='border-border/60 bg-card'>
        <CardContent className='p-4 flex items-center justify-between'>
          <div>
            <p className='text-xs font-medium text-muted-foreground'>Total Invoices Logged</p>
            <h3 className='text-xl font-bold font-mono text-foreground mt-0.5'>
              {count} <span className='text-xs font-normal text-muted-foreground'>Bills</span>
            </h3>
          </div>
          <div className='p-2.5 rounded-lg bg-blue-500/10 text-blue-600'>
            <Receipt className='h-4 w-4' />
          </div>
        </CardContent>
      </Card>

      {/* 4. Average Ticket */}
      <Card className='border-border/60 bg-card'>
        <CardContent className='p-4 flex items-center justify-between'>
          <div>
            <p className='text-xs font-medium text-muted-foreground'>Average Cost / Bill</p>
            <h3 className='flex items-center gap-1 text-xl font-bold font-mono text-foreground mt-0.5'>
              <span>{avgAmount.toLocaleString()}</span>
              <TomanIcon className='size-4 text-muted-foreground' />
            </h3>
          </div>
          <div className='p-2.5 rounded-lg bg-purple-500/10 text-purple-600'>
            <TrendingUp className='h-4 w-4' />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
