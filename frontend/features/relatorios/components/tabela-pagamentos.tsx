import { ResponsiveList, CardListItem } from '@/components/ui/responsive-list'
import { formatarMoeda } from '@/lib/formatters'
import type { RelatorioPagamentos } from '../schema'
import { BadgeStatusPagamento } from './badge-status-pagamento'

/** Tabela (desktop) / cards (mobile) do relatório de pagamentos. */
export function TabelaPagamentos({ pagamentos }: { pagamentos: RelatorioPagamentos['pagamentos'] }) {
  return (
    <ResponsiveList
      table={
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-text-muted">
              <th className="px-3 py-2 font-medium">Nº O.S.</th>
              <th className="px-3 py-2 font-medium">Empresa</th>
              <th className="px-3 py-2 font-medium">Módulo</th>
              <th className="px-3 py-2 font-medium">Vencimento</th>
              <th className="px-3 py-2 font-medium">Valor</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {pagamentos.map((p) => (
              <tr key={p.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-3 py-2 text-text">{p.numeroOS}</td>
                <td className="px-3 py-2 text-text-muted">{p.empresa}</td>
                <td className="px-3 py-2 text-text-muted">{p.modulo}</td>
                <td className="px-3 py-2 text-text-muted">{p.vencimento}</td>
                <td className="px-3 py-2 text-text">{formatarMoeda(p.valorTotal)}</td>
                <td className="px-3 py-2">
                  <BadgeStatusPagamento status={p.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      }
      cards={pagamentos.map((p) => (
        <CardListItem key={p.id}>
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-text">{p.numeroOS}</p>
            <BadgeStatusPagamento status={p.status} />
          </div>
          <p className="text-xs text-text-muted">
            {p.empresa} · {p.modulo}
          </p>
          <p className="mt-1 text-sm text-text">
            {formatarMoeda(p.valorTotal)} · Vence em {p.vencimento}
          </p>
        </CardListItem>
      ))}
    />
  )
}
