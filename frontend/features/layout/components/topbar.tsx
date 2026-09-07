'use client'

import { useState } from 'react'
import { ChevronDown, KeyRound, LogOut, Menu, PanelLeftClose, PanelLeftOpen, UserRound } from 'lucide-react'
import { getModuloConfig } from '@/features/modulos/config'
import type { Usuario } from '@/features/auth/schema'
import { useModulo } from '@/features/modulos/modulo-context'
import { cn } from '@/lib/cn'
import { ModalConfirmarLogout } from './modal-confirmar-logout'

const CLASSE_ITEM_DROPDOWN =
  'flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-text hover:bg-surface-muted'

/**
 * Topbar — porta da macro topbar() em layout_parts.html. Título mostra o
 * nome do módulo ativo; dropdown do usuário tem Meu Perfil, Alterar Senha e
 * Sair (Sair usa ConfirmDialog em vez do confirm() nativo do legado).
 *
 * O botão de recolher a sidebar mora aqui (desktop): antes ficava solto
 * entre a topbar e o <main>, ocupando altura própria e empurrando todo o
 * conteúdo da página para baixo.
 */
export function Topbar({
  usuario,
  colapsada,
  onAlternarColapso,
  onAbrirMenuMobile,
}: {
  usuario: Usuario
  colapsada: boolean
  onAlternarColapso: () => void
  onAbrirMenuMobile: () => void
}) {
  const { modulo } = useModulo()
  const config = getModuloConfig(modulo)
  const [dropdownAberto, setDropdownAberto] = useState(false)
  const [confirmandoLogout, setConfirmandoLogout] = useState(false)

  const IconeColapso = colapsada ? PanelLeftOpen : PanelLeftClose

  return (
    <header className="sticky top-0 z-30 flex h-15 shrink-0 items-center justify-between gap-2 border-b border-border-subtle bg-surface px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onAbrirMenuMobile}
          aria-label="Abrir menu"
          className="-ml-1 flex size-9 shrink-0 items-center justify-center rounded-md text-text hover:bg-surface-muted md:hidden"
        >
          <Menu aria-hidden="true" className="size-5" />
        </button>

        <button
          type="button"
          onClick={onAlternarColapso}
          aria-label={colapsada ? 'Expandir menu' : 'Recolher menu'}
          className="hidden size-9 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-surface-muted hover:text-text md:flex"
        >
          <IconeColapso aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </button>

        <h2 className="truncate text-sm font-semibold text-text sm:text-base">{config.titulo}</h2>
      </div>

      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setDropdownAberto((v) => !v)}
          aria-expanded={dropdownAberto}
          aria-haspopup="menu"
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-text hover:bg-surface-muted sm:px-3"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-text-on-primary">
            {usuario.nome.charAt(0).toUpperCase()}
          </span>
          {/* O nome some no mobile: com nomes longos ele espremia o título do módulo. */}
          <span className="hidden max-w-[12ch] truncate sm:inline">{usuario.nome.split(' ')[0]}</span>
          <ChevronDown aria-hidden="true" className={cn('size-4 transition-transform', dropdownAberto && 'rotate-180')} />
        </button>

        {dropdownAberto && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setDropdownAberto(false)} aria-hidden="true" />
            <div role="menu" className="absolute right-0 z-20 mt-1 w-56 rounded-md border border-border-subtle bg-surface py-1 shadow-lg">
              {/* Identidade completa mora aqui: no mobile o botão só mostra o
                  avatar, e a sidebar não repete mais esses dados. */}
              <div className="border-b border-border-subtle px-4 py-2.5">
                <p className="truncate text-sm font-medium text-text">{usuario.nome}</p>
                <p className="truncate text-xs text-text-muted">{usuario.email}</p>
                <p className="mt-0.5 text-xs capitalize text-text-muted">{usuario.perfil}</p>
              </div>
              {/* Ainda Flask (Domínio 4 da Fase 2 não fechou) — <a> normal, não <Link>. */}
              <a href="/gerenciar-conta" role="menuitem" className={CLASSE_ITEM_DROPDOWN}>
                <UserRound aria-hidden="true" className="size-4 shrink-0 text-text-muted" strokeWidth={1.75} />
                Meu Perfil
              </a>
              <a href="/alterar-senha" role="menuitem" className={CLASSE_ITEM_DROPDOWN}>
                <KeyRound aria-hidden="true" className="size-4 shrink-0 text-text-muted" strokeWidth={1.75} />
                Alterar Senha
              </a>
              <div className="my-1 border-t border-border-subtle" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setDropdownAberto(false)
                  setConfirmandoLogout(true)
                }}
                className={cn(CLASSE_ITEM_DROPDOWN, 'text-danger-strong hover:bg-danger-subtle')}
              >
                <LogOut aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
                Sair
              </button>
            </div>
          </>
        )}
      </div>

      <ModalConfirmarLogout open={confirmandoLogout} onClose={() => setConfirmandoLogout(false)} />
    </header>
  )
}
