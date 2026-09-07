import { Field, Input } from '@/components/ui/field'

export interface ValoresRegiao {
  inicial: string
  gasto: string
  preco: string
}

/** Bloco Inicial/Gasto/Preço de uma região — extraído de ModalEditarItem por limite de linhas. */
export function CamposRegiaoEstoque({
  label,
  valores,
  ehAdmin,
  onAtualizarMascarado,
  onAtualizarPreco,
}: {
  label: string
  valores: ValoresRegiao
  ehAdmin: boolean
  onAtualizarMascarado: (campo: 'inicial' | 'gasto', valor: string) => void
  onAtualizarPreco: (valor: string) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Field label={`${label} — Inicial`}>
        {(id) => (
          <Input
            id={id}
            readOnly={!ehAdmin}
            value={valores.inicial}
            onChange={(e) => onAtualizarMascarado('inicial', e.target.value)}
          />
        )}
      </Field>
      <Field label="Gasto">
        {(id) => (
          <Input
            id={id}
            readOnly={!ehAdmin}
            value={valores.gasto}
            onChange={(e) => onAtualizarMascarado('gasto', e.target.value)}
          />
        )}
      </Field>
      <Field label="Preço">
        {(id) => (
          <Input
            id={id}
            readOnly={!ehAdmin}
            value={valores.preco}
            onChange={(e) => onAtualizarPreco(e.target.value)}
          />
        )}
      </Field>
    </div>
  )
}
