# PokerSync

Plataforma SaaS de treino de poker baseada em GTO.

## Stack
- **Front-end:** React 18 + Vite, componentes modulares, estilo Dark Mode premium.
- **Back-end (API):** funções serverless com Supabase Auth (validação de token) + RLS no Postgres.
- **Testes:** Vitest cobrindo o motor de sizing GTO.

## Estrutura
```
src/
  App.jsx                     # roteamento Login <-> Dashboard
  main.jsx                    # entrypoint React
  components/                 # Login, Dashboard, ModuleCard, Track, Field, Logo, TableSkeleton
  services/                   # supabaseClient, authService (token -> header), drillLoader (retry/fallback)
  engine/                     # matchUserActionToGtoNode + testes
  styles/                     # index.css, skeleton.css
api/
  _middleware/requireAuth.js  # valida token, injeta user_id (nunca do body)
  _db/index.js                # camada de dados (stub)
  drills/results.js           # POST salva / GET lê resultados por usuário
  rls.sql                     # policy de isolamento por usuário
```

## Setup
```bash
cp .env.example .env   # preencha as chaves Supabase
npm install
npm run dev            # app
npm test               # suíte GTO
```

## Segurança
- O `user_id` vem **sempre** do token de sessão no back-end; qualquer valor enviado pelo front é ignorado.
- RLS (`auth.uid() = user_id`) garante isolamento no banco.

## Status
Autenticação, resiliência de UI (skeleton + retry) e testes do motor: prontos.
Pendências: ligar a UI aos endpoints reais e testes E2E do fluxo login → treino.

## Módulo: Gestão de Banca (Bankroll)
UI em `src/components/bankroll/` (estilo inline via `theme.js`, sem Tailwind; gráfico em SVG puro, sem dependência nova). Lógica pura e testável em `src/bankroll/`.

- `calc.js` — investido = buy-in×(1+reentradas); net = cashout−investido; ROI, ITM, avg buy-in; série acumulada; `groupStats` por dimensão.
- `brm.js` — buy-ins mínimos por formato/perfil (Agressivo/Padrão/Conservador) e `suggestLimits`.
- `coach.js` — regras determinísticas: drawdown em buy-ins, melhor/pior formato por ROI (com amostra mínima), saúde da banca e momentum.
- `leaks.js` — cruza formato/dia/horário e aponta ROI negativo.
- Persistência local resiliente em `storage.js`; dados de exemplo em `sampleData.js`.
- Acesso: card **Gestão de Banca** no Dashboard abre o módulo.

Testes: `src/bankroll/__tests__/` (calc + coach) rodam com `npm test`.
