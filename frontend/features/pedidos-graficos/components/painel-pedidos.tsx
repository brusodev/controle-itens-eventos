'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import { ApiError } from '@/lib/api-error'
import { usePedidosGraficos } from '../hooks/use-pedidos-graficos'
import { useMarcarEntrega } from '../hooks/use-marcar-entrega'
import { EMPTY_FILTROS_PEDIDOS, type FiltrosPedidos, type PedidoGrafico } from '../schema'
import { BarraSelecao } from './barra-selecao'
import { FiltrosPedidosForm } from './filtros-pedidos'
import { ListaPedidos } from './lista-pedidos'
import { ModalCancelarPedido } from './modal-cancelar-pedido'
import { ModalPedido, type ModalPedidoState } from './modal-pedido'
import { ResumoPedidos } from './resumo-pedidos'

/**
 * Orquestra resumo + filtros + lista + seleção múltipla + modais — porta de
 * pedidos-graficos.js. A página só monta este componente.
 *
 * "Emitir O.S." (1 pedido) e "Emitir O.S. única" (N selecionados) gravam os
 * ids em sessionStorage e navegam para /os/nova, que os lê ao montar (mesmo
 * papel de _irParaEmissaoComPedidos() + restaurarPedidosParaOS() no legado,
 * mas via sessionStorage em vez de localStorage — o rascunho de O.S. já usa
 * localStorage por módulo, e esses ids são efêmeros: só servem para a
 * próxima navegação, nunca devem sobreviver a uma aba fechada e reaberta
 * depois sem intenção).
 */
export function PainelPedidos() {
  const router = useRouter()
  const { showToast } = useToast()
  const [filtros, setFiltros] = useState<FiltrosPedidos>(EMPTY_FILTROS_PEDIDOS)
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set())
  const [modal, setModal] = useState<ModalPedidoState>(null)
  const [cancelando, setCancelando] = useState<PedidoGrafico | null>(null)

  const { data: pedidos, isLoading, isError } = usePedidosGraficos(filtros)
  const marcarEntrega = useMarcarEntrega()

  function toggleSelecionado(id: number, marcado: boolean) {
    setSelecionados((atual) => {
      const novo = new Set(atual)
      if (marcado) novo.add(id)
      else novo.delete(id)
      return novo
    })
  }

  function irParaEmissao(ids: number[]) {
    sessionStorage.setItem('pedidosGraficosOrigemIds', JSON.stringify(ids))
    router.push('/os/nova')
  }

  function handleAlternarEntrega(pedido: PedidoGrafico) {
    marcarEntrega.mutate(
      { id: pedido.id, entregue: !pedido.entregue },
      {
        onSuccess: () => showToast(pedido.entregue ? 'Entrega desmarcada.' : 'Pedido marcado como entregue.'),
        onError: (error) => showToast(error instanceof ApiError ? error.message : 'Erro ao atualizar entrega.', 'error'),
      },
    )
  }

  const pedidosVisiveis = pedidos ?? []
  // Poda a seleção: só permanece marcado o que ainda está visível e pendente
  // — mesma regra de renderizarListaPedidosGraficos() (pedidos-graficos.js:104).
  const idsSelecionaveis = new Set(pedidosVisiveis.filter((p) => p.status === 'pendente').map((p) => p.id))
  const selecionadosValidos = new Set([...selecionados].filter((id) => idsSelecionaveis.has(id)))
  const totalEstimado = [...selecionadosValidos]
    .map((id) => pedidosVisiveis.find((p) => p.id === id))
    .reduce((soma, p) => soma + (p?.valorTotal ?? 0), 0)

  return (
    <div className="flex flex-col gap-4 pb-16">
      <ResumoPedidos />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FiltrosPedidosForm filtros={filtros} onChange={setFiltros} />
        <Button onClick={() => setModal({ mode: 'new' })} className="shrink-0">
          <Plus aria-hidden="true" className="size-4" strokeWidth={1.75} />
          Novo Pedido
        </Button>
      </div>

      {isError ? (
        <EmptyState title="Erro ao carregar pedidos" description="Tente novamente em alguns instantes." />
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <ListaPedidos
          pedidos={pedidosVisiveis}
          selecionados={selecionadosValidos}
          onToggleSelecionado={toggleSelecionado}
          onEditar={(pedido) => setModal({ mode: 'edit', data: pedido })}
          onEmitirOS={(pedido) => irParaEmissao([pedido.id])}
          onCancelar={setCancelando}
          onAlternarEntrega={handleAlternarEntrega}
        />
      )}

      <BarraSelecao
        quantidade={selecionadosValidos.size}
        totalEstimado={totalEstimado}
        onEmitirOS={() => irParaEmissao([...selecionadosValidos])}
        onLimpar={() => setSelecionados(new Set())}
      />

      <ModalPedido state={modal} onClose={() => setModal(null)} />
      <ModalCancelarPedido pedido={cancelando} onClose={() => setCancelando(null)} />
    </div>
  )
}
