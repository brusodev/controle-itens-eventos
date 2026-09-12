import { cn } from '@/lib/cn'

const ELEVACAO_CLASSES = {
  flat: 'border border-border-subtle',
  raised: 'border border-border-subtle shadow-sm',
  floating: 'border border-border-subtle shadow-md',
} as const

const PADDING_CLASSES = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-4 sm:p-6',
} as const

export type CardElevacao = keyof typeof ELEVACAO_CLASSES
export type CardPadding = keyof typeof PADDING_CLASSES

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevacao?: CardElevacao
  padding?: CardPadding
  /** `<section>` quando o card é uma região de conteúdo com título próprio. */
  as?: 'div' | 'section' | 'article'
  /** Hover de elevação + cursor — só para card que É um alvo de clique/link. */
  interativo?: boolean
}

/**
 * Superfície elevada — UM lugar para o padrão
 * `rounded-lg border border-border-subtle bg-surface p-4`, que estava
 * copiado à mão em ~14 arquivos (card-relatorio-*, stat-cards,
 * cards-estatisticas, páginas de conta...). Copiado significa que cada
 * melhoria de sombra/raio/hover precisava de 14 edições e silenciosamente
 * divergia.
 *
 * `CardListItem` (components/ui/responsive-list.tsx) é um preset deste
 * componente, não outra implementação.
 */
export function Card({
  elevacao = 'raised',
  padding = 'md',
  as: Tag = 'div',
  interativo = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <Tag
      className={cn(
        'rounded-lg bg-surface',
        ELEVACAO_CLASSES[elevacao],
        PADDING_CLASSES[padding],
        interativo &&
          'cursor-pointer transition-[box-shadow,transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-border hover:shadow-md active:translate-y-0 active:shadow-sm',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}
