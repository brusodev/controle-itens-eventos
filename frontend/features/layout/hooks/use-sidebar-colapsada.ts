import { useCallback, useState } from 'react'

const STORAGE_KEY = 'sidebar_collapsed'

/** Lido uma única vez, na inicialização lazy do useState — nunca em efeito (mesmo padrão de useModulo). */
function lerEstadoInicial(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

/** Collapse da sidebar desktop — porta de toggleSidebar() em layout_parts.html (script_layout). */
export function useSidebarColapsada() {
  const [colapsada, setColapsadaState] = useState(lerEstadoInicial)

  const alternar = useCallback(() => {
    setColapsadaState((atual) => {
      const novo = !atual
      try {
        window.localStorage.setItem(STORAGE_KEY, String(novo))
      } catch {
        // Persistência é best-effort.
      }
      return novo
    })
  }, [])

  return { colapsada, alternar }
}
