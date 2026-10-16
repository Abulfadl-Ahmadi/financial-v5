import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Building,
  Zap,
  Droplets,
  Flame,
  Package,
  Wrench,
  Coffee,
  Sparkles,
} from 'lucide-react'

interface ExpenseItem {
  key: string
  title: string
  subtitle: string
  amount: number
  percentage: number
  icon: any
  color: string
  bgColor: string
}

const mockOverheadItems: ExpenseItem[] = [
  {
    key: 'RENT',
    title: 'Workshop Rent',
    subtitle: 'Monthly premises lease',
    amount: 12000000,
    percentage: 42.1,
    icon: Building,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
  },
  {
    key: 'ELECTRICITY',
    title: 'Electricity Utility',
    subtitle: '10 machines & iron boiler',
    amount: 3800000,
    percentage: 13.3,
    icon: Zap,
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
  },
  {
    key: 'SUPPLIES',
    title: 'Sewing Consumables',
    subtitle: 'Polyester spools, serger cones, needles, machine oil',
    amount: 3500000,
    percentage: 12.3,
    icon: Package,
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
  },
  {
    key: 'GAS',
    title: 'Gas Utility & Steam Boiler',
    subtitle: 'Industrial boiler & kitchen gas',
    amount: 2600000,
    percentage: 9.1,
    icon: Flame,
    color: 'text-orange-600',
    bgColor: 'bg-orange-500/10',
  },
  {
    key: 'MAINTENANCE',
    title: 'Maintenance & Repairs',
    subtitle: 'Boiler descaling, machine tune-ups, wiring/lighting',
    amount: 2400000,
    percentage: 8.4,
    icon: Wrench,
    color: 'text-red-600',
    bgColor: 'bg-red-500/10',
  },
  {
    key: 'WELFARE',
    title: 'Staff Welfare & Kitchen',
    subtitle: 'Tea, sugar, daily kitchen supplies for 7 workers',
    amount: 1800000,
    percentage: 6.3,
    icon: Coffee,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
  },
  {
    key: 'WATER',
    title: 'Water Utility',
    subtitle: 'Steam boiler water & sanitation',
    amount: 1400000,
    percentage: 4.9,
    icon: Droplets,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-500/10',
  },
  {
    key: 'CLEANING',
    title: 'Cleaning & Hygiene',
    subtitle: 'Workshop sanitation & waste disposal',
    amount: 1000000,
    percentage: 3.5,
    icon: Sparkles,
    color: 'text-teal-600',
    bgColor: 'bg-teal-500/10',
  },
]

export function OverheadBreakdownCard() {
  const totalOverhead = mockOverheadItems.reduce((acc, item) => acc + item.amount, 0)

  return (
    <Card className='border-border/60'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>Workshop Overhead & Operational Expenses</CardTitle>
            <CardDescription>
              Detailed cost allocation across rent, utilities, consumables, and maintenance
            </CardDescription>
          </div>
          <div className='text-right'>
            <div className='text-xl font-bold text-foreground'>
              {totalOverhead.toLocaleString()} <span className='text-xs font-normal text-muted-foreground'>Tomans</span>
            </div>
            <span className='text-xs text-muted-foreground'>Total Monthly Overhead</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Cumulative Multi-color Bar */}
        <div className='h-4 w-full flex rounded-full overflow-hidden mb-6 bg-muted'>
          {mockOverheadItems.map((item) => (
            <div
              key={item.key}
              style={{ width: `${item.percentage}%` }}
              className={`h-full transition-all duration-300 ${
                item.key === 'RENT'
                  ? 'bg-blue-500'
                  : item.key === 'ELECTRICITY'
                  ? 'bg-amber-500'
                  : item.key === 'SUPPLIES'
                  ? 'bg-purple-500'
                  : item.key === 'GAS'
                  ? 'bg-orange-500'
                  : item.key === 'MAINTENANCE'
                  ? 'bg-red-500'
                  : item.key === 'WELFARE'
                  ? 'bg-emerald-500'
                  : item.key === 'WATER'
                  ? 'bg-cyan-500'
                  : 'bg-teal-500'
              }`}
              title={`${item.title}: ${item.percentage}%`}
            />
          ))}
        </div>

        {/* Expense Grid Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
          {mockOverheadItems.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.key}
                className='flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-colors'
              >
                <div className={`p-2 rounded-lg ${item.bgColor} ${item.color} mt-0.5`}>
                  <Icon className='h-4 w-4' />
                </div>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center justify-between'>
                    <h4 className='text-xs font-semibold truncate'>{item.title}</h4>
                    <span className='text-[11px] font-mono font-medium text-muted-foreground'>
                      {item.percentage}%
                    </span>
                  </div>
                  <p className='text-[11px] text-muted-foreground truncate mb-1'>{item.subtitle}</p>
                  <p className='text-xs font-bold text-foreground'>
                    {item.amount.toLocaleString()} T
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
