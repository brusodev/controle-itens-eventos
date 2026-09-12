import { apiFetch } from '@/lib/api'
import {
  pedidoGraficoSchema,
  resumoPedidosSchema,
  type FiltrosPedidos,
  type PedidoGrafico,
  type PedidoPayload,
  type ResumoPedidos,
} from './schema'

/** Domínio Pedidos/Orçamentos — porta de APIClient.*PedidosGraficos (api-client.js). */
export const pedidosGraficosAPI = {
  async listar(filtros: FiltrosPedidos): Promise<PedidoGrafico[]> {
    const params = new URLSearchParams()
    if (filtros.busca) params.set('busca', filtros.busca)
    if (filtros.status) params.set('status', filtros.status)
    if (filtros.atraso) params.set('atraso', filtros.atraso)
    const query = params.toString()
    const data = await apiFetch<unknown[]>(`/api/pedidos-graficos/${query ? `?${query}` : ''}`)
    return data.map((item) => pedidoGraficoSchema.parse(item))
  },

  async resumo(): Promise<ResumoPedidos> {
    const data = await apiFetch<unknown>('/api/pedidos-graficos/resumo')
    return resumoPedidosSchema.parse(data)
  },

  async obter(id: number): Promise<PedidoGrafico> {
    const data = await apiFetch<unknown>(`/api/pedidos-graficos/${id}`)
    return pedidoGraficoSchema.parse(data)
  },

  async criar(payload: PedidoPayload): Promise<PedidoGrafico> {
    const data = await apiFetch<unknown>('/api/pedidos-graficos/', { method: 'POST', body: payload })
    return pedidoGraficoSchema.parse(data)
  },

  async atualizar(id: number, payload: Partial<PedidoPayload>): Promise<PedidoGrafico> {
    const data = await apiFetch<unknown>(`/api/pedidos-graficos/${id}`, { method: 'PUT', body: payload })
    return pedidoGraficoSchema.parse(data)
  },

  async marcarEntrega(id: number, entregue: boolean): Promise<PedidoGrafico> {
    const data = await apiFetch<unknown>(`/api/pedidos-graficos/${id}/entrega`, {
      method: 'PUT',
      body: { entregue },
    })
    return pedidoGraficoSchema.parse(data)
  },

  async cancelar(id: number, motivo: string): Promise<PedidoGrafico> {
    const data = await apiFetch<unknown>(`/api/pedidos-graficos/${id}/cancelar`, {
      method: 'POST',
      body: { motivo },
    })
    return pedidoGraficoSchema.parse(data)
  },

  excluir(id: number) {
    return apiFetch<{ sucesso: boolean; mensagem: string }>(`/api/pedidos-graficos/${id}`, { method: 'DELETE' })
  },

  /** Vincula 1 pedido a uma O.S. já emitida — chamado logo após a criação da O.S. */
  async vincularOS(pedidoId: number, ordemServicoId: number): Promise<PedidoGrafico> {
    const data = await apiFetch<unknown>(`/api/pedidos-graficos/${pedidoId}/vincular-os`, {
      method: 'POST',
      body: { ordemServicoId },
    })
    return pedidoGraficoSchema.parse(data)
  },

  /**
   * Vincula VÁRIOS pedidos a uma mesma O.S. — vínculo many-to-one, N pedidos
   * podem apontar para a mesma ordem (backend valida tudo antes de gravar
   * qualquer um: um lote parcialmente aplicado deixaria pedidos órfãos).
   */
  async vincularOSLote(pedidoIds: number[], ordemServicoId: number) {
    return apiFetch<{ sucesso: boolean; ordemServicoId: number; numeroOS: string }>(
      '/api/pedidos-graficos/vincular-os-lote',
      { method: 'POST', body: { ordemServicoId, pedidoIds } },
    )
  },
}
