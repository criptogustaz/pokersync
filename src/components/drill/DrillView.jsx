import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, AlertTriangle, SkipForward } from "lucide-react";
import { C, font } from "../theme.js";
import PokerTable from "./PokerTable.jsx";
import ActionBar from "./ActionBar.jsx";
import GtoFeedback from "./GtoFeedback.jsx";
import FilterDrawer from "./FilterDrawer.jsx";
import ScenarioBar from "./ScenarioBar.jsx";
import { useDrillBatch } from "../../services/useDrillBatch.js";
import { useFilters } from "../../services/useFilters.js";
import { parseBoard, parseHeroCombo } from "../../utils/parseBoard.js";

// Logo original do PokerSync (recriação em SVG das duas cartas + espada + linhas de velocidade)
function Logo() {
  return (
    <svg width="30" height="30" viewBox="0 0 48 48" fill="none" style={{ flexShrink: 0 }}>
      <rect x="10" y="4" width="24" height="32" rx="3" stroke="#fff" strokeWidth="2.2" transform="rotate(-12 22 20)" />
      <rect x="14" y="8" width="24" height="32" rx="3" stroke="#fff" strokeWidth="2.2" transform="rotate(6 26 24)" />
      <g transform="translate(24,22) rotate(6) scale(0.7)">
        <path d="M0,-8 C-4,-4 -8,0 -8,4 C-8,7 -5,9 -2,8 C-1,7.5 0,7 0,7 C0,7 1,7.5 2,8 C5,9 8,7 8,4 C8,0 4,-4 0,-8Z" fill="#fff" />
        <path d="M0,6 C-1,8 -2,11 -3,12 L3,12 C2,11 1,8 0,6Z" fill="#fff" />
      </g>
      <line x1="38" y1="18" x2="44" y2="18" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="39" y1="22" x2="46" y2="22" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="38" y1="26" x2="44" y2="26" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}

// Octógono simétrico de 8 lugares com o herói fixo no vértice inferior —
// herói SEMPRE embaixo. Só 5 lugares têm jogador/ação real nesta versão dos
// dados (hero + 4 vilões); os outros 3 ficam como cadeiras vazias na mesa.
const DEFAULT_SEATS = [
  { left: "50%", top: "90%", label: "BTN", sub: "Você", stack: "", active: true },
  { left: "18.9%", top: "78.3%", label: "SB", sub: "Vilão", stack: "" },
  { left: "6%", top: "50%", label: "CO", sub: "Vilão", stack: "" },
  { left: "18.9%", top: "21.7%", empty: true },
  { left: "50%", top: "10%", empty: true },
  { left: "81.1%", top: "21.7%", empty: true },
  { left: "94%", top: "50%", label: "BB", sub: "Vilão", stack: "" },
  { left: "81.1%", top: "78.3%", label: "MP", sub: "Vilão", stack: "" },
];

// Extrai { type, sizing } de uma string de ação do solver (ex: "BET 450,000000").
function parseActionString(raw) {
  const parts = String(raw).trim().split(/\s+/);
  const type = parts[0].toUpperCase();
  const sizing = parts[1] ? parseFloat(parts[1].replace(",", ".")) : 0;
  return { type, sizing };
}

export default function DrillView({ onBack }) {
  const { filters, set: setFilter, reset: resetFilters, activeCount, queryString } = useFilters();
  const { hands, loading, error, reload } = useDrillBatch(20, queryString);

  const [idx, setIdx] = useState(0);
  const [userAction, setUserAction] = useState(null);
  const [stats, setStats] = useState({ hits: 0, total: 0, freqSum: 0 });
  const [heroTimer, setHeroTimer] = useState(30);

  const hand = hands[idx] || null;

  const board = useMemo(() => (hand ? parseBoard(hand.board) : []), [hand]);

  // heroCards agora vem pronto da API (mão real, sorteada dentro do range
  // com a estratégia já calculada pelo TexasSolver) — não é mais mockado.
  const hero = useMemo(() => {
    if (!hand?.heroCards) return [{ faceDown: true }, { faceDown: true }];
    return parseHeroCombo(hand.heroCards);
  }, [hand]);

  const seats = useMemo(() => {
    if (!hand) return DEFAULT_SEATS;
    const stackLabel = `${hand.effectiveStack} bb`;
    return DEFAULT_SEATS.map((s) => (s.empty ? s : { ...s, stack: stackLabel }));
  }, [hand]);

  const context = useMemo(() => {
    if (!hand) return "";
    return `Pot ${hand.pot} · Stack ${hand.effectiveStack} bb`;
  }, [hand]);

  // gtoNodes agora é { actions, player, strategy }. actions é uma lista de
  // strings tipo "BET 450,000000" — precisa parsear pra achar os tamanhos.
  const sizingRange = useMemo(() => {
    if (!hand?.gtoNodes?.actions) return { min: 2, max: 6 };
    const sizings = hand.gtoNodes.actions
      .map(parseActionString)
      .filter((a) => a.sizing > 0)
      .map((a) => a.sizing);
    if (sizings.length === 0) return { min: 2, max: 6 };
    const min = Math.max(1, Math.floor(Math.min(...sizings) * 0.5));
    const max = Math.ceil(Math.max(...sizings) * 1.5);
    return { min, max };
  }, [hand]);

  // Timer do herói: reinicia a cada mão nova, pausa após a decisão.
  useEffect(() => {
    setHeroTimer(30);
  }, [idx]);

  useEffect(() => {
    if (userAction) return;
    const id = setInterval(() => {
      setHeroTimer((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [userAction, idx]);

  const onAction = useCallback((action, size) => {
    setUserAction({ action, sizing: size });
  }, []);

  const nextHand = useCallback(() => {
    setUserAction(null);
    if (idx + 1 < hands.length) {
      setIdx((i) => i + 1);
    } else {
      reload();
      setIdx(0);
    }
  }, [idx, hands.length, reload]);

  // Sem EV disponível nos dados do solver, a métrica de sessão passa a ser
  // % de acerto (hits/total) e frequência média da ação escolhida.
  const onFeedbackResult = useCallback((result) => {
    setStats((prev) => ({
      hits: prev.hits + (result.verdict === "PERFECT" ? 1 : 0),
      total: prev.total + 1,
      freqSum: prev.freqSum + (result.chosenFreq ?? 0),
    }));
  }, []);

  const sessionPct = stats.total > 0 ? Math.round((stats.hits / stats.total) * 100) : 0;
  const avgFreq = stats.total > 0 ? Math.round((stats.freqSum / stats.total) * 100) : 0;

  // --- Loading ---
  if (loading) {
    return (
      <div style={{ background: "#000000", borderRadius: 20, padding: 20 }}>
        <div style={{ ...font, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, minHeight: 300 }}>
          <Loader2 size={32} color="rgba(255,255,255,0.5)" style={{ animation: "spin 1s linear infinite" }} />
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Carregando mãos...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    );
  }

  // --- Error ---
  if (error) {
    return (
      <div style={{ background: "#000000", borderRadius: 20, padding: 20 }}>
        <div style={{ ...font, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, minHeight: 300 }}>
          <AlertTriangle size={32} color={C.neg} />
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Erro ao carregar mãos.</p>
          <button onClick={reload} style={{ background: "#FFFFFF", color: "#111111", border: 0, borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // --- Sem mãos ---
  if (!hand) {
    return (
      <div style={{ background: "#000000", borderRadius: 20, padding: 20 }}>
        <div style={{ ...font, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, minHeight: 300 }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, textAlign: "center" }}>
            {activeCount > 0
              ? "Nenhuma mão encontrada para esses filtros."
              : "Nenhuma mão disponível. Importe spots com o solver primeiro."}
          </p>
          {activeCount > 0 && (
            <button onClick={resetFilters} style={{ background: "#1E1E1E", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
              Limpar filtros
            </button>
          )}
          <button onClick={onBack} style={{ background: "#1E1E1E", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#000000", borderRadius: 20, padding: 20 }}>
      <div style={{ ...font, display: "flex", flexDirection: "column", gap: 16, paddingBottom: 40 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={onBack}
            title="Voltar"
            style={{ display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: 10, background: "#1E1E1E", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)", cursor: "pointer" }}
          >
            <ArrowLeft size={18} strokeWidth={1.5} />
          </button>

          <Logo />

          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF" }}>Modo Treino</h1>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
              Mão {idx + 1} de {hands.length}
            </p>
          </div>

          {/* Filtro global */}
          <FilterDrawer
            filters={filters}
            onSet={setFilter}
            onReset={resetFilters}
            activeCount={activeCount}
          />

          {userAction && (
            <button
              onClick={nextHand}
              title="Próxima mão"
              style={{ display: "flex", alignItems: "center", gap: 6, background: "#FFFFFF", color: "#111111", border: 0, borderRadius: 10, padding: "10px 18px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}
            >
              Próxima <SkipForward size={14} />
            </button>
          )}
        </div>

        {/* Mesa + Painel lateral */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px", gap: 20, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <PokerTable
              seats={seats}
              pot={String(hand.pot)}
              board={board}
              hero={hero}
              heroTimer={heroTimer}
              betEvent={userAction}
            >
              {!userAction && (
                <ActionBar
                  pot={hand.pot}
                  onAction={onAction}
                  callAmount={Math.round(hand.pot * 0.5 * 10) / 10}
                  sizingRange={sizingRange}
                />
              )}
            </PokerTable>

            {/* Barra de cenário logo abaixo da mesa */}
            <ScenarioBar filters={filters} onSet={setFilter} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {userAction ? (
              <GtoFeedback
                userAction={userAction}
                gtoNodes={hand.gtoNodes}
                heroCards={hand.heroCards}
                context={context}
                onResult={onFeedbackResult}
              />
            ) : (
              <section style={{ background: "#1E1E1E", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: "#FFFFFF" }}>Análise GTO</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>Escolha sua ação para ver o feedback.</p>
              </section>
            )}

            {/* Stats da sessão */}
            <section style={{ background: "#1E1E1E", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#FFFFFF" }}>Sessão</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: C.pos }}>
                    {stats.hits}/{stats.total}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>acertos GTO</div>
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#FFFFFF" }}>{avgFreq}%</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>freq. média jogada</div>
                </div>
              </div>
              {stats.total > 0 && (
                <>
                  <div style={{ marginTop: 14, height: 6, borderRadius: 4, background: "#252525" }}>
                    <div style={{ width: `${sessionPct}%`, height: "100%", borderRadius: 4, background: "#FFFFFF" }} />
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>
                    {sessionPct}% · Mão {idx + 1}/{hands.length}
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
