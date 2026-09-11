/** Detecta o formato ISO que o legado testava antes de formatar (auditoria.html:930). */
const REGEX_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/

export function pareceDataIso(valor: string): boolean {
  return REGEX_ISO.test(valor)
}

/** Porta de formatarDataHora() (auditoria.html:666) — toLocaleString pt-BR. */
export function formatarDataHoraBr(iso: string | null): string {
  if (!iso) return '—'
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return iso
  return data.toLocaleString('pt-BR')
}
