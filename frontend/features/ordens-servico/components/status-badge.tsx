import { Badge, type BadgeTone } from '@/components/ui/badge'
import { STATUS_OS, type StatusOS } from '../schema'

/**
 * Fonte única para os 8 estados da O.S. — resolve a duplicação que existia
 * entre portal-empresa.css (.badge-emitida, .badge-aceita...) e o objeto
 * `statusLabels` inline em ordens-servico.js, que haviam divergido: o admin
 * esqueceu 'cancelada' e caía num fallback cinza genérico.
 *
 * `satisfies Record<StatusOS, ...>` faz o TypeScript EXIGIR os 8 estados —
 * omitir um deles agora é erro de compilação, não um card mudo em produção.
 */
const STATUS_CONFIG = {
  emitida: { label: 'Emitida', tone: 'info' },
  enviada_empresa: { label: 'Aguardando Empresa', tone: 'warning' },
  em_revisao: { label: 'Em Revisão', tone: 'danger' },
  aceita: { label: 'Aceita', tone: 'success' },
  em_execucao: { label: 'Em Execução', tone: 'indigo' },
  executada: { label: 'Executada', tone: 'purple' },
  recusada: { label: 'Recusada', tone: 'danger-strong' },
  cancelada: { label: 'Cancelada', tone: 'neutral-strong' },
} as const satisfies Record<StatusOS, { label: string; tone: BadgeTone }>

export function StatusBadge({ status }: { status: StatusOS }) {
  const config = STATUS_CONFIG[status]
  return <Badge tone={config.tone}>{config.label}</Badge>
}

// Reexportado para os componentes que precisam da lista completa (ex.: filtros).
export { STATUS_OS }
