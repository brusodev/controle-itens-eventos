import type { UseFormRegister } from 'react-hook-form'
import { Field, Input, Select } from '@/components/ui/field'
import type { UsuarioForm } from '../schema'

/** Senha (obrigatória só ao criar) e status — porta do final de #formUsuario (gerenciar-usuarios.html:495-512). */
export function CamposSenhaEStatus({
  modoEdicao,
  podeEditarStatus,
  erroSenha,
  register,
}: {
  modoEdicao: boolean
  podeEditarStatus: boolean
  erroSenha: string | null
  register: UseFormRegister<UsuarioForm>
}) {
  return (
    <>
      <Field
        label={modoEdicao ? 'Nova senha' : 'Senha'}
        required={!modoEdicao}
        hint={modoEdicao ? 'Deixe em branco para manter a senha atual.' : undefined}
        error={erroSenha ?? undefined}
      >
        {(id, describedBy) => (
          <Input id={id} type="password" aria-describedby={describedBy} autoComplete="new-password" {...register('senha')} />
        )}
      </Field>

      <Field label="Status">
        {(id) => (
          <Select
            id={id}
            disabled={!podeEditarStatus}
            // O <select> do DOM só entrega string; sem setValueAs o RHF
            // gravaria "true"/"false" (string) no lugar do boolean que o
            // schema e o payload esperam.
            {...register('ativo', { setValueAs: (valor) => valor === 'true' })}
          >
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </Select>
        )}
      </Field>
    </>
  )
}
