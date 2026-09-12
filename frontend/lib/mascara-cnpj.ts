/**
 * Máscara progressiva de CNPJ (00.000.000/0000-00) — porta fiel de
 * mascaraCNPJ() em gerenciar-detentoras.html:113-125. Sem validação de
 * dígito verificador (preservado como no legado — ver plano § Domínio 2).
 */
export function mascararCnpj(valor: string): string {
  let digitos = valor.replace(/\D/g, '')
  if (digitos.length > 14) digitos = digitos.slice(0, 14)

  digitos = digitos.replace(/^(\d{2})(\d)/, '$1.$2')
  digitos = digitos.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
  digitos = digitos.replace(/\.(\d{3})(\d)/, '.$1/$2')
  digitos = digitos.replace(/(\d{4})(\d)/, '$1-$2')
  return digitos
}
