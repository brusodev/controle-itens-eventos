import type { Perfil } from '@/features/auth/schema'
import type { StatusOS } from './schema'

/**
 * As 9 regras de visibilidade de ação do card de O.S. — regra de negócio,
 * não estilo. Extraídas e verificadas em backend/static/js/ordens-servico.js
 * (linhas 110-118) durante o levantamento do plano (§ Paridade).
 *
 * Isolada como função pura para ser testável sem montar componente — é
 * exatamente o tipo de regra que "sumia" silenciosamente no JS antigo.
 */
export type AcaoOS =
  | 'visualizar'
  | 'editar'
  | 'imprimir'
  | 'pdf'
  | 'png'
  | 'excluir'
  | 'atividadePortal'
  | 'pagamento'
  | 'cancelar'

export interface ContextoAcaoOS {
  perfil: Perfil
  status: StatusOS
}

const STATUS_SEM_PAGAMENTO: readonly StatusOS[] = ['cancelada', 'recusada']
const STATUS_CANCELAVEL: readonly StatusOS[] = ['aceita', 'em_execucao']

export function acoesVisiveis({ perfil, status }: ContextoAcaoOS): Set<AcaoOS> {
  const acoes = new Set<AcaoOS>(['visualizar', 'imprimir', 'pdf', 'png'])

  if (status === 'emitida') {
    acoes.add('editar')
  }

  if (perfil === 'admin') {
    if (status === 'emitida') acoes.add('excluir')
    if (status !== 'emitida') acoes.add('atividadePortal')
    if (STATUS_CANCELAVEL.includes(status)) acoes.add('cancelar')
  }

  if ((perfil === 'admin' || perfil === 'comum') && !STATUS_SEM_PAGAMENTO.includes(status)) {
    acoes.add('pagamento')
  }

  return acoes
}
