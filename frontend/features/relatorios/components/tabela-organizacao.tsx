import { ResponsiveList, CardListItem } from '@/components/ui/responsive-list'
import { formatarMoeda } from '@/lib/formatters'
import type { RelatorioOrganizacao } from '../schema'
import { BadgeStatusOS } from './badge-status-os'

/** Tabela (desktop) / cards (mobile) do relatório de eventos - Organização. */
export function TabelaOrganizacao({ eventos }: { eventos: RelatorioOrganizacao['eventos'] }) {
  return (
    <ResponsiveList
      table={
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-text-muted">
              <th className="px-3 py-2 font-medium">Nº O.S.</th>
              <th className="px-3 py-2 font-medium">Evento</th>
              <th className="px-3 py-2 font-medium">Grupo</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Pessoas</th>
              <th className="px-3 py-2 font-medium">Custo Total</th>
              <th className="px-3 py-2 font-medium">Por Pessoa</th>
            </tr>
          </thead>
          <tbody>
            {eventos.map((ev) => (
              <tr key={ev.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-3 py-2 text-text">{ev.numeroOS}</td>
                <td className="px-3 py-2 text-text">{ev.evento}</td>
                <td className="px-3 py-2 text-text-muted">{ev.grupoNome}</td>
                <td className="px-3 py-2">
                  <BadgeStatusOS status={ev.status} />
                </td>
                <td className="px-3 py-2 text-text-muted">{ev.qtdPessoas}</td>
                <td className="px-3 py-2 text-text">{formatarMoeda(ev.custoTotal)}</td>
                <td className="px-3 py-2 text-text-muted">{formatarMoeda(ev.custoPorPessoa)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
      cards={eventos.map((ev) => (
        <CardListItem key={ev.id}>
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-text">{ev.evento}</p>
            <BadgeStatusOS status={ev.status} />
          </div>
          <p className="text-xs text-text-muted">
            {ev.numeroOS} · {ev.grupoNome} · {ev.qtdPessoas} pessoas
          </p>
          <p className="mt-1 text-sm text-text">
            {formatarMoeda(ev.custoTotal)} ({formatarMoeda(ev.custoPorPessoa)}/pessoa)
          </p>
        </CardListItem>
      ))}
    />
  )
}
