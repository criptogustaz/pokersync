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
