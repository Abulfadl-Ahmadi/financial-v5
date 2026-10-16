import { z } from 'zod'

export const expenseAccountSchema = z.object({
  id: z.number(),
  f_name: z.string().default(''),
  l_name: z.string().default(''),
  card_number: z.string().default(''),
  bank_name: z.string().default(''),
  formatted_card_number: z.string().default(''),
  user_full_name: z.string().nullable().optional(),
})

export const expenseSchema = z.object({
  id: z.number(),
  title: z.string().default(''),
  category: z.string().default('OTHER'),
  amount: z.number().or(z.string()),
  date_jalali: z.string().default(''),
  account: expenseAccountSchema.nullable().optional(),
  notes: z.string().nullable().optional().default(''),
  created_at: z.string().optional(),
})

export type Expense = z.infer<typeof expenseSchema>
