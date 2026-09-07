'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/field'
import { useModulo } from '@/features/modulos/modulo-context'
import { categoriaSchema, EMPTY_CATEGORIA, normalizarSlug, type Categoria, type CategoriaForm } from '../schema'
import { useSalvarCategoria } from '../hooks/use-salvar-categoria'

// Estado único de modal — nunca flags soltas (preferência global do projeto).
export type ModalCategoriaState = { mode: 'new' } | { mode: 'edit'; data: Categoria } | null

/**
 * Modal de criar/editar categoria — porta de mostrarModalNovaCategoria/
 * editarCategoriaDB (categorias.js). O campo "Itens Iniciais" do original
 * não é portado: era coletado e nunca enviado ao backend (código morto,
 * ver plano § Código morto identificado).
 */
export function ModalCategoria({ state, onClose }: { state: ModalCategoriaState; onClose: () => void }) {
  return (
    <Modal
      open={state !== null}
      onClose={onClose}
      title={state?.mode === 'edit' ? 'Editar Categoria' : 'Nova Categoria'}
    >
      {state && <FormularioCategoria key={state.mode === 'edit' ? state.data.id : 'new'} state={state} onClose={onClose} />}
    </Modal>
  )
}

function FormularioCategoria({ state, onClose }: { state: NonNullable<ModalCategoriaState>; onClose: () => void }) {
  const { modulo } = useModulo()
  const categoriaExistente = state.mode === 'edit' ? state.data : undefined
  const salvar = useSalvarCategoria(categoriaExistente?.id)
  const [slugEditadoManualmente, setSlugEditadoManualmente] = useState(state.mode === 'edit')

  const { register, handleSubmit, watch, setValue, formState } = useForm<CategoriaForm>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: categoriaExistente ?? { ...EMPTY_CATEGORIA, modulo },
  })

  function onNomeChange(nome: string) {
    if (!slugEditadoManualmente) {
      setValue('tipo', normalizarSlug(nome))
    }
  }

  function onSlugChange(valor: string) {
    setSlugEditadoManualmente(true)
    setValue('tipo', valor)
  }

  function onSubmit(dados: CategoriaForm) {
    salvar.mutate(dados, { onSuccess: onClose })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex gap-3">
        <div className="flex-1">
          <Field label="Nome da Categoria" required error={formState.errors.nome?.message}>
            {(id, describedBy) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                placeholder="Ex: Veículos Leves"
                {...register('nome', { onChange: (e) => onNomeChange(e.target.value) })}
              />
            )}
          </Field>
        </div>
        <Field label="Ícone/Emoji">
          {(id) => (
            <Input id={id} maxLength={5} className="w-20 text-center text-lg" {...register('icone')} />
          )}
        </Field>
      </div>

      <Field
        label="Identificador Interno (Slug)"
        required
        hint="Usado para referências no banco de dados."
        error={formState.errors.tipo?.message}
      >
        {(id, describedBy) => (
          <Input
            id={id}
            aria-describedby={describedBy}
            placeholder="ex: veiculos_leves"
            disabled={state.mode === 'edit'}
            value={watch('tipo')}
            onChange={(e) => onSlugChange(e.target.value)}
          />
        )}
      </Field>

      <Field label="Natureza da Despesa / Tipo">
        {(id) => <Input id={id} placeholder="Ex: 339039 ou Veículo" {...register('natureza')} />}
      </Field>

      <Field label="Descrição" hint="Opcional">
        {(id) => <Textarea id={id} rows={2} {...register('descricao')} />}
      </Field>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" loading={salvar.isPending}>
          Salvar Categoria
        </Button>
      </div>
    </form>
  )
}
