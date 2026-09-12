import { cn } from '@/lib/cn'

export interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-md border border-dashed border-border-subtle px-6 py-12 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-1 flex size-12 items-center justify-center rounded-full bg-surface-muted text-text-muted">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-text">{title}</p>
      {description && <p className="text-sm text-text-muted">{description}</p>}
      {action}
    </div>
  )
}
