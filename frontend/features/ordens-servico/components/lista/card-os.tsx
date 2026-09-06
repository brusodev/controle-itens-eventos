import { Badge } from '@/components/ui/badge'
import { CardListItem } from '@/components/ui/responsive-list'
import type { Perfil } from '@/features/auth/schema'
import type { OSPersistida } from '../../schema'
import { StatusBadge } from '../status-badge'
import { AcoesOS, type AcoesOSProps } from './acoes-os'

type CardOSProps = {
  os: OSPersistida
  perfil: Perfil
} & Omit<AcoesOSProps, 'os' | 'perfil'>

/**
 * Um card de O.S. — porta de ordens-servico.js:94-120, sem o destaque de
 * `os.id === 1` (resquício de depuração identificado no plano, deliberadamente
 * não replicado).
 */
export function CardOS({ os, perfil, ...acoesProps }: CardOSProps) {
  return (
    <CardListItem className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-text-muted">O.S. {os.numeroOS}</span>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={os.status} />
          {os.pagamentoPago && <Badge tone="success">Paga</Badge>}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-text">{os.evento || 'Sem título'}</h3>
        <p className="text-sm text-text-muted">
          <strong className="font-medium text-text">Detentora:</strong> {os.detentora || 'N/A'}
        </p>
        <p className="text-sm text-text-muted">
          <strong className="font-medium text-text">Data do evento:</strong> {os.data || 'N/A'}
        </p>
        <p className="text-sm text-text-muted">
          <strong className="font-medium text-text">Emitida em:</strong>{' '}
          {os.dataEmissao ? new Date(os.dataEmissao).toLocaleDateString('pt-BR') : 'N/A'}
        </p>
        <p className="text-sm text-text-muted">
          <strong className="font-medium text-text">Itens:</strong> {os.itens?.length ?? 0}
        </p>
      </div>

      <AcoesOS os={os} perfil={perfil} {...acoesProps} />
    </CardListItem>
  )
}
