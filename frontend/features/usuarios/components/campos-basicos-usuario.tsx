import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { Field, Input, Select } from '@/components/ui/field'
import { LABEL_PERFIL, type UsuarioForm } from '../schema'

/** Nome, e-mail, cargo e perfil — os campos sempre visíveis, iguais em criar e editar. */
export function CamposBasicosUsuario({
  ehAdmin,
  podeEditarPerfil,
  register,
  errors,
}: {
  ehAdmin: boolean
  podeEditarPerfil: boolean
  register: UseFormRegister<UsuarioForm>
  errors: FieldErrors<UsuarioForm>
}) {
  return (
    <>
      <Field label="Nome completo" required error={errors.nome?.message}>
        {(id, describedBy) => <Input id={id} aria-describedby={describedBy} {...register('nome')} />}
      </Field>

      <Field label="Email" required error={errors.email?.message}>
        {(id, describedBy) => <Input id={id} type="email" aria-describedby={describedBy} {...register('email')} />}
      </Field>

      <Field label="Cargo/Função">
        {(id) => <Input id={id} placeholder="Ex: Administrador, Operador" {...register('cargo')} />}
      </Field>

      <Field
        label="Perfil de acesso"
        required
        hint="Comum: acesso básico. Admin: acesso total + gerenciar usuários. Empresa: portal da detentora."
      >
        {(id) => (
          <Select id={id} disabled={!podeEditarPerfil} {...register('perfil')}>
            <option value="comum">{LABEL_PERFIL.comum}</option>
            <option value="admin" disabled={!ehAdmin}>
              {LABEL_PERFIL.admin}
            </option>
            <option value="empresa">{LABEL_PERFIL.empresa}</option>
          </Select>
        )}
      </Field>
    </>
  )
}
