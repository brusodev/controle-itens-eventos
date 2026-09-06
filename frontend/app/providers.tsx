'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { ToastProvider } from '@/components/ui/toast'
import { ModuloProvider } from '@/features/modulos/modulo-context'

export function Providers({ children }: { children: React.ReactNode }) {
  // Uma instância por sessão de navegador, não por render — evita recriar o
  // cache a cada re-render do RootLayout.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ModuloProvider>
        <ToastProvider>{children}</ToastProvider>
      </ModuloProvider>
    </QueryClientProvider>
  )
}
