'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Spinner } from '@/components/ui/spinner'
import { EmptyState } from '@/components/ui/empty-state'
import type { Modulo } from '@/features/modulos/config'
import { useOrdensParaReordenar, useSalvarReordenacao } from '../../hooks/use-reordenar-os'
import { moverPosicao } from './reordenar-linha'
import { LinhaReordenar } from './linha-reordenar'

/**
 * Reordenar numeração das O.S. de um grupo — porta de abrirModalReordenarOS/
 * salvarReordenacaoOS (ordens-servico.js:1644-1762).
 *
 * Diferença deliberada: botões de mover para cima/baixo em vez de
 * drag-and-drop nativo — mesmo resultado (reordenar e renumerar), mas
 * acessível via teclado e sem a fragilidade de drag-and-drop touch em
 * mobile, que o plano pede como alvo (§ Mobile-first).
 */
export function ModalReordenarOS({
  open,
  onClose,
  modulo,
  grupo,
}: {
  open: boolean
  onClose: () => void
  modulo: Modulo
  grupo: string
}) {
  return (
    <Modal open={open} onClose={onClose} title="Reordenar Numeração das O.S." className="sm:max-w-xl">
      {open && <ConteudoReordenar modulo={modulo} grupo={grupo} onClose={onClose} />}
    </Modal>
  )
}

function ConteudoReordenar({
  modulo,
  grupo,
  onClose,
}: {
  modulo: Modulo
  grupo: string
  onClose: () => void
}) {
  const { data: linhasIniciais, isLoading, isError } = useOrdensParaReordenar(modulo, grupo)
  const salvar = useSalvarReordenacao(modulo, grupo)
  const [ordem, setOrdem] = useState(linhasIniciais)
  const [confirmando, setConfirmando] = useState(false)

  const linhas = ordem ?? linhasIniciais

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    )
  }

  if (isError || !linhas) {
    return <EmptyState title="Erro ao carregar O.S. do grupo" />
  }

  if (linhas.length === 0) {
    return <EmptyState title="Nenhuma O.S. encontrada neste grupo" />
  }

  function confirmarSalvar() {
    salvar.mutate(
      linhas!.map((l) => l.id),
      { onSuccess: onClose },
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-text-muted">
        Módulo: {modulo.toUpperCase()} — Grupo {grupo} — {linhas.length} O.S.
      </p>
      <p className="text-xs text-text-muted">
        Use as setas para reordenar. O número será reatribuído automaticamente (OS-001 para a 1ª posição, etc.).
      </p>

      <div className="flex flex-col divide-y divide-border-subtle overflow-y-auto rounded-md border border-border-subtle">
        {linhas.map((linha, index) => (
          <LinhaReordenar
            key={linha.id}
            linha={linha}
            posicao={index}
            podeSubir={index > 0}
            podeDescer={index < linhas.length - 1}
            onSubir={() => setOrdem(moverPosicao(linhas, index, index - 1))}
            onDescer={() => setOrdem(moverPosicao(linhas, index, index + 1))}
          />
        ))}
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={() => setConfirmando(true)} loading={salvar.isPending}>
          Salvar Ordem
        </Button>
      </div>

      <ConfirmDialog
        open={confirmando}
        title="Confirmar renumeração?"
        description={`${linhas.length} O.S. do grupo ${grupo} serão renumeradas. Esta ação não pode ser desfeita.`}
        confirmLabel="Confirmar"
        onConfirm={() => {
          setConfirmando(false)
          confirmarSalvar()
        }}
        onCancel={() => setConfirmando(false)}
      />
    </div>
  )
}
