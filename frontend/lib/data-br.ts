/**
 * Conversões entre dd/mm/aaaa (exibido ao usuário) e yyyy-mm-dd (ISO, como o
 * backend armazena datas de controle como pagamentoVencimento). Porta da
 * lógica que existia duplicada em vários pontos de ordens-servico.js
 * (ex.: abrirModalPagamento / salvarPagamento).
 *
 * Não confundir com o campo `data` da O.S. (evento) — esse é texto livre e
 * NUNCA passa por aqui (ver features/ordens-servico/schema.ts).
 */

export function isoParaBr(iso: string | null | undefined): string {
  if (!iso) return ''
  if (!iso.includes('-')) return iso // já está em algum outro formato — devolve como veio
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

export function brParaIso(br: string | null | undefined): string | null {
  const valor = (br ?? '').trim()
  if (!valor) return null
  if (!valor.includes('/')) return valor // já parece ISO
  const [dia, mes, ano] = valor.split('/')
  return `${ano}-${mes}-${dia}`
}
