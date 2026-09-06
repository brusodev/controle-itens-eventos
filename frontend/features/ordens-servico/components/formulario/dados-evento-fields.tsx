import type { UseFormRegister } from 'react-hook-form'
import { Field, Input, Textarea } from '@/components/ui/field'
import { DataList } from '@/components/ui/data-list'
import type { ModuloConfig } from '@/features/modulos/config'
import type { OSForm } from '../../schema'
import type { CamposPorModuloConfig } from '../../campos-por-modulo'

export interface Sugestoes {
  eventos: string[]
  datas: string[]
  horarios: string[]
  locais: string[]
  responsaveis: string[]
  justificativas: string[]
  observacoes: string[]
}

/**
 * Campos de evento — porta da seção "Dados do Evento" em index.html:126-190.
 * Labels e obrigatoriedade variam por módulo: em Serviços Gráficos (pedido
 * pontual, não evento) estes campos existem mas deixam de ser obrigatórios.
 *
 * Nota de correção: o original usa `list=` em `<textarea>` (horário, local,
 * justificativa, observações) para ligar a um `<datalist>` — atributo sem
 * suporte na especificação HTML em textarea, então nunca funcionou em
 * nenhum navegador. Não replicado; as sugestões continuam disponíveis via
 * `useSugestoesOS` para uso futuro (ex.: autocomplete customizado).
 */
export function DadosEventoFields({
  register,
  config,
  camposModulo,
  sugestoes,
}: {
  register: UseFormRegister<OSForm>
  config: ModuloConfig
  camposModulo: CamposPorModuloConfig
  sugestoes: Sugestoes
}) {
  const sufixoObrigatorio = camposModulo.camposEventoObrigatorios ? ' *' : ''

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-base font-semibold text-text">Dados do Evento</h3>

      <Field label="Data de Emissão" required>
        {(id) => <Input id={id} type="date" {...register('dataEmissao')} />}
      </Field>

      <Field label={`Evento${sufixoObrigatorio}`}>
        {(id) => (
          <DataList
            id={id}
            suggestions={sugestoes.eventos}
            placeholder="Orientação técnica para a APEOESP..."
            {...register('evento')}
          />
        )}
      </Field>

      <Field label={`${config.osDataLabel}${sufixoObrigatorio}`} hint="Texto livre — ex.: 25 à 28/08/2025">
        {(id) => (
          <DataList id={id} suggestions={sugestoes.datas} placeholder="Ex: 25 à 28/08/2025" {...register('data')} />
        )}
      </Field>

      <Field label={`${config.osHorarioLabel}${sufixoObrigatorio}`}>
        {(id) => (
          <Textarea
            id={id}
            rows={4}
            placeholder={'Ex: 08:00 às 17:00 Hrs\nManhã: 08:00\nTarde: 14:30'}
            {...register('horario')}
          />
        )}
      </Field>

      <Field label={`${config.osLocalLabel}${sufixoObrigatorio}`}>
        {(id) => (
          <Textarea id={id} rows={2} placeholder="CGRH – Largo do Arouche, 302..." {...register('local')} />
        )}
      </Field>

      <Field label="Responsável">
        {(id) => (
          <DataList
            id={id}
            suggestions={sugestoes.responsaveis}
            placeholder="Ex: Nome - (11) 1234-5678"
            {...register('responsavel')}
          />
        )}
      </Field>

      <Field label={`Justificativa${sufixoObrigatorio}`}>
        {(id) => (
          <Textarea
            id={id}
            rows={6}
            placeholder="Conviva&#10;25/08/2025 - 200 unidades..."
            {...register('justificativa')}
          />
        )}
      </Field>

      <Field label="Observações">
        {(id) => (
          <Textarea
            id={id}
            rows={6}
            placeholder="Informações adicionais sobre a ordem de serviço..."
            {...register('observacoes')}
          />
        )}
      </Field>
    </div>
  )
}
