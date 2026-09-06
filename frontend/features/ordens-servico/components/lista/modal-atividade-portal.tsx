'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { useAtividadePortal, useResponderAtividade } from '../../hooks/use-atividade-portal'
import type { Comentario } from '../../schema-atividade'

/**
 * Porta de verAtividadePortal/_carregarAtividade em ordens-servico.js:1167-1271.
 *
 * Ponto de atenção do plano (§ XSS): o comentário da detentora externa é
 * dado nunca confiável, renderizado na tela do admin. No original ele ia
 * para innerHTML SEM escape (o mesmo dado passava por h() só do lado do
 * portal) — aqui `comentario.texto` é interpolado em JSX puro, nunca via
 * dangerouslySetInnerHTML, então o React escapa por padrão. Ver teste
 * correspondente em modal-atividade-portal.test.tsx.
 */
export function ModalAtividadePortal({
  osId,
  onClose,
}: {
  osId: number | null
  onClose: () => void
}) {
  return (
    <Modal open={osId !== null} onClose={onClose} title="Atividade do Portal" className="sm:max-w-xl">
      {osId !== null && <ConteudoAtividade osId={osId} />}
    </Modal>
  )
}

function ConteudoAtividade({ osId }: { osId: number }) {
  const { data, isLoading, isError } = useAtividadePortal(osId)
  const responder = useResponderAtividade(osId)
  const [resposta, setResposta] = useState('')

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    )
  }

  if (isError || !data) {
    return <p className="text-sm text-danger-strong">Erro ao carregar atividade.</p>
  }

  function enviarResposta() {
    const texto = resposta.trim()
    if (!texto) return
    responder.mutate(texto, { onSuccess: () => setResposta('') })
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-muted">
        O.S. {data.numero_os} — {data.evento}
      </p>

      <div className="flex flex-col gap-3">
        {data.comentarios.length === 0 && (
          <p className="text-sm text-text-muted">Nenhum comentário registrado.</p>
        )}
        {data.comentarios.map((comentario) => (
          <ComentarioItem key={comentario.id} comentario={comentario} />
        ))}
      </div>

      <div className="flex flex-col gap-2 border-t border-border-subtle pt-4">
        <label className="text-xs font-semibold text-text-muted">
          Responder (visível para a empresa)
        </label>
        <div className="flex items-end gap-2">
          <Textarea
            rows={2}
            maxLength={2000}
            value={resposta}
            onChange={(e) => setResposta(e.target.value)}
            placeholder="Digite sua resposta ou observação..."
            className="flex-1"
          />
          <Button onClick={enviarResposta} loading={responder.isPending} size="sm">
            Enviar
          </Button>
        </div>
      </div>
    </div>
  )
}

function ComentarioItem({ comentario }: { comentario: Comentario }) {
  const ehEmpresa = comentario.autorPerfil === 'empresa'
  return (
    <div className="rounded-md border border-border-subtle bg-surface-muted p-3">
      <div className="mb-1 flex items-center justify-between text-xs text-text-muted">
        <span className="font-semibold">
          {comentario.autorNome ?? 'Desconhecido'} {ehEmpresa && '(empresa)'}
        </span>
        {comentario.criadoEm && (
          <span>{new Date(comentario.criadoEm).toLocaleString('pt-BR')}</span>
        )}
      </div>
      {/* Interpolação em JSX puro — React escapa automaticamente. Nunca
          trocar por dangerouslySetInnerHTML aqui. */}
      <p className="text-sm text-text">{comentario.texto}</p>
    </div>
  )
}
