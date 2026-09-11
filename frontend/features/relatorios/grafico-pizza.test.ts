import { describe, expect, it } from 'vitest'
import { calcularFatiasPizza } from './grafico-pizza'

describe('calcularFatiasPizza', () => {
  it('devolve array vazio quando o total é zero', () => {
    expect(calcularFatiasPizza([{ label: 'A', valor: 0 }])).toEqual([])
    expect(calcularFatiasPizza([])).toEqual([])
  })

  it('ignora itens com valor zero, mas mantém os demais', () => {
    const fatias = calcularFatiasPizza([
      { label: 'A', valor: 10 },
      { label: 'B', valor: 0 },
      { label: 'C', valor: 30 },
    ])
    expect(fatias.map((f) => f.label)).toEqual(['A', 'C'])
  })

  it('calcula o percentual de cada fatia sobre o total', () => {
    const fatias = calcularFatiasPizza([
      { label: 'A', valor: 25 },
      { label: 'B', valor: 75 },
    ])
    expect(fatias.find((f) => f.label === 'A')?.percentual).toBe(25)
    expect(fatias.find((f) => f.label === 'B')?.percentual).toBe(75)
  })

  it('soma dos percentuais fecha em 100', () => {
    const fatias = calcularFatiasPizza([
      { label: 'A', valor: 7 },
      { label: 'B', valor: 13 },
      { label: 'C', valor: 5 },
    ])
    const soma = fatias.reduce((s, f) => s + f.percentual, 0)
    expect(soma).toBeCloseTo(100, 0)
  })

  it('cada fatia gera um path SVG não vazio', () => {
    const fatias = calcularFatiasPizza([{ label: 'A', valor: 10 }])
    expect(fatias[0].path).toMatch(/^M /)
  })

  it('atribui cores diferentes para itens diferentes (dentro da paleta)', () => {
    const fatias = calcularFatiasPizza([
      { label: 'A', valor: 1 },
      { label: 'B', valor: 1 },
    ])
    expect(fatias[0].cor).not.toBe(fatias[1].cor)
  })
})
