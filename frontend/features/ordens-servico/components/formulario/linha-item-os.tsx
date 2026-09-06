import { Input, Select } from '@/components/ui/field'
import { formatarNomeCategoria } from '@/lib/formatters'
import type { ModuloConfig } from '@/features/modulos/config'
import type { ItemOS } from '../../schema'

export interface LinhaItemOSProps {
  item: ItemOS
  index: number
  config: ModuloConfig
  onAtualizar: (campo: keyof ItemOS, valor: unknown) => void
  onRemover: () => void
  onDuplicar?: () => void
}

/**
 * Uma linha da tabela de itens (desktop) — porta de renderizarTabelaItensOS
 * em emitir-os.js:562-682. Três variantes conforme o módulo: com diárias,
 * com trajeto (Transporte), ou simples (ex.: Serviços Gráficos).
 */
export function LinhaItemOS({ item, index, config, onAtualizar, onRemover, onDuplicar }: LinhaItemOSProps) {
  const cellClass = 'px-2 py-1.5'

  return (
    <tr className="border-b border-border-subtle">
      <td className={`${cellClass} text-center text-text-muted`}>{index + 1}</td>
      <td className={cellClass}>{item.descricao}</td>
      <td className={cellClass}>{formatarNomeCategoria(item.categoria)}</td>

      {config.usaDiarias && (
        <td className={cellClass}>
          <Input
            type="number"
            min={1}
            value={item.diarias}
            onChange={(e) => onAtualizar('diarias', Number(e.target.value) || 1)}
            className="h-9 w-16 px-2"
          />
        </td>
      )}

      <td className={cellClass}>
        <Input
          type="number"
          min={0}
          step="any"
          value={item.qtdSolicitada ?? ''}
          onChange={(e) => onAtualizar('qtdSolicitada', Number(e.target.value) || 0)}
          className="h-9 w-20 px-2"
        />
      </td>

      {config.usaTrajeto ? (
        <>
          <td className={cellClass}>
            <Input
              placeholder="Cidade origem"
              maxLength={100}
              value={item.trajetoOrigem ?? ''}
              onChange={(e) => onAtualizar('trajetoOrigem', e.target.value)}
              className="h-9 w-32 px-2"
            />
          </td>
          <td className={cellClass}>
            <Input
              placeholder="Cidade destino"
              maxLength={100}
              value={item.trajetoDestino ?? ''}
              onChange={(e) => onAtualizar('trajetoDestino', e.target.value)}
              className="h-9 w-32 px-2"
            />
          </td>
          <td className={cellClass}>
            <Select
              value={item.trajetoTipo ?? ''}
              onChange={(e) => onAtualizar('trajetoTipo', e.target.value || null)}
              className="h-9 px-2"
            >
              <option value="">—</option>
              <option value="ida">Ida</option>
              <option value="volta">Volta</option>
            </Select>
          </td>
          <td className={`${cellClass} whitespace-nowrap`}>
            {onDuplicar && (
              <button
                type="button"
                title="Adicionar mesma linha com trajeto diferente"
                onClick={onDuplicar}
                className="mr-1 rounded bg-info px-1.5 py-0.5 text-text-on-primary"
              >
                +
              </button>
            )}
            <button
              type="button"
              onClick={onRemover}
              title="Remover item"
              className="text-danger-strong"
            >
              ✕
            </button>
          </td>
        </>
      ) : (
        <>
          <td className={cellClass}>{item.qtdTotal}</td>
          <td className={cellClass}>
            <button
              type="button"
              onClick={onRemover}
              title="Remover item"
              className="text-danger-strong"
            >
              ✕
            </button>
          </td>
        </>
      )}
    </tr>
  )
}
