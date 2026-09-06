'use client'

import { Button } from '@/components/ui/button'
import type { Perfil } from '@/features/auth/schema'
import { acoesVisiveis, type AcaoOS } from '../../acoes'
import { osAPI } from '../../api'
import type { OSPersistida } from '../../schema'

export interface AcoesOSProps {
  os: OSPersistida
  perfil: Perfil
  onEditar: (id: number) => void
  onVisualizar: (id: number) => void
  onExcluir: (id: number) => void
  onAtividadePortal: (id: number) => void
  onPagamento: (id: number) => void
  onCancelar: (id: number) => void
}

const LABELS: Record<AcaoOS, string> = {
  visualizar: 'Visualizar',
  editar: 'Editar',
  imprimir: 'Imprimir',
  pdf: 'PDF',
  png: 'PNG/SEI',
  excluir: 'Excluir',
  atividadePortal: 'Atividade',
  pagamento: 'Pagamento',
  cancelar: 'Cancelar',
}

/**
 * As 9 ações do card — regras de visibilidade vêm de acoesVisiveis()
 * (função pura testada em acoes.test.ts), nunca reimplementadas aqui.
 */
export function AcoesOS(props: AcoesOSProps) {
  const { os, perfil, onEditar, onVisualizar, onExcluir, onAtividadePortal, onPagamento, onCancelar } =
    props
  const acoes = acoesVisiveis({ perfil, status: os.status })

  function imprimir() {
    window.open(osAPI.urlPdf(os.id), '_blank')
  }

  function baixarPng() {
    window.open(osAPI.urlPng(os.id), '_blank')
  }

  return (
    <div className="flex flex-wrap gap-2">
      {acoes.has('visualizar') && (
        <Button size="sm" variant="primary" onClick={() => onVisualizar(os.id)}>
          {LABELS.visualizar}
        </Button>
      )}
      {acoes.has('editar') && (
        <Button size="sm" variant="secondary" onClick={() => onEditar(os.id)}>
          {LABELS.editar}
        </Button>
      )}
      {acoes.has('imprimir') && (
        <Button size="sm" variant="success" onClick={imprimir}>
          {LABELS.imprimir}
        </Button>
      )}
      {acoes.has('pdf') && (
        <Button size="sm" variant="secondary" onClick={imprimir}>
          {LABELS.pdf}
        </Button>
      )}
      {acoes.has('excluir') && (
        <Button size="sm" variant="danger" onClick={() => onExcluir(os.id)}>
          {LABELS.excluir}
        </Button>
      )}
      {acoes.has('atividadePortal') && (
        <Button size="sm" variant="secondary" onClick={() => onAtividadePortal(os.id)}>
          {LABELS.atividadePortal}
        </Button>
      )}
      {acoes.has('pagamento') && (
        <Button size="sm" variant="secondary" onClick={() => onPagamento(os.id)}>
          {LABELS.pagamento}
        </Button>
      )}
      {acoes.has('png') && (
        <Button size="sm" variant="secondary" onClick={baixarPng}>
          {LABELS.png}
        </Button>
      )}
      {acoes.has('cancelar') && (
        <Button size="sm" variant="danger" onClick={() => onCancelar(os.id)}>
          {LABELS.cancelar}
        </Button>
      )}
    </div>
  )
}
