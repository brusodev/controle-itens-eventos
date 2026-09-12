'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/cn'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TYPE_CLASSES: Record<ToastType, string> = {
  success: 'bg-success text-text-on-primary',
  error: 'bg-danger-strong text-text-on-primary',
  info: 'bg-neutral-strong text-text-on-primary',
}

const TYPE_ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

let nextId = 0

/**
 * Substitui window.alert (proibido nas preferências do projeto). Envolver a
 * árvore uma vez em <ToastProvider> e usar `useToast().showToast(...)`.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remover = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = nextId++
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => remover(id), 3000)
    },
    [remover],
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const Icone = TYPE_ICONS[toast.type]
          return (
            <div
              key={toast.id}
              className={cn(
                'flex items-center gap-2 rounded-md py-3 pl-4 pr-2 text-sm font-medium shadow-lg animate-slide-up',
                TYPE_CLASSES[toast.type],
              )}
            >
              <Icone aria-hidden="true" className="size-4.5 shrink-0" strokeWidth={1.75} />
              <span className="flex-1">{toast.message}</span>
              <button
                onClick={() => remover(toast.id)}
                aria-label="Fechar aviso"
                className="flex size-7 shrink-0 items-center justify-center rounded-sm hover:bg-black/10"
              >
                <X aria-hidden="true" className="size-4" strokeWidth={1.75} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast() precisa estar dentro de <ToastProvider>.')
  }
  return context
}
