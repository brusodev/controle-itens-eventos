/**
 * Tradução de chaves técnicas para rótulos legíveis — porta fiel de
 * formatarChave() em auditoria.html:823-880.
 *
 * O dicionário original tinha 'preco' duas vezes (linhas 830 e 878, mesmo
 * valor); em JS a segunda vencia em silêncio. Aqui aparece uma vez só —
 * duplicar seria erro de compilação, o que é justamente a vantagem.
 */
const TRADUCOES: Record<string, string> = {
  id: 'ID',
  nome: 'Nome',
  email: 'Email',
  perfil: 'Perfil',
  ativo: 'Ativo',
  empresa: 'Empresa',
  grupo: 'Grupo',
  descricao: 'Descrição',
  quantidade: 'Quantidade',
  preco: 'Preço',
  unidade: 'Unidade',
  regiao: 'Região',
  numero_os: 'Nº O.S.',
  numeroOS: 'Nº O.S.',
  evento: 'Evento',
  data: 'Data',
  horario: 'Horário',
  local: 'Local',
  justificativa: 'Justificativa',
  observacoes: 'Observações',
  data_evento: 'Data do Evento',
  responsavel: 'Responsável',
  criado_em: 'Criado em',
  atualizado_em: 'Atualizado em',
  contratoNum: 'Nº Contrato',
  contrato: 'Contrato',
  dataAssinatura: 'Data Assinatura',
  prazoVigencia: 'Prazo Vigência',
  detentora: 'Detentora',
  cnpj: 'CNPJ',
  servico: 'Serviço',
  gestorContrato: 'Gestor',
  fiscalContrato: 'Fiscal',
  fiscalTipo: 'Tipo Fiscal',
  regiaoEstoque: 'Região Estoque',
  dataEmissao: 'Data Emissão',
  dataEmissaoCompleta: 'Data/Hora Emissão',
  itens: 'Itens da O.S.',
  criadoEm: 'Criado em',
  atualizadoEm: 'Atualizado em',
  qtdSolicitada: 'Qtd. Solicitada',
  qtdTotal: 'Qtd. Total',
  diarias: 'Diárias',
  categoria: 'Categoria',
  categoria_id: 'ID Categoria',
  itemId: 'ID Item',
  item: 'Código Item',
  itemCodigo: 'Código',
  itemBec: 'BEC',
  natureza: 'Natureza (BEC)',
  regioes: 'Estoques por Região',
  inicial: 'Quantidade Inicial',
  gasto: 'Quantidade Gasta',
}

/** Chave desconhecida vira "snake_case" → "Snake Case", como no legado. */
export function formatarChave(chave: string): string {
  return TRADUCOES[chave] ?? chave.replace(/_/g, ' ').replace(/\b\w/g, (letra) => letra.toUpperCase())
}
