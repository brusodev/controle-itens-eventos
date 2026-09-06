'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { MODULOS, type Modulo } from './config'

const STORAGE_KEY = 'modulo_atual'
const MODULO_PADRAO: Modulo = 'coffee'

function isModulo(value: string | null): value is Modulo {
  return value !== null && (MODULOS as readonly string[]).includes(value)
}

/** Lido uma única vez, na inicialização lazy do useState — nunca em efeito. */
function lerModuloInicial(): Modulo {
  if (typeof window === 'undefined') return MODULO_PADRAO
  try {
    const salvo = window.localStorage.getItem(STORAGE_KEY)
    return isModulo(salvo) ? salvo : MODULO_PADRAO
  } catch {
    // localStorage indisponível (modo privado etc.) — segue com o padrão.
    return MODULO_PADRAO
  }
}

interface ModuloContextValue {
  modulo: Modulo
  setModulo: (modulo: Modulo) => void
}

const ModuloContext = createContext<ModuloContextValue | null>(null)

/**
 * Fonte única do módulo ativo. Substitui o `localStorage.getItem('modulo_atual')`
 * lido diretamente dentro do client HTTP (api-client.js antigo) — aqui o
 * módulo é estado React tipado, e o wrapper de API (lib/api.ts) o consome
 * via `useModulo()`, nunca lendo localStorage por conta própria.
 *
 * A chave de armazenamento é mantida (`modulo_atual`) só para não perder a
 * escolha do usuário entre sessões — a leitura em si é sempre via contexto.
 */
export function ModuloProvider({ children }: { children: React.ReactNode }) {
  const [modulo, setModuloState] = useState<Modulo>(lerModuloInicial)

  const setModulo = useCallback((novo: Modulo) => {
    setModuloState(novo)
    try {
      window.localStorage.setItem(STORAGE_KEY, novo)
    } catch {
      // Persistência é best-effort; o estado em memória já foi atualizado.
    }
  }, [])

  return <ModuloContext.Provider value={{ modulo, setModulo }}>{children}</ModuloContext.Provider>
}

export function useModulo(): ModuloContextValue {
  const context = useContext(ModuloContext)
  if (!context) {
    throw new Error('useModulo() precisa estar dentro de <ModuloProvider>.')
  }
  return context
}
