import { z } from 'zod'
import { usuarioSchema } from '@/features/auth/schema'

/**
 * Mínimo real exigido pelo backend (auth_routes.py:469). O legado tinha três
 * valores divergentes — 6 no modal morto de gerenciar-conta.html, 8 na tela
 * alterar-senha.html, 12 no backend — e os dois primeiros só produziam um 400
 * depois do submit. Aqui existe um número só, e ele é o do backend.
 */
export const MIN_SENHA = 12

/** Porta de formPerfil em gerenciar-conta.html:386-404 (POST /auth/atualizar-perfil). */
export const perfilFormSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório.'),
  email: z.string().trim().min(1, 'Email é obrigatório.').email('Email inválido.'),
  cargo: z.string().trim(),
})

export type PerfilForm = z.infer<typeof perfilFormSchema>

export const EMPTY_PERFIL_FORM: PerfilForm = {
  nome: '',
  email: '',
  cargo: '',
}

/** Porta de procesarSenha() em alterar-senha.html:412-440 (POST /auth/api/alterar-senha). */
export const senhaFormSchema = z
  .object({
    senhaAtual: z.string().min(1, 'Senha atual é obrigatória.'),
    senhaNova: z.string().min(MIN_SENHA, `A nova senha deve ter no mínimo ${MIN_SENHA} caracteres.`),
    senhaConfirma: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((dados) => dados.senhaNova === dados.senhaConfirma, {
    path: ['senhaConfirma'],
    message: 'As senhas não coincidem.',
  })
  .refine((dados) => dados.senhaAtual !== dados.senhaNova, {
    path: ['senhaNova'],
    message: 'A nova senha deve ser diferente da atual.',
  })

export type SenhaForm = z.infer<typeof senhaFormSchema>

export const EMPTY_SENHA_FORM: SenhaForm = {
  senhaAtual: '',
  senhaNova: '',
  senhaConfirma: '',
}

/** Resposta de POST /auth/atualizar-perfil (auth_routes.py:518-522). */
export const perfilAtualizadoSchema = z.object({
  sucesso: z.boolean(),
  mensagem: z.string(),
  usuario: usuarioSchema,
})

/** Resposta de POST /auth/api/alterar-senha (auth_routes.py:474-477). */
export const senhaAlteradaSchema = z.object({
  sucesso: z.boolean(),
  mensagem: z.string(),
})
