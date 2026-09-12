import { EmptyState } from '@/components/ui/empty-state'
import type { PedidoGrafico } from '../schema'
import { CardPedido } from './card-pedido'

/**
 * Grid de pedidos — porta de renderizarListaPedidosGraficos(). O legado já
 * era cards em toda largura (não tabela no desktop), então não usa
 * ResponsiveList — layout único, só a densidade muda com o grid.
 */
export function ListaPedidos({
  pedidos,
  selecionados,
  onToggleSelecionado,
  onEditar,
  onEmitirOS,
  onCancelar,
  onAlternarEntrega,
}: {
  pedidos: PedidoGrafico[]
  selecionados: Set<number>
  onToggleSelecionado: (id: number, marcado: boolean) => void
  onEditar: (pedido: PedidoGrafico) => void
  onEmitirOS: (pedido: PedidoGrafico) => void
  onCancelar: (pedido: PedidoGrafico) => void
  onAlternarEntrega: (pedido: PedidoGrafico) => void
}) {
  if (pedidos.length === 0) {
    return <EmptyState title="Nenhum pedido encontrado" description='Clique em "Novo Pedido" para lançar o primeiro.' />
  }

  return (
    <div className="flex flex-col gap-3">
      {pedidos.map((pedido) => (
        <CardPedido
          key={pedido.id}
          pedido={pedido}
          selecionado={selecionados.has(pedido.id)}
          onToggleSelecionado={(marcado) => onToggleSelecionado(pedido.id, marcado)}
          onEditar={() => onEditar(pedido)}
          onEmitirOS={() => onEmitirOS(pedido)}
          onCancelar={() => onCancelar(pedido)}
          onAlternarEntrega={() => onAlternarEntrega(pedido)}
        />
      ))}
    </div>
  )
}
