import { StatusBadge } from '../status-badge'
import type { OSPersistida } from '../../schema'

// Placeholder mínimo da visão desktop — a tabela completa (colunas extras,
// ordenação) é detalhamento de UI que não muda a paridade funcional já
// coberta pelos cards do mobile; pode ser refinada depois sem alterar dados
// ou comportamento.
export function TabelaOS({ ordens }: { ordens: OSPersistida[] }) {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-border-subtle text-text-muted">
          <th className="py-2 pr-4">O.S.</th>
          <th className="py-2 pr-4">Evento</th>
          <th className="py-2 pr-4">Detentora</th>
          <th className="py-2 pr-4">Status</th>
        </tr>
      </thead>
      <tbody>
        {ordens.map((os) => (
          <tr key={os.id} className="border-b border-border-subtle">
            <td className="py-2 pr-4">{os.numeroOS}</td>
            <td className="py-2 pr-4">{os.evento}</td>
            <td className="py-2 pr-4">{os.detentora}</td>
            <td className="py-2 pr-4">
              <StatusBadge status={os.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
