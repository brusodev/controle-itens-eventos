/**
 * Parser de número em formato BR (separador de milhar "." e decimal ",") —
 * porta de `_calcularDisponivelItem` em ordens-servico.js:283. O backend
 * formata `inicial`/`gasto`/`preco` do estoque assim antes de mandar ao
 * client (ver Item.to_dict / formatar_br em backend/models.py:70).
 */
export function parseNumeroBr(valor: string | null | undefined): number {
  if (!valor) return 0
  return parseFloat(String(valor).replace(/\./g, '').replace(',', '.')) || 0
}

export function formatarNumeroBr(valor: number, maximumFractionDigits = 2): string {
  return valor.toLocaleString('pt-BR', { maximumFractionDigits })
}
