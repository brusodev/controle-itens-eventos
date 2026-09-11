import { Field, Input } from '@/components/ui/field'

/**
 * Par "Data início" / "Data fim" compartilhado pelos relatórios que filtram
 * por período. Quem monta o estado inicial usa `periodoMesVigente()` — este
 * componente só exibe e edita os dois campos.
 */
export function FiltroPeriodo({
  dataInicio,
  dataFim,
  onChangeInicio,
  onChangeFim,
  labelInicio = 'Data início',
  labelFim = 'Data fim',
}: {
  dataInicio: string
  dataFim: string
  onChangeInicio: (valor: string) => void
  onChangeFim: (valor: string) => void
  labelInicio?: string
  labelFim?: string
}) {
  return (
    <>
      <Field label={labelInicio}>
        {(id) => <Input id={id} type="date" value={dataInicio} onChange={(e) => onChangeInicio(e.target.value)} />}
      </Field>
      <Field label={labelFim}>
        {(id) => <Input id={id} type="date" value={dataFim} onChange={(e) => onChangeFim(e.target.value)} />}
      </Field>
    </>
  )
}
