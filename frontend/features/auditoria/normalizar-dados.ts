/**
 * `dados_antes`/`dados_depois` podem chegar como string JSON ou como objeto
 * já parseado, dependendo de quem gravou o registro — porta do parse
 * defensivo em auditoria.html:738-756.
 *
 * Devolve null para tudo que não vira um objeto com ao menos uma chave:
 * JSON inválido, null, string vazia, array, primitivo ou `{}`. É o mesmo
 * critério do legado (`temAntes`/`temDepois`), que decide se a seção de
 * comparação aparece.
 */
export function normalizarDadosAuditoria(valor: unknown): Record<string, unknown> | null {
  let dados = valor

  if (typeof dados === 'string') {
    try {
      dados = JSON.parse(dados)
    } catch {
      return null
    }
  }

  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) return null

  const registro = dados as Record<string, unknown>
  return Object.keys(registro).length > 0 ? registro : null
}
