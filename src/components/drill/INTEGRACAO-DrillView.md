# Integração no DrillView.jsx

Não estou reescrevendo o `DrillView.jsx` porque ele orquestra `useDrillBatch`,
`useFilters`, `matchUserActionToGtoNode` e os filtros — mexer nisso às cegas
quebra a busca de dados. Abaixo está só o que muda.

## 1. Arquivos

| Arquivo | Ação |
|---|---|
| `src/components/drill/drillTheme.js` | **novo** |
| `src/components/drill/Card.jsx` | substituir |
| `src/components/drill/PokerTable.jsx` | substituir |
| `src/components/drill/ActionBar.jsx` | substituir |
| `src/components/drill/GtoFeedback.jsx` | substituir |
| `src/components/drill/SessionPanel.jsx` | **novo** |
| `src/components/drill/DrillView.jsx` | editar (abaixo) |
| `src/components/theme.js` | intocado |

Se algum componente atual receber props diferentes das documentadas no topo
de cada arquivo, adapte o **mapeamento** no `DrillView`, não o componente —
os contratos novos estão desenhados para o dado que vem de `drills.gto_nodes`.

## 2. Layout: grid de duas colunas

```jsx
<div style={{ display: "grid",
              gridTemplateColumns: "minmax(0,1.55fr) minmax(300px,1fr)",
              gap: 20, alignItems: "start" }}>
  <div>
    <PokerTable hand={hand} onOpenFilters={() => setFiltersOpen(true)} />
    {hand && <ActionBar actions={actions} onAct={handleAct} disabled={!!chosen} />}
  </div>

  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
    <GtoFeedback hand={hand} nodes={nodes} chosen={chosen} />
    <SessionPanel hands={session.hands}
                  evLostSeries={session.evLostSeries}
                  onLine={session.onLine} />
    <NextButton onClick={nextHand} enabled={!!chosen} />
  </div>
</div>
```

O botão "Próxima mão" fica no **pé da coluna direita**, não no header.
Fecha o Z: mesa (esq-baixo) → análise (dir-meio) → avançar (dir-baixo).

## 3. Estado zerado

`hand = null` até o filtro devolver um spot válido. `PokerTable` já trata isso
sozinho — mostra os 8 assentos vazios, board tracejado e o CTA. No `DrillView`
basta não montar `ActionBar` e `GtoFeedback` enquanto `hand` for null.

## 4. Atalhos de teclado

```jsx
useEffect(() => {
  const onKey = (e) => {
    if (e.target.matches("input, textarea, select")) return;
    if (e.code === "Space") { e.preventDefault(); if (chosen) nextHand(); return; }
    const hit = actions.find((a) => a.key === e.key.toUpperCase());
    if (hit && !chosen) handleAct(hit);
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [actions, chosen, handleAct, nextHand]);
```

Mapeamento: `Q` / `W` / `E` para as três ações (na ordem em que aparecem na
ActionBar), `ESPAÇO` para avançar. A guarda do `e.target` evita disparar
atalho enquanto o jogador digita num filtro.

## 5. Campos novos que o DrillView precisa montar

### `hand.spr`
```js
const spr = +(effectiveStack / pot).toFixed(1);
```
Calcular no momento do nó, não no início da mão.

### `hand.history`
Derivar da sequência de ações do spot, agrupada por rua. A rua corrente
recebe `current: true`. As posições precisam bater com as chaves de `POS`
(`UTG`, `UTG+1`, `MP`, `HJ`, `CO`, `BTN`, `SB`, `BB`).

### `hand.seats`
Os 8 assentos sempre presentes. Quem não participa da mão fica
`{ status: "empty" }`. Quem tem ação real e ainda está na mão recebe
`live`, quem está na vez recebe `acting`.

### `node.ev`
EV loss em bb relativo à melhor ação — ou seja, a ação ótima é sempre
`0`. Se o `gto_nodes` guardar EV absoluto, converta:

```js
const best = Math.max(...raw.map(n => n.ev));
const nodes = raw.map(n => ({ ...n, ev: +(n.ev - best).toFixed(2) }));
```

**Atenção ao mesmo bug do sizing:** se o EV vier na mesma escala do
`BET 3600.000000`, ele precisa da divisão por 100 antes de virar bb,
igual ao que foi corrigido no `matchUserActionToGtoNode.js`.

### `session.onLine`
Contar como "na linha do solver" toda ação cuja frequência GTO seja
**acima de ~10%**, não apenas a de maior frequência. Se contar só a
majoritária, você recria o placar binário que estamos removendo — uma
jogada mista de 31% é jogada legítima, não erro.

## 6. Ponto ainda em aberto

A régua de calibragem do `SessionPanel` (elite ≤ 0.10 bb/mão,
sólido ≤ 0.30) é estimativa, não vem de dado. Com os 2500 spots dá para
rodar a distribuição real de EV loss e ancorar os limiares nos percentis
do próprio produto.
