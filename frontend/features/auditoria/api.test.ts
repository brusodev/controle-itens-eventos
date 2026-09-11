import { describe, expect, it } from 'vitest'
import { montarParams } from './api'
import { EMPTY_FILTROS_AUDITORIA, LIMITE_POR_PAGINA } from './schema'

describe('montarParams', () => {
  it('envia só paginação quando não há filtro', () => {
    const params = new URLSearchParams(montarParams(EMPTY_FILTROS_AUDITORIA, 1))
    expect([...params.keys()].sort()).toEqual(['limite', 'pagina'])
    expect(params.get('limite')).toBe(String(LIMITE_POR_PAGINA))
  })

  /**
   * O backend compara data_fim com um datetime (auditoria_routes.py:43).
   * Sem a hora fixada no fim do dia, escolher "10/09" excluiria todos os
   * registros do próprio dia 10 — o filtro pareceria simplesmente errado.
   */
  it('estende as datas aos extremos do dia', () => {
    const params = new URLSearchParams(
      montarParams({ ...EMPTY_FILTROS_AUDITORIA, dataInicio: '2026-09-01', dataFim: '2026-09-10' }, 1),
    )
    expect(params.get('data_inicio')).toBe('2026-09-01T00:00:00')
    expect(params.get('data_fim')).toBe('2026-09-10T23:59:59')
  })

  it('omite filtros vazios em vez de mandar string vazia', () => {
    const params = new URLSearchParams(
      montarParams({ ...EMPTY_FILTROS_AUDITORIA, acao: 'UPDATE' }, 2),
    )
    expect(params.get('acao')).toBe('UPDATE')
    expect(params.has('usuario_id')).toBe(false)
    expect(params.has('modulo')).toBe(false)
    expect(params.get('pagina')).toBe('2')
  })
})
