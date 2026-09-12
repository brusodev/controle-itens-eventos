'use client'

import { CheckCircle2, FileText, Pencil, RotateCcw, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CardListItem } from '@/components/ui/responsive-list'
import { classificarUrgencia } from '../urgencia'
import { formatarDataSimples, formatarMoeda } from '@/lib/formatters'
import type { PedidoGrafico } from '../schema'
import { BadgeUrgencia } from './badge-urgencia'

/**
 * Um pedido — porta de renderizarListaPedidosGraficos() (pedidos-graficos.js:
 * 109-166), que montava innerHTML sem escape para solicitante/descrição/setor.
 * Aqui a interpolação vira JSX puro.
 */
export function CardPedido({
  pedido,
  selecionado,
  onToggleSelecionado,
  onEditar,
  onEmitirOS,
  onCancelar,
  onAlternarEntrega,
}: {
  pedido: PedidoGrafico
  selecionado: boolean
  onToggleSelecionado: (marcado: boolean) => void
  onEditar: () => void
  onEmitirOS: () => void
  onCancelar: () => void
  onAlternarEntrega: () => void
}) {
  const urgencia = classificarUrgencia(pedido)
  const selecionavel = pedido.status === 'pendente'

  return (
    <CardListItem className={selecionado ? 'border-2 border-info' : undefined}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          {selecionavel ? (
            <input
              type="checkbox"
              checked={selecionado}
              onChange={(e) => onToggleSelecionado(e.target.checked)}
              title="Selecionar para emitir uma O.S. única"
              className="mt-0.5 size-4.5 shrink-0 accent-info"
            />
          ) : (
            <span className="w-4.5 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold text-text">{pedido.solicitante}</p>
            <p className="text-sm text-text-muted">{pedido.descricao}</p>
            <p className="mt-1 text-xs text-text-muted">
              {pedido.dataPedido && `Pedido em ${formatarDataSimples(pedido.dataPedido)}`}
              {pedido.prazoEntrega ? ` · Prazo: ${formatarDataSimples(pedido.prazoEntrega)}` : ' · Sem prazo definido'}
              {pedido.setorSolicitante && ` · Setor: ${pedido.setorSolicitante}`}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-bold text-indigo">{formatarMoeda(pedido.valorTotal)}</p>
          <div className="mt-1">
            <BadgeUrgencia urgencia={urgencia} />
          </div>
          <p className="mt-1 text-xs text-text-muted">
            {pedido.statusLabel}
            {pedido.numeroOS && ` · ${pedido.numeroOS}`}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-border-subtle pt-3">
        {pedido.status === 'pendente' && (
          <>
            <Button variant="ghost" size="sm" onClick={onEditar}>
              <Pencil aria-hidden="true" className="size-4" strokeWidth={1.75} />
              Editar
            </Button>
            <Button variant="ghost" size="sm" onClick={onEmitirOS}>
              <FileText aria-hidden="true" className="size-4" strokeWidth={1.75} />
              Emitir O.S.
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancelar} className="text-danger-strong hover:bg-danger-subtle">
              <XCircle aria-hidden="true" className="size-4" strokeWidth={1.75} />
              Cancelar
            </Button>
          </>
        )}
        {pedido.status !== 'cancelado' && (
          <Button variant="ghost" size="sm" onClick={onAlternarEntrega}>
            {pedido.entregue ? (
              <RotateCcw aria-hidden="true" className="size-4" strokeWidth={1.75} />
            ) : (
              <CheckCircle2 aria-hidden="true" className="size-4" strokeWidth={1.75} />
            )}
            {pedido.entregue ? 'Desmarcar entrega' : 'Marcar como entregue'}
          </Button>
        )}
      </div>
    </CardListItem>
  )
}
