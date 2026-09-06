import type { UseFormSetValue } from 'react-hook-form'
import { useEffect } from 'react'
import { Field, Input, Select } from '@/components/ui/field'
import { useGrupos } from '@/features/detentoras/hooks/use-grupos'
import { useDetentoraPorGrupo } from '@/features/detentoras/hooks/use-detentora-por-grupo'
import { useToast } from '@/components/ui/toast'
import type { ModuloConfig, Modulo } from '@/features/modulos/config'
import type { OSForm } from '../../schema'

/**
 * Grupo + dados de contrato/detentora — porta de carregarDadosDetentora/
 * limparCamposDetentora em ordens-servico.js:835-899. Os campos de contrato
 * são sempre readonly, preenchidos ao escolher o grupo; aqui isso é reação
 * a `useDetentoraPorGrupo`, não manipulação manual de `.value`.
 */
export function DadosContratoFields({
  setValue,
  grupo,
  onGrupoChange,
  modulo,
  config,
}: {
  setValue: UseFormSetValue<OSForm>
  grupo: string
  onGrupoChange: (grupo: string) => void
  modulo: Modulo
  config: ModuloConfig
}) {
  const { data: grupos = [] } = useGrupos(modulo)
  const { data: detentora, isFetching, isError } = useDetentoraPorGrupo(grupo, modulo)
  const { showToast } = useToast()

  useEffect(() => {
    if (grupo === '' || isFetching) return
    if (isError) {
      showToast(`Erro ao buscar detentora do grupo ${grupo}.`, 'error')
      return
    }
    if (!detentora) {
      showToast(`Nenhuma detentora cadastrada para o grupo ${grupo}.`, 'error')
      return
    }
    setValue('contrato', detentora.contratoNum)
    setValue('dataAssinatura', detentora.dataAssinatura)
    setValue('prazoVigencia', detentora.prazoVigencia)
    setValue('detentora', detentora.nome)
    setValue('detentoraId', detentora.id)
    setValue('cnpj', detentora.cnpj)
    setValue('servico', detentora.servico)
    setValue('grupo', grupo)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setValue é estável (react-hook-form)
  }, [detentora, isFetching, isError, grupo])

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md bg-surface-muted p-4">
        <Field label={`Selecione o ${config.grupoLabel}/Região`} required>
          {(id) => (
            <Select id={id} value={grupo} onChange={(e) => onGrupoChange(e.target.value)} className="max-w-60">
              <option value="">-- Selecione o {config.grupoLabel} --</option>
              {grupos.map((g) => (
                <option key={g} value={g}>
                  {config.grupoLabel} {g}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <p className="mt-1 text-xs text-text-muted">
          Os dados do contrato serão preenchidos automaticamente.
        </p>
      </div>

      <h3 className="text-base font-semibold text-text">Dados do Contrato</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        <ReadonlyField label="Contrato Nº" value={detentora?.contratoNum ?? ''} />
        <ReadonlyField label="Data da Assinatura" value={detentora?.dataAssinatura ?? ''} />
        <ReadonlyField label="Prazo de Vigência" value={detentora?.prazoVigencia ?? ''} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <ReadonlyField label="Nome da Detentora" value={detentora?.nome ?? ''} className="sm:col-span-2" />
        <ReadonlyField label="CNPJ" value={detentora?.cnpj ?? ''} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <ReadonlyField label="Serviço" value={detentora?.servico ?? ''} className="sm:col-span-2" />
        <ReadonlyField label={`${config.grupoLabel} (região do estoque)`} value={grupo} />
      </div>
    </div>
  )
}

function ReadonlyField({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <Field label={label}>{(id) => <Input id={id} value={value} readOnly className="bg-surface-muted" />}</Field>
    </div>
  )
}
