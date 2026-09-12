import { Card } from '@/components/ui/card'

/** Grid de estatísticas — um número + rótulo por card, compartilhado pelos 8 relatórios. */
export function StatCards({ itens }: { itens: { label: string; valor: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {itens.map((item) => (
        <Card key={item.label} padding="sm">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{item.label}</p>
          <p className="mt-1 text-lg font-bold text-text">{item.valor}</p>
        </Card>
      ))}
    </div>
  )
}
