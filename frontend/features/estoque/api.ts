import { apiFetch } from '@/lib/api'
import type { Modulo } from '@/features/modulos/config'
import { dadosAlimentacaoSchema, type DadosAlimentacao } from './schema'

export const estoqueAPI = {
  async listarPorModulo(modulo: Modulo): Promise<DadosAlimentacao> {
    const data = await apiFetch<unknown>('/api/alimentacao/', { modulo })
    return dadosAlimentacaoSchema.parse(data)
  },
}
