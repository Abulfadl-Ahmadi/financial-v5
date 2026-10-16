import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'

const monthlyData = [
  { month: 'Farvardin', revenue: 95, payroll: 32, overhead: 18, netProfit: 45 },
  { month: 'Ordibehesht', revenue: 110, payroll: 38, overhead: 20, netProfit: 52 },
  { month: 'Khordad', revenue: 125, payroll: 42, overhead: 22, netProfit: 61 },
  { month: 'Tir', revenue: 118, payroll: 40, overhead: 21, netProfit: 57 },
  { month: 'Mordad', revenue: 135, payroll: 46, overhead: 24, netProfit: 65 },
  { month: 'Shahrivar', revenue: 148, payroll: 50, overhead: 26, netProfit: 72 },
  { month: 'Mehr', revenue: 130, payroll: 44, overhead: 23, netProfit: 63 },
  { month: 'Aban', revenue: 142, payroll: 48, overhead: 25, netProfit: 69 },
  { month: 'Azar', revenue: 155, payroll: 52, overhead: 27, netProfit: 76 },
  { month: 'Dey', revenue: 138, payroll: 46, overhead: 24, netProfit: 68 },
  { month: 'Bahman', revenue: 165, payroll: 55, overhead: 28, netProfit: 82 },
  { month: 'Esfand', revenue: 180, payroll: 60, overhead: 30, netProfit: 90 },
]

export function RevenueExpensesChart() {
  return (
    <div className='w-full h-[360px] pt-4'>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart
          data={monthlyData}
          margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
          barCategoryGap='20%'
        >
          <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='#e5e7eb' opacity={0.3} />
          <XAxis
            dataKey='month'
            stroke='#888888'
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke='#888888'
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${val}M`}
          />
          <Tooltip
            formatter={(value: any, name: any) => [
              `${Number(value).toLocaleString()} Million Tomans`,
              name === 'revenue'
                ? 'Contract Revenue'
                : name === 'payroll'
                ? 'Tailors Payroll'
                : name === 'overhead'
                ? 'Operating Overhead'
                : 'Net Profit',
            ]}
            contentStyle={{
              backgroundColor: '#1f2937',
              borderColor: '#374151',
              borderRadius: '8px',
              color: '#f9fafb',
              fontSize: '12px',
            }}
          />
          <Legend
            verticalAlign='top'
            height={36}
            formatter={(value) => {
              const labels: Record<string, string> = {
                revenue: 'Contract Revenue',
                payroll: 'Tailor Payroll',
                overhead: 'Overhead Costs',
                netProfit: 'Net Profit',
              }
              return <span className='text-xs font-medium text-foreground'>{labels[value] || value}</span>
            }}
          />
          <Bar dataKey='revenue' fill='#3b82f6' radius={[4, 4, 0, 0]} name='revenue' />
          <Bar dataKey='payroll' fill='#f97316' radius={[4, 4, 0, 0]} name='payroll' />
          <Bar dataKey='overhead' fill='#ef4444' radius={[4, 4, 0, 0]} name='overhead' />
          <Bar dataKey='netProfit' fill='#10b981' radius={[4, 4, 0, 0]} name='netProfit' />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
