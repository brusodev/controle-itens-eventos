import { Field, Select } from '@/components/ui/field'

/** Select de região (1-6) — repetido em O.S., Estoque e Movimentações no legado. */
export function SelectRegiao({
  label = 'Região',
  value,
  onChange,
}: {
  label?: string
  value: string
  onChange: (valor: string) => void
}) {
  return (
    <Field label={label}>
      {(id) => (
        <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Todas</option>
          {[1, 2, 3, 4, 5, 6].map((r) => (
            <option key={r} value={r}>
              Região {r}
            </option>
          ))}
        </Select>
      )}
    </Field>
  )
}
