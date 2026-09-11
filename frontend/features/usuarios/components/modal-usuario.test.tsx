import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ModalUsuario } from './modal-usuario'
import { ToastProvider } from '@/components/ui/toast'
import { usuariosAPI } from '../api'
import { detentorasAPI } from '@/features/detentoras/api'
import type { Usuario } from '@/features/auth/schema'
import type { UsuarioAdmin } from '../schema'

vi.mock('../api')
vi.mock('@/features/detentoras/api')

const ADMIN: Usuario = {
  id: 1,
  nome: 'Admin Logado',
  email: 'admin@teste.com',
  cargo: null,
  perfil: 'admin',
  detentora_id: null,
  ativo: true,
  modulosPermitidos: [],
}

function usuarioAlvo(overrides: Partial<UsuarioAdmin> = {}): UsuarioAdmin {
  return {
    id: 2,
    nome: 'Fulano',
    email: 'fulano@teste.com',
    cargo: null,
    perfil: 'comum',
    detentora_id: null,
    ativo: true,
    modulosPermitidos: [],
    criado_em: '2026-01-01T00:00:00',
    atualizado_em: null,
    ...overrides,
  }
}

function renderizar(state: Parameters<typeof ModalUsuario>[0]['state']) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ModalUsuario state={state} usuarioLogado={ADMIN} onClose={() => {}} />
      </ToastProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.mocked(detentorasAPI.listarTodas).mockResolvedValue([])
  vi.mocked(usuariosAPI.atualizar).mockResolvedValue({
    usuario: usuarioAlvo({ ativo: false }),
    sessaoAtualizada: false,
  })
})

describe('ModalUsuario', () => {
  /**
   * Regressão: um <select> do DOM só entrega string. Sem `setValueAs` no
   * register('ativo'), o formulário enviaria "false" (string truthy) em vez
   * de `false` (boolean) — o backend recebe `ativo` sempre truthy e o
   * usuário nunca é desativado pela UI, mesmo escolhendo "Inativo".
   */
  it('envia ativo como boolean ao trocar o status no select', async () => {
    const user = userEvent.setup()
    renderizar({ mode: 'edit', data: usuarioAlvo({ ativo: true }) })

    await screen.findByDisplayValue('Fulano')
    await user.selectOptions(screen.getByLabelText(/status/i), 'Inativo')
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    await waitFor(() => expect(usuariosAPI.atualizar).toHaveBeenCalled())
    const [, payload] = vi.mocked(usuariosAPI.atualizar).mock.calls[0]
    expect(payload.ativo).toBe(false)
    expect(typeof payload.ativo).toBe('boolean')
  })

  it('mostra o select de detentora só para perfil empresa', async () => {
    const user = userEvent.setup()
    renderizar({ mode: 'new' })

    expect(screen.queryByLabelText(/detentora vinculada/i)).not.toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText(/perfil de acesso/i), 'empresa')
    expect(screen.getByLabelText(/detentora vinculada/i)).toBeInTheDocument()
    expect(screen.queryByText(/módulos permitidos/i)).not.toBeInTheDocument()
  })

  /** Só admin edita status/perfil/módulos de outra pessoa (auth_routes.py:314-364). */
  it('desabilita campos de admin ao editar o próprio usuário logado', async () => {
    renderizar({ mode: 'edit', data: usuarioAlvo({ id: ADMIN.id, perfil: 'admin' }) })
    await screen.findByDisplayValue('Fulano')

    expect(screen.getByLabelText(/perfil de acesso/i)).toBeDisabled()
    expect(screen.getByLabelText(/status/i)).toBeDisabled()
  })

  it('mantém campos de admin habilitados ao editar outro usuário', async () => {
    renderizar({ mode: 'edit', data: usuarioAlvo() })
    await screen.findByDisplayValue('Fulano')

    expect(screen.getByLabelText(/perfil de acesso/i)).toBeEnabled()
    expect(screen.getByLabelText(/status/i)).toBeEnabled()
  })
})
