import { formatarDataExtenso } from '@/lib/formatters'
import { getModuloConfig } from '@/features/modulos/config'
import type { OSForm } from '../../schema'

/**
 * Preview da O.S. antes de emitir — porta de gerarPreviewOS em
 * emitir-os.js:912-1080. Todos os campos vindos do formulário (evento,
 * local, justificativa...) são interpolados em JSX puro: no original iam
 * para innerHTML sem escape; aqui o React escapa por padrão.
 *
 * Não reproduz o timbrado oficial pixel a pixel (logo, cores exatas de
 * fundo da tabela) — isso é o PDF gerado server-side (ReportLab), que
 * continua sendo o documento oficial. Este preview existe para conferir os
 * dados antes de confirmar, não para substituir o PDF.
 */
export function PreviewOS({ dados }: { dados: OSForm }) {
  const config = getModuloConfig(dados.modulo)

  const valorTotal = dados.itens.reduce((soma, item) => {
    const valor = parseFloat(String(item.valorUnit ?? '0')) || 0
    return soma + valor * (item.qtdTotal || 0)
  }, 0)

  return (
    <div className="flex flex-col gap-4 text-sm text-text">
      <header className="text-center">
        <h2 className="text-base font-bold">GOVERNO DO ESTADO DE SÃO PAULO</h2>
        <h3 className="font-semibold">SECRETARIA DE ESTADO DA EDUCAÇÃO</h3>
        <h2 className="mt-2 text-lg font-bold">ORDEM DE SERVIÇO</h2>
        <p className="mt-1 text-text-muted">
          Emissão: <strong>{dados.dataEmissao}</strong> · Número: <strong>{dados.numeroOS}</strong>
        </p>
      </header>

      <table className="w-full border-collapse text-left">
        <tbody>
          <TableRow label="Contrato Nº" value={dados.contrato} label2="Data assinatura" value2={dados.dataAssinatura} />
          <TableRow label="Detentora" value={dados.detentora} colSpan />
          <TableRow label="Serviço" value={dados.servico} label2="Prazo vigência" value2={dados.prazoVigencia} />
          <TableRow label="CNPJ" value={dados.cnpj} label2={config.grupoLabelUpper} value2={dados.grupo} />
        </tbody>
      </table>

      <table className="w-full border-collapse text-left">
        <tbody>
          {dados.evento && <TableRow label="Evento" value={dados.evento} colSpan />}
          {dados.data && <TableRow label={config.osDataLabel} value={dados.data} colSpan />}
          {dados.horario && <TableRow label={config.osHorarioLabel} value={dados.horario} colSpan />}
          {dados.local && <TableRow label={config.osLocalLabel} value={dados.local} colSpan />}
          <TableRow label="Responsável" value={dados.responsavel} colSpan />
          {dados.setorSolicitante && <TableRow label="Setor Solicitante" value={dados.setorSolicitante} colSpan />}
        </tbody>
      </table>

      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-success-subtle">
            <th className="px-2 py-1">Nº</th>
            <th className="px-2 py-1">{config.descLabel}</th>
            <th className="px-2 py-1">{config.itemCodeLabelUpper}</th>
            {config.usaDiarias && <th className="px-2 py-1">Diárias</th>}
            <th className="px-2 py-1">{config.colunaQtdCompacta}</th>
            <th className="px-2 py-1">Valor Unit.</th>
            <th className="px-2 py-1">Valor Total</th>
          </tr>
        </thead>
        <tbody>
          {dados.itens.map((item, index) => {
            const valorUnit = parseFloat(String(item.valorUnit ?? '0')) || 0
            const valorTotalItem = valorUnit * (item.qtdTotal || 0)
            return (
              <tr key={index} className="bg-surface-muted">
                <td className="px-2 py-1 text-center">{index + 1}</td>
                <td className="px-2 py-1">{item.descricao}</td>
                <td className="px-2 py-1 text-center">{item.itemBec}</td>
                {config.usaDiarias && <td className="px-2 py-1 text-center">{item.diarias}</td>}
                <td className="px-2 py-1 text-right">{item.qtdSolicitada ?? item.qtdTotal}</td>
                <td className="px-2 py-1 text-right">R$ {valorUnit.toFixed(2)}</td>
                <td className="px-2 py-1 text-right">R$ {valorTotalItem.toFixed(2)}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="bg-success-subtle font-semibold">
            <td colSpan={config.usaDiarias ? 6 : 5} className="px-2 py-1 text-right">
              Valor Total:
            </td>
            <td className="px-2 py-1 text-right">R$ {valorTotal.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <section>
        <p className="font-semibold">Justificativa:</p>
        <p className="whitespace-pre-line">{dados.justificativa}</p>
      </section>

      {dados.observacoes && (
        <section>
          <p className="font-semibold">Observações:</p>
          <p className="whitespace-pre-line">{dados.observacoes}</p>
        </section>
      )}

      <footer className="text-center">
        <p>São Paulo, {formatarDataExtenso(dados.data)}.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-8">
          {dados.signatarios.map((sig, index) => (
            <div key={index}>
              <p className="border-t border-text pt-1">{sig.nome}</p>
              <p className="text-xs text-text-muted">{sig.cargo}</p>
            </div>
          ))}
        </div>
      </footer>
    </div>
  )
}

function TableRow({
  label,
  value,
  label2,
  value2,
  colSpan,
}: {
  label: string
  value?: string | null
  label2?: string
  value2?: string | null
  colSpan?: boolean
}) {
  return (
    <tr>
      <td className="px-2 py-1 font-semibold">{label}:</td>
      <td className="px-2 py-1" colSpan={colSpan ? 3 : undefined}>
        {value}
      </td>
      {!colSpan && label2 && (
        <>
          <td className="px-2 py-1 font-semibold">{label2}:</td>
          <td className="px-2 py-1">{value2}</td>
        </>
      )}
    </tr>
  )
}
