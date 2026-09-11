import { z } from 'zod'
import type { Modulo } from '@/features/modulos/config'
import type { Perfil } from '@/features/auth/schema'

/**
 * Domínio Usuários — o mais delicado da Fase 2 (autorização granular por
 * campo, CSRF ao editar a si mesmo).
 *
 * `usuarioAdminSchema` estende o `usuarioSchema` compartilhado (que só tem
 * os campos que a topbar/sidebar usam) com `criado_em`/`atualizado_em`, que
 * Usuario.to_dict() (models.py:531-546) já devolve e que a listagem legada
 * exibe ("Criado em ..."). Ficam de fora daqui e não em auth/schema.ts para
 * não inflar o schema usado por toda tela autenticada com campos que só a
 * gestão de usuários consome.
 */
export const usuarioAdminSchema = z.object({
  id: z.number(),
  nome: z.string(),
  email: z.string(),
  cargo: z.string().nullable(),
  perfil: z.enum(['admin', 'comum', 'empresa']),
  detentora_id: z.number().nullable(),
  ativo: z.boolean(),
  modulosPermitidos: z.array(z.string()),
  criado_em: z.string().nullable(),
  atualizado_em: z.string().nullable(),
})

export type UsuarioAdmin = z.infer<typeof usuarioAdminSchema>

export const LABEL_PERFIL: Record<Perfil, string> = {
  admin: 'Administrador',
  comum: 'Usuário Comum',
  empresa: 'Empresa (Portal Detentora)',
}

/** Os 6 módulos com checkbox no legado (gerenciar-usuarios.html:485-490) — mesma ordem. */
export const MODULOS_COM_LABEL: readonly { modulo: Modulo; label: string }[] = [
  { modulo: 'coffee', label: 'Coffee Break' },
  { modulo: 'transporte', label: 'Transporte' },
  { modulo: 'organizacao', label: 'Organização' },
  { modulo: 'hospedagem', label: 'Hospedagem' },
  { modulo: 'trofeus', label: 'Troféus' },
  { modulo: 'servicos_graficos', label: 'Serviços Gráficos' },
]

/**
 * Formulário de criar/editar — porta de #formUsuario
 * (gerenciar-usuarios.html:433-518).
 *
 * `senha` fica sempre presente e opcional aqui: a obrigatoriedade "só no
 * modo criar" é regra de fluxo (depende de estar criando ou editando), não
 * de forma — decidida no componente, não no schema (mesmo motivo por trás
 * de EMPTY_X existir fora do zod no resto do projeto).
 */
export const usuarioFormSchema = z
  .object({
    nome: z.string().trim().min(1, 'Nome é obrigatório.'),
    email: z.string().trim().min(1, 'Email é obrigatório.').email('Email inválido.'),
    cargo: z.string().trim(),
    perfil: z.enum(['admin', 'comum', 'empresa']),
    ativo: z.boolean(),
    detentoraId: z.string(),
    modulosPermitidos: z.array(z.string()),
    senha: z.string(),
  })
  .refine((dados) => dados.perfil !== 'empresa' || dados.detentoraId !== '', {
    path: ['detentoraId'],
    message: 'Selecione a detentora vinculada ao usuário empresa.',
  })

export type UsuarioForm = z.infer<typeof usuarioFormSchema>

export const EMPTY_USUARIO_FORM: UsuarioForm = {
  nome: '',
  email: '',
  cargo: '',
  perfil: 'comum',
  ativo: true,
  detentoraId: '',
  modulosPermitidos: [],
  senha: '',
}

export function usuarioParaForm(usuario: UsuarioAdmin): UsuarioForm {
  return {
    nome: usuario.nome,
    email: usuario.email,
    cargo: usuario.cargo ?? '',
    perfil: usuario.perfil,
    ativo: usuario.ativo,
    detentoraId: usuario.detentora_id ? String(usuario.detentora_id) : '',
    modulosPermitidos: usuario.modulosPermitidos,
    senha: '',
  }
}

/** Payload de POST /auth/registro e PUT /auth/api/usuarios/<id>. */
export interface UsuarioPayload {
  nome: string
  email: string
  cargo: string
  perfil: string
  ativo: boolean
  detentora_id: number | null
  modulos_permitidos?: string[]
  senha?: string
}

export function formParaPayload(dados: UsuarioForm): UsuarioPayload {
  const payload: UsuarioPayload = {
    nome: dados.nome,
    email: dados.email,
    cargo: dados.cargo,
    perfil: dados.perfil,
    ativo: dados.ativo,
    detentora_id: dados.perfil === 'empresa' && dados.detentoraId ? Number(dados.detentoraId) : null,
  }
  // Módulos não fazem sentido para perfil empresa (models.py:238-242 do
  // registro só grava para perfil != 'empresa').
  if (dados.perfil !== 'empresa') {
    payload.modulos_permitidos = dados.modulosPermitidos
  }
  if (dados.senha) {
    payload.senha = dados.senha
  }
  return payload
}
