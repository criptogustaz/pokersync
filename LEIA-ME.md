# PokerSync — Atualização 30/07/2026

Pacote de arquivos atualizados durante a sessão. Este arquivo explica o que copiar, o que patchar e o que verificar antes de subir.

---

## 1. Arquivos NOVOS (copie diretamente para o repositório)

Estes arquivos não existiam antes. Coloque-os nos caminhos indicados.

- `src/services/profileService.js`
- `src/services/bankrollService.js`
- `src/services/notificationService.js`
- `src/services/xpService.js`
- `src/components/Avatar.jsx`
- `src/components/ProfileMenu.jsx`
- `src/components/NotificationsMenu.jsx`
- `src/components/HelpMenu.jsx`
- `src/components/HeroPanel.jsx`
- `src/components/VerifyEmail.jsx`
- `src/components/ConfirmedView.jsx`
- `src/components/hub/HubView.jsx`
- `supabase/functions/assign-daily-missions/index.ts`

---

## 2. Arquivos ATUALIZADOS (substitua os existentes)

Estes já existiam no projeto. Substitua o conteúdo pelos arquivos deste pacote.

- `src/services/authService.js` — signUp agora envia `{ nome, apelido }` em PT
- `src/App.jsx` — roteamento com detecção de sessão
- `src/components/Login.jsx` — formulário completo (Nome + Apelido + Email + Senha)
- `src/components/Dashboard.jsx` — header novo + módulos ajustados + roteamento
- `src/components/bankroll/BankrollView.jsx` — usa serviço Supabase (sem localStorage)

---

## 3. Arquivos que precisam de PATCH MANUAL

### 3a) `src/components/drill/DrillView.jsx`

Não incluído no pacote (arquivo grande e específico ao seu projeto). Aplique estes ajustes:

**Trocar o import**:
```js
// ANTES:
import { saveDrillResult } from "../../services/drillResultService.js";

// DEPOIS:
import { registerTraining } from "../../services/xpService.js";
```

**Trocar a chamada dentro de `onFeedbackResult`**:
```js
// ANTES:
saveDrillResult({ ... })
  .catch((e) => console.error(...));

// DEPOIS:
registerTraining({
  spotId: hand?.spotId,
  verdict: result.verdict,
  evLoss: result.evLoss,
  userAction: userAction?.action,
  userSizing: userAction?.sizing,
})
  .then((r) => {
    if (r?.level_up) {
      console.log(`🎉 Level up! Novo nível: ${r.new_level}`);
    }
  })
  .catch((e) => console.error("Falha ao registrar treino:", e));
```

### 3b) `src/components/ModuleCard.jsx`

Adicionar suporte à prop `comingSoon` (usada nos cards "Revisão de Mãos" e "Construtor de Range" no Dashboard).

Na assinatura do componente:
```jsx
export default function ModuleCard({ title, desc, icon: Icon, tint, edge, onClick, comingSoon }) {
  const disabled = !!comingSoon;
  // ...
}
```

No JSX raiz, dentro do botão:
```jsx
<button
  onClick={disabled ? undefined : onClick}
  disabled={disabled}
  style={{
    // ... styles existentes ...
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.65 : 1,
    position: "relative",
  }}
>
  {/* conteúdo existente */}

  {disabled && (
    <span style={{
      position: "absolute",
      top: 12, right: 12,
      fontSize: 10, fontWeight: 700,
      letterSpacing: ".06em", textTransform: "uppercase",
      padding: "4px 8px", borderRadius: 6,
      background: "rgba(201,162,39,0.15)",
      color: "#C9A227",
      border: "1px solid rgba(201,162,39,0.3)",
    }}>
      Em breve
    </span>
  )}
</button>
```

---

## 4. Arquivos removidos (opcional)

Estes arquivos ficaram órfãos após a migração:

- `src/bankroll/storage.js` — não é mais usado (era o localStorage antigo)
- `src/services/drillResultService.js` — substituído pelo `xpService.registerTraining`

Não é urgente remover, mas mantê-los pode confundir depois.

---

## 5. Supabase (SQL já rodado nesta sessão)

Tudo o que foi executado no SQL Editor. Você não precisa rodar de novo (já está aplicado), mas fica de referência caso precise recriar em outro ambiente:

- Tabelas: `profiles.avatar_id`, `bankroll_sessions`, `bankroll_settings`, `notifications`, `user_progress`, `missions`, `user_missions`, `training_sessions`, `xp_events`
- RLS em todas as tabelas com `auth.uid() = user_id` (ou `= id` para `profiles`)
- Funções: `xp_for_next_level`, `handle_new_user_progress`, `handle_welcome_notification`, `award_xp`, `register_training`, `update_streak_on_event`, `update_mission_progress`, `on_training_session_insert`, `on_bankroll_session_insert`, `on_streak_incremented`
- Triggers em `auth.users`, `xp_events`, `training_sessions`, `bankroll_sessions`, `user_progress`
- Extensões: `pg_cron`, `pg_net`
- Cron: `daily-missions-assignment` (`0 0 * * *`)
- Edge Function: `assign-daily-missions` publicada

---

## 6. Checklist antes de dar `git push`

- [ ] Rodar `npm run dev` local para conferir se compila sem erros.
- [ ] Se der erro de import em algum arquivo, conferir o caminho relativo (especialmente em `HeroPanel.jsx` que importa `../bankroll/calc.js`).
- [ ] Testar login com uma conta existente.
- [ ] Testar cadastro criando conta nova (com Nome + Apelido).
- [ ] Confirmar que o avatar aparece no header e o menu abre.
- [ ] Abrir sino: deve mostrar "Bem-vindo ao PokerSync!" na conta nova.
- [ ] Abrir Hub: nível 1, XP 0, 6 missões (preview ou reais, dependendo se o cron rodou).
- [ ] Fazer um drill: XP deve ser creditado.
- [ ] Registrar sessão de banca: XP deve ser creditado.

---

**Sessão em:** 30/07/2026
**Status:** Pronto para deploy
