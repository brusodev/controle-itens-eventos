import { Badge, type BadgeTone } from '@/components/ui/badge'
import { LABEL_URGENCIA, type Urgencia } from '../urgencia'

/** Cores de badgeUrgenciaPedido() (pedidos-graficos.js:70-78), em tokens semânticos. */
const TOM_POR_URGENCIA: Record<Urgencia, BadgeTone> = {
  atrasado: 'danger',
  vencendo: 'warning',
  ok: 'success',
  sem_prazo: 'neutral-strong',
  concluido: 'success',
  cancelado: 'neutral-strong',
}

export function BadgeUrgencia({ urgencia }: { urgencia: Urgencia }) {
  return <Badge tone={TOM_POR_URGENCIA[urgencia]}>{LABEL_URGENCIA[urgencia]}</Badge>
}
