import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ListaAuditoria } from './lista-auditoria'
import type { Auditoria } from '../schema'

function registro(overrides: Partial<Auditoria> = {}): Auditoria {
  return {
    id: 1,
    usuario_id: 7,
    usuario_email: 'fulano@teste.com',
    usuario_nome: 'Fulano',
    acao: 'UPDATE',
    modulo: 'ITEM',
    entidade_tipo: 'Item',
    entidade_id: 3,
    descricao: 'Alterou o item',
    dados_antes: null,
    dados_depois: null,
    ip_address: '127.0.0.1',
    user_agent: 'Mozilla/5.0',
    data_hora: '2026-01-15T10:30:00',
    ...overrides,
  }
}

describe('ListaAuditoria', () => {
  /**
   * Regressão de XSS: renderizarTabela() (auditoria.html:614) montava
   * innerHTML interpolando usuario_nome, usuario_email e descricao sem
   * escape algum. Um registro gravado com script no nome executaria ao
   * abrir a tela — para o admin, que é quem vê esta página.
   */
  it('renderiza nome e descrição como texto literal, nunca como HTML', () => {
    const payload = '<script>alert(1)</script>'
    render(
      <ListaAuditoria
        registros={[registro({ usuario_nome: payload, descricao: payload })]}
        onVerDetalhes={() => {}}
      />,
    )

    expect(document.querySelector('script')).toBeNull()
    expect(screen.getAllByText(payload).length).toBeGreaterThan(0)
  })

  /**
   * O legado passava o registro inteiro serializado dentro do atributo
   * onclick, escapando só aspas simples (auditoria.html:625). Aqui o objeto
   * chega por closure — não há string em atributo para quebrar.
   */
  it('entrega o objeto original ao handler de detalhes', async () => {
    const onVerDetalhes = vi.fn()
    const item = registro({ descricao: `aspas ' e " misturadas` })
    render(<ListaAuditoria registros={[item]} onVerDetalhes={onVerDetalhes} />)

    await userEvent.click(screen.getAllByRole('button', { name: /ver/i })[0])

    expect(onVerDetalhes).toHaveBeenCalledWith(item)
  })

  it('mostra estado vazio quando não há registros', () => {
    render(<ListaAuditoria registros={[]} onVerDetalhes={() => {}} />)
    expect(screen.getByText(/nenhum registro encontrado/i)).toBeInTheDocument()
  })

  it('traduz ação e módulo conhecidos', () => {
    render(<ListaAuditoria registros={[registro()]} onVerDetalhes={() => {}} />)
    expect(screen.getAllByText('Atualizar').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Item').length).toBeGreaterThan(0)
  })

  it('mostra ação desconhecida sem quebrar a tela', () => {
    render(<ListaAuditoria registros={[registro({ acao: 'ACAO_ANTIGA' })]} onVerDetalhes={() => {}} />)
    expect(screen.getAllByText('ACAO_ANTIGA').length).toBeGreaterThan(0)
  })
})
