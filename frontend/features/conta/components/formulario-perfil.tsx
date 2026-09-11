'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { useToast } from '@/components/ui/toast'
import type { Usuario } from '@/features/auth/schema'
import { ApiError } from '@/lib/api-error'
import { useAtualizarPerfil } from '../hooks/use-atualizar-perfil'
import { perfilFormSchema, type PerfilForm } from '../schema'

/**
 * Edição de perfil — porta de formPerfil/salvarPerfil em
 * gerenciar-conta.html. No legado era um modal sobre uma lista de dados
 * estáticos; aqui os mesmos campos são a própria tela, já editáveis.
 *
 * O legado dava location.reload() após salvar, para a sessão renovada
 * aparecer no cabeçalho — desnecessário aqui: useAtualizarPerfil escreve o
 * usuário novo no cache de ['auth','me'] e sidebar/topbar reagem sozinhas.
 */
export function FormularioPerfil({ usuario }: { usuario: Usuario }) {
  const atualizar = useAtualizarPerfil()
  const { showToast } = useToast()

  const { register, handleSubmit, reset, formState } = useForm<PerfilForm>({
    resolver: zodResolver(perfilFormSchema),
    defaultValues: { nome: usuario.nome, email: usuario.email, cargo: usuario.cargo ?? '' },
  })

  function onSubmit(dados: PerfilForm) {
    atualizar.mutate(dados, {
      onSuccess: (atualizado) => {
        showToast('Perfil atualizado com sucesso!')
        // Reseta com o que o backend gravou (não com o que foi digitado):
        // e-mail volta normalizado em minúsculas, cargo vazio vira null.
        reset({ nome: atualizado.nome, email: atualizado.email, cargo: atualizado.cargo ?? '' })
      },
      onError: (error) => {
        showToast(error instanceof ApiError ? error.message : 'Erro ao atualizar perfil.', 'error')
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Field label="Nome completo" required error={formState.errors.nome?.message}>
        {(id, describedBy) => (
          <Input id={id} aria-describedby={describedBy} autoComplete="name" {...register('nome')} />
        )}
      </Field>

      <Field label="Email" required error={formState.errors.email?.message}>
        {(id, describedBy) => (
          <Input id={id} type="email" aria-describedby={describedBy} autoComplete="email" {...register('email')} />
        )}
      </Field>

      <Field label="Cargo/Função" error={formState.errors.cargo?.message}>
        {(id, describedBy) => (
          <Input
            id={id}
            aria-describedby={describedBy}
            autoComplete="organization-title"
            placeholder="Não definido"
            {...register('cargo')}
          />
        )}
      </Field>

      <div className="flex justify-end">
        <Button type="submit" loading={atualizar.isPending} disabled={!formState.isDirty}>
          Salvar alterações
        </Button>
      </div>
    </form>
  )
}
