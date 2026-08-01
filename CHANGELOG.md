# PokerSync — Changelog

## 2026-07-31

### Módulo Revisor de Mãos (backend + front)
- Estrutura Supabase completa: tabelas `hand_reviews`, `hand_review_tags`, `hand_review_images`, `hand_review_tag_links`, `hand_review_answers`, RLS e Storage bucket privado.
- Suporte a agente desktop e importação de salas: `source`, `poker_room`, `external_hand_id`, `structured_data`, `hand_sync_devices`, `hand_sync_batches`.
- Auto-avaliação por street (Camada 1): `hand_review_street_evals` + catálogo `hand_eval_reasons` (17 motivos).
- Detecção de leaks (Camada 2): RPCs `detect_user_leaks` e `user_review_summary`.
- Mapa motivo → drill (Camada 3): `hand_review_drill_suggestions` + RPCs `suggest_drills_for_leak` e `suggest_drills_for_user`.
- Painel admin de drills travado por email do dono (`gsimonetto1@gmail.com`).
- Gamificação: 4 missões diárias (`register`, `complete`, `self_eval`, `questions`) + RPC `register_review_event` integrada com `award_xp`.
- Componentes React: `RevisorFila`, `RevisorNovaMao`, `RevisorDetalhe`, `LeaksCard`, `AdminDrillsPanel`.
- Card "Construtor de Hands" substituído por "Revisor de Mãos" no Dashboard (accent roxo `#A855F7`).

### Backlog
- Adicionadas ideias inspiradas em ICMIZER, HRC, DTO, GTO Wizard, Hand2Note e Upswing.

## 2026-07-30

### Documentação inicial
- Criada visão oficial do produto.
- Definido slogan: **PokerSync — Organize. Estude. Evolua.**
- Registrados princípios do produto.
- Organizado roadmap por módulos.
- Registradas decisões de produto.
- Criado backlog inicial.
- Definida visão futura de Player Evolution e Plataforma para Times.
- Definida captura manual de mãos como alternativa ao agente desktop.
- Definido Review de Mãos sem dependência de solver na V1.
