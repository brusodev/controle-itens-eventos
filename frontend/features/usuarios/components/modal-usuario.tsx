'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { ApiError } from '@/lib/api-error'
import type { Usuario } from '@/features/auth/schema'
import { useListarTodasDetentoras } from '@/features/detentoras/hooks/use-listar-todas-detentoras'
import { useSalvarUsuario } from '../hooks/use-salvar-usuario'
import {
  EMPTY_USUARIO_FORM,
  formParaPayload,
  usuarioFormSchema,
  usuarioParaForm,
  type UsuarioAdmin,
  type UsuarioForm,
} from '../schema'
import { validarSenhaUsuario } from '../validar-senha-usuario'
import { CamposBasicosUsuario } from './campos-basicos-usuario'
import { CamposPorPerfil } from './campos-por-perfil'
import { CamposSenhaEStatus } from './campos-senha-status'

// Estado único de modal — nunca flags soltas (preferência global do projeto).
export type ModalUsuarioState = { mode: 'new' } | { mode: 'edit'; data: UsuarioAdmin } | null

/**
 * Criar/editar usuário — porta de abrirModalNovoUsuario/editarUsuario/
 * salvarUsuario (gerenciar-usuarios.html:677-825).
 *
 * `usuarioLogado` decide o que fica visível: só admin pode promover para
 * admin (perfilSelecionado === 'admin' && usuarioPerfil !== 'admin' no
 * legado) e só admin edita ativo/perfil/detentora/módulos de outra pessoa
 * (auth_routes.py:314-364) — os campos ficam `disabled`, não escondidos,
 * para quem só edita o próprio nome/cargo ver que os demais existem.
 */
export function ModalUsuario({
  state,
  usuarioLogado,
  onClose,
}: {
  state: ModalUsuarioState
  usuarioLogado: Usuario
  onClose: () => void
}) {
  return (
    <Modal open={state !== null} onClose={onClose} title={state?.mode === 'edit' ? 'Editar Usuário' : 'Novo Usuário'}>
      {state && (
        <FormularioUsuario
          key={state.mode === 'edit' ? state.data.id : 'new'}
          state={state}
          usuarioLogado={usuarioLogado}
          onClose={onClose}
        />
      )}
    </Modal>
  )
}

function FormularioUsuario({
  state,
  usuarioLogado,
  onClose,
}: {
  state: NonNullable<ModalUsuarioState>
  usuarioLogado: Usuario
  onClose: () => void
}) {
  const usuarioExistente = state.mode === 'edit' ? state.data : undefined
  const ehAdmin = usuarioLogado.perfil === 'admin'
  const editandoOutro = ehAdmin && usuarioExistente !== undefined && usuarioExistente.id !== usuarioLogado.id
  // O próprio admin editando a si mesmo também não mexe nesses campos por
  // aqui — ver Domínio 4 (Conta/Perfil), que já cobre nome/e-mail/cargo.
  const podeEditarCamposAdmin = ehAdmin && (state.mode === 'new' || editandoOutro)

  const salvar = useSalvarUsuario(usuarioLogado.id, usuarioExistente?.id)
  const { showToast } = useToast()
  const [erroSenha, setErroSenha] = useState<string | null>(null)

  const { register, handleSubmit, watch, setValue, formState } = useForm<UsuarioForm>({
    resolver: zodResolver(usuarioFormSchema),
    defaultValues: usuarioExistente ? usuarioParaForm(usuarioExistente) : EMPTY_USUARIO_FORM,
  })

  const { data: detentoras = [] } = useListarTodasDetentoras()
  const perfil = watch('perfil')
  const modulosPermitidos = watch('modulosPermitidos')

  function onSubmit(dados: UsuarioForm) {
    const erro = validarSenhaUsuario(dados.senha, state.mode === 'edit')
    setErroSenha(erro)
    if (erro) return

    salvar.mutate(formParaPayload(dados), {
      onSuccess: () => {
        showToast(state.mode === 'edit' ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!')
        onClose()
      },
      onError: (error) => {
        showToast(error instanceof ApiError ? error.message : 'Erro ao salvar usuário.', 'error')
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <CamposBasicosUsuario
        ehAdmin={ehAdmin}
        podeEditarPerfil={podeEditarCamposAdmin}
        register={register}
        errors={formState.errors}
      />

      <CamposPorPerfil
        perfil={perfil}
        modulosPermitidos={modulosPermitidos}
        detentoras={detentoras}
        podeEditar={podeEditarCamposAdmin}
        register={register}
        setValue={setValue}
        errors={formState.errors}
      />

      <CamposSenhaEStatus
        modoEdicao={state.mode === 'edit'}
        podeEditarStatus={podeEditarCamposAdmin}
        erroSenha={erroSenha}
        register={register}
      />

      <div className="mt-2 flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" loading={salvar.isPending}>
          Salvar
        </Button>
      </div>
    </form>
  )
}
