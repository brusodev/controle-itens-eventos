'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { getModuloConfig } from '@/features/modulos/config'
import { useModulo } from '@/features/modulos/modulo-context'
import { osAPI } from '../../api'
import { EMPTY_OS, osSchema, type OSForm } from '../../schema'
import { camposPorModulo } from '../../campos-por-modulo'
import { useSalvarOS } from '../../hooks/use-salvar-os'
import { useSugestoesOS } from '../../hooks/use-sugestoes-os'
import { useSetoresSolicitantes } from '../../hooks/use-setores-solicitantes'
import { useRascunhoOS } from '../../hooks/use-rascunho-os'
import { usePreviewOS } from '../../hooks/use-preview-os'
import { DadosContratoFields } from './dados-contrato-fields'
import { DadosEventoFields } from './dados-evento-fields'
import { CamposPorModuloFields } from './campos-por-modulo-fields'
import { SignatariosFields } from './signatarios-fields'
import { TabelaItensOS } from './tabela-itens-os'
import { SeletorItensModal } from './seletor-itens-modal'
import { ModalVisualizarOS } from './modal-visualizar-os'
import { BannerRascunho } from './banner-rascunho'

/**
 * Formulário unificado de O.S. — a peça central do plano. Um componente,
 * uma função de submit, para criar e editar (ver plano § "A peça central:
 * formulário unificado"). Se o campo está no schema Zod, ele vai no
 * payload — não há mais dois caminhos de submit para divergir.
 */
export function FormularioOS({ osId }: { osId?: number }) {
  const router = useRouter()
  const { modulo } = useModulo()
  const { showToast } = useToast()
  const config = getModuloConfig(modulo)
  const camposModulo = camposPorModulo(modulo)

  const { data: osExistente } = useQuery({
    queryKey: ['ordens-servico', osId],
    queryFn: () => osAPI.obter(osId!),
    enabled: !!osId,
  })

  const form = useForm<OSForm>({
    resolver: zodResolver(osSchema),
    defaultValues: osExistente ?? { ...EMPTY_OS, modulo },
    values: osExistente,
  })
  const { register, control, handleSubmit, watch, setValue, formState } = form

  const grupo = watch('grupo') ?? ''
  const sugestoes = useSugestoesOS(modulo)
  const { data: setoresSugeridos = [] } = useSetoresSolicitantes(modulo)
  const salvar = useSalvarOS(osId)
  const preview = usePreviewOS()
  const rascunho = useRascunhoOS(modulo)
  const [seletorAberto, setSeletorAberto] = useState(false)

  async function onSubmit(dados: OSForm) {
    await preview.abrirPreview(dados, osId)
  }

  function confirmarEmissao() {
    if (!preview.dadosPreview) return
    salvar.mutate(preview.dadosPreview, {
      onSuccess: () => {
        rascunho.descartar()
        showToast(osId ? 'O.S. atualizada com sucesso.' : 'O.S. emitida com sucesso.', 'success')
        preview.fecharPreview()
        router.push('/os')
      },
      onError: () => showToast('Erro ao salvar a O.S. Tente novamente.', 'error'),
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {rascunho.rascunhoDisponivel && !osId && (
        <BannerRascunho
          timestamp={rascunho.rascunhoDisponivel.timestamp}
          dados={rascunho.rascunhoDisponivel.dados}
          onRestaurar={() => {
            form.reset(rascunho.rascunhoDisponivel!.dados)
          }}
          onDescartar={rascunho.descartar}
        />
      )}

      <DadosContratoFields
        setValue={setValue}
        grupo={grupo}
        onGrupoChange={(g) => setValue('grupo', g)}
        modulo={modulo}
        config={config}
      />

      <DadosEventoFields register={register} config={config} camposModulo={camposModulo} sugestoes={sugestoes} />

      <CamposPorModuloFields register={register} camposModulo={camposModulo} setoresSugeridos={setoresSugeridos} />

      <SignatariosFields control={control} register={register} nomesSugeridos={sugestoes.nomesSignatarios} />

      <div className="flex flex-col gap-3">
        <h3 className="text-base font-semibold text-text">Itens da Ordem de Serviço</h3>
        <TabelaItensOS itens={watch('itens')} config={config} onChange={(itens) => setValue('itens', itens)} />
        <Button type="button" variant="secondary" size="sm" className="self-start" onClick={() => setSeletorAberto(true)}>
          Selecionar Itens
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={preview.carregandoNumero}>
          Visualizar O.S.
        </Button>
      </div>

      <SeletorItensModal
        open={seletorAberto}
        onClose={() => setSeletorAberto(false)}
        modulo={modulo}
        grupo={grupo}
        itensAtuais={watch('itens')}
        onConfirmar={(itens) => setValue('itens', itens)}
      />

      <ModalVisualizarOS
        dados={preview.dadosPreview}
        salvando={salvar.isPending}
        onConfirmar={confirmarEmissao}
        onClose={preview.fecharPreview}
      />

      {formState.errors.itens && (
        <p className="text-sm text-danger-strong">{formState.errors.itens.message}</p>
      )}
    </form>
  )
}
