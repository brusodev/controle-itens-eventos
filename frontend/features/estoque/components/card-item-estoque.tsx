import { Badge, type BadgeTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardListItem } from '@/components/ui/responsive-list'
import { parseNumeroBr, formatarNumeroBr } from '@/lib/numero-br'
import { formatarCategoriaAlimentacao } from '@/lib/formatters'
import { calcularTotaisEstoque } from '../disponibilidade'
import type { CategoriaAlimentacao, ItemEstoque } from '../schema'
import type { RegiaoConfig } from '@/features/modulos/config'

function statusTom(disponivel: number, limiteAlerta: number): BadgeTone {
  if (disponivel === 0) return 'danger-strong'
  if (disponivel < limiteAlerta) return 'warning'
  return 'success'
}

/** Um card de item — porta de filtrarAlimentacao (estoque.js:117-211). */
export function CardItemEstoque({
  item,
  categoriaNome,
  categoria,
  regioesConfig,
  ehAdmin,
  onEditar,
  onExcluir,
}: {
  item: ItemEstoque
  categoriaNome: string
  categoria: CategoriaAlimentacao
  regioesConfig: RegiaoConfig
  ehAdmin: boolean
  onEditar: () => void
  onExcluir: () => void
}) {
  const totais = calcularTotaisEstoque(item)

  return (
    <CardListItem className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-text-muted">
          {formatarCategoriaAlimentacao(categoriaNome)} ({categoria.natureza})
        </span>
        <Badge tone={statusTom(totais.disponivel, 1000)}>
          Disponível: {formatarNumeroBr(totais.disponivel)}
        </Badge>
      </div>

      <h3 className="font-medium text-text">{item.descricao}</h3>
      {item.natureza && <p className="text-xs text-text-muted">Código: {item.natureza}</p>}

      <div className="flex gap-4 text-sm text-text-muted">
        <span>Inicial: {formatarNumeroBr(totais.inicial)}</span>
        <span>Gasto: {formatarNumeroBr(totais.gasto)}</span>
      </div>

      <table className="w-full text-left text-xs">
        <thead>
          <tr className="text-text-muted">
            <th className="py-1">{regioesConfig.tipoLabel}</th>
            <th className="py-1 text-right">Inicial</th>
            <th className="py-1 text-right">Usado</th>
            <th className="py-1 text-right">Rest.</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: regioesConfig.quantidade }, (_, i) => i + 1).map((regiao) => {
            const r = item.regioes?.[String(regiao)]
            const inicial = r ? parseNumeroBr(r.inicial) : 0
            const gasto = r ? parseNumeroBr(r.gasto) : 0
            const disponivel = inicial - gasto
            return (
              <tr key={regiao} className="border-t border-border-subtle">
                <td className="py-1">{regioesConfig.nomes[regiao] ?? `${regioesConfig.tipoLabel} ${regiao}`}</td>
                <td className="py-1 text-right">{formatarNumeroBr(inicial)}</td>
                <td className="py-1 text-right">{formatarNumeroBr(gasto)}</td>
                <td className={`py-1 text-right ${disponivel === 0 ? 'text-danger-strong' : ''}`}>
                  {formatarNumeroBr(disponivel)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={onEditar}>
          Editar
        </Button>
        {ehAdmin && (
          <Button size="sm" variant="danger" onClick={onExcluir}>
            Excluir
          </Button>
        )}
      </div>
    </CardListItem>
  )
}
