import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Sidebar } from './sidebar'
import type { Usuario } from '@/features/auth/schema'

vi.mock('next/navigation', () => ({ usePathname: () => '/os' }))
vi.mock('@/features/modulos/modulo-context', () => ({ useModulo: () => ({ modulo: 'coffee' }) }))

const USUARIO: Usuario = {
  id: 1,
  nome: 'Fulano de Tal',
  email: 'fulano@teste.com',
  cargo: null,
  perfil: 'admin',
  detentora_id: null,
  ativo: true,
  modulosPermitidos: [],
}

function renderizar(props: Partial<React.ComponentProps<typeof Sidebar>> = {}) {
  render(
    <Sidebar
      usuario={USUARIO}
      colapsada={false}
      abertaNoMobile={false}
      onFecharMobile={() => {}}
      {...props}
    />,
  )
  return document.querySelector('aside')!
}

describe('Sidebar', () => {
  /**
   * Regressão: `colapsada` é estado só do desktop. Sem o prefixo `md:` na
   * largura reduzida, quem recolhia a sidebar no desktop abria depois o
   * drawer no celular com 70px — uma tira de ícones sem label, inutilizável.
   */
  it('mantém a largura cheia no mobile mesmo colapsada no desktop', () => {
    const aside = renderizar({ colapsada: true, abertaNoMobile: true })

    expect(aside.className).toContain('w-[260px]')
    expect(aside.className).toContain('md:w-[70px]')
    expect(aside.className).not.toMatch(/(^|\s)w-\[70px\]/)
  })

  it('esconde a sidebar fora da tela no mobile quando o drawer está fechado', () => {
    const aside = renderizar({ abertaNoMobile: false })

    expect(aside.className).toContain('-translate-x-full')
    expect(aside.className).toContain('md:translate-x-0')
  })

  it('renderiza os labels dos itens como texto (ícone é SVG, não emoji)', () => {
    renderizar()

    expect(screen.getByText('Ordens de Serviço')).toBeInTheDocument()
    expect(document.querySelectorAll('aside svg').length).toBeGreaterThan(0)
  })

  it('marca o item da rota atual com aria-current', () => {
    renderizar()

    expect(screen.getByText('Ordens de Serviço').closest('a')).toHaveAttribute('aria-current', 'page')
  })
})
