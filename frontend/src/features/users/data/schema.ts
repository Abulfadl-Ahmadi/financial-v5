import { z } from 'zod'

export const userSchema = z.object({
  id: z.number().or(z.string()),
  username: z.string(),
  first_name: z.string().optional().default(''),
  last_name: z.string().optional().default(''),
  email: z.string().nullable().optional().default(''),
  phone_number: z.string().nullable().optional().default(''),
  card_number: z.string().nullable().optional().default(''),
  brand_name: z.string().nullable().optional().default(''),
  role: z.string().default('user'),
  status: z.string().optional().default('active'),
})

export type User = z.infer<typeof userSchema>
