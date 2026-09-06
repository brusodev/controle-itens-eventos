import { z } from 'zod'

/** Espelha Usuario.to_dict() em backend/models.py:531. */
export const usuarioSchema = z.object({
  id: z.number(),
  nome: z.string(),
  email: z.string(),
  cargo: z.string().nullable(),
  perfil: z.enum(['admin', 'comum', 'empresa']),
  detentora_id: z.number().nullable(),
  ativo: z.boolean(),
  modulosPermitidos: z.array(z.string()),
})

export type Usuario = z.infer<typeof usuarioSchema>
export type Perfil = Usuario['perfil']
