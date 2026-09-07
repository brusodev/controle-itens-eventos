import type { Modulo } from '@/features/modulos/config'

/**
 * Descrição de cada card do dashboard — porta fiel de dashboard.html:209-249.
 * Título/emoji já vêm de getModuloConfig(); só a descrição (específica
 * desta tela) mora aqui, para não acoplar features/modulos/config.ts
 * (consumido por todo o app) a um único consumidor.
 */
export const DESCRICAO_DASHBOARD: Record<Modulo, string> = {
  coffee: 'Gerenciamento de itens, estoques regionais e emissão de O.S. para eventos com alimentação.',
  transporte: 'Controle de itens de logística, quantidade de transporte e emissão de ordens de serviço de frete.',
  organizacao: 'Controle de itens de organização de eventos, montagem, recursos humanos, equipamentos e materiais.',
  hospedagem: 'Controle de diárias de hospedagem, apartamentos e emissão de O.S. para eventos com pernoite.',
  trofeus: 'Controle de fornecimento de troféus e premiações. Dois grupos com empresas separadas.',
  servicos_graficos:
    'Controle de impressões, cópias, banners, livretos e demais itens gráficos, com emissão de O.S. por pedidos pontuais.',
}

/** Ordem exata dos cards no dashboard.html — servicos_graficos por último, condicionado a permissão. */
export const ORDEM_MODULOS_DASHBOARD: readonly Modulo[] = [
  'coffee',
  'transporte',
  'organizacao',
  'hospedagem',
  'trofeus',
  'servicos_graficos',
] as const
