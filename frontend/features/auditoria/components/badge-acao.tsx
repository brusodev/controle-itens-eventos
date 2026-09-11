import { Badge, type BadgeTone } from '@/components/ui/badge'
import { LABEL_ACAO, type AcaoAuditoria } from '../schema'

/** Cores das .badge-{acao} do legado (auditoria.html), agora em tokens semânticos. */
const TOM_POR_ACAO: Record<AcaoAuditoria, BadgeTone> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'danger-strong',
  LOGIN: 'indigo',
  LOGOUT: 'neutral-strong',
}

/** Ação desconhecida (registro antigo) cai no tom neutro e mostra o valor cru, como traduzirAcao(). */
export function BadgeAcao({ acao }: { acao: string }) {
  const conhecida = acao in TOM_POR_ACAO ? (acao as AcaoAuditoria) : null
  return (
    <Badge tone={conhecida ? TOM_POR_ACAO[conhecida] : 'neutral-strong'}>
      {conhecida ? LABEL_ACAO[conhecida] : acao}
    </Badge>
  )
}
