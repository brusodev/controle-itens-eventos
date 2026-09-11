import { Lock, Pencil, Trash2, Unlock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Usuario } from '@/features/auth/schema'
import { podeAlterarStatus, podeEditar, podeExcluir } from '../pode-gerenciar'
import type { UsuarioAdmin } from '../schema'

/**
 * Botões de ação de uma linha/card — só aparecem quando pode-gerenciar.ts
 * autoriza. O legado mostrava Ativar/Desativar/Deletar mesmo sobre a
 * própria linha do admin logado, e só o backend barrava (400) o clique.
 */
export function AcoesUsuario({
  usuario,
  usuarioLogado,
  onEditar,
  onAlternarAtivo,
  onExcluir,
}: {
  usuario: UsuarioAdmin
  usuarioLogado: Usuario
  onEditar: (usuario: UsuarioAdmin) => void
  onAlternarAtivo: (usuario: UsuarioAdmin) => void
  onExcluir: (usuario: UsuarioAdmin) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {podeEditar(usuarioLogado, usuario) && (
        <Button variant="ghost" size="sm" onClick={() => onEditar(usuario)}>
          <Pencil aria-hidden="true" className="size-4" strokeWidth={1.75} />
          Editar
        </Button>
      )}
      {podeAlterarStatus(usuarioLogado, usuario) && (
        <Button variant="ghost" size="sm" onClick={() => onAlternarAtivo(usuario)}>
          {usuario.ativo ? (
            <Lock aria-hidden="true" className="size-4" strokeWidth={1.75} />
          ) : (
            <Unlock aria-hidden="true" className="size-4" strokeWidth={1.75} />
          )}
          {usuario.ativo ? 'Desativar' : 'Ativar'}
        </Button>
      )}
      {podeExcluir(usuarioLogado, usuario) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onExcluir(usuario)}
          className="text-danger-strong hover:bg-danger-subtle"
        >
          <Trash2 aria-hidden="true" className="size-4" strokeWidth={1.75} />
          Deletar
        </Button>
      )}
    </div>
  )
}
