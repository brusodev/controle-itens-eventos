import { Input } from '@/components/ui/field'
import { calcularDisponivel, excedeEstoque } from '@/features/estoque/disponibilidade'
import type { ItemEstoque } from '@/features/estoque/schema'
import type { ModuloConfig } from '@/features/modulos/config'
import { formatarNumeroBr } from '@/lib/numero-br'

export interface SelecaoItem {
  marcado: boolean
  diarias: number
  qtd: number
}

/** Uma linha do seletor de itens — porta de ordens-servico.js:346-368 (itensHtml). */
export function ItemSelecionavel({
  item,
  grupo,
  config,
  selecao,
  onChange,
}: {
  item: ItemEstoque
  grupo: string
  config: ModuloConfig
  selecao: SelecaoItem
  onChange: (selecao: SelecaoItem) => void
}) {
  const disponivel = calcularDisponivel(item, grupo)
  const excede = excedeEstoque({ disponivel, quantidade: selecao.qtd, diarias: selecao.diarias })

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle py-2 last:border-0">
      <label className="flex flex-1 items-center gap-2 text-sm text-text">
        <input
          type="checkbox"
          checked={selecao.marcado}
          onChange={(e) => onChange({ ...selecao, marcado: e.target.checked })}
          className="size-4.5"
        />
        <span>{item.descricao}</span>
        <span className="text-text-muted">{item.unidade}</span>
      </label>

      {disponivel !== null && (
        <span
          className={
            disponivel <= 0
              ? 'text-xs font-medium text-danger-strong'
              : 'text-xs font-medium text-success'
          }
        >
          {disponivel <= 0 ? 'Sem estoque' : `Estoque: ${formatarNumeroBr(disponivel)} ${item.unidade}`}
        </span>
      )}

      {config.usaDiarias && (
        <label className="flex items-center gap-1 text-xs text-text-muted">
          Diárias:
          <Input
            type="number"
            min={1}
            value={selecao.diarias}
            onChange={(e) => onChange({ ...selecao, diarias: Number(e.target.value) || 1 })}
            className="h-8 w-16 px-2"
          />
        </label>
      )}

      <label className="flex items-center gap-1 text-xs text-text-muted">
        {config.colunaQtdCompacta}:
        <Input
          type="number"
          min={0}
          step="any"
          value={selecao.qtd || ''}
          onChange={(e) => onChange({ ...selecao, qtd: Number(e.target.value) || 0 })}
          className={excede ? 'h-8 w-20 border-danger-strong px-2' : 'h-8 w-20 px-2'}
        />
      </label>

      {excede && (
        <span className="text-xs font-medium text-danger-strong">
          Excede estoque (disp: {formatarNumeroBr(disponivel!)})
        </span>
      )}
    </div>
  )
}
