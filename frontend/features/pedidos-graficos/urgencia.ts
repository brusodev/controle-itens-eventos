import type { PedidoGrafico } from './schema'

/**
 * Classificação de urgência de um pedido — porta fiel de
 * classificarUrgenciaPedido() (pedidos-graficos.js:57-68).
 *
 * `cancelado` e `concluido` (entregue) vencem qualquer prazo — um pedido
 * cancelado não é "atrasado" mesmo com prazoEntrega no passado.
 */
export type Urgencia = 'atrasado' | 'vencendo' | 'ok' | 'sem_prazo' | 'concluido' | 'cancelado'

const DIAS_VENCENDO_EM_BREVE = 3

export function classificarUrgencia(pedido: Pick<PedidoGrafico, 'status' | 'entregue' | 'prazoEntrega'>, hoje = new Date()): Urgencia {
  if (pedido.status === 'cancelado') return 'cancelado'
  if (pedido.entregue) return 'concluido'
  if (!pedido.prazoEntrega) return 'sem_prazo'

  const hojeSemHora = new Date(hoje)
  hojeSemHora.setHours(0, 0, 0, 0)
  const prazo = new Date(`${pedido.prazoEntrega}T00:00:00`)
  const diffDias = Math.round((prazo.getTime() - hojeSemHora.getTime()) / 86_400_000)

  if (diffDias < 0) return 'atrasado'
  if (diffDias <= DIAS_VENCENDO_EM_BREVE) return 'vencendo'
  return 'ok'
}

export const LABEL_URGENCIA: Record<Urgencia, string> = {
  atrasado: 'Atrasado',
  vencendo: 'Vencendo em breve',
  ok: 'No prazo',
  sem_prazo: 'Sem prazo definido',
  concluido: 'Entregue',
  cancelado: 'Cancelado',
}
