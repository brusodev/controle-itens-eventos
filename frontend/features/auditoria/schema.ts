import { z } from 'zod'

/** Ações e módulos são os valores dos selects de filtro em auditoria.html:466-483. */
export const ACOES_AUDITORIA = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'] as const
export const MODULOS_AUDITORIA = ['OS', 'ITEM', 'DETENTORA', 'USUARIO', 'AUTH'] as const

export type AcaoAuditoria = (typeof ACOES_AUDITORIA)[number]
export type ModuloAuditoria = (typeof MODULOS_AUDITORIA)[number]

export const LABEL_ACAO: Record<AcaoAuditoria, string> = {
  CREATE: 'Criar',
  UPDATE: 'Atualizar',
  DELETE: 'Deletar',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
}

export const LABEL_MODULO: Record<ModuloAuditoria, string> = {
  OS: 'Ordem de Serviço',
  ITEM: 'Item',
  DETENTORA: 'Detentora',
  USUARIO: 'Usuário',
  AUTH: 'Autenticação',
}

/**
 * Espelha Auditoria.to_dict() (models.py:577-593).
 *
 * `acao` e `modulo` não usam z.enum: registros antigos podem ter valores
 * fora das listas acima, e o legado já tratava isso (traduzirAcao devolve a
 * chave crua quando não conhece). Um enum estrito faria o .parse() derrubar
 * a tela inteira por causa de uma linha histórica.
 *
 * `dados_antes`/`dados_depois` chegam como string JSON OU objeto já
 * parseado, dependendo de quem gravou — por isso z.unknown() aqui e o
 * parse defensivo em normalizar-dados.ts, como fazia auditoria.html:738-756.
 */
export const auditoriaSchema = z.object({
  id: z.number(),
  usuario_id: z.number().nullable(),
  usuario_email: z.string().nullable(),
  usuario_nome: z.string().nullable(),
  acao: z.string(),
  modulo: z.string(),
  entidade_tipo: z.string().nullable(),
  entidade_id: z.number().nullable(),
  descricao: z.string().nullable(),
  dados_antes: z.unknown(),
  dados_depois: z.unknown(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  data_hora: z.string().nullable(),
})

export type Auditoria = z.infer<typeof auditoriaSchema>

/** Resposta de GET /api/auditoria/ (auditoria_routes.py:54-59). */
export const paginaAuditoriaSchema = z.object({
  total: z.number(),
  pagina: z.number(),
  limite: z.number(),
  auditorias: z.array(auditoriaSchema),
})

export type PaginaAuditoria = z.infer<typeof paginaAuditoriaSchema>

/** Resposta de GET /api/auditoria/usuarios (auditoria_routes.py:88-92). */
export const usuarioAuditoriaSchema = z.object({
  id: z.number(),
  nome: z.string(),
  email: z.string(),
})

export type UsuarioAuditoria = z.infer<typeof usuarioAuditoriaSchema>

/** Resposta de GET /api/auditoria/estatisticas (auditoria_routes.py:138-148). */
export const estatisticasAuditoriaSchema = z.object({
  total: z.number(),
  ultimas_24h: z.number(),
  por_modulo: z.record(z.string(), z.number()),
  por_acao: z.record(z.string(), z.number()),
  usuarios_ativos: z.array(
    z.object({ nome: z.string().nullable(), email: z.string().nullable(), total: z.number() }),
  ),
})

export type EstatisticasAuditoria = z.infer<typeof estatisticasAuditoriaSchema>

/** Filtros da tela — os 4 do legado (usuário, módulo, ação, intervalo de datas). */
export interface FiltrosAuditoria {
  usuarioId: string
  modulo: string
  acao: string
  dataInicio: string
  dataFim: string
}

export const EMPTY_FILTROS_AUDITORIA: FiltrosAuditoria = {
  usuarioId: '',
  modulo: '',
  acao: '',
  dataInicio: '',
  dataFim: '',
}

/** Mesmo tamanho de página do legado (auditoria.html:537). */
export const LIMITE_POR_PAGINA = 50
