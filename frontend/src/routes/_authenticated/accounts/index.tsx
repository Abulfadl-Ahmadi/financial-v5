import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Accounts } from '@/features/accounts'

const accountsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  fullName: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/accounts/')({
  validateSearch: accountsSearchSchema,
  component: Accounts,
})
