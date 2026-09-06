'use client'

import { createContext, useCallback, useContext, useState } from 'react'
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

let nextId = 0

/**
 * Substitui window.alert (proibido nas preferências do projeto). Envolver a
 * árvore uma vez em <ToastProvider> e usar `useToast().showToast(...)`.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = nextId++
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'rounded-md px-4 py-3 text-sm font-medium shadow-lg',
              TYPE_CLASSES[toast.type],
            )}
          >
            {toast.message}
          </div>
        ))}
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
