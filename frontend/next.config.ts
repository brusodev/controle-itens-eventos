import type { NextConfig } from 'next'

// O proxy abaixo faz o Next servir /api/* e /auth/* como se fossem dele
// mesmo, encaminhando ao Flask de servidor para servidor. Vale em DEV e em
// PRODUÇÃO, pelo mesmo motivo nos dois casos: o navegador só enxerga a
// origem do próprio front, então
//   - o cookie de sessão (HttpOnly, SameSite=Lax) é gravado no domínio do
//     front e reenviado normalmente, sem precisar de SESSION_COOKIE_DOMAIN;
//   - CORS não entra em jogo (não há requisição cross-origin no browser);
//   - `SameSite=Lax` continua valendo como defesa contra CSRF — não é
//     preciso afrouxar para SameSite=None, que exporia as rotas de mutação
//     que ainda não validam o token CSRF no servidor.
// Consequência prática: o Flask em produção NÃO precisa de nenhuma mudança
// de configuração para o front novo funcionar.
//
// A variável é obrigatória e sem fallback: um endereço de backend adivinhado
// silenciosamente é pior do que um build que falha — sem ela, todo /api/* e
// /auth/* viraria 404 do próprio Next, e o site só quebraria no primeiro
// login, já em produção.
async function rewrites() {
  const backendUrl = process.env.BACKEND_URL
  if (!backendUrl) {
    throw new Error(
      'BACKEND_URL não definida.\n' +
        '  - Local: copie frontend/.env.example para .env.local e ajuste.\n' +
        '  - Vercel: defina BACKEND_URL nas Environment Variables do projeto\n' +
        '    (ex.: https://coex.projtdev.site) para todos os ambientes.',
    )
  }
  return {
    // beforeFiles: sempre tem prioridade sobre as próprias páginas do Next —
    // usado só para /api e /auth, que são sempre do Flask, nunca do Next.
    //
    // Regras com barra final EXPLÍCITA primeiro — sem elas, `:path*` sozinho
    // normaliza a barra final embutida no path antes do destino ser montado,
    // e várias rotas do Flask (O.S., itens, categorias, detentoras...) só
    // existem com a barra (@blueprint.route('/')); sem ela, o Werkzeug
    // devolve 308 e o rewrite vira um redirect cross-origin quebrado.
    beforeFiles: [
      { source: '/api/:path*/', destination: `${backendUrl}/api/:path*/` },
      { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
      { source: '/auth/:path*/', destination: `${backendUrl}/auth/:path*/` },
      { source: '/auth/:path*', destination: `${backendUrl}/auth/:path*` },
    ],
    // fallback: só entra em ação quando o Next tenta suas próprias rotas
    // (app/**) e nenhuma casa. Cobre as telas Flask que a migração ainda
    // não alcançou (/dashboard, /gerenciar-usuarios, /empresa, /auditoria,
    // ...) sem precisar listar cada uma — sem isso, links para elas (ex.:
    // o redirect pós-login) caem em 404 do próprio Next em vez de chegar
    // ao Flask.
    fallback: [{ source: '/:path*', destination: `${backendUrl}/:path*` }],
  }
}

const nextConfig: NextConfig = {
  rewrites,
  // Flask distingue `/api/ordens-servico` (sem rota) de
  // `/api/ordens-servico/` (a rota real de listar/criar) — várias rotas do
  // backend (O.S., itens, categorias, detentoras...) só existem com a barra
  // final. Sem esta flag, o próprio Next intercepta `/api/.../` ANTES do
  // rewrite acima e devolve 308 removendo a barra, quebrando essas rotas.
  // Com a flag, o rewrite decide, e a barra final chega intacta ao Flask.
  skipTrailingSlashRedirect: true,
  // O projeto não usa CLAUDE.md/AGENTS.md (confirmado no levantamento do
  // plano) — desliga a geração automática que o `next dev` do Next 16 faz
  // por padrão, para não recriar esses arquivos a cada boot.
  agentRules: false,
}

export default nextConfig
