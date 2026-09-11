import { useMutation } from '@tanstack/react-query'
import { contaAPI } from '../api'
import type { SenhaForm } from '../schema'

/** Troca de senha — não invalida cache algum: nenhum dado exibido muda. */
export function useAlterarSenha() {
  return useMutation({
    mutationFn: (dados: SenhaForm) => contaAPI.alterarSenha(dados),
  })
}
