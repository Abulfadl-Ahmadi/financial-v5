import { z } from 'zod'

export const userAccountSchema = z.object({
  id: z.number(),
  is_primary: z.boolean().default(false),
  is_active: z.boolean().default(true),
  f_name: z.string().default(''),
  l_name: z.string().default(''),
  card_number: z.string().default(''),
  bank_name: z.string().default(''),
  formatted_card_number: z.string().default(''),
})

export const userSchema = z.object({
  id: z.number().or(z.string()),
  party_id: z.number().nullable().optional(),
  username: z.string(),
  first_name: z.string().optional().default(''),
  last_name: z.string().optional().default(''),
  email: z.string().nullable().optional().default(''),
  phone_number: z.string().nullable().optional().default(''),
  card_number: z.string().nullable().optional().default(''),
  brand_name: z.string().nullable().optional().default(''),
  role: z.string().default('user'),
  is_active: z.boolean().nullish(),
  status: z.string().optional().default('active'),
  bank_accounts: z.array(userAccountSchema).nullish(),
})

export type UserStatus = 'active' | 'inactive' | 'invited' | 'suspended' | string

export type User = z.infer<typeof userSchema>
