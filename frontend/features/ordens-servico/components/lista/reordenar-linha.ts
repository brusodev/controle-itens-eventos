export interface ReordenarLinha {
  id: number
  numeroAtual: string
  evento: string | null | undefined
  dataEmissao: string | null | undefined
}

/** Move um item de posição num array, sem mutar o original — base de mover-para-cima/baixo. */
export function moverPosicao<T>(lista: T[], de: number, para: number): T[] {
  if (para < 0 || para >= lista.length) return lista
  const copia = [...lista]
  const [item] = copia.splice(de, 1)
  copia.splice(para, 0, item)
  return copia
}
