import { useState } from 'react'
import { osAPI } from '../api'
import type { OSForm } from '../schema'

/**
 * Estado do fluxo "Visualizar" → preview → "Confirmar e Emitir" — porta de
 * visualizarOS/fecharModalVisualizarOS (emitir-os.js:761-810). Busca o
 * próximo número da O.S. só na criação (edição mantém o número existente).
 */
export function usePreviewOS() {
  const [dadosPreview, setDadosPreview] = useState<OSForm | null>(null)
  const [carregandoNumero, setCarregandoNumero] = useState(false)

  async function abrirPreview(dados: OSForm, osId?: number) {
    if (osId) {
      setDadosPreview(dados)
      return
    }
    setCarregandoNumero(true)
    try {
      const { proximoNumero } = await osAPI.proximoNumero(dados.modulo, dados.grupo ?? '')
      setDadosPreview({ ...dados, numeroOS: proximoNumero })
    } finally {
      setCarregandoNumero(false)
    }
  }

  function fecharPreview() {
    setDadosPreview(null)
  }

  return { dadosPreview, carregandoNumero, abrirPreview, fecharPreview }
}
