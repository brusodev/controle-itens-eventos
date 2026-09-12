import { cn } from '@/lib/cn'

const TONE_CLASSES = {
  success: 'bg-success-subtle text-success',
  warning: 'bg-warning-subtle text-warning',
  danger: 'bg-danger-subtle text-danger',
  'danger-strong': 'bg-danger-strong-subtle text-danger-strong',
  info: 'bg-info-subtle text-info',
  indigo: 'bg-indigo-subtle text-indigo',
  purple: 'bg-purple-subtle text-purple',
  'neutral-strong': 'bg-neutral-strong-subtle text-neutral-strong',
} as const

export type BadgeTone = keyof typeof TONE_CLASSES

export interface BadgeProps {
  tone: BadgeTone
  children: React.ReactNode
  className?: string
  /** Ponto de status à esquerda (ex.: indicador ao vivo), sem repetir o texto. */
  dot?: boolean
}

export function Badge({ tone, children, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {dot && <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
