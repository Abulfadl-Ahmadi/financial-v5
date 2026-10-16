import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  Scissors, 
  Gauge, 
  Wrench,
  ArrowUpRight
} from 'lucide-react'

interface KpiCardsProps {
  netProfit: number
  totalRevenue: number
  totalOverhead: number
  activeOrdersCount: number
  inProductionPieces: number
  efficiencyScore: number
  activeMachines: number
  totalMachines: number
}

export function KpiCards({
  netProfit = 84500000,
  totalRevenue = 142000000,
  totalOverhead = 28500000,
  activeOrdersCount = 4,
  inProductionPieces = 1850,
  efficiencyScore = 83.3,
  activeMachines = 6,
  totalMachines = 10,
}: Partial<KpiCardsProps>) {
  const machineUtilization = Math.round((activeMachines / totalMachines) * 100)

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      {/* 1. Net Profit Card */}
      <Card className='relative overflow-hidden border-border/60 hover:shadow-md transition-shadow'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium text-muted-foreground'>
            Monthly Net Profit
          </CardTitle>
          <div className='p-2 bg-emerald-500/10 text-emerald-600 rounded-lg'>
            <TrendingUp className='h-4 w-4' />
          </div>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-emerald-600 dark:text-emerald-400'>
            {netProfit.toLocaleString()} <span className='text-xs font-normal text-muted-foreground'>Tomans</span>
          </div>
          <div className='mt-2 flex items-center justify-between text-xs text-muted-foreground'>
            <span>Rev: {totalRevenue.toLocaleString()} T (Costs: {totalOverhead.toLocaleString()} T)</span>
            <span className='inline-flex items-center text-emerald-600 font-medium'>
              <ArrowUpRight className='h-3 w-3 me-0.5' /> +14.8%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Active Sewing Orders */}
      <Card className='relative overflow-hidden border-border/60 hover:shadow-md transition-shadow'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium text-muted-foreground'>
            Active Contract Batches
          </CardTitle>
          <div className='p-2 bg-blue-500/10 text-blue-600 rounded-lg'>
            <Scissors className='h-4 w-4' />
          </div>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-foreground'>
            {activeOrdersCount} <span className='text-xs font-normal text-muted-foreground'>Batches</span>
          </div>
          <div className='mt-2 flex items-center justify-between text-xs text-muted-foreground'>
            <span>In Production: {inProductionPieces.toLocaleString()} pcs</span>
            <Badge variant='secondary' className='text-[10px] px-1.5 py-0'>
              6 Tailors Active
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 3. SAM Line Efficiency */}
      <Card className='relative overflow-hidden border-border/60 hover:shadow-md transition-shadow'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium text-muted-foreground'>
            SAM Line Efficiency
          </CardTitle>
          <div className='p-2 bg-amber-500/10 text-amber-600 rounded-lg'>
            <Gauge className='h-4 w-4' />
          </div>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-amber-600 dark:text-amber-400'>
            {efficiencyScore.toFixed(1)}%
          </div>
          <div className='mt-2 flex items-center justify-between text-xs text-muted-foreground'>
            <span>Target: 85.0%</span>
            <span className='text-xs text-muted-foreground'>12,000 / 14,400 min</span>
          </div>
        </CardContent>
      </Card>

      {/* 4. Machinery Utilization */}
      <Card className='relative overflow-hidden border-border/60 hover:shadow-md transition-shadow'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium text-muted-foreground'>
            Lockstitch Capacity Load
          </CardTitle>
          <div className='p-2 bg-purple-500/10 text-purple-600 rounded-lg'>
            <Wrench className='h-4 w-4' />
          </div>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-foreground'>
            {activeMachines} <span className='text-sm font-normal text-muted-foreground'>/ {totalMachines} Machines</span>
          </div>
          <div className='mt-2 flex items-center justify-between text-xs text-muted-foreground'>
            <div className='h-2 w-24 bg-secondary rounded-full overflow-hidden'>
              <div 
                className='h-full bg-purple-600 rounded-full' 
                style={{ width: `${machineUtilization}%` }}
              />
            </div>
            <span className='font-medium text-purple-600'>{machineUtilization}% Active</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
