import { Badge } from '@/components/ui/badge'
import { STATUS_OS, StatusBadge } from '@/features/ordens-servico/components/status-badge'
import type { StatusOS } from '@/features/ordens-servico/schema'

function ehStatusConhecido(valor: string): valor is StatusOS {
  return (STATUS_OS as readonly string[]).includes(valor)
}

/**
 * Wrapper de StatusBadge para os relatórios de Organização/Transporte, cujo
 * `status` chega como `string` solto (não valida contra o enum no schema —
 * ver comentário em relatorios/schema.ts). Valor fora dos 8 conhecidos
 * (registro histórico) mostra badge neutro com o texto cru, em vez de
 * quebrar o StatusBadge original.
 */
export function BadgeStatusOS({ status }: { status: string }) {
  if (ehStatusConhecido(status)) return <StatusBadge status={status} />
  return <Badge tone="neutral-strong">{status}</Badge>
}
