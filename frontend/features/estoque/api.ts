import { apiFetch } from '@/lib/api'
import type { Modulo } from '@/features/modulos/config'
import {
  dadosAlimentacaoSchema,
  itemEstoqueSchema,
  type AtualizarEstoquePayload,
  type DadosAlimentacao,
  type ItemEstoque,
  type NovoItemPayload,
} from './schema'

export const estoqueAPI = {
  async listarPorModulo(modulo: Modulo): Promise<DadosAlimentacao> {
    const data = await apiFetch<unknown>('/api/alimentacao/', { modulo })
    return dadosAlimentacaoSchema.parse(data)
  },

  /**
   * PUT /api/alimentacao/item/<id>/estoque — só admin no backend
   * (@admin_requerido). O payload nunca representa um delta: é o valor de
   * gasto/inicial/preço desejado por região; o backend é quem decide se
   * `gasto` muda como ajuste rastreável no ledger (ver plano § Domínio 3).
   */
  async atualizarEstoque(itemId: number, payload: AtualizarEstoquePayload): Promise<ItemEstoque> {
    const data = await apiFetch<unknown>(`/api/alimentacao/item/${itemId}/estoque`, {
      method: 'PUT',
      body: payload,
    })
    return itemEstoqueSchema.parse(data)
  },
}

/** Rotas de item vêm de itens_routes.py (blueprint distinto de alimentacao_routes.py). */
export const itensAPI = {
  async criar(payload: NovoItemPayload): Promise<ItemEstoque> {
    const data = await apiFetch<unknown>('/api/itens/', { method: 'POST', body: payload })
    return itemEstoqueSchema.parse(data)
  },

  excluir(itemId: number) {
    return apiFetch<{ mensagem: string }>(`/api/itens/${itemId}`, { method: 'DELETE' })
  },
}
