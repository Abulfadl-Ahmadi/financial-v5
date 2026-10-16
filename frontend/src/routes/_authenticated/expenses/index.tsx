import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Expenses } from '@/features/expenses'

const expensesSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  title: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/expenses/')({
  validateSearch: expensesSearchSchema,
  component: Expenses,
})
