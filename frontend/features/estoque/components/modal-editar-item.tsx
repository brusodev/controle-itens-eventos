'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { formatarNumeroMilhar, removerMascaraNumero } from '@/lib/formatters'
import type { RegiaoConfig } from '@/features/modulos/config'
import { useAtualizarEstoque } from '../hooks/use-atualizar-estoque'
import type { ItemEstoque } from '../schema'
import { CamposRegiaoEstoque, type ValoresRegiao } from './campos-regiao-estoque'

export interface EditarItemState {
  item: ItemEstoque
  categoriaNome: string
}

/**
 * Modal de edição de estoque — porta de editarItemAlimentacao/salvamento
 * (estoque.js:223-393). Campos Inicial/Gasto/Preço ficam readOnly para
 * quem não é admin (a API já é @admin_requerido; isto é reforço de UI).
 */
export function ModalEditarItem({
  state,
  regioesConfig,
  ehAdmin,
  onClose,
}: {
  state: EditarItemState | null
  regioesConfig: RegiaoConfig
  ehAdmin: boolean
  onClose: () => void
}) {
  return (
    <Modal open={state !== null} onClose={onClose} title="Editar Item" className="sm:max-w-lg">
      {state && (
        <FormularioEdicao
          key={state.item.id}
          state={state}
          regioesConfig={regioesConfig}
          ehAdmin={ehAdmin}
          onClose={onClose}
        />
      )}
    </Modal>
  )
}

function valoresIniciais(item: ItemEstoque, quantidadeRegioes: number): Record<string, ValoresRegiao> {
  const valores: Record<string, ValoresRegiao> = {}
  for (let regiao = 1; regiao <= quantidadeRegioes; regiao++) {
    const r = item.regioes?.[String(regiao)]
    valores[String(regiao)] = {
      inicial: r?.inicial ? formatarNumeroMilhar(removerMascaraNumero(r.inicial)) : '',
      gasto: r?.gasto ? formatarNumeroMilhar(removerMascaraNumero(r.gasto)) : '0',
      preco: r?.preco ?? '0',
    }
  }
  return valores
}

function FormularioEdicao({
  state,
  regioesConfig,
  ehAdmin,
  onClose,
}: {
  state: EditarItemState
  regioesConfig: RegiaoConfig
  ehAdmin: boolean
  onClose: () => void
}) {
  const { item } = state
  const atualizar = useAtualizarEstoque(item.id)
  const [natureza, setNatureza] = useState(item.natureza ?? '')
  const [valores, setValores] = useState(() => valoresIniciais(item, regioesConfig.quantidade))

  function atualizarMascarado(regiao: string, campo: 'inicial' | 'gasto', valor: string) {
    const semMascara = valor.replace(/\D/g, '')
    setValores((atual) => ({
      ...atual,
      [regiao]: { ...atual[regiao], [campo]: semMascara ? formatarNumeroMilhar(semMascara) : '' },
    }))
  }

  function atualizarPreco(regiao: string, valor: string) {
    setValores((atual) => ({ ...atual, [regiao]: { ...atual[regiao], preco: valor } }))
  }

  function salvar() {
    const regioesPayload: Record<string, ValoresRegiao> = {}
    for (const [regiao, campos] of Object.entries(valores)) {
      regioesPayload[regiao] = {
        inicial: removerMascaraNumero(campos.inicial) || '__',
        gasto: removerMascaraNumero(campos.gasto) || '0',
        preco: campos.preco || '0',
      }
    }
    atualizar.mutate({ regioes: regioesPayload, natureza }, { onSuccess: onClose })
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Descrição">{(id) => <Input id={id} value={item.descricao} readOnly className="bg-surface-muted" />}</Field>
      <Field label="Unidade">{(id) => <Input id={id} value={item.unidade} readOnly className="bg-surface-muted" />}</Field>
      <Field label="Código">
        {(id) => (
          <Input id={id} value={natureza} readOnly={!ehAdmin} onChange={(e) => setNatureza(e.target.value)} />
        )}
      </Field>

      {Array.from({ length: regioesConfig.quantidade }, (_, i) => i + 1).map((regiao) => {
        const chave = String(regiao)
        return (
          <CamposRegiaoEstoque
            key={chave}
            label={regioesConfig.nomes[regiao] ?? `${regioesConfig.tipoLabel} ${regiao}`}
            valores={valores[chave]}
            ehAdmin={ehAdmin}
            onAtualizarMascarado={(campo, valor) => atualizarMascarado(chave, campo, valor)}
            onAtualizarPreco={(valor) => atualizarPreco(chave, valor)}
          />
        )
      })}

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        {ehAdmin && (
          <Button onClick={salvar} loading={atualizar.isPending}>
            Salvar
          </Button>
        )}
      </div>
    </div>
  )
}
