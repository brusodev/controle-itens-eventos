export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border-subtle px-6 py-12 text-center">
      <p className="text-sm font-medium text-text">{title}</p>
      {description && <p className="text-sm text-text-muted">{description}</p>}
      {action}
    </div>
  )
}
