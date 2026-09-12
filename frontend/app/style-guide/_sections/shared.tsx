/** Wrapper compartilhado por toda seção do style guide. */
export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-border-subtle pt-6">
      <h2 className="text-lg font-semibold text-text">{title}</h2>
      {children}
    </section>
  )
}

export function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={`h-16 rounded-md border border-border-subtle ${className}`} />
      <span className="text-xs text-text-muted">{name}</span>
    </div>
  )
}
