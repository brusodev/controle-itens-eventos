import { parseNumeroBr } from '@/lib/numero-br'
import type { ItemEstoque } from './schema'

/**
 * Porta de _calcularDisponivelItem/_validarQtdVsEstoque em
 * ordens-servico.js:283-315 — quanto do item ainda está disponível no grupo,
 * e se uma quantidade solicitada excede esse saldo.
 *
 * `null` quando o grupo não tem registro de estoque para este item (o
 * seletor original também não mostra badge nesse caso — item "sem controle
 * de estoque" é distinto de "zerado").
 */
export function calcularDisponivel(item: ItemEstoque, grupo: string): number | null {
  const regiao = item.regioes?.[grupo]
  if (!regiao) return null
  return parseNumeroBr(regiao.inicial) - parseNumeroBr(regiao.gasto)
}

export function excedeEstoque(params: {
  disponivel: number | null
  quantidade: number
  diarias: number
}): boolean {
  const { disponivel, quantidade, diarias } = params
  if (disponivel === null || disponivel < 0) return false
  return quantidade * diarias > disponivel
}
