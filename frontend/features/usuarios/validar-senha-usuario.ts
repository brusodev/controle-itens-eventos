import { MIN_SENHA } from '@/features/conta/schema'

/**
 * Valida a senha do formulário de usuário — porta da regra condicional em
 * salvarUsuario() (gerenciar-usuarios.html:762-779): obrigatória ao criar,
 * opcional ao editar (vazio = mantém a atual), mas se preenchida precisa
 * atender o mínimo.
 *
 * O legado validava 6 caracteres aqui (e "Mínimo 6 caracteres" no
 * placeholder) — mesma divergência já unificada em 12 no Domínio 4
 * (features/conta/schema.ts), reaproveitada aqui em vez de repetir o número.
 */
export function validarSenhaUsuario(senha: string, modoEdicao: boolean): string | null {
  if (!senha) {
    return modoEdicao ? null : 'Senha é obrigatória.'
  }
  if (senha.length < MIN_SENHA) {
    return `Senha deve ter no mínimo ${MIN_SENHA} caracteres.`
  }
  return null
}
