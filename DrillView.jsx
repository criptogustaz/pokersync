import React, { useCallback, useMemo, useState } from "react";
import { ArrowLeft, Loader2, AlertTriangle, SkipForward } from "lucide-react";
import { C, font } from "../theme.js";
import PokerTable from "./PokerTable.jsx";
import ActionBar from "./ActionBar.jsx";
import GtoFeedback from "./GtoFeedback.jsx";
import FilterDrawer from "./FilterDrawer.jsx";
import { useDrillBatch } from "../../services/useDrillBatch.js";
import { useFilters } from "../../services/useFilters.js";
import { parseBoard, parseHeroCombo } from "../../utils/parseBoard.js";

const DEFAULT_SEATS = [
  { left: "50%", top: "12%", label: "CO", sub: "Vilão", stack: "" },
  { left: "15%", top: "30%", label: "MP", sub: "Vilão", stack: "" },
  { left: "85%", top: "30%", label: "BTN", sub: "Você", stack: "", active: true },
  { left: "15%", top: "72%", label: "SB", sub: "Vilão", stack: "" },
  { left: "85%", top: "72%", label: "BB", sub: "Vilão", stack: "" },
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
    return DEFAULT_SEATS.map((s) => ({ ...s, stack: stackLabel }));
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

  const [sizing, setSizing] = useState(2.5);

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
      <div style={{ ...font, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, minHeight: 300 }}>
        <Loader2 size={32} color="rgba(255,255,255,0.5)" style={{ animation: "spin 1s linear infinite" }} />
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Carregando mãos...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  // --- Error ---
  if (error) {
    return (
      <div style={{ ...font, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, minHeight: 300 }}>
        <AlertTriangle size={32} color={C.neg} />
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Erro ao carregar mãos.</p>
        <button onClick={reload} style={{ background: "#FFFFFF", color: "#111111", border: 0, borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
          Tentar novamente
        </button>
      </div>
    );
  }

  // --- Sem mãos ---
  if (!hand) {
    return (
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
    );
  }

  return (
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
          <PokerTable seats={seats} pot={String(hand.pot)} board={board} hero={hero}>
            {!userAction && (
              <ActionBar
                sizing={sizing}
                onSizing={setSizing}
                onAction={onAction}
                callAmount={Math.round(hand.pot * 0.5 * 10) / 10}
                sizingRange={sizingRange}
              />
            )}
          </PokerTable>
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
  );
}
