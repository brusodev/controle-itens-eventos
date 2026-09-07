import { z } from 'zod'
import { MODULOS } from '@/features/modulos/config'

/**
 * Espelha Detentora.to_dict() em backend/models.py:167. `id` é opcional
 * porque o mesmo schema serve de formulário de criação (sem id) — igual ao
 * padrão OSForm/OSPersistida em features/ordens-servico/schema.ts.
 */
export const detentoraSchema = z.object({
  id: z.number().optional(),
  contratoNum: z.string().min(1, 'Número do contrato é obrigatório.'),
  dataAssinatura: z.string().nullable().optional(),
  prazoVigencia: z.string().nullable().optional(),
  nome: z.string().min(1, 'Nome é obrigatório.'),
  cnpj: z.string().min(1, 'CNPJ é obrigatório.'),
  servico: z.string().nullable().optional(),
  modulo: z.enum(MODULOS),
  grupo: z.string().min(1, 'Grupo é obrigatório.'),
  ativo: z.boolean(),
})

export type DetentoraForm = z.infer<typeof detentoraSchema>
export type Detentora = DetentoraForm & { id: number }

/** `EMPTY_DETENTORA` fora do componente — reset limpo do modal. */
export const EMPTY_DETENTORA: DetentoraForm = {
  contratoNum: '',
  dataAssinatura: null,
  prazoVigencia: '',
  nome: '',
  cnpj: '',
  servico: '',
  modulo: 'coffee',
  grupo: '',
  ativo: true,
}

/** Serviço padrão por módulo ao abrir "Nova Detentora" — porta de abrirModalNova() em gerenciar-detentoras.html:271-281. */
export const SERVICO_PADRAO_POR_MODULO: Partial<Record<(typeof MODULOS)[number], string>> = {
  coffee: 'COFFEE BREAK',
  transporte: 'SERVIÇOS DE TRANSPORTE',
  organizacao: 'ORGANIZAÇÃO DE EVENTOS',
  hospedagem: 'HOSPEDAGEM',
}
