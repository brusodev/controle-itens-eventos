import { z } from 'zod'

/** Espelha Detentora.to_dict() em backend/models.py:167. */
export const detentoraSchema = z.object({
  id: z.number(),
  contratoNum: z.string(),
  dataAssinatura: z.string(),
  prazoVigencia: z.string(),
  nome: z.string(),
  cnpj: z.string(),
  servico: z.string(),
  modulo: z.string().optional(),
  grupo: z.string(),
  ativo: z.boolean(),
})

export type Detentora = z.infer<typeof detentoraSchema>
