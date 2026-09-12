'use client'

import { useState } from 'react'
import { Download, FileSearch } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { ResponsiveList, CardListItem } from '@/components/ui/responsive-list'
import { Spinner } from '@/components/ui/spinner'
import { useModulo } from '@/features/modulos/modulo-context'
import { formatarMoeda } from '@/lib/formatters'
import { relatoriosAPI } from '../api'
import { useRelatorioOS } from '../hooks/use-relatorio-os'
import { periodoMesVigente } from '../periodo-mes-vigente'
import { EMPTY_FILTROS_OS, type FiltrosRelatorioOS } from '../schema'
import { SelectRegiao } from './select-regiao'
import { StatCards } from './stat-cards'

/**
 * Relatório de Ordens de Serviço — porta do card #1 de relatorios.js
 * (gerarRelatorioOS/exportarRelatorioOSExcel). Sempre visível, qualquer
 * módulo.
 */
export function CardRelatorioOS() {
  const { modulo } = useModulo()
  const [filtros, setFiltros] = useState<FiltrosRelatorioOS>(() => {
    const { inicio, fim } = periodoMesVigente()
    return { ...EMPTY_FILTROS_OS, dataInicio: inicio, dataFim: fim }
  })
  const [gerado, setGerado] = useState(false)

  const { data, isFetching } = useRelatorioOS(filtros, gerado)

  function definir<K extends keyof FiltrosRelatorioOS>(campo: K, valor: FiltrosRelatorioOS[K]) {
    setFiltros((atual) => ({ ...atual, [campo]: valor }))
  }

  return (
    <Card as="section" padding="lg">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-text">Ordens de Serviço</h2>
        <p className="text-sm text-text-muted">
          Relatório completo de O.S. emitidas com filtros por período, região e contratada.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Data início">
          {(id) => (
            <Input id={id} type="date" value={filtros.dataInicio} onChange={(e) => definir('dataInicio', e.target.value)} />
          )}
        </Field>
        <Field label="Data fim">
          {(id) => <Input id={id} type="date" value={filtros.dataFim} onChange={(e) => definir('dataFim', e.target.value)} />}
        </Field>
        <SelectRegiao value={filtros.regiao} onChange={(v) => definir('regiao', v)} />
        <Field label="Contratada">
          {(id) => (
            <Input id={id} value={filtros.contratada} onChange={(e) => definir('contratada', e.target.value)} placeholder="Nome da contratada" />
          )}
        </Field>
        <Field label="Serviço">
          {(id) => (
            <Input id={id} value={filtros.servico} onChange={(e) => definir('servico', e.target.value)} placeholder="Tipo de serviço" />
          )}
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => setGerado(true)} loading={isFetching}>
          <FileSearch aria-hidden="true" className="size-4" strokeWidth={1.75} />
          Gerar Relatório
        </Button>
        {gerado && data && (
          <Button
            variant="success"
            onClick={() => window.open(relatoriosAPI.urlExcelOrdensServico(filtros, modulo), '_blank')}
          >
            <Download aria-hidden="true" className="size-4" strokeWidth={1.75} />
            Exportar Excel
          </Button>
        )}
      </div>

      {gerado && (
        <div className="mt-4 flex flex-col gap-4">
          {isFetching && !data ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : data ? (
            <>
              <StatCards
                itens={[
                  { label: 'Total O.S.', valor: String(data.estatisticas.total_os) },
                  { label: 'Total Itens', valor: String(data.estatisticas.total_itens) },
                  { label: 'Regiões Atendidas', valor: String(data.estatisticas.regioes_atendidas) },
                  { label: 'Valor Total', valor: formatarMoeda(data.estatisticas.valor_total) },
                ]}
              />
              <ResponsiveList
                table={
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-text-muted">
                        <th className="px-3 py-2 font-medium">Nº O.S.</th>
                        <th className="px-3 py-2 font-medium">Emissão</th>
                        <th className="px-3 py-2 font-medium">Solicitante</th>
                        <th className="px-3 py-2 font-medium">Evento</th>
                        <th className="px-3 py-2 font-medium">Tipo</th>
                        <th className="px-3 py-2 font-medium">Qtd.</th>
                        <th className="px-3 py-2 font-medium">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.linhas.map((linha, i) => (
                        <tr key={i} className="border-b border-border-subtle last:border-b-0">
                          <td className="px-3 py-2 text-text">{linha.numeroOS}</td>
                          <td className="px-3 py-2 text-text-muted">{linha.dataEmissao}</td>
                          <td className="px-3 py-2 text-text-muted">{linha.solicitante}</td>
                          <td className="px-3 py-2 text-text">{linha.evento}</td>
                          <td className="px-3 py-2 text-text-muted">{linha.tipo}</td>
                          <td className="px-3 py-2 text-text-muted">{linha.quantidade}</td>
                          <td className="px-3 py-2 text-text">{formatarMoeda(linha.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                }
                cards={data.linhas.map((linha, i) => (
                  <CardListItem key={i}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-text">{linha.numeroOS}</p>
                      <p className="text-sm font-semibold text-text">{formatarMoeda(linha.valor)}</p>
                    </div>
                    <p className="mt-1 text-sm text-text">{linha.evento}</p>
                    <p className="text-xs text-text-muted">
                      {linha.tipo} · Qtd. {linha.quantidade} · {linha.dataEmissao}
                    </p>
                  </CardListItem>
                ))}
              />
            </>
          ) : null}
        </div>
      )}
    </Card>
  )
}
