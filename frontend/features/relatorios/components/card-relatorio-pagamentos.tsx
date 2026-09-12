'use client'

import { useState } from 'react'
import { Download, FileSearch } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { MODULOS, getModuloConfig } from '@/features/modulos/config'
import { formatarMoeda } from '@/lib/formatters'
import { relatoriosAPI } from '../api'
import { useRelatorioPagamentos } from '../hooks/use-relatorio-pagamentos'
import { EMPTY_FILTROS_PAGAMENTOS, STATUS_PAGAMENTO, type FiltrosPagamentos } from '../schema'
import { StatCards } from './stat-cards'
import { TabelaPagamentos } from './tabela-pagamentos'

/**
 * Controle de Pagamentos — porta do card #8 (gerarRelatorioPagamentos).
 * Único dos 8 que filtra por VENCIMENTO, não por emissão, e sem período
 * pré-populado no legado — mantido assim (vencimentos futuros e passados
 * são igualmente relevantes aqui, diferente dos demais relatórios).
 */
export function CardRelatorioPagamentos() {
  const [filtros, setFiltros] = useState<FiltrosPagamentos>(EMPTY_FILTROS_PAGAMENTOS)
  const [gerado, setGerado] = useState(false)

  const { data, isFetching } = useRelatorioPagamentos(filtros, gerado)

  return (
    <Card as="section" padding="lg">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-text">Controle de Pagamentos</h2>
        <p className="text-sm text-text-muted">
          Acompanhe prazos de vencimento das notas e visualize as O.S. pagas, pendentes e vencidas.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Status">
          {(id) => (
            <Select id={id} value={filtros.status} onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value }))}>
              <option value="">Todos</option>
              {STATUS_PAGAMENTO.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Vencimento de">
          {(id) => (
            <Input
              id={id}
              type="date"
              value={filtros.dataInicioVencimento}
              onChange={(e) => setFiltros((f) => ({ ...f, dataInicioVencimento: e.target.value }))}
            />
          )}
        </Field>
        <Field label="Vencimento até">
          {(id) => (
            <Input
              id={id}
              type="date"
              value={filtros.dataFimVencimento}
              onChange={(e) => setFiltros((f) => ({ ...f, dataFimVencimento: e.target.value }))}
            />
          )}
        </Field>
        <Field label="Módulo">
          {(id) => (
            <Select id={id} value={filtros.modulo} onChange={(e) => setFiltros((f) => ({ ...f, modulo: e.target.value }))}>
              <option value="">Todos</option>
              {MODULOS.map((m) => (
                <option key={m} value={m}>
                  {getModuloConfig(m).titulo}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Empresa">
          {(id) => (
            <Input id={id} value={filtros.empresa} onChange={(e) => setFiltros((f) => ({ ...f, empresa: e.target.value }))} placeholder="Nome da empresa" />
          )}
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => setGerado(true)} loading={isFetching}>
          <FileSearch aria-hidden="true" className="size-4" strokeWidth={1.75} />
          Gerar Relatório
        </Button>
        {gerado && data && data.pagamentos.length > 0 && (
          <Button variant="success" onClick={() => window.open(relatoriosAPI.urlExcelPagamentos(filtros), '_blank')}>
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
                  { label: 'Total', valor: String(data.estatisticas.total) },
                  { label: 'Pagos', valor: String(data.estatisticas.pagos) },
                  { label: 'Pendentes', valor: String(data.estatisticas.pendentes) },
                  { label: 'Vencidos', valor: String(data.estatisticas.vencidos) },
                  { label: 'Sem Prazo', valor: String(data.estatisticas.sem_prazo) },
                  { label: 'Valor Total', valor: formatarMoeda(data.estatisticas.valor_total) },
                ]}
              />
              <TabelaPagamentos pagamentos={data.pagamentos} />
            </>
          ) : null}
        </div>
      )}
    </Card>
  )
}
