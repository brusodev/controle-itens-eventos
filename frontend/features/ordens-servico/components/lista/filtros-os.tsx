import { Input, Select } from '@/components/ui/field'
import { useGrupos } from '@/features/detentoras/hooks/use-grupos'
import { useModulo } from '@/features/modulos/modulo-context'

export interface FiltroOSState {
  busca: string
  grupo: string
  filtroPagamento: '' | 'vencidas' | 'pagas'
}

export const EMPTY_FILTRO_OS: FiltroOSState = { busca: '', grupo: '', filtroPagamento: '' }

export function FiltrosOS({
  value,
  onChange,
}: {
  value: FiltroOSState
  onChange: (value: FiltroOSState) => void
}) {
  const { modulo } = useModulo()
  const { data: grupos = [] } = useGrupos(modulo)

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="Buscar O.S..."
        value={value.busca}
        onChange={(e) => onChange({ ...value, busca: e.target.value })}
        className="max-w-xs"
        aria-label="Buscar O.S."
      />
      <Select
        value={value.grupo}
        onChange={(e) => onChange({ ...value, grupo: e.target.value })}
        aria-label="Filtrar por grupo"
        className="min-w-[150px]"
      >
        <option value="">Todos os grupos</option>
        {grupos.map((grupo) => (
          <option key={grupo} value={grupo}>
            {grupo}
          </option>
        ))}
      </Select>
      <Select
        value={value.filtroPagamento}
        onChange={(e) =>
          onChange({ ...value, filtroPagamento: e.target.value as FiltroOSState['filtroPagamento'] })
        }
        aria-label="Filtrar por pagamento"
        className="min-w-[160px]"
      >
        <option value="">Todos os pagamentos</option>
        <option value="vencidas">Vencidas</option>
        <option value="pagas">Pagas</option>
      </Select>
    </div>
  )
}
