import { formatarChave } from '../formatar-chave'
import { formatarDataHoraBr, pareceDataIso } from '../formatar-data'

/**
 * Renderiza um valor do diff — porta de formatarValor()
 * (auditoria.html:882-937), que montava string HTML e escapava à mão com
 * escapeHtml(). Aqui é JSX: o escape é da linguagem, não de uma função que
 * alguém pode esquecer de chamar.
 *
 * Recursivo por natureza (arrays de itens contêm objetos com seus próprios
 * campos), como o original.
 */
export function ValorAuditoria({ valor, chave }: { valor: unknown; chave?: string }) {
  if (valor === null || valor === undefined) {
    return <em className="text-text-muted">Vazio</em>
  }

  if (typeof valor === 'boolean') {
    return <span>{valor ? 'Sim' : 'Não'}</span>
  }

  // Estoques por região: cada região vira um <details> expansível.
  if (chave === 'regioes' && typeof valor === 'object' && !Array.isArray(valor)) {
    return <ListaExpansivel entradas={Object.entries(valor as Record<string, unknown>)} rotulo={(k) => `Região ${k}`} />
  }

  if (Array.isArray(valor)) {
    if (valor.length === 0) return <em className="text-text-muted">Nenhum item</em>
    return <ListaExpansivel entradas={valor.map((v, i) => [String(i), v])} rotulo={(_, i) => `Item ${i + 1}`} />
  }

  if (typeof valor === 'object') {
    return (
      <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-surface-muted p-2 text-xs">
        {JSON.stringify(valor, null, 2)}
      </pre>
    )
  }

  if (typeof valor === 'string' && pareceDataIso(valor)) {
    return <span>{formatarDataHoraBr(valor)}</span>
  }

  return <span className="break-words">{String(valor)}</span>
}

/** Bloco expansível compartilhado por "regiões" e "itens" — ambos eram <details> no legado. */
function ListaExpansivel({
  entradas,
  rotulo,
}: {
  entradas: [string, unknown][]
  rotulo: (chave: string, indice: number) => string
}) {
  return (
    <div className="mt-1 flex flex-col gap-1">
      {entradas.map(([chave, conteudo], indice) => (
        <details key={chave} className="rounded bg-surface-muted p-2">
          <summary className="cursor-pointer text-xs font-semibold text-primary-emphasis">
            {rotulo(chave, indice)}
          </summary>
          <div className="mt-2 flex flex-col gap-1 pl-2">
            {conteudo && typeof conteudo === 'object' ? (
              Object.entries(conteudo as Record<string, unknown>).map(([k, v]) => (
                <div key={k} className="text-xs">
                  <strong className="text-text">{formatarChave(k)}:</strong>{' '}
                  <ValorAuditoria valor={v} chave={k} />
                </div>
              ))
            ) : (
              <span className="text-xs">{String(conteudo)}</span>
            )}
          </div>
        </details>
      ))}
    </div>
  )
}
