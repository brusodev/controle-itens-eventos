import { Skeleton } from '@/components/ui/skeleton'
import { useEstatisticasAuditoria } from '../hooks/use-estatisticas-auditoria'

/** Os 3 cards do topo — porta de .stats-grid (auditoria.html:430-443). */
export function CardsEstatisticas() {
  const { data, isLoading } = useEstatisticasAuditoria()

  const cards = [
    { titulo: 'Total de registros', valor: data?.total },
    { titulo: 'Últimas 24h', valor: data?.ultimas_24h },
    { titulo: 'Usuários ativos', valor: data?.usuarios_ativos.length },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.titulo} className="rounded-lg border border-border-subtle bg-surface p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{card.titulo}</p>
          {isLoading ? (
            <Skeleton className="mt-1 h-8 w-20" />
          ) : (
            <p className="mt-1 text-2xl font-bold text-text">{(card.valor ?? 0).toLocaleString('pt-BR')}</p>
          )}
        </div>
      ))}
    </div>
  )
}
