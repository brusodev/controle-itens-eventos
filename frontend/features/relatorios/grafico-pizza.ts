/**
 * Geometria de um gráfico de pizza em SVG puro — sem lib externa (o legado
 * usava Chart.js via CDN só para isto). Cada fatia é um <path> com arco
 * calculado aqui; o componente só desenha o resultado.
 */
export interface FatiaPizza {
  label: string
  valor: number
  cor: string
  path: string
  percentual: number
}

const PALETA = ['#667eea', '#764ba2', '#2e7d32', '#e65100', '#1565c0', '#c62828', '#6a1b9a', '#283593', '#00838f', '#ad1457']

function pontoNoCirculo(centro: number, raio: number, anguloGraus: number): [number, number] {
  const rad = ((anguloGraus - 90) * Math.PI) / 180
  return [centro + raio * Math.cos(rad), centro + raio * Math.sin(rad)]
}

/** `itens` com valor 0 são ignorados (fatia de ângulo zero não desenha). Devolve [] se o total for 0. */
export function calcularFatiasPizza(itens: { label: string; valor: number }[], raio = 80): FatiaPizza[] {
  const total = itens.reduce((soma, i) => soma + i.valor, 0)
  if (total <= 0) return []

  const centro = raio
  let anguloAcumulado = 0

  return itens
    .filter((item) => item.valor > 0)
    .map((item, indice) => {
      const fatiaGraus = (item.valor / total) * 360
      const [x1, y1] = pontoNoCirculo(centro, raio, anguloAcumulado)
      const [x2, y2] = pontoNoCirculo(centro, raio, anguloAcumulado + fatiaGraus)
      const largeArc = fatiaGraus > 180 ? 1 : 0
      const path = `M ${centro} ${centro} L ${x1} ${y1} A ${raio} ${raio} 0 ${largeArc} 1 ${x2} ${y2} Z`

      anguloAcumulado += fatiaGraus

      return {
        label: item.label,
        valor: item.valor,
        cor: PALETA[indice % PALETA.length],
        path,
        percentual: Math.round((item.valor / total) * 1000) / 10,
      }
    })
}
