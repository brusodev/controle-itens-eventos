import { Search } from 'lucide-react'
import { Select } from '@/components/ui/field'
import { LABEL_STATUS_PEDIDO, STATUS_PEDIDO, type FiltrosPedidos } from '../schema'

/** Os 3 filtros da listagem — porta do .filter-section (index.html:333-341). */
export function FiltrosPedidosForm({
  filtros,
  onChange,
}: {
  filtros: FiltrosPedidos
  onChange: (filtros: FiltrosPedidos) => void
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative sm:max-w-xs sm:flex-1">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Buscar por solicitante ou descrição..."
          value={filtros.busca}
          onChange={(e) => onChange({ ...filtros, busca: e.target.value })}
          className="h-11 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm text-text placeholder:text-text-muted"
        />
      </div>
      <div className="sm:w-52">
        <Select value={filtros.status} onChange={(e) => onChange({ ...filtros, status: e.target.value })}>
          <option value="">Todos os status</option>
          {STATUS_PEDIDO.map((s) => (
            <option key={s} value={s}>
              {LABEL_STATUS_PEDIDO[s]}
            </option>
          ))}
        </Select>
      </div>
      <div className="sm:w-48">
        <Select value={filtros.atraso} onChange={(e) => onChange({ ...filtros, atraso: e.target.value })}>
          <option value="">Todos os prazos</option>
          <option value="sim">Atrasados</option>
        </Select>
      </div>
    </div>
  )
}
