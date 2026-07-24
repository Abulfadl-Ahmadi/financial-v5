import { z } from 'zod'

export const accountSchema = z.object({
  id: z.number(),
  f_name: z.string().default(''),
  l_name: z.string().default(''),
  card_number: z.string().default(''),
  bank_name: z.string().default(''),
  formatted_card_number: z.string().default(''),
})

export type Account = z.infer<typeof accountSchema>
