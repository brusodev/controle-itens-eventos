'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, FileImage, Pencil, Printer } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardListItem } from '@/components/ui/responsive-list'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useUsuarioAtual } from '@/features/auth/hooks/use-usuario-atual'
import { isoParaBr } from '@/lib/data-br'
import { osAPI } from '../../api'
import { acoesVisiveis } from '../../acoes'
import { useOS } from '../../hooks/use-os'
import { StatusBadge } from '../status-badge'
import { PreviewOS } from '../formulario/preview-os'

/**
 * Tela de detalhe de uma O.S. — antes desta rota não existir, o botão
 * "Visualizar" da lista (lista-os.tsx) navegava para /os/{id} e caía em 404;
 * no desktop nem havia como abrir (tabela-os.tsx sem coluna de ações). Reusa
 * `PreviewOS`, que já renderiza o documento oficial completo — aqui só entra
 * o que só uma O.S. persistida tem: status, ações e pagamento/cancelamento.
 */
export function DetalheOS({ osId }: { osId: number }) {
  const router = useRouter()
  const { data: usuario } = useUsuarioAtual()
  const { data: os, isLoading, isError } = useOS(osId)

  if (!usuario) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/os"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text"
        >
          <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={1.75} />
          Voltar para Ordens de Serviço
        </Link>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {isError && (
        <EmptyState
          title="Erro ao carregar a O.S."
          description="Verifique se o backend está rodando e tente novamente."
        />
      )}

      {os && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-text">O.S. {os.numeroOS}</h1>
              <StatusBadge status={os.status} />
              {os.pagamentoPago && <Badge tone="success">Paga</Badge>}
            </div>
            <BarraAcoes osId={os.id} perfil={usuario.perfil} status={os.status} router={router} />
          </div>

          {(os.pagamentoVencimento || os.motivoExclusao) && (
            <CardListItem className="flex flex-col gap-2 text-sm">
              {os.pagamentoVencimento && (
                <p>
                  <strong className="font-medium text-text">Vencimento do pagamento:</strong>{' '}
                  {isoParaBr(os.pagamentoVencimento)} —{' '}
                  {os.pagamentoPago ? 'pago' : 'em aberto'}
                </p>
              )}
              {os.motivoExclusao && (
                <p className="text-danger-strong">
                  <strong className="font-medium">Cancelada/excluída</strong>
                  {os.dataExclusao && ` em ${isoParaBr(os.dataExclusao)}`}: {os.motivoExclusao}
                </p>
              )}
            </CardListItem>
          )}

          <CardListItem>
            <PreviewOS dados={os} />
          </CardListItem>
        </>
      )}
    </div>
  )
}

function BarraAcoes({
  osId,
  perfil,
  status,
  router,
}: {
  osId: number
  perfil: Parameters<typeof acoesVisiveis>[0]['perfil']
  status: Parameters<typeof acoesVisiveis>[0]['status']
  router: ReturnType<typeof useRouter>
}) {
  const acoes = acoesVisiveis({ perfil, status })

  return (
    <div className="flex flex-wrap gap-2">
      {acoes.has('editar') && (
        <Button size="sm" variant="secondary" onClick={() => router.push(`/os/${osId}/editar`)}>
          <Pencil aria-hidden="true" className="size-4" strokeWidth={1.75} />
          Editar
        </Button>
      )}
      {acoes.has('imprimir') && (
        <Button size="sm" variant="secondary" onClick={() => window.print()}>
          <Printer aria-hidden="true" className="size-4" strokeWidth={1.75} />
          Imprimir
        </Button>
      )}
      {acoes.has('pdf') && (
        <Button size="sm" variant="secondary" onClick={() => window.open(osAPI.urlPdf(osId), '_blank')}>
          <Download aria-hidden="true" className="size-4" strokeWidth={1.75} />
          PDF
        </Button>
      )}
      {acoes.has('png') && (
        <Button size="sm" variant="secondary" onClick={() => window.open(osAPI.urlPng(osId), '_blank')}>
          <FileImage aria-hidden="true" className="size-4" strokeWidth={1.75} />
          PNG/SEI
        </Button>
      )}
    </div>
  )
}
