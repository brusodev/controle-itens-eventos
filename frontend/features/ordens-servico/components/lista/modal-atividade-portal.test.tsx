import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ModalAtividadePortal } from './modal-atividade-portal'
import { osAPI } from '../../api'

/**
 * Regressão do caso de XSS armazenado cross-privilege identificado no plano
 * (§ Context, item 2): um comentário da detentora externa contendo HTML/script
 * hoje precisa aparecer como TEXTO LITERAL na tela do admin, nunca ser
 * interpretado como markup — era exatamente essa falha em ordens-servico.js:1247
 * (innerHTML sem escape) que este componente corrige por construção.
 */
describe('ModalAtividadePortal — XSS cross-privilege', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  function renderComQueryClient(ui: React.ReactElement) {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
  }

  it('renderiza comentário malicioso da detentora como texto, não como HTML', async () => {
    const payloadMalicioso = '<img src=x onerror="window.__xss=true">'

    vi.spyOn(osAPI, 'atividadePortal').mockResolvedValue({
      os_id: 1,
      status: 'em_revisao',
      numero_os: '1/2026',
      evento: 'Workshop de Teste',
      revisoes: [],
      aceites: [],
      comentarios: [
        {
          id: 1,
          texto: payloadMalicioso,
          criadoEm: '2026-01-01T10:00:00',
          autorPerfil: 'empresa',
          autorNome: 'Detentora Teste',
        },
      ],
    })

    renderComQueryClient(<ModalAtividadePortal osId={1} onClose={() => {}} />)

    // O texto deve aparecer LITERALMENTE na árvore (prova que não virou markup).
    const paragrafo = await screen.findByText(payloadMalicioso)
    expect(paragrafo.tagName).toBe('P')

    // Nenhum elemento <img> foi de fato criado a partir do payload — se o
    // React tivesse interpretado como HTML, este seletor encontraria a tag.
    expect(document.querySelector('img')).toBeNull()

    // O onerror nunca executou.
    expect((window as unknown as { __xss?: boolean }).__xss).toBeUndefined()
  })
})
