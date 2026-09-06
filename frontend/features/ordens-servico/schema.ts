import { z } from 'zod'
import { MODULOS } from '@/features/modulos/config'

/**
 * Fonte única de tipo + validação do formulário de O.S. — ver plano
 * § "A peça central: formulário unificado". Espelha o payload aceito por
 * backend/routes/os_routes.py (POST/PUT /api/ordens-servico) e o retorno de
 * OrdemServico.to_dict() / ItemOrdemServico.to_dict() em backend/models.py.
 *
 * Regras que existem por terem sido a causa de bugs reais (não estética):
 *  - `data` é texto livre ("26 à 30/05/2026"), NUNCA um z.string().date() —
 *    convertê-la para ISO foi o bug corrigido no commit 09e93ae.
 *  - `observacoes` está aqui explicitamente porque já "sumiu" no salvamento
 *    quando existia só em um dos dois caminhos duplicados do JS antigo.
 *  - Todo campo opcional no backend é `.nullable().optional()` aqui, não
 *    omitido — omitir um campo do schema é exatamente como ele voltava a
 *    sumir do payload antes.
 */

export const STATUS_OS = [
  'emitida',
  'enviada_empresa',
  'em_revisao',
  'aceita',
  'em_execucao',
  'executada',
  'recusada',
  'cancelada',
] as const

export type StatusOS = (typeof STATUS_OS)[number]

const signatarioSchema = z.object({
  cargo: z.string(),
  nome: z.string(),
})

// Um item dentro da O.S. — `itemId`, `categoria`, `descricao` e `qtdTotal`
// são obrigatórios no backend (acesso direto por chave em os_routes.py;
// ausentes ali viram 500, não 400). Os demais têm fallback no servidor.
export const itemOSSchema = z.object({
  id: z.number().optional(), // presente só em itens já persistidos (edição)
  categoria: z.string().min(1, 'Selecione a categoria do item.'),
  itemId: z.union([z.string(), z.number()]),
  itemCodigo: z.string().nullable().optional(),
  itemBec: z.string().nullable().optional(),
  descricao: z.string().min(1),
  unidade: z.string().nullable().optional(),
  diarias: z.number().int().positive(),
  qtdSolicitada: z.number().nullable().optional(),
  qtdTotal: z.number(),
  valorUnit: z.union([z.string(), z.number()]).nullable().optional(),
  // Transporte: trajeto por item (duplicar item é uma ação só desse módulo)
  trajetoOrigem: z.string().nullable().optional(),
  trajetoDestino: z.string().nullable().optional(),
  trajetoTipo: z.enum(['ida', 'volta']).nullable().optional(),
})
export type ItemOS = z.infer<typeof itemOSSchema>

export const osSchema = z.object({
  id: z.number().optional(), // ausente na criação, presente na edição
  numeroOS: z.string().nullable().optional(),
  status: z.enum(STATUS_OS).optional(),
  modulo: z.enum(MODULOS),
  grupo: z.string().nullable().optional(),

  // Contrato / detentora
  contrato: z.string().nullable().optional(),
  dataAssinatura: z.string().nullable().optional(),
  prazoVigencia: z.string().nullable().optional(),
  detentora: z.string().nullable().optional(),
  detentoraId: z.number().nullable().optional(),
  cnpj: z.string().nullable().optional(),
  servico: z.string().nullable().optional(),

  // Evento / pedido — `data` é texto livre, nunca ISO (ver docstring acima)
  evento: z.string().min(1, 'Informe o evento.'),
  data: z.string().nullable().optional(),
  horario: z.string().nullable().optional(),
  local: z.string().nullable().optional(),
  justificativa: z.string().nullable().optional(),
  observacoes: z.string().nullable().optional(),

  // Transporte (trajeto no nível da O.S., além do trajeto por item)
  trajetoOrigem: z.string().nullable().optional(),
  trajetoDestino: z.string().nullable().optional(),
  trajetoKm: z.string().nullable().optional(),
  trajetoTipo: z.enum(['ida', 'volta']).nullable().optional(),

  // Organização
  qtdPessoasAtendidas: z.number().nullable().optional(),

  // Transporte
  setorSolicitante: z.string().nullable().optional(),

  // Serviços Gráficos (pedidos pontuais, datas opcionais)
  dataPedido: z.string().nullable().optional(),
  dataEntrega: z.string().nullable().optional(),

  // Responsáveis / signatários
  gestorContrato: z.string().nullable().optional(),
  fiscalContrato: z.string().nullable().optional(),
  fiscalTipo: z.string().nullable().optional(),
  responsavel: z.string().nullable().optional(),
  signatarios: z.array(signatarioSchema),

  dataEmissao: z.string().nullable().optional(),

  // Pagamento
  pagamentoVencimento: z.string().nullable().optional(),
  pagamentoPago: z.boolean().optional(),

  itens: z.array(itemOSSchema).min(1, 'Adicione ao menos um item.'),
})

export type OSForm = z.infer<typeof osSchema>

/**
 * Uma O.S. já persistida sempre volta da API com `id` e `status` — só o
 * formulário de criação (antes do primeiro POST) não os tem. Telas que só
 * leem O.S. já existentes (lista, detalhe, modais de ação) usam este tipo
 * em vez de forçar `!`/type assertion em `id` espalhado pelos componentes.
 */
export type OSPersistida = OSForm & { id: number; status: StatusOS }

/**
 * `EMPTY_OS` fora do componente (preferência global do projeto) — reset
 * limpo do formulário, e o mesmo valor serve de `defaultValues` para criar
 * e editar (ver useForm em FormularioOS).
 */
export const EMPTY_OS: OSForm = {
  numeroOS: null,
  modulo: 'coffee',
  grupo: null,
  contrato: '',
  dataAssinatura: null,
  prazoVigencia: null,
  detentora: '',
  detentoraId: null,
  cnpj: '',
  servico: '',
  evento: '',
  data: '',
  horario: '',
  local: '',
  justificativa: '',
  observacoes: '',
  trajetoOrigem: null,
  trajetoDestino: null,
  trajetoKm: null,
  trajetoTipo: null,
  qtdPessoasAtendidas: null,
  setorSolicitante: null,
  dataPedido: null,
  dataEntrega: null,
  gestorContrato: '',
  fiscalContrato: '',
  fiscalTipo: 'Fiscal do Contrato',
  responsavel: '',
  // Default de inicializarSignatarios() em emitir-os.js:1259 — 2 linhas
  // (Gestor + Fiscal), sempre presentes; SignatariosFields não permite
  // remover abaixo desse mínimo.
  signatarios: [
    { cargo: 'Gestor do Contrato', nome: '' },
    { cargo: 'Fiscal do Contrato', nome: '' },
  ],
  dataEmissao: null,
  pagamentoVencimento: null,
  pagamentoPago: false,
  itens: [],
}
