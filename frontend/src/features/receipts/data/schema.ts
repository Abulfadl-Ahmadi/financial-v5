import { z } from 'zod'

export const receiptAccountSchema = z.object({
  id: z.number(),
  f_name: z.string().default(''),
  l_name: z.string().default(''),
  card_number: z.string().default(''),
  bank_name: z.string().default(''),
  formatted_card_number: z.string().default(''),
})

export const receiptSchema = z.object({
  id: z.number(),
  tracking_code: z.string().default(''),
  date_jalali: z.string().default(''),
  time_str: z.string().nullable().optional().default(''),
  atm_id: z.string().nullable().optional().default(''),
  recovery_code: z.string().nullable().optional().default(''),
  from_account: receiptAccountSchema,
  to_account: receiptAccountSchema,
  amount: z.number().or(z.string()),
  receipt_type: z.string().default('OTHER'),
  status: z.string().default('VERIFIED'),
  notes: z.string().nullable().optional().default(''),
  created_at: z.string().optional(),
})

export type Receipt = z.infer<typeof receiptSchema>
