import type { ReordenarLinha } from './reordenar-linha'

export function LinhaReordenar({
  linha,
  posicao,
  podeSubir,
  podeDescer,
  onSubir,
  onDescer,
}: {
  linha: ReordenarLinha
  posicao: number
  podeSubir: boolean
  podeDescer: boolean
  onSubir: () => void
  onDescer: () => void
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 text-sm">
      <span className="w-16 font-semibold text-primary-emphasis">
        OS-{String(posicao + 1).padStart(3, '0')}
      </span>
      <span className="w-16 text-text-muted">{linha.numeroAtual}</span>
      <span className="flex-1 truncate">{linha.evento || '—'}</span>
      <span className="text-xs text-text-muted">
        {linha.dataEmissao ? new Date(linha.dataEmissao).toLocaleDateString('pt-BR') : '—'}
      </span>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={onSubir}
          disabled={!podeSubir}
          aria-label="Mover para cima"
          className="disabled:opacity-30"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={onDescer}
          disabled={!podeDescer}
          aria-label="Mover para baixo"
          className="disabled:opacity-30"
        >
          ↓
        </button>
      </div>
    </div>
  )
}
