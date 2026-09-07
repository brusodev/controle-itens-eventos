import { useCallback, useEffect, useState } from 'react'

/**
 * Drawer da sidebar no mobile (<768px) — porta de toggleMobileSidebar() em
 * layout_parts.html. Não persiste entre navegações.
 *
 * Enquanto aberto, trava o scroll do body: sem isso o conteúdo atrás do
 * overlay rolava junto com o gesto de scroll sobre o drawer no celular.
 */
export function useDrawerMobile() {
  const [aberto, setAberto] = useState(false)

  const fechar = useCallback(() => setAberto(false), [])
  const abrir = useCallback(() => setAberto(true), [])

  useEffect(() => {
    if (!aberto) return

    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setAberto(false)
    }
    document.addEventListener('keydown', aoTeclar)

    return () => {
      document.body.style.overflow = overflowAnterior
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [aberto])

  return { aberto, abrir, fechar }
}
