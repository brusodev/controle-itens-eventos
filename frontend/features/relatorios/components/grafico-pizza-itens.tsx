import { calcularFatiasPizza } from '../grafico-pizza'

/** Gráfico de pizza do ranking de itens mais utilizados — porta visual de grafico-pizza-itens (Chart.js no legado). */
export function GraficoPizzaItens({ itens }: { itens: { descricao: string | null; total_consumido: number }[] }) {
  const fatias = calcularFatiasPizza(itens.map((i) => ({ label: i.descricao ?? '-', valor: i.total_consumido })))

  if (fatias.length === 0) return null

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
      <svg viewBox="0 0 160 160" className="size-40 shrink-0" role="img" aria-label="Distribuição de consumo por item">
        {fatias.map((fatia) => (
          <path key={fatia.label} d={fatia.path} fill={fatia.cor} stroke="var(--color-surface)" strokeWidth={1} />
        ))}
      </svg>
      <ul className="flex flex-col gap-1.5 text-sm">
        {fatias.map((fatia) => (
          <li key={fatia.label} className="flex items-center gap-2">
            <span aria-hidden="true" className="size-3 shrink-0 rounded-sm" style={{ backgroundColor: fatia.cor }} />
            <span className="text-text">{fatia.label}</span>
            <span className="text-text-muted">{fatia.percentual}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
