import { Field, Input, Select, Textarea } from '@/components/ui/field'
import { DataList } from '@/components/ui/data-list'
import { Section } from './shared'

export function SecaoCampos() {
  return (
    <Section title="Field / Input / Select / Textarea">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Evento" required>
          {(id, describedBy) => (
            <Input id={id} aria-describedby={describedBy} placeholder="Workshop de..." />
          )}
        </Field>
        <Field label="Com erro" error="Campo obrigatório.">
          {(id, describedBy, invalid) => (
            <Input id={id} aria-describedby={describedBy} invalid={invalid} />
          )}
        </Field>
        <Field label="Com hint" hint="Formato livre, ex: 26 à 30/05/2026">
          {(id, describedBy) => <Input id={id} aria-describedby={describedBy} />}
        </Field>
        <Field label="Grupo">
          {(id, describedBy) => (
            <Select id={id} aria-describedby={describedBy}>
              <option>Grupo 1</option>
              <option>Grupo 2</option>
            </Select>
          )}
        </Field>
        <Field label="Observações">
          {(id, describedBy) => <Textarea id={id} aria-describedby={describedBy} />}
        </Field>
        <Field label="Autocomplete (DataList)">
          {(id, describedBy) => (
            <DataList
              id={id}
              aria-describedby={describedBy}
              suggestions={['Workshop de Capacitação', 'Reunião Anual', 'Seminário Regional']}
            />
          )}
        </Field>
      </div>
    </Section>
  )
}
