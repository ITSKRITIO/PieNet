import { z } from 'zod'

export const usernameSchema = z
  .string({ required_error: 'Choose a username' })
  .trim()
  .regex(/^[A-Za-z0-9_]{3,24}$/, 'Use 3–24 letters, numbers or underscores')

export const passwordSchema = z
  .string({ required_error: 'Enter a password' })
  .min(8, 'Use at least 8 characters')
  .max(64, 'Use 64 characters or fewer')

export const signupSchema = z
  .object({
    username: usernameSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    inviteCode: z.string().max(200).optional(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Enter your username').max(24),
  password: z.string().min(1, 'Enter your password').max(128),
  adminCode: z.string().max(200).optional(),
})

export const profileSchema = z.object({
  username: usernameSchema.optional(),
  bio: z.string().trim().max(300, 'Keep your bio under 300 characters').optional(),
})

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password').max(128),
  newPassword: passwordSchema,
})

export const chatMessageSchema = z.object({
  content: z.string().trim().min(1, 'Write a message first').max(500, 'Messages can be up to 500 characters'),
})

export const planSchema = z
  .object({
    title: z.string().trim().min(1, 'Give the plan a title').max(120),
    description: z.string().trim().max(2000).default(''),
    location: z.string().trim().max(160).default(''),
    startsAt: z.coerce.date({ invalid_type_error: 'Choose a date and time' }),
    endsAt: z.coerce.date().nullable().optional(),
  })
  .refine((v) => !v.endsAt || v.endsAt > v.startsAt, { path: ['endsAt'], message: 'End time must be after the start' })

export const attendSchema = z.object({ status: z.enum(['GOING', 'MAYBE']).nullable() })

export const announcementSchema = z.object({
  title: z.string().trim().min(1, 'Add a title').max(140),
  content: z.string().trim().min(1, 'Write the announcement').max(5000),
  pinned: z.boolean().optional(),
})

export const albumSchema = z.object({
  name: z.string().trim().min(1, 'Name the album').max(80),
  description: z.string().trim().max(500).default(''),
})

export const adminUserSchema = z.object({
  disabled: z.boolean().optional(),
  newPassword: passwordSchema.optional(),
})

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex color like #38bdf8')

export const NAV_IDS = ['home', 'chat', 'plans', 'announcements', 'memories', 'members'] as const
export const HOME_SECTION_IDS = ['chat', 'plans', 'announcements', 'memories'] as const

export const settingsShape = {
  siteName: z.string().trim().min(1).max(30),
  slogan: z.string().trim().min(1).max(80),
  showLogo: z.boolean(),
  logoMark: z.string().trim().min(1).max(3),
  accentColor: hex,
  backgroundColor: hex,
  textColor: hex,
  mutedColor: hex,
  nav: z.object(Object.fromEntries(NAV_IDS.map((id) => [id, z.boolean()])) as Record<(typeof NAV_IDS)[number], z.ZodBoolean>),
  homeSections: z.object(
    Object.fromEntries(HOME_SECTION_IDS.map((id) => [id, z.boolean()])) as Record<(typeof HOME_SECTION_IDS)[number], z.ZodBoolean>,
  ),
  signupEnabled: z.boolean(),
  membersCanAnnounce: z.boolean(),
}
export const settingsSchema = z.object(settingsShape)
export const settingsUpdateSchema = settingsSchema.partial().strict()
export type SiteSettings = z.infer<typeof settingsSchema>
