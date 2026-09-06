import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Modulo } from '@/features/modulos/config'
import type { OSForm } from '../schema'

interface Rascunho {
  timestamp: number
  dados: OSForm
}

const AUTO_SAVE_INTERVALO_MS = 30_000

function chaveRascunho(modulo: Modulo): string {
  return `rascunho_os_${modulo}`
}

/** true quando o rascunho tem algo digno de recuperar — evita banner para um form vazio. */
function rascunhoTemConteudo(dados: OSForm): boolean {
  if (dados.itens.length > 0) return true
  const camposTexto: (keyof OSForm)[] = ['evento', 'data', 'local', 'justificativa', 'observacoes']
  return camposTexto.some((campo) => {
    const valor = dados[campo]
    return typeof valor === 'string' && valor.trim() !== ''
  })
}

function lerRascunho(modulo: Modulo): Rascunho | null {
  if (typeof window === 'undefined') return null // SSR: sem localStorage
  const raw = localStorage.getItem(chaveRascunho(modulo))
  if (!raw) return null
  try {
    const rascunho: Rascunho = JSON.parse(raw)
    if (rascunhoTemConteudo(rascunho.dados)) return rascunho
    localStorage.removeItem(chaveRascunho(modulo))
    return null
  } catch {
    localStorage.removeItem(chaveRascunho(modulo))
    return null
  }
}

/**
 * Rascunho com auto-save — porta de salvarRascunhoOS/_iniciarAutoSave/
 * _verificarRascunhoOS/descartarRascunhoOS (emitir-os.js:1341-1441).
 *
 * Diferença deliberada: salva o objeto `OSForm` tipado inteiro (validável
 * pelo mesmo schema Zod do resto do formulário), não um mapa solto de
 * `id do input → string` como no original — não há como o rascunho ficar
 * dessincronizado do formato que o backend espera.
 */
export function useRascunhoOS(modulo: Modulo) {
  // Deriva do localStorage a cada troca de módulo — sem useState+useEffect
  // sincronizando duas fontes da verdade (o valor É a leitura do storage).
  // Só passa a ficar "obsoleto" após um `descartar()`, tratado à parte.
  const rascunhoDoStorage = useMemo(() => lerRascunho(modulo), [modulo])
  const [descartadoManualmente, setDescartadoManualmente] = useState(false)

  // Reseta o flag "descartei" ajustando o estado durante a própria
  // renderização (padrão recomendado pelo React para "resetar estado
  // quando uma prop muda", equivalente a uma `key` — evitável só com
  // useEffect, que causaria um render extra sempre que o módulo trocasse).
  const [moduloAnterior, setModuloAnterior] = useState(modulo)
  if (modulo !== moduloAnterior) {
    setModuloAnterior(modulo)
    setDescartadoManualmente(false)
  }

  const rascunhoDisponivel = descartadoManualmente ? null : rascunhoDoStorage

  const dadosAtuaisRef = useRef<OSForm | null>(null)

  const salvar = useCallback(
    (dados: OSForm) => {
      dadosAtuaisRef.current = dados
      if (!rascunhoTemConteudo(dados)) return
      try {
        localStorage.setItem(chaveRascunho(modulo), JSON.stringify({ timestamp: Date.now(), dados }))
      } catch {
        // localStorage cheio ou indisponível — auto-save é best-effort.
      }
    },
    [modulo],
  )

  const descartar = useCallback(() => {
    localStorage.removeItem(chaveRascunho(modulo))
    setDescartadoManualmente(true)
  }, [modulo])

  // Auto-save periódico do último valor conhecido do formulário.
  useEffect(() => {
    const id = setInterval(() => {
      if (dadosAtuaisRef.current) salvar(dadosAtuaisRef.current)
    }, AUTO_SAVE_INTERVALO_MS)
    return () => clearInterval(id)
  }, [salvar])

  return { rascunhoDisponivel, salvar, descartar }
}
