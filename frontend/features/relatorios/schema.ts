import { STATUS_OS } from '@/features/ordens-servico/schema'

/**
 * Domínio Relatórios — 8 sub-relatórios, cada um com filtros e schema
 * próprios (não há formato genérico compartilhado — porta de
 * relatorios.js). Exportações Excel/PDF continuam no Flask (decisão do
 * plano); o frontend só monta filtros, mostra o JSON e aciona o download
 * por URL direta, mesmo padrão de osAPI.urlPdf/urlPng.
 *
 * Cada sub-relatório vive no seu próprio arquivo em ./schemas/ (um schema
 * único ultrapassava 200 linhas de forma genuína, não por descuido — 8
 * formatos de resposta completamente distintos). Este arquivo só reexporta,
 * para quem consome continuar importando de 'features/relatorios/schema'.
 *
 * Todo filtro de data pré-popula com o mês vigente ao montar a tela — o
 * backend já aplica esse default quando nenhuma data chega
 * (_periodo_mes_vigente(), relatorios_routes.py:44), mas só no relatório de
 * O.S.; replicar no client garante o mesmo comportamento visível nos 8.
 */

export const STATUS_OS_FILTRAVEIS = STATUS_OS

export * from './schemas/os'
export * from './schemas/estoque'
export * from './schemas/movimentacoes'
export * from './schemas/consumo'
export * from './schemas/top-itens'
export * from './schemas/organizacao'
export * from './schemas/transporte'
export * from './schemas/pagamentos'
