import { Badge } from '@/components/ui/badge'
import { LABEL_PERFIL, type UsuarioAdmin } from '../schema'

/** Avatar + nome + badge de perfil + e-mail — cabeçalho compartilhado por linha (tabela) e card (mobile). */
export function CabecalhoUsuario({ usuario }: { usuario: UsuarioAdmin }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-text-on-primary">
        {usuario.nome.charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="truncate font-medium text-text">{usuario.nome}</p>
          {usuario.perfil !== 'comum' && (
            <Badge tone={usuario.perfil === 'admin' ? 'warning' : 'indigo'}>{LABEL_PERFIL[usuario.perfil]}</Badge>
          )}
        </div>
        <p className="truncate text-xs text-text-muted">{usuario.email}</p>
      </div>
    </div>
  )
}
