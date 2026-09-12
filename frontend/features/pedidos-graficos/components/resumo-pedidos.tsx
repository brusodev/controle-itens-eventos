import { Skeleton } from '@/components/ui/skeleton'
import { useResumoPedidos } from '../hooks/use-resumo-pedidos'

/** Os 4 cards de alerta — porta de renderizarResumoPedidosGraficos() (pedidos-graficos.js:37). */
export function ResumoPedidos() {
  const { data, isLoading } = useResumoPedidos()

  const cards = [
    { label: 'Em aberto', valor: data?.pendentes, cor: 'border-info text-info' },
    { label: 'Atrasados', valor: data?.atrasados, cor: 'border-danger text-danger' },
    { label: 'Vencendo em breve', valor: data?.vencendoEmBreve, cor: 'border-warning text-warning' },
    { label: 'Aguardando entrega', valor: data?.aguardandoEntrega, cor: 'border-purple text-purple' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-lg border-l-4 bg-surface p-3 shadow-sm ${card.cor}`}>
          {isLoading ? (
            <Skeleton className="h-7 w-10" />
          ) : (
            <p className="text-xl font-bold">{card.valor ?? 0}</p>
          )}
          <p className="text-xs text-text-muted">{card.label}</p>
        </div>
      ))}
    </div>
  )
}
