import { z } from 'zod'

export const accountSchema = z.object({
  id: z.number(),
  owner_id: z.number().nullable().optional(),
  is_primary: z.boolean().default(false),
  is_active: z.boolean().default(true),
  f_name: z.string().default(''),
  l_name: z.string().default(''),
  card_number: z.string().default(''),
  bank_name: z.string().default(''),
  formatted_card_number: z.string().default(''),
  user_id: z.number().optional().nullable(),
  user_role: z.string().optional().nullable(),
  user_full_name: z.string().optional().nullable(),
  is_workshop: z.boolean().default(false),
})

export type Account = z.infer<typeof accountSchema>
