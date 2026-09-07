'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Spinner } from '@/components/ui/spinner'
import { useUsuarioAtual } from '@/features/auth/hooks/use-usuario-atual'
import { Sidebar } from '@/features/layout/components/sidebar'
import { Topbar } from '@/features/layout/components/topbar'
import { useSidebarColapsada } from '@/features/layout/hooks/use-sidebar-colapsada'
import { useDrawerMobile } from '@/features/layout/hooks/use-drawer-mobile'
import { cn } from '@/lib/cn'

/**
 * Layout das telas internas autenticadas — porta de base.html (sidebar +
 * topbar via layout_parts.html). Só envolve o route group (interno); /login
 * e /style-guide continuam sem chrome, mesmo padrão do Flask (login.html e
 * dashboard.html também são standalone).
 *
 * `useUsuarioAtual()` já dispara o redirect de sessão expirada (via
 * apiFetch, em caso de 401) — aqui só resta tratar o caso de perfil
 * 'empresa' entrar numa tela interna por engano, replicando o
 * `views_routes.py` atual (essas contas pertencem ao Portal, Fase 3).
 */
export default function LayoutInterno({ children }: { children: React.ReactNode }) {
  const { data: usuario, isLoading } = useUsuarioAtual()
  const { colapsada, alternar } = useSidebarColapsada()
  const drawer = useDrawerMobile()
  const pathname = usePathname()

  const ehEmpresa = usuario?.perfil === 'empresa'

  useEffect(() => {
    if (ehEmpresa) {
      // /empresa é o Portal da Detentora (Flask, Fase 3) — navegação de
      // página inteira, não router.push() (que assumiria rota do próprio Next).
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign('/empresa')
    }
  }, [ehEmpresa])

  // Fecha o drawer ao trocar de rota: o onClick do item só cobre cliques no
  // menu — voltar pelo botão do navegador deixava o drawer aberto sobre a
  // tela nova.
  const { fechar: fecharDrawer } = drawer
  useEffect(() => {
    fecharDrawer()
  }, [pathname, fecharDrawer])

  if (isLoading || !usuario || ehEmpresa) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      <Sidebar
        usuario={usuario}
        colapsada={colapsada}
        abertaNoMobile={drawer.aberto}
        onFecharMobile={drawer.fechar}
      />
      <div className={cn('flex min-h-screen flex-col transition-[margin]', colapsada ? 'md:ml-[70px]' : 'md:ml-[260px]')}>
        <Topbar
          usuario={usuario}
          colapsada={colapsada}
          onAlternarColapso={alternar}
          onAbrirMenuMobile={drawer.abrir}
        />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
