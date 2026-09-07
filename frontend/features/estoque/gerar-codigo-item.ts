import type { ItemEstoque } from './schema'

/**
 * Próximo código sequencial de item numa categoria — porta de
 * kits-requisicoes.js:117-119 (`maxCodigo + 1`). Códigos não numéricos são
 * ignorados no cálculo do máximo (ex.: itens que usam código BEC como
 * `item`, se algum dia existirem).
 */
export function gerarProximoCodigoItem(itensExistentes: ItemEstoque[]): string {
  const maxCodigo = itensExistentes.reduce((max, item) => {
    const codigo = parseInt(item.item, 10)
    return Number.isNaN(codigo) ? max : Math.max(max, codigo)
  }, 0)
  return String(maxCodigo + 1)
}

/**
 * Regiões iniciais de um item novo — replica a quantidade inicial em todas
 * as regiões do módulo, gasto zerado. Porta de kits-requisicoes.js:110-114.
 */
export function montarRegioesIniciais(
  quantidadeInicial: string,
  quantidadeRegioes: number,
): Record<string, { inicial: string; gasto: string }> {
  const regioes: Record<string, { inicial: string; gasto: string }> = {}
  for (let regiao = 1; regiao <= quantidadeRegioes; regiao++) {
    regioes[String(regiao)] = { inicial: quantidadeInicial, gasto: '0' }
  }
  return regioes
}
