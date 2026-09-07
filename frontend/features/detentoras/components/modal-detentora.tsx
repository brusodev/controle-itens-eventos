'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/field'
import { mascararCnpj } from '@/lib/mascara-cnpj'
import { getModuloConfig, type Modulo } from '@/features/modulos/config'
import {
  detentoraSchema,
  EMPTY_DETENTORA,
  SERVICO_PADRAO_POR_MODULO,
  type Detentora,
  type DetentoraForm,
} from '../schema'
import { useSalvarDetentora } from '../hooks/use-salvar-detentora'

// Estado único de modal — nunca flags soltas (preferência global do projeto).
export type ModalDetentoraState = { mode: 'new' } | { mode: 'edit'; data: Detentora } | null

const GRUPOS_PADRAO = ['1', '2', '3', '4', '5', '6']

/** Porta de abrirModalNova/editarDetentora/salvarDetentora (gerenciar-detentoras.html:271-343). */
export function ModalDetentora({
  state,
  modulo,
  onClose,
}: {
  state: ModalDetentoraState
  modulo: Modulo
  onClose: () => void
}) {
  return (
    <Modal open={state !== null} onClose={onClose} title={state?.mode === 'edit' ? 'Editar Detentora' : 'Nova Detentora'}>
      {state && (
        <FormularioDetentora
          key={state.mode === 'edit' ? state.data.id : 'new'}
          state={state}
          modulo={modulo}
          onClose={onClose}
        />
      )}
    </Modal>
  )
}

function FormularioDetentora({
  state,
  modulo,
  onClose,
}: {
  state: NonNullable<ModalDetentoraState>
  modulo: Modulo
  onClose: () => void
}) {
  const detentoraExistente = state.mode === 'edit' ? state.data : undefined
  const salvar = useSalvarDetentora(detentoraExistente?.id)
  const config = getModuloConfig(modulo)

  const { register, handleSubmit, watch, setValue, formState } = useForm<DetentoraForm>({
    resolver: zodResolver(detentoraSchema),
    defaultValues:
      detentoraExistente ?? {
        ...EMPTY_DETENTORA,
        modulo,
        servico: SERVICO_PADRAO_POR_MODULO[modulo] ?? 'COFFEE BREAK',
      },
  })

  function onSubmit(dados: DetentoraForm) {
    salvar.mutate(dados, { onSuccess: onClose })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Field label={`${config.grupoLabel}/Região`} required hint={`${config.grupoLabel} corresponde à Região do estoque (1-6)`}>
        {(id, describedBy) => (
          <Select id={id} aria-describedby={describedBy} {...register('grupo')}>
            <option value="">Selecione o {config.grupoLabel}</option>
            {GRUPOS_PADRAO.map((g) => (
              <option key={g} value={g}>
                {config.grupoLabel} {g}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field label="Nome da Detentora" required error={formState.errors.nome?.message}>
        {(id, describedBy) => (
          <Input id={id} aria-describedby={describedBy} placeholder="Ex: Empresa XPTO Ltda" {...register('nome')} />
        )}
      </Field>

      <Field label="CNPJ" required error={formState.errors.cnpj?.message}>
        {(id, describedBy) => (
          <Input
            id={id}
            aria-describedby={describedBy}
            placeholder="00.000.000/0000-00"
            maxLength={18}
            value={watch('cnpj')}
            onChange={(e) => setValue('cnpj', mascararCnpj(e.target.value))}
          />
        )}
      </Field>

      <Field label="Contrato Nº" required error={formState.errors.contratoNum?.message}>
        {(id, describedBy) => (
          <Input id={id} aria-describedby={describedBy} placeholder="014/DA/2024" {...register('contratoNum')} />
        )}
      </Field>

      <Field label="Data da Assinatura" hint="Opcional">
        {(id) => <Input id={id} type="date" {...register('dataAssinatura')} />}
      </Field>

      <Field label="Prazo de Vigência" hint="Opcional">
        {(id) => <Input id={id} placeholder="12 meses" {...register('prazoVigencia')} />}
      </Field>

      <Field label="Serviço" hint="Opcional">
        {(id) => <Input id={id} placeholder="COFFEE BREAK" {...register('servico')} />}
      </Field>

      <Field label="Status">
        {(id) => (
          <Select id={id} value={watch('ativo') ? 'true' : 'false'} onChange={(e) => setValue('ativo', e.target.value === 'true')}>
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </Select>
        )}
      </Field>

      <div className="flex justify-end gap-3">
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
