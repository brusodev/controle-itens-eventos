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

export function Badge({ tone, children }: { tone: BadgeTone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
        TONE_CLASSES[tone],
      )}
    >
      {children}
    </span>
  )
}
