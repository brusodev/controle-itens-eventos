'use client'

import { AlertTriangle } from 'lucide-react'
import { Modal } from './modal'
import { Button } from './button'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  /** Desabilita os dois botões e mostra spinner no de confirmar — evita duplo clique numa exclusão. */
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Substitui window.confirm (proibido nas preferências do projeto) — usado
 * em ações destrutivas como excluir/cancelar O.S.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <div className="flex gap-3">
        {danger && (
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-danger-strong"
            strokeWidth={1.75}
          />
        )}
        {description && <p className="text-sm text-text-muted">{description}</p>}
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
