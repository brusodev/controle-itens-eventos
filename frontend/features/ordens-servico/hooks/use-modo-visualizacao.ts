import { useCallback, useState } from 'react'

const STORAGE_KEY = 'os_modo_visualizacao'

export const MODOS_VISUALIZACAO = ['lista', 'grid'] as const
export type ModoVisualizacao = (typeof MODOS_VISUALIZACAO)[number]
const MODO_PADRAO: ModoVisualizacao = 'lista'

/** localStorage é texto não confiável — valida antes de aceitar (mesmo padrão de isModulo em modulo-context.tsx). */
function isModo(value: string | null): value is ModoVisualizacao {
  return value !== null && (MODOS_VISUALIZACAO as readonly string[]).includes(value)
}

/** Lido uma única vez, na inicialização lazy do useState — nunca em efeito (mesmo padrão de use-sidebar-colapsada). */
function lerModoInicial(): ModoVisualizacao {
  if (typeof window === 'undefined') return MODO_PADRAO
  try {
    const salvo = window.localStorage.getItem(STORAGE_KEY)
    return isModo(salvo) ? salvo : MODO_PADRAO
  } catch {
    return MODO_PADRAO
  }
}

/** Preferência lista/grid da tela /os, persistida entre sessões. */
export function useModoVisualizacao() {
  const [modo, setModoState] = useState<ModoVisualizacao>(lerModoInicial)

  const setModo = useCallback((novo: ModoVisualizacao) => {
    setModoState(novo)
    try {
      window.localStorage.setItem(STORAGE_KEY, novo)
    } catch {
      // Persistência é best-effort.
    }
  }, [])

  return { modo, setModo }
}
