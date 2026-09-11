'use client'

import { useState } from 'react'
import { FileSearch, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Select } from '@/components/ui/field'
import { ResponsiveList, CardListItem } from '@/components/ui/responsive-list'
import { Spinner } from '@/components/ui/spinner'
import { useModulo } from '@/features/modulos/modulo-context'
import { useCategorias } from '@/features/categorias/hooks/use-categorias'
import { relatoriosAPI } from '../api'
import { useRelatorioEstoque } from '../hooks/use-relatorio-estoque'
import { EMPTY_FILTROS_ESTOQUE, type FiltrosEstoque } from '../schema'
import { SelectRegiao } from './select-regiao'
import { StatCards } from './stat-cards'

/** Posição de Estoque — porta do card #2 (gerarRelatorioEstoque/gerarPDFRelatorioEstoque). */
export function CardRelatorioEstoque() {
  const { modulo } = useModulo()
  const [filtros, setFiltros] = useState<FiltrosEstoque>(EMPTY_FILTROS_ESTOQUE)
  const [gerado, setGerado] = useState(false)

  const { data: categorias = [] } = useCategorias(modulo)
  const { data, isFetching } = useRelatorioEstoque(filtros, gerado)

  return (
    <section className="rounded-lg border border-border-subtle bg-surface p-4 sm:p-6">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-text">Posição de Estoque</h2>
        <p className="text-sm text-text-muted">Visualize o estoque atual, consumo e disponibilidade por região.</p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Categoria">
          {(id) => (
            <Select
              id={id}
              value={filtros.categoriaId}
              onChange={(e) => setFiltros((f) => ({ ...f, categoriaId: e.target.value }))}
            >
              <option value="">Todas</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <SelectRegiao value={filtros.regiao} onChange={(v) => setFiltros((f) => ({ ...f, regiao: v }))} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => setGerado(true)} loading={isFetching}>
          <FileSearch aria-hidden="true" className="size-4" strokeWidth={1.75} />
          Gerar Relatório
        </Button>
        {gerado && data && (
          <Button variant="success" onClick={() => window.open(relatoriosAPI.urlPdfEstoque(filtros, modulo), '_blank')}>
            <FileText aria-hidden="true" className="size-4" strokeWidth={1.75} />
            Exportar PDF
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
                  { label: 'Total Itens', valor: String(data.resumo.total_itens) },
                  { label: 'Qtd. Inicial', valor: data.resumo.total_inicial.toLocaleString('pt-BR') },
                  { label: 'Qtd. Gasta', valor: data.resumo.total_gasto.toLocaleString('pt-BR') },
                  { label: '% Uso Geral', valor: `${data.resumo.percentual_uso_geral}%` },
                ]}
              />
              <ResponsiveList
                table={
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-text-muted">
                        <th className="px-3 py-2 font-medium">Item</th>
                        <th className="px-3 py-2 font-medium">Categoria</th>
                        <th className="px-3 py-2 font-medium">Região</th>
                        <th className="px-3 py-2 font-medium">Inicial</th>
                        <th className="px-3 py-2 font-medium">Gasto</th>
                        <th className="px-3 py-2 font-medium">Disponível</th>
                        <th className="px-3 py-2 font-medium">% Uso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.estoque.map((linha, i) => (
                        <tr key={i} className="border-b border-border-subtle last:border-b-0">
                          <td className="px-3 py-2 text-text">{linha.descricao}</td>
                          <td className="px-3 py-2 text-text-muted">{linha.categoria}</td>
                          <td className="px-3 py-2 text-text-muted">{linha.regiao}</td>
                          <td className="px-3 py-2 text-text-muted">{linha.quantidade_inicial}</td>
                          <td className="px-3 py-2 text-text-muted">{linha.quantidade_gasto}</td>
                          <td className="px-3 py-2 text-text">{linha.quantidade_disponivel}</td>
                          <td className="px-3 py-2 text-text-muted">{linha.percentual_uso}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                }
                cards={data.estoque.map((linha, i) => (
                  <CardListItem key={i}>
                    <p className="font-medium text-text">{linha.descricao}</p>
                    <p className="text-xs text-text-muted">
                      {linha.categoria} · Região {linha.regiao}
                    </p>
                    <p className="mt-1 text-sm text-text">
                      Disponível: {linha.quantidade_disponivel} ({linha.percentual_uso}% usado)
                    </p>
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
