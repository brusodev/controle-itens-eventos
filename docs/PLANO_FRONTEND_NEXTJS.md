# Plano de Migração do Frontend para Next.js + React

> **Status:** proposta / planejamento. Nada deste documento foi implementado.
> Objetivo: substituir o frontend atual (HTML + ~7.800 linhas de JS vanilla)
> por um frontend Next.js/React, **mantendo o backend Flask como API REST**.
> O backend praticamente não muda — só precisa de pequenos ajustes de CORS/CSRF.

---

## 1. Por que migrar (a relação com os bugs atuais)

Os bugs recorrentes da edição de O.S. **não são aleatórios** — são sintomas de
três fraquezas estruturais do frontend atual, todas resolvidas por construção
no React:

| Problema atual | Causa raiz | Como o React resolve |
|---|---|---|
| "Campo X não salva na edição" (itens zerados, observações, data) | Payload de salvamento **duplicado** em `emitir-os.js` e `ordens-servico.js`; ao adicionar campo, esquecem de um | **Fonte única**: um único objeto de estado tipado e uma única função de submit para criar e editar |
| Data do evento vira `2026-05-07` ao editar | Reidratação manual campo-a-campo via `getElementById().value =` + conversões ad-hoc | Estado controlado: o valor vive em um só lugar, sem reidratação manual |
| Aviso "alterações não salvas" indevido | `beforeunload` global com flag manual dessincronizada do submit | `react-hook-form` expõe `isDirty`/`isSubmitting` corretos automaticamente |
| Estado perdido ao navegar | Edição salva `osEditandoId` no `localStorage` e troca de página | Roteamento SPA mantém estado em memória; sem localStorage como ponte |
| Bugs só aparecem em produção | Sem tipos, sem testes do caminho real | TypeScript pega erros em build; React Testing Library testa componentes |

**Resumo:** a classe inteira de bugs "editei e não salvou" deixa de existir
porque não há mais dois caminhos de código para manter em sincronia.

---

## 2. Princípio central: backend permanece, frontend é reescrito

O backend Flask **já é uma API REST** organizada por domínio. Isso é a maior
vantagem desta migração: não há reescrita de regra de negócio, estoque,
geração de PDF, auditoria ou controle de status. Só a camada de apresentação muda.

```
┌─────────────────────┐        HTTP/JSON         ┌──────────────────────┐
│  Next.js (novo)     │  ───────────────────────▶ │  Flask API (mantido) │
│  React + TS         │  ◀─────────────────────── │  /api/* (sem mudança)│
│  porta 3000         │     cookie de sessão      │  porta 5100          │
└─────────────────────┘                           └──────────────────────┘
```

### O que o backend já oferece (reaproveitado 100%)
- `POST /auth/login`, `/auth/logout`, `GET /auth/csrf-token`, `POST /auth/registro`
- `/api/itens`, `/api/categorias`, `/api/alimentacao`
- `/api/ordens-servico` (CRUD + `/pdf`, `/png`, `/enviar-empresa`, `/reordenar`)
- `/api/detentoras`, `/api/auditoria`
- `/api/empresa/*` (portal da detentora — feature flag)

### Domínios de negócio (5 módulos)
`coffee` · `transporte` · `organizacao` · `hospedagem` · `trofeus`
O módulo atual vive hoje em `localStorage.modulo_atual` e vai como `?modulo=` em
quase toda request. No React vira contexto/estado global tipado.

### Perfis de usuário
`admin` · `comum` · `empresa` (este último é o portal da detentora, isolado).

---

## 3. Stack proposta

| Camada | Tecnologia | Por quê |
|---|---|---|
| Framework | **Next.js 14+ (App Router)** | SSR/CSR híbrido, roteamento por arquivos, maduro |
| Linguagem | **TypeScript** | Pega na compilação os bugs de campo/tipo que hoje só aparecem em runtime |
| Estado de servidor | **TanStack Query (React Query)** | Cache, refetch, `Promise.all` automático, loading/error states — substitui o `api-client.js` manual |
| Formulários | **react-hook-form** + **Zod** | Estado de form único, validação tipada, `isDirty`/`isSubmitting` corretos (mata o bug do `beforeunload`) |
| HTTP | **fetch** com wrapper tipado | Mantém o cookie de sessão (`credentials: 'include'`) e injeta CSRF |
| Estilo | **Tailwind CSS** (ou CSS Modules) | Migração incremental do CSS atual |
| Testes | **Vitest** + **React Testing Library** + **Playwright** (e2e) | Testar o caminho real de edição que hoje não tem cobertura |

> Alinhado às preferências do projeto: `EMPTY_FORM` fora do componente, modal
> com estado único `{ mode: 'new' | 'edit', data? }`, fetches paralelos,
> API separada por domínio, loading/error em toda operação assíncrona.

---

## 4. Autenticação — o ponto que exige atenção

Hoje o login cria uma **sessão Flask em cookie httponly** + um **CSRF token por
sessão** (`session['csrf_token']`), exposto via `GET /auth/csrf-token` e enviado
de volta no header `X-CSRF-Token` nas rotas mutantes.

### Estratégia recomendada: manter a sessão por cookie
Não trocar para JWT — a sessão por cookie já funciona, é segura (httponly) e
evita reescrever o backend de auth. No Next.js:

1. **Toda request** usa `fetch(url, { credentials: 'include' })` para enviar o cookie.
2. Após login, buscar o CSRF token (`GET /auth/csrf-token`) e guardá-lo em memória
   (contexto), reenviando como `X-CSRF-Token` em POST/PUT/DELETE.
3. **CORS:** o Flask já tem `CORS(app, supports_credentials=True)`. Precisa apenas
   incluir `http://localhost:3000` (dev) e o domínio de produção do Next em
   `CORS_ORIGIN` (.env). **Esta é a única mudança real necessária no backend.**
4. **Cookie cross-site em produção:** se o Next e o Flask ficarem em domínios
   diferentes, `SESSION_COOKIE_SAMESITE` precisa ir para `'None'` + `Secure`.
   **Recomendado evitar isso** servindo ambos sob o mesmo domínio (ver §7).

### Proteção de rotas
- Middleware do Next (`middleware.ts`) checa a presença/validade da sessão antes
  de renderizar páginas protegidas; redireciona para `/login` se 401.
- Guards por perfil: `admin` vs `comum` vs `empresa` (o portal `/empresa/*` é
  totalmente separado das telas internas).

---

## 5. Mapa de telas (paridade com o sistema atual)

Cada rota de view atual vira uma rota do App Router. Telas internas e portal
são **áreas separadas** com layouts distintos.

### Área interna (admin/comum)
| Rota atual (Flask view) | Rota Next | Componente principal |
|---|---|---|
| `/` (index, abas) | `/` | Dashboard + navegação por módulo |
| `/dashboard` | `/dashboard` | Indicadores |
| `/alimentacao` /  `/estoque` | `/estoque` | Tabela de estoque por região |
| `/categorias` | `/categorias` | CRUD categorias |
| `/emitir-os` | `/os/nova` | **Formulário de O.S. (criar)** |
| `/ordens-servico` | `/os` | Lista de O.S. + ações |
| (edição via localStorage) | `/os/[id]/editar` | **Formulário de O.S. (editar)** — mesmo componente de `/os/nova` |
| `/relatorios` | `/relatorios` | Relatórios |
| `/detentoras` | `/detentoras` | CRUD detentoras |
| `/gerenciar-usuarios` | `/usuarios` | CRUD usuários (admin) |
| `/gerenciar-conta`, `/alterar-senha` | `/conta` | Conta/senha |
| `/importar-os` | `/os/importar` | Importação |
| (auditoria) | `/auditoria` | Log de auditoria |

### Portal da detentora (perfil empresa)
| Rota atual | Rota Next | Componente |
|---|---|---|
| `/empresa` | `/portal` | Inbox de O.S. da detentora |
| `/empresa/ordens/<id>` | `/portal/os/[id]` | Detalhe + aceite/revisão/comentário |

> **Observação:** o sistema de assinatura (canvas) foi removido da UI; o portal
> não precisa replicar o canvas. O backend ainda aceita aceite, mas sem o botão.

---

## 6. A peça que mata os bugs: o formulário de O.S. unificado

Hoje existem **dois** caminhos de salvamento (`emitir-os.js` e `ordens-servico.js`)
com payloads que divergem. No React, **um único componente** serve criar e editar.

### Esqueleto proposto (conceito, não código final)

```tsx
// schema Zod — fonte única da forma do payload (valida E tipa)
const osSchema = z.object({
  contrato: z.string(),
  detentora: z.string(),
  cnpj: z.string(),
  servico: z.string(),
  grupo: z.string(),
  evento: z.string().min(1),
  data: z.string(),            // texto livre: "07/05/2026" ou "26 à 30/05/2026"
  horario: z.string(),
  local: z.string(),
  justificativa: z.string(),
  observacoes: z.string(),     // <- nunca mais "some" porque está no schema
  qtdPessoasAtendidas: z.number().nullable(),
  dataEmissao: z.string(),
  signatarios: z.array(signatarioSchema),
  itens: z.array(itemSchema),  // diarias, qtdSolicitada, qtdTotal, valorUnit...
})
type OSForm = z.infer<typeof osSchema>

const EMPTY_OS: OSForm = { /* fora do componente, reset limpo */ }

function FormularioOS({ osId }: { osId?: number }) {
  // edição: carrega a O.S.; criação: usa EMPTY_OS
  const { data, isLoading } = useQuery({
    queryKey: ['os', osId],
    queryFn: () => osAPI.obter(osId!),
    enabled: !!osId,
  })

  const form = useForm<OSForm>({
    resolver: zodResolver(osSchema),
    defaultValues: data ?? EMPTY_OS,
  })

  const salvar = useMutation({
    mutationFn: (payload: OSForm) =>
      osId ? osAPI.atualizar(osId, payload) : osAPI.criar(payload),
    // mesmo payload para criar e editar — impossível divergir
  })

  // form.formState.isDirty -> aviso de "não salvo" correto, sem flag manual
}
```

### Garantias que isso dá (e que hoje faltam)
- **Impossível** um campo "sumir" no salvamento: se está no schema, vai no payload.
- Criar e editar usam **o mesmo** payload — fim da classe de bug "edição perde dados".
- Data do evento é `string` livre — sem conversão ISO indevida.
- `isDirty` controla o `beforeunload` corretamente.
- TypeScript recusa em build qualquer campo com nome/tipo errado.

---

## 7. Estratégia de implementação (incremental, sem big bang)

A migração **não precisa ser tudo de uma vez**. Ordem sugerida, por risco/retorno:

### Fase 0 — Fundação (sem tocar no sistema atual)
- Criar projeto Next.js em `frontend/` (novo diretório, isolado do `backend/`).
- Configurar TypeScript, Tailwind, TanStack Query, react-hook-form, Zod.
- Implementar o **wrapper de API** (fetch + cookie + CSRF) e o tipo `Usuario`,
  `OrdemServico`, `Item`, etc. (espelhando os `to_dict()` do backend).
- Configurar CORS no Flask para aceitar `localhost:3000`.
- **Risco zero:** o sistema atual continua rodando intacto.

### Fase 1 — Vertical slice: O.S. (a área dos bugs)
- Implementar `/os` (lista), `/os/nova`, `/os/[id]/editar` com o formulário unificado.
- Validar contra a API real. Escrever testes do caminho de edição.
- **Maior retorno:** resolve os bugs que motivaram esta migração.

### Fase 2 — Demais telas internas
- Estoque, categorias, detentoras, usuários, relatórios, auditoria, conta.

### Fase 3 — Portal da detentora
- Inbox e detalhe (`/portal`, `/portal/os/[id]`).

### Fase 4 — Corte e deploy
- Servir o Next como frontend principal.
- **Deploy recomendado (evita dor de cookie cross-site):** Next e Flask sob o
  **mesmo domínio** via reverse proxy (Nginx/Caddy): `/` → Next, `/api` e `/auth`
  → Flask. Assim o cookie de sessão continua same-site e nada de CORS complexo.
- Aposentar os templates HTML e o JS vanilla.

> **Coexistência:** durante a migração, dá para rodar Next (3000) e Flask (5100)
> lado a lado. Telas ainda não migradas continuam servidas pelo Flask.

---

## 8. Código limpo (clean code) — regras concretas

Objetivo: que qualquer tela nova nasça pequena, legível e difícil de quebrar.
Não são slogans — são regras que dá para revisar em PR.

### 8.1 Estrutura de pastas (separação por domínio, não por tipo)

```text
frontend/
  app/                      # rotas (App Router)
    (interno)/os/...        # área interna agrupada
    (portal)/portal/...     # portal da detentora agrupado
  features/                 # 1 pasta por domínio de negócio
    ordens-servico/
      api.ts                # chamadas da API deste domínio (osAPI)
      schema.ts             # Zod + tipos derivados
      hooks.ts              # useOrdensServico, useSalvarOS...
      components/           # FormularioOS, ListaOS, ItensTable...
    estoque/ ...
    detentoras/ ...
  lib/                      # wrapper de fetch, csrf, helpers genéricos
  components/ui/            # componentes burros reutilizáveis (Button, Modal, Field)
```
**Regra:** lógica de um domínio mora em `features/<dominio>/`. Nada de
"utils.js gigante" (hoje há `globals.js`, `utils.js`, `app_edit_fix.js` com
responsabilidades misturadas).

### 8.2 Componentes pequenos e com uma responsabilidade
- Um componente que passa de ~150 linhas é candidato a ser quebrado.
- Componentes de **apresentação** (burros, recebem props) separados dos de
  **container** (buscam dados, orquestram). O `FormularioOS` orquestra;
  `ItensTable`, `SignatariosFields`, `DadosContratoFields` são apresentacionais.
- Sem lógica de fetch dentro de componente de UI — isso vive em hooks (`features/.../hooks.ts`).

### 8.3 Tipagem como contrato (TypeScript estrito)
- `tsconfig` com `strict: true`. Sem `any` (usar `unknown` + narrowing).
- Tipos derivados do **schema Zod** (`z.infer`), nunca duplicados à mão —
  uma fonte só para validação E tipo.
- Os tipos de resposta da API espelham os `to_dict()` do backend, em um lugar só.

### 8.4 Sem as anti-práticas que causaram os bugs atuais
Alinhado às preferências globais do projeto e ao que vimos quebrar:
- **Proibido** `console.log`/`console.error` esquecido → hook de lint barra no commit.
- **Proibido** `window.confirm`/`alert` → usar `Modal`/`Toast` próprios.
- **Proibido** fallback hardcoded tipo `|| 'http://localhost:8000'` → variável
  de ambiente (`NEXT_PUBLIC_API_URL`).
- **Proibido** fetch sequencial quando pode ser paralelo → React Query resolve
  com queries independentes (paralelas por padrão).
- **Proibido** estado de formulário espalhado em flags soltas → um objeto de
  form (`react-hook-form`), `EMPTY_OS` fora do componente.
- **Proibido** duplicar o payload de criar/editar → uma função de submit só.

### 8.5 Convenções
- Nomes em português no domínio (mantém consistência com o backend:
  `ordemServico`, `detentora`, `qtdTotal`), inglês só em termos técnicos.
- Imports absolutos (`@/features/...`) em vez de `../../../`.
- ESLint + Prettier configurados; CI roda `lint` + `type-check` + `test`.
- Cada `feature` exporta uma API pública mínima (index.ts) — encapsulamento.

---

## 9. Responsividade — mobile-first de verdade

O frontend atual tem limitações sérias no celular (tabelas que estouram a tela,
formulário de O.S. longo e apertado, botões pequenos). O novo nasce **mobile-first**:
escreve-se o layout para a tela pequena primeiro e expande-se para desktop.

### 9.1 Princípios
- **Mobile-first com Tailwind:** estilos base = celular; `md:`/`lg:` adicionam
  o desktop. Nunca o contrário.
- **Touch-friendly:** alvos de toque ≥ 44×44px (hoje os botões de ação da O.S.
  são pequenos demais no celular).
- **Sem scroll horizontal:** nada de tabela larga forçando zoom-out.
- **Tipografia e espaçamento fluidos:** legível sem pinçar a tela.

### 9.2 O caso difícil: a tabela de Itens da Ordem de Serviço

A tabela de itens (`# / Descrição / Categoria / Diárias / Qtd / Total`) é o
ponto que mais quebra no mobile hoje. Padrão proposto:
- **Desktop (`md:`+):** tabela tradicional.
- **Celular:** cada item vira um **card empilhado** (label + valor), com os
  inputs de quantidade/diárias em tamanho de toque adequado. Um componente
  `ItensTable` que renderiza `<table>` ou lista de `<ItemCard>` conforme o breakpoint.

```text
  Desktop                          Mobile (card por item)
  ┌──┬──────────┬─────┬─────┐      ┌────────────────────────┐
  │# │Descrição │Qtd  │Total│      │ Café 100ml             │
  ├──┼──────────┼─────┼─────┤      │ Categoria: Coffee      │
  │1 │Café 100ml│ 10  │ 20  │      │ Diárias:[2] Qtd:[10]   │
  └──┴──────────┴─────┴─────┘      │ Total: 20              │
                                   └────────────────────────┘
```

### 9.3 Navegação e formulário no celular
- **Navegação:** menu lateral (hoje `layout_parts.html`) vira um drawer/hambúrguer
  no mobile e sidebar fixa no desktop.
- **Formulário de O.S.:** campos em coluna única no celular, grid de 2–3 colunas
  no desktop (`grid-cols-1 md:grid-cols-2`). Seções colapsáveis (Contrato,
  Evento, Itens, Signatários) para encurtar o scroll no celular.
- **Ações:** barra de ações fixa (sticky) no rodapé em telas pequenas, para
  "Salvar"/"Visualizar" ficarem sempre alcançáveis sem rolar até o fim.
- **Modais:** viram bottom-sheet (deslizam de baixo) no celular — padrão mobile
  mais natural que um modal centralizado.

### 9.4 O portal da detentora é prioridade mobile
A detentora frequentemente acessa pelo celular para ver/aceitar O.S. O inbox
(`/portal`) deve ser uma lista de cards tocável, e o detalhe
(`/portal/os/[id]`) deve ter as ações (aceitar/revisar/comentar) acessíveis com
o polegar. Testar esses fluxos em viewport de celular antes do corte.

### 9.5 Como garantir (não confiar no olho)
- Breakpoints padronizados via Tailwind (`sm/md/lg/xl`).
- **Testes e2e Playwright em viewport mobile** (ex.: iPhone SE 375px) nos
  fluxos críticos: emitir O.S., editar O.S., aceitar no portal.
- Checagem de acessibilidade básica (foco, contraste, labels) — ajuda mobile e a11y juntos.

---

## 10. Mudanças necessárias no backend (mínimas)

1. **CORS** (`app.py`): incluir a origem do Next em `CORS_ORIGIN`. Já há suporte
   a múltiplas origens separadas por vírgula.
2. **Em produção same-domain (recomendado):** nenhuma mudança de cookie.
   **Se cross-domain:** `SESSION_COOKIE_SAMESITE='None'` + `Secure=True`.
3. **(Opcional) Remover os `render_template`** das views que viram páginas React,
   mantendo só os endpoints `/api/*`. Pode ser feito por último.
4. Nada de estoque, PDF, auditoria, status ou regra de negócio muda.

---

## 11. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Cookie de sessão cross-domain | Servir same-domain via reverse proxy (§7 Fase 4) |
| Geração de PDF/PNG (hoje server-side) | Mantida no Flask; o React só chama o endpoint e baixa o arquivo |
| Paridade de telas incompleta | Migração incremental; Flask serve o que ainda não migrou |
| Curva de TypeScript/React | Começar pelo slice de O.S.; o resto segue o mesmo padrão |
| Regressão durante a migração | Testes e2e (Playwright) cobrindo os fluxos críticos antes do corte |

---

## 12. Esforço estimado (ordem de grandeza, não compromisso)

| Fase | Escopo | Estimativa |
|---|---|---|
| 0 | Fundação + API client + auth | pequena |
| 1 | Slice de O.S. (lista + form unificado + testes) | média |
| 2 | Demais telas internas | média/grande |
| 3 | Portal da detentora | média |
| 4 | Deploy same-domain + corte | pequena/média |

---

## 13. Checklist de "definição de pronto" da migração

- [ ] Login/logout funcionando com cookie de sessão + CSRF
- [ ] Guards de rota por perfil (admin/comum/empresa)
- [ ] Contexto de módulo (coffee/transporte/...) substituindo `localStorage.modulo_atual`
- [ ] Formulário de O.S. **único** para criar e editar
- [ ] Schema Zod cobrindo **todos** os campos (incl. observações, data livre, itens completos)
- [ ] Testes do caminho de edição (campo a campo persiste)
- [ ] Lista de O.S. + ações (visualizar, PDF, PNG, excluir, pagamento, reordenar)
- [ ] Estoque, categorias, detentoras, usuários, relatórios, auditoria
- [ ] Portal da detentora (inbox + detalhe + aceite/revisão/comentário)
- [ ] Deploy same-domain (reverse proxy) sem cookie cross-site
- [ ] Hook de lint barrando `console.log`/`print` (cumpre a regra do projeto)

### Código limpo

- [ ] TypeScript `strict: true`, sem `any`
- [ ] Estrutura por domínio (`features/<dominio>`), sem "utils gigante"
- [ ] Tipos derivados do schema Zod (uma fonte só)
- [ ] Componentes pequenos; apresentação separada de container
- [ ] ESLint + Prettier no CI (`lint` + `type-check` + `test`)

### Responsividade (mobile-first)

- [ ] Layout base mobile, expandido com `md:`/`lg:` (nunca o contrário)
- [ ] Tabela de itens da O.S. vira cards no celular (sem scroll horizontal)
- [ ] Alvos de toque ≥ 44px; navegação em drawer no mobile
- [ ] Barra de ações sticky e modais como bottom-sheet no celular
- [ ] Portal da detentora testado em viewport de celular
- [ ] Testes e2e Playwright em viewport mobile (emitir/editar/aceitar)

---

*Documento de planejamento. Implementar quando houver janela — começar pela
Fase 1 (O.S.) entrega o maior retorno: elimina a família de bugs de edição.*
