'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  /** Bottom-sheet no mobile em vez de modal centralizado — padrão do plano. */
  className?: string
}

/**
 * Modal genérico — quem controla abertura/edição usa o padrão de estado
 * único das preferências do projeto:
 *   const [modal, setModal] = useState<null | { mode: 'new' | 'edit'; data?: T }>(null)
 * em vez de flags soltas (`mostrarModal`, `editando`, `itemAtual`...).
 *
 * Trap de foco simples + fechar com Esc — acessibilidade básica (§ plano).
 */
export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
      if (event.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (!focusable || focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    dialogRef.current?.focus()
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className={cn(
          // Bottom-sheet no mobile (desliza de baixo, cantos só em cima),
          // modal centralizado a partir de sm: (plano § UX).
          'flex max-h-[85vh] w-full flex-col rounded-t-lg bg-surface shadow-lg',
          'sm:max-w-lg sm:rounded-lg',
          className,
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
            <h2 className="text-lg font-semibold text-text">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="text-text-muted hover:text-text"
            >
              ×
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
