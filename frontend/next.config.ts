import type { NextConfig } from 'next'

// Em desenvolvimento, o Flask roda local e o cookie de sessão (SameSite=Lax)
// exige same-origin: o proxy abaixo faz o Next servir /api/* e /auth/* como
// se fossem dele mesmo, sem precisar mexer em CORS/cookie do Flask.
//
// Em produção (Vercel) este rewrite não é usado — lá o Flask fica num
// subdomínio próprio e é chamado direto via CORS (ver plano § Deploy).
// Por isso a env var é exigida sem fallback: se faltar, é sinal de que o
// .env.local não foi criado a partir do .env.example, não que devemos
// adivinhar um endereço de servidor.
async function rewrites() {
  const backendUrl = process.env.BACKEND_URL
  if (!backendUrl) {
    if (process.env.NODE_ENV === 'production') return []
    throw new Error(
      'BACKEND_URL não definida. Copie frontend/.env.example para .env.local e ajuste.',
    )
  }
  return [
    // Regras com barra final EXPLÍCITA primeiro — sem elas, `:path*` sozinho
    // normaliza a barra final embutida no path antes do destino ser montado,
    // e várias rotas do Flask (O.S., itens, categorias, detentoras...) só
    // existem com a barra (@blueprint.route('/')); sem ela, o Werkzeug
    // devolve 308 e o rewrite vira um redirect cross-origin quebrado.
    { source: '/api/:path*/', destination: `${backendUrl}/api/:path*/` },
    { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
    { source: '/auth/:path*/', destination: `${backendUrl}/auth/:path*/` },
    { source: '/auth/:path*', destination: `${backendUrl}/auth/:path*` },
  ]
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
