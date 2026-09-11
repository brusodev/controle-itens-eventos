'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Field, Input } from '@/components/ui/field'
import { useToast } from '@/components/ui/toast'
import { ApiError } from '@/lib/api-error'
import { useAlterarSenha } from '../hooks/use-alterar-senha'
import { EMPTY_SENHA_FORM, senhaFormSchema, type SenhaForm } from '../schema'
import { MedidorForcaSenha } from './medidor-forca-senha'

/**
 * Troca de senha — porta de procesarSenha() em alterar-senha.html.
 *
 * As três validações locais do legado (comprimento, coincidência, senha nova
 * != atual) viraram o senhaFormSchema, que roda antes do submit em vez de
 * uma cadeia de ifs com alert. O mínimo é 12 (o do backend), não os 8 da
 * tela antiga — que só produziam um 400 depois de ir ao servidor.
 */
export function FormularioSenha() {
  const router = useRouter()
  const alterar = useAlterarSenha()
  const { showToast } = useToast()
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false)

  const { register, handleSubmit, watch, formState } = useForm<SenhaForm>({
    resolver: zodResolver(senhaFormSchema),
    defaultValues: EMPTY_SENHA_FORM,
  })

  const senhaNova = watch('senhaNova') ?? ''

  // Lido durante a renderização de propósito: formState é um Proxy que só
  // assina a propriedade que o render de fato lê. Consultado apenas dentro
  // do handler de clique, `isDirty` ficava sempre false e o diálogo de
  // descarte nunca aparecia.
  const temAlteracoes = formState.isDirty

  // O legado usava confirm('Descartar alterações?') ao cancelar (proibido
  // no projeto). Só vale perguntar se há algo digitado a perder.
  function cancelar() {
    if (temAlteracoes) {
      setConfirmandoDescarte(true)
      return
    }
    router.push('/conta')
  }

  function onSubmit(dados: SenhaForm) {
    alterar.mutate(dados, {
      onSuccess: (mensagem) => {
        showToast(mensagem)
        router.push('/conta')
      },
      onError: (error) => {
        showToast(error instanceof ApiError ? error.message : 'Erro ao alterar senha.', 'error')
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Field label="Senha atual" required error={formState.errors.senhaAtual?.message}>
        {(id, describedBy) => (
          <Input
            id={id}
            type="password"
            aria-describedby={describedBy}
            autoComplete="current-password"
            {...register('senhaAtual')}
          />
        )}
      </Field>

      <div className="flex flex-col gap-3">
        <Field label="Nova senha" required error={formState.errors.senhaNova?.message}>
          {(id, describedBy) => (
            <Input
              id={id}
              type="password"
              aria-describedby={describedBy}
              autoComplete="new-password"
              {...register('senhaNova')}
            />
          )}
        </Field>
        <MedidorForcaSenha senha={senhaNova} />
      </div>

      <Field label="Confirmar nova senha" required error={formState.errors.senhaConfirma?.message}>
        {(id, describedBy) => (
          <Input
            id={id}
            type="password"
            aria-describedby={describedBy}
            autoComplete="new-password"
            {...register('senhaConfirma')}
          />
        )}
      </Field>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={cancelar}>
          Cancelar
        </Button>
        <Button type="submit" loading={alterar.isPending}>
          Alterar senha
        </Button>
      </div>

      <ConfirmDialog
        open={confirmandoDescarte}
        title="Descartar alterações?"
        description="A senha não será alterada."
        confirmLabel="Descartar"
        cancelLabel="Continuar editando"
        danger
        onConfirm={() => router.push('/conta')}
        onCancel={() => setConfirmandoDescarte(false)}
      />
    </form>
  )
}
