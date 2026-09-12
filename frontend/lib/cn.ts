import { twMerge } from 'tailwind-merge'

/**
 * Concatena classes E resolve conflitos entre utilities do Tailwind: a
 * última ganha. Sem o merge, duas classes da mesma família (ex. `border`
 * base do primitivo + `border-2 border-info` passado por `className`) saíam
 * as duas, e quem vencia dependia da ordem no CSS gerado — o override por
 * `className` funcionava por acidente, não por contrato.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return twMerge(...classes.filter(Boolean))
}
