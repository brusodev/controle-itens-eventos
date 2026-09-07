'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/field'
import { formatarCategoriaAlimentacao } from '@/lib/formatters'
import { getModuloConfig, type Modulo } from '@/features/modulos/config'
import { useCriarItem } from '../hooks/use-criar-item'
import { gerarProximoCodigoItem, montarRegioesIniciais } from '../gerar-codigo-item'
import { EMPTY_NOVO_ITEM_FORM, type DadosAlimentacao, type NovoItemForm } from '../schema'

/**
 * Modal de novo item — porta de mostrarModalNovoItem + submit real em
 * kits-requisicoes.js:75-150. O código do item é gerado no client como
 * sequencial da categoria (maior código existente + 1), e a quantidade
 * inicial é replicada em todas as regiões do módulo com gasto zerado.
 */
export function ModalNovoItem({
  open,
  onClose,
  modulo,
  dadosAlimentacao,
}: {
  open: boolean
  onClose: () => void
  modulo: Modulo
  dadosAlimentacao: DadosAlimentacao
}) {
  return (
    <Modal open={open} onClose={onClose} title="Adicionar Item ao Estoque">
      {open && (
        <FormularioNovoItem
          key={JSON.stringify(Object.keys(dadosAlimentacao))}
          modulo={modulo}
          dadosAlimentacao={dadosAlimentacao}
          onClose={onClose}
        />
      )}
    </Modal>
  )
}

function FormularioNovoItem({
  modulo,
  dadosAlimentacao,
  onClose,
}: {
  modulo: Modulo
  dadosAlimentacao: DadosAlimentacao
  onClose: () => void
}) {
  const config = getModuloConfig(modulo)
  const criar = useCriarItem()
  const [form, setForm] = useState<NovoItemForm>({ ...EMPTY_NOVO_ITEM_FORM })

  const categorias = Object.keys(dadosAlimentacao).sort()

  function salvar() {
    const categoriaData = dadosAlimentacao[form.categoria]
    if (!categoriaData) return

    const codigo = gerarProximoCodigoItem(categoriaData.itens)
    const regioes = montarRegioesIniciais(form.quantidadeInicial || '0', config.regioes.quantidade)

    criar.mutate(
      {
        categoria_id: categoriaData.categoria_db_id,
        item: codigo,
        descricao: form.nome,
        unidade: form.unidade,
        natureza: form.natureza || null,
        regioes,
      },
      { onSuccess: onClose },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Categoria" required>
        {(id) => (
          <Select id={id} value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
            <option value="">Selecione a categoria</option>
            {categorias.map((cat) => (
              <option key={cat} value={cat}>
                {formatarCategoriaAlimentacao(cat)}
                {dadosAlimentacao[cat].natureza ? ` (${dadosAlimentacao[cat].natureza})` : ''}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field label="Nome do Item" required>
        {(id) => <Input id={id} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />}
      </Field>

      <Field label={`Código ${config.itemCodeLabel}`} hint="Opcional">
        {(id) => (
          <Input
            id={id}
            placeholder="Ex: 228990"
            value={form.natureza}
            onChange={(e) => setForm({ ...form, natureza: e.target.value })}
          />
        )}
      </Field>

      <Field label="Quantidade Inicial" hint="Replicada em todas as regiões do módulo">
        {(id) => (
          <Input
            id={id}
            type="number"
            min={0}
            value={form.quantidadeInicial}
            onChange={(e) => setForm({ ...form, quantidadeInicial: e.target.value })}
          />
        )}
      </Field>

      <Field label="Unidade">
        {(id) => (
          <Input id={id} value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} />
        )}
      </Field>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={salvar} loading={criar.isPending} disabled={!form.categoria || !form.nome}>
          Adicionar Item
        </Button>
      </div>
    </div>
  )
}
