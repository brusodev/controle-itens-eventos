import { MIN_SENHA } from './schema'

/**
 * Requisitos exibidos como checklist — porta de verificarForca() em
 * alterar-senha.html:353-386, que misturava o cálculo com getElementById.
 * Aqui é função pura: o componente só desenha o resultado.
 *
 * Só o comprimento é bloqueante (é o que o backend valida). Maiúscula,
 * minúscula, número e especial são orientação visual, como no legado —
 * nenhum deles impedia o submit lá, e não impedem aqui.
 */
export interface RequisitoSenha {
  id: string
  label: string
  atendido: boolean
}

export type NivelForca = 'fraca' | 'media' | 'forte'

export interface ForcaSenha {
  requisitos: RequisitoSenha[]
  atendidos: number
  nivel: NivelForca
  label: string
}

const LABEL_POR_NIVEL: Record<NivelForca, string> = {
  fraca: 'Senha fraca',
  media: 'Senha média',
  forte: 'Senha forte',
}

export function avaliarForcaSenha(senha: string): ForcaSenha {
  const requisitos: RequisitoSenha[] = [
    { id: 'length', label: `Mínimo ${MIN_SENHA} caracteres`, atendido: senha.length >= MIN_SENHA },
    { id: 'uppercase', label: 'Pelo menos 1 letra maiúscula', atendido: /[A-Z]/.test(senha) },
    { id: 'lowercase', label: 'Pelo menos 1 letra minúscula', atendido: /[a-z]/.test(senha) },
    { id: 'number', label: 'Pelo menos 1 número', atendido: /\d/.test(senha) },
    { id: 'special', label: 'Pelo menos 1 caractere especial (!@#$%)', atendido: /[!@#$%^&*]/.test(senha) },
  ]

  const atendidos = requisitos.filter((r) => r.atendido).length
  // Mesmos cortes do legado: <2 fraca, <4 média, senão forte.
  const nivel: NivelForca = atendidos < 2 ? 'fraca' : atendidos < 4 ? 'media' : 'forte'

  return { requisitos, atendidos, nivel, label: LABEL_POR_NIVEL[nivel] }
}
