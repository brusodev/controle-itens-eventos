'use client'

import { useModulo } from '@/features/modulos/modulo-context'
import { CardRelatorioConsumo } from './card-relatorio-consumo'
import { CardRelatorioEstoque } from './card-relatorio-estoque'
import { CardRelatorioMovimentacoes } from './card-relatorio-movimentacoes'
import { CardRelatorioOrganizacao } from './card-relatorio-organizacao'
import { CardRelatorioOS } from './card-relatorio-os'
import { CardRelatorioPagamentos } from './card-relatorio-pagamentos'
import { CardRelatorioTopItens } from './card-relatorio-top-itens'
import { CardRelatorioTransporte } from './card-relatorio-transporte'

/**
 * Orquestra os 8 cards — porta de .relatorios-grid (index.html:357). Os
 * cards de Organização e Transporte só aparecem no módulo correspondente,
 * como atualizarVisibilidadeRelatoriosPorModulo() fazia via display:none
 * (relatorios.js:934).
 */
export function PainelRelatorios() {
  const { modulo } = useModulo()

  return (
    <div className="flex flex-col gap-4">
      <CardRelatorioOS />
      <CardRelatorioEstoque />
      <CardRelatorioMovimentacoes />
      <CardRelatorioConsumo />
      <CardRelatorioTopItens />
      {modulo === 'organizacao' && <CardRelatorioOrganizacao />}
      {modulo === 'transporte' && <CardRelatorioTransporte />}
      <CardRelatorioPagamentos />
    </div>
  )
}
