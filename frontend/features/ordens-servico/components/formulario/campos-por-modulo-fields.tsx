import type { UseFormRegister } from 'react-hook-form'
import { Field, Input } from '@/components/ui/field'
import { DataList } from '@/components/ui/data-list'
import type { OSForm } from '../../schema'
import type { CamposPorModuloConfig } from '../../campos-por-modulo'

/**
 * Campos condicionais por módulo — porta dos blocos `display:none` por
 * padrão em index.html:174-201 (campo-qtd-pessoas, campo-setor-solicitante,
 * campo-data-pedido, campo-data-entrega), controlados aqui por
 * `camposPorModulo()` em vez de manipulação de `style.display`.
 */
export function CamposPorModuloFields({
  register,
  camposModulo,
  setoresSugeridos,
}: {
  register: UseFormRegister<OSForm>
  camposModulo: CamposPorModuloConfig
  setoresSugeridos: string[]
}) {
  return (
    <div className="flex flex-col gap-4">
      {camposModulo.mostrarQtdPessoas && (
        <Field label="Qtd. Pessoas Atendidas" hint="Opcional">
          {(id) => (
            <Input id={id} type="number" min={0} placeholder="0" className="max-w-45" {...register('qtdPessoasAtendidas', { valueAsNumber: true })} />
          )}
        </Field>
      )}

      <Field label={`Setor Solicitante${camposModulo.setorSolicitanteObrigatorio ? ' *' : ''}`}>
        {(id) => (
          <DataList
            id={id}
            suggestions={setoresSugeridos}
            placeholder="Ex: Gabinete, Logística, RH..."
            {...register('setorSolicitante')}
          />
        )}
      </Field>

      {camposModulo.mostrarDataPedidoEntrega && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Data do Pedido" hint="Opcional">
            {(id) => <Input id={id} type="date" className="max-w-55" {...register('dataPedido')} />}
          </Field>
          <Field label="Data de Entrega" hint="Opcional">
            {(id) => <Input id={id} type="date" className="max-w-55" {...register('dataEntrega')} />}
          </Field>
        </div>
      )}
    </div>
  )
}
