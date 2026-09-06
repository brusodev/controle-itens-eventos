import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Modulo } from '@/features/modulos/config'
import { osAPI } from '../api'

/**
 * Sugestões de autocomplete para os 8 datalists do formulário — porta de
 * carregarSugestoesOS em ordens-servico.js:148-220. Derivadas das O.S. já
 * cadastradas no módulo, não de um endpoint dedicado (só setores
 * solicitantes tem rota própria — ver detentorasAPI/relatoriosAPI).
 */
export function useSugestoesOS(modulo: Modulo) {
  const { data: ordens } = useQuery({
    queryKey: ['ordens-servico', modulo, 'todas-para-sugestoes'],
    queryFn: () => osAPI.listar(modulo),
    staleTime: 60_000,
  })

  return useMemo(() => {
    const eventos = new Set<string>()
    const datas = new Set<string>()
    const horarios = new Set<string>()
    const locais = new Set<string>()
    const responsaveis = new Set<string>()
    const justificativas = new Set<string>()
    const observacoes = new Set<string>()
    const nomesSignatarios = new Set<string>()

    for (const os of ordens ?? []) {
      if (os.evento) eventos.add(os.evento)
      if (os.data) datas.add(os.data)
      if (os.horario) horarios.add(os.horario)
      if (os.local) locais.add(os.local)
      if (os.responsavel) responsaveis.add(os.responsavel)
      if (os.justificativa) justificativas.add(os.justificativa)
      if (os.observacoes) observacoes.add(os.observacoes)
      for (const sig of os.signatarios) {
        if (sig.nome) nomesSignatarios.add(sig.nome)
      }
    }

    const ordenado = (set: Set<string>) => Array.from(set).sort()

    return {
      eventos: ordenado(eventos),
      datas: ordenado(datas),
      horarios: ordenado(horarios),
      locais: ordenado(locais),
      responsaveis: ordenado(responsaveis),
      justificativas: ordenado(justificativas),
      observacoes: ordenado(observacoes),
      nomesSignatarios: ordenado(nomesSignatarios),
    }
  }, [ordens])
}
