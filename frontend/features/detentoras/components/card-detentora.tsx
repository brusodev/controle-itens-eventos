import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardListItem } from '@/components/ui/responsive-list'
import { isoParaBr } from '@/lib/data-br'
import { getModuloConfig } from '@/features/modulos/config'
import type { Detentora } from '../schema'

/**
 * Porta de renderizarDetentoras() em gerenciar-detentoras.html:216-269.
 * Ações de editar/inativar só visíveis a admin — defesa em profundidade
 * client-side (backend ainda aceita de qualquer autenticado, ver plano
 * § Domínio 2, achado de autorização).
 */
export function CardDetentora({
  detentora,
  ehAdmin,
  onEditar,
  onInativar,
}: {
  detentora: Detentora
  ehAdmin: boolean
  onEditar: () => void
  onInativar: () => void
}) {
  const grupoLabel = getModuloConfig(detentora.modulo).grupoLabel

  return (
    <CardListItem className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-text">
          {grupoLabel} {detentora.grupo}
        </span>
        <Badge tone={detentora.ativo ? 'success' : 'neutral-strong'}>
          {detentora.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      <dl className="flex flex-col gap-1 text-sm text-text">
        <Campo label="Empresa" valor={detentora.nome} />
        <Campo label="CNPJ" valor={detentora.cnpj} />
        <Campo label="Contrato" valor={detentora.contratoNum} />
        <Campo label="Assinatura" valor={isoParaBr(detentora.dataAssinatura) || 'Não informada'} />
        <Campo label="Vigência" valor={detentora.prazoVigencia || 'Não informada'} />
        <Campo label="Serviço" valor={detentora.servico || '—'} />
      </dl>

      {ehAdmin && (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={onEditar}>
            Editar
          </Button>
          <Button size="sm" variant="danger" onClick={onInativar} disabled={!detentora.ativo}>
            Inativar
          </Button>
        </div>
      )}
    </CardListItem>
  )
}

function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex gap-1">
      <dt className="font-medium">{label}:</dt>
      <dd className="text-text-muted">{valor}</dd>
    </div>
  )
}
