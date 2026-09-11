'use client'

import { Modal } from '@/components/ui/modal'
import { formatarChave } from '../formatar-chave'
import { formatarDataHoraBr } from '../formatar-data'
import { normalizarDadosAuditoria } from '../normalizar-dados'
import { LABEL_MODULO, type Auditoria, type ModuloAuditoria } from '../schema'
import { BadgeAcao } from './badge-acao'
import { ValorAuditoria } from './valor-auditoria'

/**
 * Detalhe de um registro — porta de abrirDetalhes()
 * (auditoria.html:698-816).
 *
 * O legado passava o registro serializado dentro de um atributo HTML
 * (`onclick='abrirDetalhes(${JSON.stringify(a)...})'`), escapando só aspas
 * simples — o ponto mais arriscado da tela (§ plano). Aqui o objeto chega
 * por prop React; não existe serialização em atributo para quebrar.
 */
export function ModalDetalheAuditoria({
  registro,
  onClose,
}: {
  registro: Auditoria | null
  onClose: () => void
}) {
  return (
    <Modal open={registro !== null} onClose={onClose} title="Detalhes da Auditoria">
      {registro && <ConteudoDetalhe registro={registro} />}
    </Modal>
  )
}

function ConteudoDetalhe({ registro }: { registro: Auditoria }) {
  const antes = normalizarDadosAuditoria(registro.dados_antes)
  const depois = normalizarDadosAuditoria(registro.dados_depois)
  const moduloLabel = LABEL_MODULO[registro.modulo as ModuloAuditoria] ?? registro.modulo

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h3 className="mb-2 text-sm font-semibold text-text">Informações gerais</h3>
        <dl className="flex flex-col gap-1.5 text-sm">
          <Linha rotulo="Data/Hora" valor={formatarDataHoraBr(registro.data_hora)} />
          <Linha
            rotulo="Usuário"
            valor={
              registro.usuario_nome
                ? `${registro.usuario_nome}${registro.usuario_email ? ` (${registro.usuario_email})` : ''}`
                : 'Não disponível'
            }
          />
          <Linha rotulo="Ação" valor={<BadgeAcao acao={registro.acao} />} />
          <Linha rotulo="Módulo" valor={moduloLabel} />
          <Linha rotulo="Descrição" valor={registro.descricao ?? '—'} />
          <Linha rotulo="IP" valor={registro.ip_address ?? 'Não disponível'} />
          <Linha rotulo="User Agent" valor={<span className="text-xs">{registro.user_agent ?? 'Não disponível'}</span>} />
        </dl>
      </section>

      {antes || depois ? (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-text">Comparação de dados</h3>
          {/* Empilha no mobile: duas colunas a 375px deixariam cada valor com ~150px. */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ColunaDiff titulo="Antes" dados={antes} vazio="Nenhum dado anterior" />
            <ColunaDiff titulo="Depois" dados={depois} vazio="Nenhum dado posterior" />
          </div>
        </section>
      ) : (
        <p className="rounded-md bg-surface-muted p-4 text-center text-sm text-text-muted">
          Não há dados de comparação disponíveis para este registro.
        </p>
      )}
    </div>
  )
}

function Linha({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border-subtle pb-1.5 last:border-b-0 sm:flex-row sm:gap-2">
      <dt className="shrink-0 font-medium text-text-muted sm:w-32">{rotulo}:</dt>
      <dd className="min-w-0 break-words text-text">{valor}</dd>
    </div>
  )
}

function ColunaDiff({
  titulo,
  dados,
  vazio,
}: {
  titulo: string
  dados: Record<string, unknown> | null
  vazio: string
}) {
  return (
    <div className="rounded-md border border-border-subtle p-3">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">{titulo}</h4>
      {dados ? (
        <div className="flex flex-col gap-2">
          {Object.entries(dados).map(([chave, valor]) => (
            <div key={chave} className="min-w-0">
              <div className="text-xs font-semibold text-text">{formatarChave(chave)}</div>
              <div className="min-w-0 break-words text-sm text-text-muted">
                <ValorAuditoria valor={valor} chave={chave} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted">{vazio}</p>
      )}
    </div>
  )
}
