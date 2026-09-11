'use client'

import { useState } from 'react'
import { FileSearch } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, Select } from '@/components/ui/field'
import { ResponsiveList, CardListItem } from '@/components/ui/responsive-list'
import { Spinner } from '@/components/ui/spinner'
import { useRelatorioMovimentacoes } from '../hooks/use-relatorio-movimentacoes'
import { periodoMesVigente } from '../periodo-mes-vigente'
import { EMPTY_FILTROS_MOVIMENTACOES, type FiltrosMovimentacoes } from '../schema'
import { FiltroPeriodo } from './filtro-periodo'
import { SelectRegiao } from './select-regiao'
import { StatCards } from './stat-cards'

/** Movimentações de Estoque — porta do card #3 (gerarRelatorioMovimentacoes). Sem exportação no legado. */
export function CardRelatorioMovimentacoes() {
  const [filtros, setFiltros] = useState<FiltrosMovimentacoes>(() => {
    const { inicio, fim } = periodoMesVigente()
    return { ...EMPTY_FILTROS_MOVIMENTACOES, dataInicio: inicio, dataFim: fim }
  })
  const [gerado, setGerado] = useState(false)

  const { data, isFetching } = useRelatorioMovimentacoes(filtros, gerado)

  return (
    <section className="rounded-lg border border-border-subtle bg-surface p-4 sm:p-6">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-text">Movimentações de Estoque</h2>
        <p className="text-sm text-text-muted">Histórico detalhado de entradas e saídas.</p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FiltroPeriodo
          dataInicio={filtros.dataInicio}
          dataFim={filtros.dataFim}
          onChangeInicio={(v) => setFiltros((f) => ({ ...f, dataInicio: v }))}
          onChangeFim={(v) => setFiltros((f) => ({ ...f, dataFim: v }))}
        />
        <SelectRegiao value={filtros.regiao} onChange={(v) => setFiltros((f) => ({ ...f, regiao: v }))} />
        <Field label="Tipo">
          {(id) => (
            <Select id={id} value={filtros.tipo} onChange={(e) => setFiltros((f) => ({ ...f, tipo: e.target.value }))}>
              <option value="">Todos</option>
              <option value="SAIDA">Saída</option>
              <option value="ENTRADA">Entrada</option>
            </Select>
          )}
        </Field>
      </div>

      <div className="mt-4">
        <Button onClick={() => setGerado(true)} loading={isFetching}>
          <FileSearch aria-hidden="true" className="size-4" strokeWidth={1.75} />
          Gerar Relatório
        </Button>
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
                  { label: 'Total', valor: String(data.resumo.total_movimentacoes) },
                  { label: 'Saídas', valor: data.resumo.total_saidas.toLocaleString('pt-BR') },
                  { label: 'Entradas', valor: data.resumo.total_entradas.toLocaleString('pt-BR') },
                  { label: 'Saldo', valor: data.resumo.saldo.toLocaleString('pt-BR') },
                ]}
              />
              <ResponsiveList
                table={
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-text-muted">
                        <th className="px-3 py-2 font-medium">Data</th>
                        <th className="px-3 py-2 font-medium">Item</th>
                        <th className="px-3 py-2 font-medium">O.S.</th>
                        <th className="px-3 py-2 font-medium">Região</th>
                        <th className="px-3 py-2 font-medium">Tipo</th>
                        <th className="px-3 py-2 font-medium">Qtd.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.movimentacoes.map((m) => (
                        <tr key={m.id} className="border-b border-border-subtle last:border-b-0">
                          <td className="px-3 py-2 text-text-muted">{m.data}</td>
                          <td className="px-3 py-2 text-text">{m.item_descricao}</td>
                          <td className="px-3 py-2 text-text-muted">{m.numero_os}</td>
                          <td className="px-3 py-2 text-text-muted">{m.regiao}</td>
                          <td className="px-3 py-2">
                            <Badge tone={m.tipo === 'SAIDA' ? 'danger' : 'success'}>
                              {m.tipo === 'SAIDA' ? 'Saída' : 'Entrada'}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-text">{m.quantidade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                }
                cards={data.movimentacoes.map((m) => (
                  <CardListItem key={m.id}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-text">{m.item_descricao}</p>
                      <Badge tone={m.tipo === 'SAIDA' ? 'danger' : 'success'}>
                        {m.tipo === 'SAIDA' ? 'Saída' : 'Entrada'}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-muted">
                      {m.data} · O.S. {m.numero_os} · Região {m.regiao}
                    </p>
                    <p className="mt-1 text-sm text-text">Quantidade: {m.quantidade}</p>
                  </CardListItem>
                ))}
              />
            </>
          ) : null}
        </div>
      )}
    </section>
  )
}
