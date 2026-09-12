import { LayoutGrid, List } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { ModoVisualizacao } from '../../hooks/use-modo-visualizacao'

const OPCOES = [
  { modo: 'lista', Icone: List, label: 'Ver em lista' },
  { modo: 'grid', Icone: LayoutGrid, label: 'Ver em grade' },
] as const satisfies readonly { modo: ModoVisualizacao; Icone: typeof List; label: string }[]

/**
 * `aria-pressed` (não `aria-current`) porque são dois botões de um grupo de
 * alternância, não navegação. Escondido abaixo de `md:` (`hidden md:flex`
 * no consumidor): nesse breakpoint os dois modos renderizam cards e o
 * controle não teria efeito.
 */
export function ToggleModoVisualizacao({
  modo,
  onChange,
}: {
  modo: ModoVisualizacao
  onChange: (modo: ModoVisualizacao) => void
}) {
  return (
    <div role="group" aria-label="Modo de exibição" className="hidden rounded-md border border-border p-0.5 md:flex">
      {OPCOES.map(({ modo: valor, Icone, label }) => (
        <button
          key={valor}
          type="button"
          onClick={() => onChange(valor)}
          aria-pressed={modo === valor}
          aria-label={label}
          title={label}
          className={cn(
            'flex size-9 items-center justify-center rounded-sm transition-colors',
            modo === valor
              ? 'bg-primary-subtle text-primary-emphasis'
              : 'text-text-muted hover:bg-surface-muted hover:text-text',
          )}
        >
          <Icone aria-hidden="true" className="size-4.5" strokeWidth={1.75} />
        </button>
      ))}
    </div>
  )
}
