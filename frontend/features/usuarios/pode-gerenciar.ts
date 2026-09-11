import type { Usuario } from '@/features/auth/schema'
import type { UsuarioAdmin } from './schema'

/**
 * Regras de quando um botão de ação (editar/ativar/desativar/deletar) deve
 * ficar disponível para uma LINHA da listagem — porta de renderizarUsuarios()
 * (gerenciar-usuarios.html:642-663), que só mostrava Ativar/Desativar/Deletar
 * para `usuarioPerfil === 'admin'`, sem nunca esconder essas ações sobre a
 * própria linha do admin logado (o backend bloqueia deletar a si mesmo com
 * 400, mas o botão aparecia normalmente e o clique só falhava depois).
 *
 * Aqui a UI já esconde por antecipação — defesa em profundidade, mesma
 * decisão tomada para Detentoras (§ plano Domínio 2).
 */
export function podeAlterarStatus(usuarioLogado: Usuario, alvo: UsuarioAdmin): boolean {
  return usuarioLogado.perfil === 'admin' && usuarioLogado.id !== alvo.id
}

/** DELETE é 400 no backend quando usuario_id === session (auth_routes.py:412-413). */
export function podeExcluir(usuarioLogado: Usuario, alvo: UsuarioAdmin): boolean {
  return usuarioLogado.perfil === 'admin' && usuarioLogado.id !== alvo.id
}

/** Qualquer um pode editar o próprio perfil; só admin edita o de outros (auth_routes.py:314-316). */
export function podeEditar(usuarioLogado: Usuario, alvo: UsuarioAdmin): boolean {
  return usuarioLogado.perfil === 'admin' || usuarioLogado.id === alvo.id
}
