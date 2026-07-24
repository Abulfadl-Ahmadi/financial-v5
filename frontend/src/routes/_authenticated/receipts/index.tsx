import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Receipts } from '@/features/receipts'

const receiptsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  tracking_code: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/receipts/')({
  validateSearch: receiptsSearchSchema,
  component: Receipts,
})
