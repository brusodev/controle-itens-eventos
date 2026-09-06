import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

const VARIANT_CLASSES = {
  primary: 'bg-primary text-text-on-primary hover:bg-primary-hover',
  secondary: 'bg-surface text-text border border-border hover:bg-surface-muted',
  success: 'bg-success text-text-on-primary hover:opacity-90',
  danger: 'bg-danger-strong text-text-on-primary hover:opacity-90',
  ghost: 'bg-transparent text-text hover:bg-surface-muted',
} as const

const SIZE_CLASSES = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-sm gap-2', // 44px — alvo de toque mínimo (plano § Acessibilidade)
  lg: 'h-12 px-6 text-base gap-2',
} as const

export type ButtonVariant = keyof typeof VARIANT_CLASSES
export type ButtonSize = keyof typeof SIZE_CLASSES

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <span
          className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  )
})
