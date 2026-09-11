/**
 * Primeiro dia do mes corrente e hoje, em ISO (YYYY-MM-DD) - espelha
 * _periodo_mes_vigente() (relatorios_routes.py:44), usado para pre-popular
 * os campos de data ao montar a tela. Sem isso, "nenhuma data preenchida"
 * dispararia uma consulta sem filtro nenhum na primeira renderizacao.
 */
export function periodoMesVigente(): { inicio: string; fim: string } {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const dia = String(hoje.getDate()).padStart(2, '0')
  return { inicio: `${ano}-${mes}-01`, fim: `${ano}-${mes}-${dia}` }
}
