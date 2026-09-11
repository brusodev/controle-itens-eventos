import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { periodoMesVigente } from './periodo-mes-vigente'

describe('periodoMesVigente', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('devolve o primeiro dia do mês e a data de hoje, em ISO', () => {
    vi.setSystemTime(new Date(2026, 8, 15)) // 15/09/2026 (mês 0-indexado)
    expect(periodoMesVigente()).toEqual({ inicio: '2026-09-01', fim: '2026-09-15' })
  })

  it('preenche dia e mês com zero à esquerda', () => {
    vi.setSystemTime(new Date(2026, 0, 5)) // 05/01/2026
    expect(periodoMesVigente()).toEqual({ inicio: '2026-01-01', fim: '2026-01-05' })
  })

  it('no primeiro dia do mês, início e fim coincidem', () => {
    vi.setSystemTime(new Date(2026, 2, 1))
    expect(periodoMesVigente()).toEqual({ inicio: '2026-03-01', fim: '2026-03-01' })
  })
})
