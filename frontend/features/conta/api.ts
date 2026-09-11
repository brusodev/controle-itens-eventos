import { apiFetch } from '@/lib/api'
import type { Usuario } from '@/features/auth/schema'
import { perfilAtualizadoSchema, senhaAlteradaSchema, type PerfilForm, type SenhaForm } from './schema'

/**
 * Chamadas do domínio Conta — porta de gerenciar-conta.html e
 * alterar-senha.html.
 *
 * O backend aceita camelCase e snake_case na troca de senha
 * (auth_routes.py:460-461), mas só snake_case em atualizar-perfil. Enviamos
 * snake_case nos dois para ter um formato só.
 */
export const contaAPI = {
  async atualizarPerfil(dados: PerfilForm): Promise<Usuario> {
    const resposta = await apiFetch<unknown>('/auth/atualizar-perfil', {
      method: 'POST',
      body: { nome: dados.nome, email: dados.email, cargo: dados.cargo },
    })
    return perfilAtualizadoSchema.parse(resposta).usuario
  },

  async alterarSenha(dados: SenhaForm): Promise<string> {
    const resposta = await apiFetch<unknown>('/auth/api/alterar-senha', {
      method: 'POST',
      body: { senha_atual: dados.senhaAtual, senha_nova: dados.senhaNova },
      // "Senha atual incorreta" volta como 401 (auth_routes.py:466). Sem
      // isto, errar a senha atual deslogaria o usuário em vez de mostrar a
      // mensagem — o 401 aqui não significa sessão expirada.
      permitir401: true,
    })
    return senhaAlteradaSchema.parse(resposta).mensagem
  },
}
