import { ResponsiveList, CardListItem } from '@/components/ui/responsive-list'
import type { RelatorioTopItens } from '../schema'

/** Tabela (desktop) / cards (mobile) do ranking de itens mais utilizados. */
export function TabelaTopItens({ ranking }: { ranking: RelatorioTopItens['ranking'] }) {
  return (
    <ResponsiveList
      table={
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-text-muted">
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Item</th>
              <th className="px-3 py-2 font-medium">Categoria</th>
              <th className="px-3 py-2 font-medium">Consumido</th>
              <th className="px-3 py-2 font-medium">Vezes</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((item) => (
              <tr key={item.posicao} className="border-b border-border-subtle last:border-b-0">
                <td className="px-3 py-2 text-text-muted">{item.posicao}</td>
                <td className="px-3 py-2 text-text">{item.descricao}</td>
                <td className="px-3 py-2 text-text-muted">{item.categoria}</td>
                <td className="px-3 py-2 text-text-muted">
                  {item.total_consumido.toLocaleString('pt-BR')} {item.unidade}
                </td>
                <td className="px-3 py-2 text-text-muted">{item.vezes_utilizado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
      cards={ranking.map((item) => (
        <CardListItem key={item.posicao}>
          <p className="font-medium text-text">
            #{item.posicao} {item.descricao}
          </p>
          <p className="text-xs text-text-muted">{item.categoria}</p>
          <p className="mt-1 text-sm text-text">
            {item.total_consumido.toLocaleString('pt-BR')} {item.unidade} · {item.vezes_utilizado}x
          </p>
        </CardListItem>
      ))}
    />
  )
}
