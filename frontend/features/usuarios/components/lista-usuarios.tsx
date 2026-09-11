'use client'

import { Badge } from '@/components/ui/badge'
import { CardListItem, ResponsiveList } from '@/components/ui/responsive-list'
import { EmptyState } from '@/components/ui/empty-state'
import type { Usuario } from '@/features/auth/schema'
import type { UsuarioAdmin } from '../schema'
import { AcoesUsuario } from './acoes-usuario'
import { CabecalhoUsuario } from './cabecalho-usuario'

/**
 * Grid de usuários — porta de renderizarUsuarios() (gerenciar-usuarios.html:
 * 602-663), que montava innerHTML sem escape para nome, cargo e e-mail.
 * Aqui a interpolação vira JSX puro.
 */
export function ListaUsuarios({
  usuarios,
  filtro,
  usuarioLogado,
  onEditar,
  onAlternarAtivo,
  onExcluir,
}: {
  usuarios: UsuarioAdmin[]
  filtro: string
  usuarioLogado: Usuario
  onEditar: (usuario: UsuarioAdmin) => void
  onAlternarAtivo: (usuario: UsuarioAdmin) => void
  onExcluir: (usuario: UsuarioAdmin) => void
}) {
  const filtrados = usuarios.filter(
    (u) => u.nome.toLowerCase().includes(filtro.toLowerCase()) || u.email.toLowerCase().includes(filtro.toLowerCase()),
  )

  if (filtrados.length === 0) {
    return (
      <EmptyState
        title="Nenhum usuário encontrado"
        description='Clique em "Novo Usuário" para adicionar o primeiro usuário ao sistema.'
      />
    )
  }

  return (
    <ResponsiveList
      table={
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-text-muted">
              <th className="px-3 py-2 font-medium">Usuário</th>
              <th className="px-3 py-2 font-medium">Cargo</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((usuario) => (
              <tr key={usuario.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-3 py-2">
                  <CabecalhoUsuario usuario={usuario} />
                </td>
                <td className="px-3 py-2 text-text-muted">{usuario.cargo ?? '—'}</td>
                <td className="px-3 py-2">
                  <Badge tone={usuario.ativo ? 'success' : 'neutral-strong'}>
                    {usuario.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  <AcoesUsuario
                    usuario={usuario}
                    usuarioLogado={usuarioLogado}
                    onEditar={onEditar}
                    onAlternarAtivo={onAlternarAtivo}
                    onExcluir={onExcluir}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      }
      cards={filtrados.map((usuario) => (
        <CardListItem key={usuario.id}>
          <div className="flex items-start justify-between gap-2">
            <CabecalhoUsuario usuario={usuario} />
            <Badge tone={usuario.ativo ? 'success' : 'neutral-strong'}>
              {usuario.ativo ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
          {usuario.cargo && <p className="mt-2 text-sm text-text-muted">{usuario.cargo}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <AcoesUsuario
              usuario={usuario}
              usuarioLogado={usuarioLogado}
              onEditar={onEditar}
              onAlternarAtivo={onAlternarAtivo}
              onExcluir={onExcluir}
            />
          </div>
        </CardListItem>
      ))}
    />
  )
}
