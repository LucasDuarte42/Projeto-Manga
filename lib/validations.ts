import { z } from 'zod'

const boundedText = (max: number) =>
  z.string().trim().max(max, `Máximo de ${max} caracteres`)

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, 'Email muito longo')
  .email('Email inválido')

export const passwordSchema = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .max(128, 'Senha muito longa')
  .regex(/[A-Z]/, 'Deve conter pelo menos uma letra maiúscula')
  .regex(/[0-9]/, 'Deve conter pelo menos um número')
  .regex(/[^a-zA-Z0-9]/, 'Deve conter pelo menos um caractere especial')

export const registerSchema = z.object({
  name: boundedText(100).min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: emailSchema,
  password: passwordSchema,
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha obrigatória').max(128, 'Senha muito longa'),
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, 'Token obrigatório').max(128, 'Token inválido'),
  password: passwordSchema,
})

const optionalText = (max: number) =>
  z.string().trim().max(max).nullable().optional()

const coverUrlSchema = z
  .string()
  .trim()
  .url('URL da capa inválida')
  .max(2048, 'URL da capa muito longa')
  .refine((value) => {
    try {
      return new URL(value).protocol === 'https:'
    } catch {
      return false
    }
  }, 'A capa deve usar HTTPS')
  .nullable()
  .optional()

const positiveInt = z.number().int().min(0).max(100000)

export const mangaCreateSchema = z.object({
  name: boundedText(200).min(1, 'Nome obrigatório'),
  author: optionalText(200),
  coverUrl: coverUrlSchema,
  volume: positiveInt.optional().default(1),
  totalVolumes: positiveInt.nullable().optional(),
  totalChapters: positiveInt.nullable().optional(),
  status: z.enum(['READ', 'READING', 'WANT_TO_READ']).optional().default('WANT_TO_READ'),
  isInWishlist: z.boolean().optional().default(false),
  note: z.number().min(0).max(10).nullable().optional(),
  genre: optionalText(100),
  collectionType: z.enum(['MANGA', 'HQ']).optional().default('MANGA'),
})

export const mangaUpdateSchema = z.object({
  name: boundedText(200).min(1).optional(),
  author: optionalText(200),
  coverUrl: coverUrlSchema,
  volume: positiveInt.optional(),
  totalVolumes: positiveInt.nullable().optional(),
  totalChapters: positiveInt.nullable().optional(),
  readChapters: z.array(z.number().int().min(1).max(100000)).max(100000).optional(),
  ownedVolumes: z.array(z.number().int().min(1).max(100000)).max(10000).optional(),
  status: z.enum(['READ', 'READING', 'WANT_TO_READ']).optional(),
  isInWishlist: z.boolean().optional(),
  note: z.number().min(0).max(10).nullable().optional(),
  genre: optionalText(100),
})

export const volumeRatingSchema = z.object({
  volume: z.number().int().min(1).max(100000),
  note: z.number().min(0).max(10),
})

export const chapterRatingSchema = z.object({
  chapter: z.number().int().min(1).max(100000),
  note: z.number().min(0).max(10),
})

export const volumeStatusSchema = z.object({
  volume: z.number().int().min(1).max(100000),
  status: z.enum(['MISSING', 'OWNED', 'READ', 'LOANED']),
  loanedTo: z.string().trim().max(120, 'Nome muito longo').nullable().optional(),
  dueDate: z.string().datetime({ offset: true }).nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.status === 'LOANED' && !data.loanedTo) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['loanedTo'], message: 'Informe para quem o volume foi emprestado' })
  }
  if (data.status !== 'LOANED' && (data.loanedTo || data.dueDate)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['status'], message: 'Dados de empréstimo só podem ser usados com o status emprestado' })
  }
})

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1, 'Query obrigatória').max(100, 'Query muito longa'),
})

export const featuredMangaSchema = z.object({
  mangaIds: z.array(z.string().trim().min(1).max(50)).max(3, 'Escolha no máximo três obras')
    .refine((ids) => new Set(ids).size === ids.length, 'Não repita obras nos destaques'),
})

export const profileAvatarSchema = z.object({
  avatarUrl: z.string().regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/, 'Formato de imagem inválido').max(700_000, 'A imagem deve ter no máximo 512 KB').nullable(),
})

export const mangaListQuerySchema = z.object({
  q: z.string().trim().max(100, 'Busca muito longa').optional().default(''),
  author: z.string().trim().max(100, 'Autor muito longo').optional().default(''),
  genre: z.string().trim().max(100, 'Gênero muito longo').optional().default(''),
  status: z.enum(['ALL', 'READ', 'READING', 'WANT_TO_READ', 'MISSING']).optional().default('ALL'),
  collectionType: z.enum(['ALL', 'MANGA', 'HQ']).optional().default('ALL'),
  progress: z.enum(['ALL', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETE']).optional().default('ALL'),
  volumes: z.enum(['ALL', 'MISSING', 'COMPLETE']).optional().default('ALL'),
  sort: z.enum(['RECENT', 'AZ', 'ZA']).optional().default('RECENT'),
  page: z.coerce.number().int().min(1).max(100000).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(20),
})
