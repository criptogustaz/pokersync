# Instruções para aplicar o Revisor de Mãos

Estes são os únicos ajustes em arquivos **existentes** que você precisa fazer manualmente. Todo o resto está pronto nos arquivos novos entregues.

## 1) `src/App.jsx` — adicionar rotas

```jsx
import RevisorFila from './components/revisor/RevisorFila';
import RevisorNovaMao from './components/revisor/RevisorNovaMao';
import RevisorDetalhe from './components/revisor/RevisorDetalhe';
import AdminDrillsPanel from './components/revisor/AdminDrillsPanel';

// Dentro do <Routes>:
<Route path="/revisor" element={<RevisorFila />} />
<Route path="/revisor/nova" element={<RevisorNovaMao />} />
<Route path="/revisor/:id" element={<RevisorDetalhe />} />
<Route path="/admin/drills" element={<AdminDrillsPanel />} />
```

## 2) `src/components/Dashboard.jsx` — substituir card

No array de cards do Dashboard, localize o objeto do **Construtor de Hands** e substitua por:

```jsx
{
  title: 'Revisor de Mãos',
  description: 'Registre, revise e transforme mãos em aprendizado.',
  icon: BookOpen,
  color: '#A855F7',
  route: '/revisor',
}
```

E ajuste o import do `lucide-react`: adicione `BookOpen` e remova o ícone antigo do Construtor.

## 3) `src/components/training/...` — banner de origem (opcional)

Se o Modo Treino já usa `useSearchParams`, adicione um banner quando vier do Revisor:

```jsx
import { useSearchParams } from 'react-router-dom';
const [params] = useSearchParams();
const fromReview = params.get('from') === 'review' || params.get('from') === 'leak';
const drillTitle = params.get('drill');

{fromReview && drillTitle && (
  <div style={{
    background: 'rgba(168,85,247,0.1)',
    border: '1px solid rgba(168,85,247,0.4)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 13,
    color: '#c4b5fd',
  }}>
    <b>Sugestão vinda do Revisor:</b> {drillTitle}
  </div>
)}
```

---

## Backend (Supabase) — já aplicado ✅

Todas as migrations foram aplicadas via MCP durante a sessão:
- `hand_reviews_module_v1`
- `hand_reviews_agent_ready`
- `hand_review_street_evaluation`
- `hand_review_leak_detection`
- `hand_review_drill_mapping`
- `admin_drills_owner_policies`
- `revisor_daily_missions_and_xp`

Nada mais a rodar no banco.

---

## Ajustes de path que podem ser necessários

Nos arquivos entregues, o `handReviewService.js` importa de `'../lib/supabaseClient'`. Se seu client estiver em outro caminho (ex.: `'../services/supabase'`), ajuste o import.

Se `getCurrentUser()` não existir em `authService.js`, use no lugar:

```js
const { data: { user } } = await supabase.auth.getUser();
```
