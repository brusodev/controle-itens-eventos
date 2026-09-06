import { useQuery } from '@tanstack/react-query'
import type { Modulo } from '@/features/modulos/config'
import { detentorasAPI } from '../api'

/** Dispara ao escolher o grupo no formulário de O.S. — preenche contrato/detentora/CNPJ automaticamente. */
export function useDetentoraPorGrupo(grupo: string, modulo: Modulo) {
  return useQuery({
    queryKey: ['detentoras', 'grupo', modulo, grupo],
    queryFn: () => detentorasAPI.obterPorGrupo(grupo, modulo),
    enabled: grupo !== '',
  })
}
