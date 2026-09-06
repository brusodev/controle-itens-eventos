import { CardListItem } from '@/components/ui/responsive-list'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/field'
import { formatarNomeCategoria } from '@/lib/formatters'
import type { ModuloConfig } from '@/features/modulos/config'
import type { ItemOS } from '../../schema'

export interface ItemCardMobileProps {
  item: ItemOS
  index: number
  config: ModuloConfig
  onAtualizar: (campo: keyof ItemOS, valor: unknown) => void
  onRemover: () => void
  onDuplicar?: () => void
}

/** Versão mobile de uma linha de TabelaItensOS — card empilhado, sem scroll horizontal (plano § UX). */
export function ItemCardMobile({
  item,
  index,
  config,
  onAtualizar,
  onRemover,
  onDuplicar,
}: ItemCardMobileProps) {
  return (
    <CardListItem className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs text-text-muted">#{index + 1}</span>
          <p className="text-sm font-medium text-text">{item.descricao}</p>
          <p className="text-xs text-text-muted">{formatarNomeCategoria(item.categoria)}</p>
        </div>
        <button
          type="button"
          onClick={onRemover}
          aria-label="Remover item"
          className="text-danger-strong"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        {config.usaDiarias && (
          <label className="flex items-center gap-1 text-xs text-text-muted">
            Diárias
            <Input
              type="number"
              min={1}
              value={item.diarias}
              onChange={(e) => onAtualizar('diarias', Number(e.target.value) || 1)}
              className="h-9 w-16 px-2"
            />
          </label>
        )}
        <label className="flex items-center gap-1 text-xs text-text-muted">
          {config.colunaQtdCompacta}
          <Input
            type="number"
            min={0}
            step="any"
            value={item.qtdSolicitada ?? ''}
            onChange={(e) => onAtualizar('qtdSolicitada', Number(e.target.value) || 0)}
            className="h-9 w-20 px-2"
          />
        </label>
        {config.colunaQtdTotal && (
          <span className="flex items-center text-xs text-text-muted">Total: {item.qtdTotal}</span>
        )}
      </div>

      {config.usaTrajeto && (
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Cidade origem"
            value={item.trajetoOrigem ?? ''}
            onChange={(e) => onAtualizar('trajetoOrigem', e.target.value)}
          />
          <Input
            placeholder="Cidade destino"
            value={item.trajetoDestino ?? ''}
            onChange={(e) => onAtualizar('trajetoDestino', e.target.value)}
          />
          <Select
            value={item.trajetoTipo ?? ''}
            onChange={(e) => onAtualizar('trajetoTipo', e.target.value || null)}
          >
            <option value="">—</option>
            <option value="ida">Ida</option>
            <option value="volta">Volta</option>
          </Select>
          {onDuplicar && (
            <Button variant="secondary" size="sm" onClick={onDuplicar}>
              Duplicar com trajeto invertido
            </Button>
          )}
        </div>
      )}
    </CardListItem>
  )
}
