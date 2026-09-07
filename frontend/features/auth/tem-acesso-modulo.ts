import type { Usuario } from './schema'
import type { Modulo } from '@/features/modulos/config'

/**
 * Espelha Usuario.tem_acesso_modulo() em backend/models.py:512 — lista
 * vazia/nula = acesso a todos os módulos (default retrocompatível).
 * Perfil 'empresa' nunca acessa módulos internos (só o Portal, Fase 3).
 * Admin sempre tem acesso.
 *
 * Fonte única desta regra — usada tanto na visibilidade do menu
 * (features/layout/menu-items.ts) quanto no card de Serviços Gráficos do
 * dashboard, para não haver duas implementações que possam divergir.
 */
export function temAcessoModulo(usuario: Usuario, modulo: Modulo): boolean {
  if (usuario.perfil === 'empresa') return false
  if (usuario.perfil === 'admin') return true
  if (usuario.modulosPermitidos.length === 0) return true
  return usuario.modulosPermitidos.includes(modulo)
}
