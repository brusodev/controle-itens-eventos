import { z } from 'zod'

/**
 * Domínio Pedidos/Orçamentos (Serviços Gráficos) — etapa anterior à emissão
 * de O.S., porta de pedidos-graficos.js + templates/index.html (aba
 * `tab-pedidos-graficos`). Reservado ao módulo `servicos_graficos`
 * (backend: @modulo_permitido_requerido em pedidos_graficos_routes.py).
 *
 * Espelha PedidoGrafico.to_dict() / ItemPedidoGrafico.to_dict()
 * (backend/models.py:844-903).
 */

export const STATUS_PEDIDO = ['pendente', 'convertido', 'cancelado'] as const
export type StatusPedido = (typeof STATUS_PEDIDO)[number]

export const LABEL_STATUS_PEDIDO: Record<StatusPedido, string> = {
  pendente: 'Pendente',
  convertido: 'Convertido em O.S.',
  cancelado: 'Cancelado',
}

export const itemPedidoSchema = z.object({
  id: z.number().optional(), // presente só em itens já persistidos
  itemId: z.number(),
  categoria: z.string().nullable(),
  descricao: z.string().nullable(),
  unidade: z.string().nullable(),
  quantidade: z.number(),
  valorUnit: z.string(), // string BR, snapshot no momento da criação (backend)
})
export type ItemPedido = z.infer<typeof itemPedidoSchema>

export const pedidoGraficoSchema = z.object({
  id: z.number(),
  dataPedido: z.string().nullable(),
  solicitante: z.string(),
  descricao: z.string(),
  setorSolicitante: z.string().nullable(),
  prazoEntrega: z.string().nullable(),
  status: z.enum(STATUS_PEDIDO),
  statusLabel: z.string(),
  entregue: z.boolean(),
  dataEntregaEfetiva: z.string().nullable(),
  ordemServicoId: z.number().nullable(),
  numeroOS: z.string().nullable(),
  observacoes: z.string().nullable(),
  usuarioCriadorId: z.number(),
  criadoEm: z.string().nullable(),
  atualizadoEm: z.string().nullable(),
  motivoCancelamento: z.string().nullable(),
  valorTotal: z.number(),
  itens: z.array(itemPedidoSchema).optional(), // ausente em listar() (incluir_itens=false)
})
export type PedidoGrafico = z.infer<typeof pedidoGraficoSchema>

/** GET /api/pedidos-graficos/resumo (auth_routes.py:167-198) — cards do painel de alertas. */
export const resumoPedidosSchema = z.object({
  pendentes: z.number(),
  atrasados: z.number(),
  vencendoEmBreve: z.number(),
  aguardandoEntrega: z.number(),
})
export type ResumoPedidos = z.infer<typeof resumoPedidosSchema>

/** Filtros da listagem — os 3 do legado (busca, status, atraso). */
export interface FiltrosPedidos {
  busca: string
  status: string
  atraso: string
}
export const EMPTY_FILTROS_PEDIDOS: FiltrosPedidos = { busca: '', status: '', atraso: '' }

/**
 * Formulário de criar/editar — porta de #pg-* (pedidos-graficos.js:388-410).
 * `itens` pode ficar vazio: "o pedido pode ser salvo sem itens e detalhado
 * depois" (comentário do próprio legado).
 */
export const pedidoFormSchema = z.object({
  dataPedido: z.string(),
  prazoEntrega: z.string(),
  solicitante: z.string().trim().min(1, 'Solicitante é obrigatório.'),
  setorSolicitante: z.string(),
  descricao: z.string().trim().min(1, 'Descrição é obrigatória.'),
  observacoes: z.string(),
  itens: z.array(
    z.object({
      itemId: z.number(),
      categoria: z.string().nullable(),
      descricao: z.string().nullable(),
      unidade: z.string().nullable(),
      quantidade: z.number().positive(),
      valorUnit: z.string(),
    }),
  ),
})
export type PedidoForm = z.infer<typeof pedidoFormSchema>

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function emptyPedidoForm(): PedidoForm {
  return {
    dataPedido: hojeISO(),
    prazoEntrega: '',
    solicitante: '',
    setorSolicitante: '',
    descricao: '',
    observacoes: '',
    itens: [],
  }
}

export function pedidoParaForm(pedido: PedidoGrafico): PedidoForm {
  return {
    dataPedido: pedido.dataPedido ?? hojeISO(),
    prazoEntrega: pedido.prazoEntrega ?? '',
    solicitante: pedido.solicitante,
    setorSolicitante: pedido.setorSolicitante ?? '',
    descricao: pedido.descricao,
    observacoes: pedido.observacoes ?? '',
    itens: (pedido.itens ?? []).map((i) => ({
      itemId: i.itemId,
      categoria: i.categoria,
      descricao: i.descricao,
      unidade: i.unidade,
      quantidade: i.quantidade,
      valorUnit: i.valorUnit,
    })),
  }
}

/** Payload de POST /api/pedidos-graficos/ e PUT /api/pedidos-graficos/<id>. */
export interface PedidoPayload {
  dataPedido: string | null
  prazoEntrega: string | null
  solicitante: string
  setorSolicitante: string | null
  descricao: string
  observacoes: string | null
  itens: { itemId: number; categoria: string | null; descricao: string | null; unidade: string | null; quantidade: number }[]
}

export function formParaPayload(dados: PedidoForm): PedidoPayload {
  return {
    dataPedido: dados.dataPedido || null,
    prazoEntrega: dados.prazoEntrega || null,
    solicitante: dados.solicitante,
    setorSolicitante: dados.setorSolicitante.trim() || null,
    descricao: dados.descricao,
    observacoes: dados.observacoes.trim() || null,
    itens: dados.itens.map((i) => ({
      itemId: i.itemId,
      categoria: i.categoria,
      descricao: i.descricao,
      unidade: i.unidade,
      quantidade: i.quantidade,
    })),
  }
}
