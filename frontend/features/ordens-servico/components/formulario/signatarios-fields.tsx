import { useFieldArray, type Control, type UseFormRegister } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { DataList } from '@/components/ui/data-list'
import type { OSForm } from '../../schema'

const CARGOS_SUGERIDOS = [
  'Gestor do Contrato',
  'Gestora do Contrato',
  'Co-Gestor(a) do Contrato',
  'Fiscal do Contrato',
  'Fiscal Técnico(a)',
  'Fiscal Técnica',
  'Representante Legal do Contratado',
]

const MINIMO_SIGNATARIOS = 2

/**
 * Signatários dinâmicos — porta de inicializarSignatarios/adicionarSignatario/
 * removerSignatario (emitir-os.js:1259-1309). Sempre ao menos 2 linhas
 * (Gestor + Fiscal); abaixo disso a remoção fica indisponível, como no original.
 */
export function SignatariosFields({
  control,
  register,
  nomesSugeridos,
}: {
  control: Control<OSForm>
  register: UseFormRegister<OSForm>
  nomesSugeridos: string[]
}) {
  const { fields, append, remove } = useFieldArray({ control, name: 'signatarios' })

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-base font-semibold text-text">Signatários da O.S.</h3>

      {fields.map((field, index) => (
        <div key={field.id} className="flex items-center gap-2">
          <DataList
            suggestions={CARGOS_SUGERIDOS}
            placeholder="Cargo"
            className="flex-1"
            {...register(`signatarios.${index}.cargo`)}
          />
          <DataList
            suggestions={nomesSugeridos}
            placeholder="Nome completo"
            className="flex-[1.5]"
            {...register(`signatarios.${index}.nome`)}
          />
          {fields.length > MINIMO_SIGNATARIOS && (
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label="Remover signatário"
              className="rounded-md bg-danger-strong px-2.5 py-1.5 text-text-on-primary"
            >
              ✕
            </button>
          )}
        </div>
      ))}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="self-start"
        onClick={() => append({ cargo: '', nome: '' })}
      >
        Adicionar Signatário
      </Button>
    </div>
  )
}
