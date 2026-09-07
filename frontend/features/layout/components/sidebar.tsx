'use client'

import { usePathname } from 'next/navigation'
import { Target, X } from 'lucide-react'
import { getModuloConfig } from '@/features/modulos/config'
import type { Usuario } from '@/features/auth/schema'
import { useModulo } from '@/features/modulos/modulo-context'
import { cn } from '@/lib/cn'
import { itensMenuVisiveis } from '../menu-items'
import { ItemMenuLink } from './item-menu-link'

/**
 * Sidebar — porta da macro sidebar() (ramo admin/comum) em
 * layout_parts.html. Dimensões herdadas do legado (--sidebar-width: 260px,
 * --sidebar-collapsed-width: 70px) como classes Tailwind equivalentes.
 *
 * Responsividade: `colapsada` é um estado EXCLUSIVO do desktop — no mobile a
 * sidebar é drawer deslizante e sempre em largura cheia. Aplicar a largura
 * colapsada sem o prefixo `md:` fazia o drawer do celular abrir com 70px
 * quando o usuário tinha recolhido a sidebar no desktop antes.
 */
export function Sidebar({
  usuario,
  colapsada,
  abertaNoMobile,
  onFecharMobile,
}: {
  usuario: Usuario
  colapsada: boolean
  abertaNoMobile: boolean
  onFecharMobile: () => void
}) {
  const pathname = usePathname()
  const { modulo } = useModulo()
  const config = getModuloConfig(modulo)
  const itens = itensMenuVisiveis(usuario, modulo, config)

  return (
    <>
      {abertaNoMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onFecharMobile}
          aria-hidden="true"
        />
      )}
      <aside
        aria-label="Menu principal"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-neutral-900 text-white',
          'transition-transform duration-200 md:transition-[width]',
          // Largura reduzida só no desktop — no mobile o drawer é sempre 260px.
          colapsada && 'md:w-[70px]',
          // Fora do desktop, a visibilidade é o próprio drawer.
          'md:translate-x-0',
          abertaNoMobile ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className={cn('flex h-15 shrink-0 items-center gap-2 border-b border-white/10', colapsada ? 'px-3 md:justify-center' : 'px-4')}>
          <Target aria-hidden="true" className="size-5 shrink-0 text-primary-300" strokeWidth={2} />
          <span className={cn('font-semibold', colapsada && 'md:hidden')}>Controle Itens</span>
          {/* Fechar o drawer: no mobile o overlay e o Esc não são descobríveis
              por toque — sem este botão a única saída óbvia era tocar fora. */}
          <button
            type="button"
            onClick={onFecharMobile}
            aria-label="Fechar menu"
            className="ml-auto flex size-9 shrink-0 items-center justify-center rounded-md text-white/70 hover:bg-white/10 hover:text-white md:hidden"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <nav className={cn('flex flex-1 flex-col gap-1 overflow-y-auto py-3', colapsada ? 'px-3 md:px-2.5' : 'px-3')}>
          {itens.map((item, index) => (
            <div key={item.id}>
              {/* Divisor do legado: após "Trocar Módulo". */}
              {index === 1 && <div className="my-2 border-t border-white/10" />}
              <ItemMenuLink
                item={item}
                ativo={pathname === item.href || (item.href !== '/' && Boolean(pathname?.startsWith(item.href + '/')))}
                colapsada={colapsada}
                onNavegar={onFecharMobile}
              />
            </div>
          ))}
        </nav>

      </aside>
    </>
  )
}
