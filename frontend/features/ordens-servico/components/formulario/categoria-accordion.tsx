import { useState } from 'react'
import { formatarNomeCategoria } from '@/lib/formatters'
import type { CategoriaAlimentacao } from '@/features/estoque/schema'
import type { ModuloConfig } from '@/features/modulos/config'
import { ItemSelecionavel, type SelecaoItem } from './item-selecionavel'

/** Um grupo de itens (categoria) no seletor — porta de toggleCategoriaSeletor em emitir-os.js:408. */
export function CategoriaAccordion({
  nomeCategoria,
  itensVisiveis,
  totalItens,
  grupo,
  config,
  selecoes,
  onChangeItem,
  forcarAberta,
}: {
  nomeCategoria: string
  itensVisiveis: CategoriaAlimentacao['itens']
  totalItens: number
  grupo: string
  config: ModuloConfig
  selecoes: Map<number, SelecaoItem>
  onChangeItem: (itemId: number, selecao: SelecaoItem) => void
  /** true durante uma busca com resultado nesta categoria — força exibição, sem sobrescrever o toggle manual. */
  forcarAberta: boolean
}) {
  const [abertaManual, setAbertaManual] = useState(false)
  const aberta = abertaManual || forcarAberta
  const selecionadosNaCategoria = itensVisiveis.filter((item) => selecoes.get(item.id)?.marcado).length

  if (itensVisiveis.length === 0) return null

  return (
    <div className="rounded-md border border-border-subtle">
      <button
        type="button"
        onClick={() => setAbertaManual((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-text"
      >
        <span aria-hidden="true">{aberta ? '▼' : '▶'}</span>
        <span className="flex-1">{formatarNomeCategoria(nomeCategoria)}</span>
        <span className="text-xs text-text-muted">{totalItens} itens</span>
        {selecionadosNaCategoria > 0 && (
          <span className="rounded-full bg-primary-subtle px-2 py-0.5 text-xs font-semibold text-primary">
            {selecionadosNaCategoria}
          </span>
        )}
      </button>

      {aberta && (
        <div className="border-t border-border-subtle px-3 py-1">
          {itensVisiveis.map((item) => (
            <ItemSelecionavel
              key={item.id}
              item={item}
              grupo={grupo}
              config={config}
              selecao={selecoes.get(item.id) ?? { marcado: false, diarias: 1, qtd: 0 }}
              onChange={(selecao) => onChangeItem(item.id, selecao)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
