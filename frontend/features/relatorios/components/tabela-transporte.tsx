import { ResponsiveList, CardListItem } from '@/components/ui/responsive-list'
import { formatarMoeda } from '@/lib/formatters'
import type { RelatorioTransporte } from '../schema'
import { BadgeStatusOS } from './badge-status-os'

/** Tabela (desktop) / cards (mobile) do relatório de transporte por setor. */
export function TabelaTransporte({ ordens }: { ordens: RelatorioTransporte['ordens'] }) {
  return (
    <ResponsiveList
      table={
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-text-muted">
              <th className="px-3 py-2 font-medium">Nº O.S.</th>
              <th className="px-3 py-2 font-medium">Setor</th>
              <th className="px-3 py-2 font-medium">Evento</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Valor</th>
            </tr>
          </thead>
          <tbody>
            {ordens.map((os) => (
              <tr key={os.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-3 py-2 text-text">{os.numeroOS}</td>
                <td className="px-3 py-2 text-text-muted">{os.setor}</td>
                <td className="px-3 py-2 text-text">{os.evento}</td>
                <td className="px-3 py-2">
                  <BadgeStatusOS status={os.status} />
                </td>
                <td className="px-3 py-2 text-text">{formatarMoeda(os.valorTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
      cards={ordens.map((os) => (
        <CardListItem key={os.id}>
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-text">{os.evento}</p>
            <BadgeStatusOS status={os.status} />
          </div>
          <p className="text-xs text-text-muted">
            {os.numeroOS} · {os.setor}
          </p>
          <p className="mt-1 text-sm text-text">{formatarMoeda(os.valorTotal)}</p>
        </CardListItem>
      ))}
    />
  )
}
