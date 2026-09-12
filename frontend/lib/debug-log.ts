/**
 * Log de diagnóstico opt-out por ambiente — nunca em produção, nunca com
 * emoji (emoji em stdout já quebrou build/print no Windows nesta stack:
 * ver memória do projeto). Preferir a `console.error`/`console.warn` direto,
 * que o eslint bloqueia fora de debug — este helper é o escape hatch único.
 */
export function debugLog(mensagem: string, ...dados: unknown[]): void {
  if (process.env.NODE_ENV === 'production') return
  console.warn(`[debug] ${mensagem}`, ...dados)
}
