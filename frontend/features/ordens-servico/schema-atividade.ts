import { z } from 'zod'

/** Espelha ComentarioEmpresa.to_dict() em backend/models.py:733. */
export const comentarioSchema = z.object({
  id: z.number(),
  texto: z.string(),
  criadoEm: z.string().nullable(),
  autorPerfil: z.enum(['admin', 'comum', 'empresa']).nullable(),
  autorNome: z.string().nullable(),
})

export const revisaoSchema = z.object({
  id: z.number(),
  motivo: z.string().nullable().optional(),
  criadoEm: z.string().nullable().optional(),
})

export const aceiteSchema = z.object({
  id: z.number(),
})

export const atividadePortalSchema = z.object({
  os_id: z.number(),
  status: z.string(),
  numero_os: z.string().nullable(),
  evento: z.string().nullable(),
  revisoes: z.array(revisaoSchema.passthrough()),
  comentarios: z.array(comentarioSchema),
  aceites: z.array(aceiteSchema.passthrough()),
})

export type Comentario = z.infer<typeof comentarioSchema>
export type AtividadePortal = z.infer<typeof atividadePortalSchema>
