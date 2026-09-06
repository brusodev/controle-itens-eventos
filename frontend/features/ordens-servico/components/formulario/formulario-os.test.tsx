import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FormularioOS } from './formulario-os'
import { osAPI } from '../../api'
import { detentorasAPI } from '@/features/detentoras/api'
import { EMPTY_OS, type OSPersistida } from '../../schema'
import { ToastProvider } from '@/components/ui/toast'
import { ModuloProvider } from '@/features/modulos/modulo-context'

/**
 * Regressão da família de bugs "campo não salva na edição" (plano §
 * Context, item 1): o payload de salvamento existia duplicado em
 * emitir-os.js e ordens-servico.js, e um campo podia sumir em um dos dois
 * caminhos. Aqui há só `useSalvarOS` — este teste carrega uma O.S., edita
 * cada campo relevante e confirma que TODOS chegam intactos no payload de
 * PUT, inclusive os que já sumiram historicamente (observações, data do
 * evento como texto livre).
 */

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const OS_EXISTENTE: OSPersistida = {
  ...EMPTY_OS,
  id: 42,
  status: 'emitida',
  modulo: 'coffee',
  grupo: '1',
  contrato: '014/DA/2024',
  detentora: 'Empresa Teste',
  cnpj: '00.000.000/0001-00',
  servico: 'COFFEE BREAK',
  evento: 'Evento Original',
  data: '10/05/2026', // texto livre — nunca deve virar ISO
  horario: '08h às 12h',
  local: 'Sede',
  justificativa: 'Justificativa original',
  observacoes: 'Observação original',
  responsavel: 'Fulano de Tal',
  signatarios: [
    { cargo: 'Gestor do Contrato', nome: 'Gestor Original' },
    { cargo: 'Fiscal do Contrato', nome: 'Fiscal Original' },
  ],
  itens: [
    {
      categoria: 'coffee_break_bebidas_quentes',
      itemId: 1,
      descricao: 'Item Original',
      unidade: 'Pessoa',
      diarias: 1,
      qtdSolicitada: 50,
      qtdTotal: 50,
    },
  ],
}

function renderFormulario() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <ModuloProvider>
        <ToastProvider>
          <FormularioOS osId={42} />
        </ToastProvider>
      </ModuloProvider>
    </QueryClientProvider>,
  )
}

describe('FormularioOS — edição campo a campo', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(osAPI, 'obter').mockResolvedValue(OS_EXISTENTE)
    vi.spyOn(osAPI, 'atualizar').mockResolvedValue(OS_EXISTENTE)
    vi.spyOn(osAPI, 'proximoNumero').mockResolvedValue({ proximoNumero: 'OS-999' })
    vi.spyOn(osAPI, 'setoresSolicitantes').mockResolvedValue([])
    vi.spyOn(osAPI, 'listar').mockResolvedValue([OS_EXISTENTE])
    vi.spyOn(detentorasAPI, 'listarGrupos').mockResolvedValue(['1'])
    vi.spyOn(detentorasAPI, 'obterPorGrupo').mockResolvedValue({
      id: 1,
      contratoNum: '014/DA/2024',
      dataAssinatura: '2024-11-04',
      prazoVigencia: '12 MESES',
      nome: 'Empresa Teste',
      cnpj: '00.000.000/0001-00',
      servico: 'COFFEE BREAK',
      grupo: '1',
      ativo: true,
    })
  })

  it('carrega os dados existentes nos campos', async () => {
    renderFormulario()
    expect(await screen.findByDisplayValue('Evento Original')).toBeInTheDocument()
    expect(screen.getByDisplayValue('10/05/2026')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Justificativa original')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Observação original')).toBeInTheDocument()
  })

  it('editar observações e emitir preserva o novo valor no payload — bug histórico', async () => {
    const user = userEvent.setup()
    renderFormulario()

    const campoObservacoes = await screen.findByDisplayValue('Observação original')
    await user.clear(campoObservacoes)
    await user.type(campoObservacoes, 'Observação editada')

    await user.click(screen.getByRole('button', { name: 'Visualizar O.S.' }))

    const dialog = await screen.findByRole('dialog', { name: 'Visualizar O.S.' })
    await user.click(within(dialog).getByRole('button', { name: 'Confirmar e Emitir' }))

    await waitFor(() => {
      expect(osAPI.atualizar).toHaveBeenCalledWith(
        42,
        expect.objectContaining({ observacoes: 'Observação editada' }),
      )
    })
  })

  it('editar a data do evento mantém texto livre — nunca converte para ISO (bug do commit 09e93ae)', async () => {
    const user = userEvent.setup()
    renderFormulario()

    const campoData = await screen.findByDisplayValue('10/05/2026')
    await user.clear(campoData)
    await user.type(campoData, '26 à 30/05/2026')

    await user.click(screen.getByRole('button', { name: 'Visualizar O.S.' }))
    const dialog = await screen.findByRole('dialog', { name: 'Visualizar O.S.' })
    await user.click(within(dialog).getByRole('button', { name: 'Confirmar e Emitir' }))

    await waitFor(() => {
      expect(osAPI.atualizar).toHaveBeenCalledWith(
        42,
        expect.objectContaining({ data: '26 à 30/05/2026' }),
      )
    })
  })

  it('editar evento, justificativa e itens simultaneamente — todos persistem juntos', async () => {
    const user = userEvent.setup()
    renderFormulario()

    const campoEvento = await screen.findByDisplayValue('Evento Original')
    await user.clear(campoEvento)
    await user.type(campoEvento, 'Evento Editado')

    const campoJustificativa = screen.getByDisplayValue('Justificativa original')
    await user.clear(campoJustificativa)
    await user.type(campoJustificativa, 'Justificativa editada')

    await user.click(screen.getByRole('button', { name: 'Visualizar O.S.' }))
    const dialog = await screen.findByRole('dialog', { name: 'Visualizar O.S.' })
    await user.click(within(dialog).getByRole('button', { name: 'Confirmar e Emitir' }))

    await waitFor(() => {
      expect(osAPI.atualizar).toHaveBeenCalledWith(
        42,
        expect.objectContaining({
          evento: 'Evento Editado',
          justificativa: 'Justificativa editada',
          // O item original não foi tocado nesta edição — precisa sobreviver
          // ao submit tanto quanto os campos de texto editados.
          itens: expect.arrayContaining([expect.objectContaining({ descricao: 'Item Original' })]),
        }),
      )
    })
  })
})
