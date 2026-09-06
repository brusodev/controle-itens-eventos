import type { Modulo } from '@/features/modulos/config'

/**
 * Regra de visibilidade/obrigatoriedade de campos por módulo — porta de
 * _atualizarLabelsFormulario em emitir-os.js:103-160, como função pura
 * testável (mesmo padrão de acoesVisiveis).
 */
export interface CamposPorModuloConfig {
  mostrarQtdPessoas: boolean
  /** Setor Solicitante é sempre visível; só muda se é obrigatório. */
  setorSolicitanteObrigatorio: boolean
  /** Serviços Gráficos: pedidos pontuais — campos de evento ficam opcionais. */
  camposEventoObrigatorios: boolean
  mostrarDataPedidoEntrega: boolean
}

export function camposPorModulo(modulo: Modulo): CamposPorModuloConfig {
  const isGrafico = modulo === 'servicos_graficos'
  const exigeSetor = modulo === 'transporte' || isGrafico

  return {
    mostrarQtdPessoas: modulo === 'organizacao',
    setorSolicitanteObrigatorio: exigeSetor,
    camposEventoObrigatorios: !isGrafico,
    mostrarDataPedidoEntrega: isGrafico,
  }
}
