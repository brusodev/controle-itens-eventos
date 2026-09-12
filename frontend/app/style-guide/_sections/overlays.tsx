'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast'
import { Section } from './shared'

export function SecaoToast() {
  const { showToast } = useToast()
  return (
    <Section title="Toast">
      <div className="flex flex-wrap gap-3">
        <Button variant="success" onClick={() => showToast('Salvo com sucesso.', 'success')}>
          Disparar toast de sucesso
        </Button>
        <Button variant="danger" onClick={() => showToast('Erro ao salvar.', 'error')}>
          Disparar toast de erro
        </Button>
        <Button variant="secondary" onClick={() => showToast('Só um aviso.', 'info')}>
          Disparar toast de info
        </Button>
      </div>
    </Section>
  )
}

export function SecaoModal() {
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <Section title="Modal / ConfirmDialog">
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setModalOpen(true)}>Abrir modal</Button>
        <Button variant="danger" onClick={() => setConfirmOpen(true)}>
          Abrir confirm dialog
        </Button>
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Exemplo de modal">
        <p className="text-sm text-text-muted">
          Bottom-sheet no mobile, centralizado a partir de sm:. Esc fecha, Tab prende o foco.
        </p>
      </Modal>
      <ConfirmDialog
        open={confirmOpen}
        title="Excluir O.S.?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        danger
        onConfirm={() => setConfirmOpen(false)}
        onCancel={() => setConfirmOpen(false)}
      />
    </Section>
  )
}
