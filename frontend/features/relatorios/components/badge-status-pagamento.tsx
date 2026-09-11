import { Badge, type BadgeTone } from '@/components/ui/badge'
import type { StatusPagamento } from '../schema'

/** Cores de PAG_STATUS_CFG (relatorios.js:951) — status calculado pelo backend, aqui só exibido. */
const TOM_POR_STATUS: Record<StatusPagamento, BadgeTone> = {
  pago: 'success',
  pendente: 'warning',
  vencido: 'danger-strong',
  sem_prazo: 'neutral-strong',
}

const LABEL_POR_STATUS: Record<StatusPagamento, string> = {
  pago: 'Pago',
  pendente: 'Pendente',
  vencido: 'Vencido',
  sem_prazo: 'Sem Prazo',
}

export function BadgeStatusPagamento({ status }: { status: StatusPagamento }) {
  return <Badge tone={TOM_POR_STATUS[status]}>{LABEL_POR_STATUS[status]}</Badge>
}
