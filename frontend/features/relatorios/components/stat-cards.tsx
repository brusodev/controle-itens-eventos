/** Grid de estatísticas — um número + rótulo por card, compartilhado pelos 8 relatórios. */
export function StatCards({ itens }: { itens: { label: string; valor: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {itens.map((item) => (
        <div key={item.label} className="rounded-lg border border-border-subtle bg-surface p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{item.label}</p>
          <p className="mt-1 text-lg font-bold text-text">{item.valor}</p>
        </div>
      ))}
    </div>
  )
}
