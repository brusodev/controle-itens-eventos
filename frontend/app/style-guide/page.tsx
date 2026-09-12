import { SecaoCores, SecaoTipografia, SecaoElevacaoRaio, SecaoGradiente } from './_sections/tokens'
import { SecaoButton, SecaoStatusBadge, SecaoBadge } from './_sections/botoes-badges'
import { SecaoCampos } from './_sections/campos'
import { SecaoCard } from './_sections/cards'
import { SecaoToast, SecaoModal } from './_sections/overlays'
import { SecaoEstados } from './_sections/estados'

/**
 * Style guide — entregável de design do plano (§ "Entregável de design
 * antes das telas"). Todo componente de components/ui/ em todos os estados,
 * para aprovação da direção visual ANTES de qualquer tela da Fase 1.
 *
 * Não é uma tela do produto: não faz parte da navegação normal, existe só
 * como referência viva. Se um componente muda aqui, ele muda em todo lugar
 * que o consome — o objetivo é impedir a divergência que existia entre
 * portal-empresa.css e o statusLabels inline de ordens-servico.js.
 *
 * Composta a partir de `_sections/*` (um arquivo por seção) para caber no
 * limite de 200 linhas por arquivo do eslint — o conteúdo cresceu com os
 * novos tokens de elevação/gradiente e o primitivo Card.
 */
export default function StyleGuidePage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-12 px-6 py-12">
      <header>
        <h1 className="text-2xl font-bold text-text">Style Guide</h1>
        <p className="text-text-muted">
          Tokens e componentes — referência viva, não uma tela do produto.
        </p>
      </header>

      <SecaoCores />
      <SecaoTipografia />
      <SecaoElevacaoRaio />
      <SecaoGradiente />
      <SecaoButton />
      <SecaoStatusBadge />
      <SecaoBadge />
      <SecaoCard />
      <SecaoCampos />
      <SecaoToast />
      <SecaoModal />
      <SecaoEstados />
    </div>
  )
}
