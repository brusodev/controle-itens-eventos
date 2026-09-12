'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/field'
import { useToast } from '@/components/ui/toast'
import { ApiError } from '@/lib/api-error'
import { useSalvarPedido } from '../hooks/use-salvar-pedido'
import { emptyPedidoForm, formParaPayload, pedidoFormSchema, pedidoParaForm, type PedidoForm, type PedidoGrafico } from '../schema'
import { ItensPedidoForm } from './itens-pedido-form'

// Estado único de modal — nunca flags soltas (preferência do projeto).
export type ModalPedidoState = { mode: 'new' } | { mode: 'edit'; data: PedidoGrafico } | null

/**
 * Criar/editar pedido — porta de abrirModalPedidoGrafico/salvarPedidoGrafico
 * (pedidos-graficos.js:245-393). Edição é bloqueada pelo backend quando o
 * pedido não está mais 'pendente' (409); esse modal só é aberto para
 * pedidos pendentes (a lista já esconde a ação "Editar" nos demais).
 */
export function ModalPedido({ state, onClose }: { state: ModalPedidoState; onClose: () => void }) {
  return (
    <Modal open={state !== null} onClose={onClose} title={state?.mode === 'edit' ? 'Editar Pedido' : 'Novo Pedido'}>
      {state && <FormularioPedido key={state.mode === 'edit' ? state.data.id : 'new'} state={state} onClose={onClose} />}
    </Modal>
  )
}

function FormularioPedido({ state, onClose }: { state: NonNullable<ModalPedidoState>; onClose: () => void }) {
  const pedidoExistente = state.mode === 'edit' ? state.data : undefined
  const salvar = useSalvarPedido(pedidoExistente?.id)
  const { showToast } = useToast()

  const { register, handleSubmit, watch, setValue, formState } = useForm<PedidoForm>({
    resolver: zodResolver(pedidoFormSchema),
    defaultValues: pedidoExistente ? pedidoParaForm(pedidoExistente) : emptyPedidoForm(),
  })

  function onSubmit(dados: PedidoForm) {
    salvar.mutate(formParaPayload(dados), {
      onSuccess: () => {
        showToast(state.mode === 'edit' ? 'Pedido atualizado.' : 'Pedido criado.')
        onClose()
      },
      onError: (error) => {
        showToast(error instanceof ApiError ? error.message : 'Erro ao salvar pedido.', 'error')
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Data do pedido" required>
          {(id) => <Input id={id} type="date" {...register('dataPedido')} />}
        </Field>
        <Field label="Prazo de entrega">
          {(id) => <Input id={id} type="date" {...register('prazoEntrega')} />}
        </Field>
      </div>

      <Field label="Solicitante" required error={formState.errors.solicitante?.message}>
        {(id, describedBy) => <Input id={id} aria-describedby={describedBy} placeholder="Nome de quem pediu" {...register('solicitante')} />}
      </Field>

      <Field label="Setor solicitante">
        {(id) => <Input id={id} placeholder="Ex: Coordenadoria X" {...register('setorSolicitante')} />}
      </Field>

      <Field label="Descrição" required error={formState.errors.descricao?.message}>
        {(id, describedBy) => (
          <Textarea id={id} aria-describedby={describedBy} rows={2} placeholder="Ex: 500 blocos de notas" {...register('descricao')} />
        )}
      </Field>

      <Field label="Observações">
        {(id) => <Textarea id={id} rows={2} {...register('observacoes')} />}
      </Field>

      <ItensPedidoForm itens={watch('itens')} onChange={(itens) => setValue('itens', itens, { shouldDirty: true })} />

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
