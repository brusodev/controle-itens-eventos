import type { UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form'
import { Field, Select } from '@/components/ui/field'
import type { Detentora } from '@/features/detentoras/schema'
import type { UsuarioForm } from '../schema'
import { CheckboxesModulos } from './checkboxes-modulos'

/**
 * Bloco condicional por perfil — porta de onPerfilChange()
 * (gerenciar-usuarios.html:560-575): perfil `empresa` mostra o select de
 * detentora e esconde os módulos; qualquer outro perfil é o oposto.
 */
export function CamposPorPerfil({
  perfil,
  modulosPermitidos,
  detentoras,
  podeEditar,
  register,
  setValue,
  errors,
}: {
  perfil: UsuarioForm['perfil']
  modulosPermitidos: string[]
  detentoras: Detentora[]
  podeEditar: boolean
  register: UseFormRegister<UsuarioForm>
  setValue: UseFormSetValue<UsuarioForm>
  errors: FieldErrors<UsuarioForm>
}) {
  if (perfil === 'empresa') {
    return (
      <Field
        label="Detentora vinculada"
        required
        hint="O usuário só verá O.S. desta detentora."
        error={errors.detentoraId?.message}
      >
        {(id, describedBy) => (
          <Select id={id} disabled={!podeEditar} aria-describedby={describedBy} {...register('detentoraId')}>
            <option value="">Selecione a detentora...</option>
            {detentoras.map((d) => (
              <option key={d.id} value={d.id}>
                {d.contratoNum ? `${d.nome} — ${d.contratoNum}` : d.nome}
              </option>
            ))}
          </Select>
        )}
      </Field>
    )
  }

  return (
    <fieldset disabled={!podeEditar}>
      <CheckboxesModulos
        selecionados={modulosPermitidos}
        onChange={(modulos) => setValue('modulosPermitidos', modulos, { shouldDirty: true })}
      />
    </fieldset>
  )
}
