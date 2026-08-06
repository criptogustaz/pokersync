import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, AlertTriangle, SkipForward, ChevronRight } from "lucide-react";
import { C, font } from "../theme.js";
import PokerTable from "./PokerTable.jsx";
import ActionBar from "./ActionBar.jsx";
import GtoFeedback from "./GtoFeedback.jsx";
import FilterDrawer from "./FilterDrawer.jsx";
import { useDrillBatch } from "../../services/useDrillBatch.js";
import { useFilters } from "../../services/useFilters.js";
import { useFacets } from "../../services/useFacets.js";
import { parseBoard, parseHeroCombo } from "../../utils/parseBoard.js";

/* ==================================================================
   HIERARQUIA (revisão de UX)

   1. Mesa é o único protagonista — coluna única, largura total.
   2. Filtro virou barra de contexto no topo: mostra o cenário ativo
      como chips clicáveis (é onde o jogador LÊ em que spot está) e
      abre o drawer. ScenarioBar (abaixo da mesa) foi removida —
      duplicava o drawer e ficava fora do fluxo de leitura.
   3. Análise GTO não é indicador permanente: só existe DEPOIS da ação,
      ancorada logo abaixo da mesa (onde a ActionBar estava). Sem card
      vazio "escolha sua ação".
   4. Sessão virou strip de rodapé, tipografia pequena, cor neutra.
      Teal (C.pos) fica reservado para acerto.

   O header continua SEMPRE montado (não desmonta o FilterDrawer).
===================================================================*/

const DEFAULT_SEATS = [
  { left: "50%", top: "90%", label: "BTN", sub: "Você", stack: "", active: true },
  { left: "18.9%", top: "78.3%", label: "SB", sub: "Vilão", stack: "", inHand: true },
  { left: "6%", top: "50%", label: "CO", sub: "Vilão", stack: "", inHand: true },
  { left: "18.9%", top: "21.7%", label: "UTG", sub: "Fora da mão", stack: "", inHand: false },
  { left: "50%", top: "10%", label: "UTG+1", sub: "Fora da mão", stack: "", inHand: false },
  { left: "81.1%", top: "21.7%", label: "HJ", sub: "Fora da mão", stack: "", inHand: false },
  { left: "94%", top: "50%", label: "BB", sub: "Vilão", stack: "", inHand: true },
  { left: "81.1%", top: "78.3%", label: "MP", sub: "Vilão", stack: "", inHand: false },
];

/* Rótulos legíveis para as chaves do objeto `filters`. */
const FILTER_LABELS = {
  street: "Street",
  action: "Ação",
  position: "Posição",
  heroPosition: "Posição",
  villainPosition: "Vilão",
  stack: "Stack",
  effectiveStack: "Stack",
  format: "Formato",
};

/* Valores que significam "sem restrição" e não viram chip. */
const NEUTRAL_VALUES = new Set(["", "Qualquer", "Todos", "Todas", "Ambos", "Any", "all"]);

function parseActionString(raw) {
  const parts = String(raw).trim().split(/\s+/);
  const type = parts[0].toUpperCase();
  const sizing = parts[1] ? parseFloat(parts[1].replace(",", ".")) : 0;
  return { type, sizing };
}

/* ------------------------------------------------------------------
   Barra de contexto — controle primário do cenário.
   Estado ativo: chips com o filtro corrente. Estado zerado: convite.
-------------------------------------------------------------------*/
function ContextBar({ filters, onOpen, children }) {
  const chips = useMemo(() => {
    return Object.entries(filters || {})
      .filter(([, v]) => {
        if (Array.isArray(v)) return v.length > 0;
        return v !== null && v !== undefined && !NEUTRAL_VALUES.has(String(v));
      })
      .map(([k, v]) => ({
        key: k,
        label: FILTER_LABELS[k] || k,
        value: Array.isArray(v) ? v.join(" · ") : String(v),
      }));
  }, [filters]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px 10px 16px",
        borderRadius: 14,
        background: "#141414",
        border: "1px solid rgba(255,255,255,0.10)",
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: "rgba(255,255,255,0.28)",
          flexShrink: 0,
        }}
      >
        Cenário
      </span>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flex: 1,
          minWidth: 0,
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        {chips.length === 0 ? (
          <button
            onClick={onOpen}
            style={{
              ...font,
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: 0,
              padding: 0,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              color: "rgba(255,255,255,0.45)",
            }}
          >
            Nenhum filtro aplicado — escolha uma situação para treinar
            <ChevronRight size={14} strokeWidth={2} />
          </button>
        ) : (
          chips.map((chip, i) => (
            <React.Fragment key={chip.key}>
              {i > 0 && (
                <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 12, flexShrink: 0 }}>›</span>
              )}
              <button
                onClick={onOpen}
                title={`${chip.label}: ${chip.value}`}
                style={{
                  ...font,
                  display: "flex",
                  alignItems: "baseline",
                  gap: 6,
                  padding: "5px 10px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "rgba(255,255,255,0.3)",
                  }}
                >
                  {chip.label}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF" }}>{chip.value}</span>
              </button>
            </React.Fragment>
          ))
        )}
      </div>

      {/* Gatilho do drawer (FilterDrawer) */}
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Strip de sessão — indicador, não painel.
-------------------------------------------------------------------*/
function SessionStrip({ hits, total, avgFreq, sessionPct }) {
  const item = (value, label, color) => (
    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.28)" }}>{label}</span>
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        flexWrap: "wrap",
        padding: "8px 14px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: "rgba(255,255,255,0.22)",
        }}
      >
        Sessão
      </span>
      {item(`${hits}/${total}`, "acertos GTO", total > 0 && hits > 0 ? C.pos : "rgba(255,255,255,0.6)")}
      {item(`${sessionPct}%`, "aproveitamento", "rgba(255,255,255,0.6)")}
      {item(`${avgFreq}%`, "freq. média jogada", "rgba(255,255,255,0.6)")}
    </div>
  );
}

export default function DrillView({ onBack }) {
  const { filters, set: setFilter, reset: resetFilters, activeCount, queryString } = useFilters();
  const { hands, loading, error, reload } = useDrillBatch(20, queryString);
  const facets = useFacets();

  const [filtersOpen, setFiltersOpen] = useState(false);

  const [idx, setIdx] = useState(0);
  const [userAction, setUserAction] = useState(null);
  const [stats, setStats] = useState({ hits: 0, total: 0, freqSum: 0 });
  const [heroTimer, setHeroTimer] = useState(30);

  const hand = hands[idx] || null;

  useEffect(() => {
    setIdx(0);
    setUserAction(null);
  }, [queryString]);

  const board = useMemo(() => (hand ? parseBoard(hand.board) : []), [hand]);

  const hero = useMemo(() => {
    if (!hand?.heroCards) return [{ faceDown: true }, { faceDown: true }];
    return parseHeroCombo(hand.heroCards);
  }, [hand]);

  const seats = useMemo(() => {
    if (!hand) return DEFAULT_SEATS;
    const stackLabel = `${hand.effectiveStack} bb`;
    return DEFAULT_SEATS.map((s) => (s.inHand || s.active ? { ...s, stack: stackLabel } : s));
  }, [hand]);

  const context = useMemo(() => {
    if (!hand) return "";
    return `Pot ${hand.pot} · Stack ${hand.effectiveStack} bb`;
  }, [hand]);

  const betSizings = useMemo(() => {
    if (!hand?.gtoNodes?.actions) return [];
    const sizings = hand.gtoNodes.actions
      .map(parseActionString)
      .filter((a) => a.type === "BET" && a.sizing > 0)
      .map((a) => a.sizing / 100);
    const unique = Array.from(new Set(sizings)).sort((a, b) => a - b);
    return unique.slice(0, 3);
  }, [hand]);

  useEffect(() => {
    setHeroTimer(30);
  }, [idx]);

  useEffect(() => {
    if (userAction || !hand) return;
    const id = setInterval(() => {
      setHeroTimer((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [userAction, idx, hand]);

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

  const onFeedbackResult = useCallback((result) => {
    setStats((prev) => ({
      hits: prev.hits + (result.verdict === "PERFECT" ? 1 : 0),
      total: prev.total + 1,
      freqSum: prev.freqSum + (result.chosenFreq ?? 0),
    }));
  }, []);

  const sessionPct = stats.total > 0 ? Math.round((stats.hits / stats.total) * 100) : 0;
  const avgFreq = stats.total > 0 ? Math.round((stats.freqSum / stats.total) * 100) : 0;

  const panelBox = {
    ...font,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    minHeight: 300,
  };

  /* ---------------- Conteúdo (nunca desmonta o header) --------------- */
  let content;

  if (loading) {
    content = (
      <div style={panelBox}>
        <Loader2 size={32} color="rgba(255,255,255,0.5)" style={{ animation: "spin 1s linear infinite" }} />
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Carregando mãos...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  } else if (error) {
    content = (
      <div style={panelBox}>
        <AlertTriangle size={32} color={C.neg} />
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Erro ao carregar mãos.</p>
        <button
          onClick={reload}
          style={{ background: "#FFFFFF", color: "#111111", border: 0, borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}
        >
          Tentar novamente
        </button>
      </div>
    );
  } else if (!hand) {
    content = (
      <div style={panelBox}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, textAlign: "center" }}>
          {activeCount > 0
            ? "Nenhuma mão encontrada para esses filtros."
            : "Escolha uma situação nos filtros para começar a treinar."}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          {activeCount > 0 && (
            <button
              onClick={resetFilters}
              style={{ background: "#1E1E1E", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}
            >
              Limpar filtros
            </button>
          )}
          <button
            onClick={() => setFiltersOpen(true)}
            style={{ background: "#FFFFFF", color: "#111111", border: 0, borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}
          >
            {activeCount > 0 ? "Ajustar filtros" : "Definir cenário"}
          </button>
        </div>
      </div>
    );
  } else {
    content = (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
              betSizings={betSizings}
              onAction={onAction}
              callAmount={Math.round(hand.pot * 0.5 * 10) / 10}
            />
          )}
        </PokerTable>

        {/* Feedback ancorado onde a ação aconteceu — só existe após a ação */}
        {userAction && (
          <GtoFeedback
            userAction={userAction}
            gtoNodes={hand.gtoNodes}
            heroCards={hand.heroCards}
            context={context}
            onResult={onFeedbackResult}
          />
        )}

        <SessionStrip
          hits={stats.hits}
          total={stats.total}
          avgFreq={avgFreq}
          sessionPct={sessionPct}
        />
      </div>
    );
  }

  /* ----------------------------- Render ----------------------------- */
  return (
    <div style={{ background: "#000000", borderRadius: 20, padding: 20 }}>
      <div style={{ ...font, display: "flex", flexDirection: "column", gap: 14, paddingBottom: 40 }}>
        {/* Header — SEMPRE montado, em todos os estados */}
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
              {hand ? `Mão ${idx + 1} de ${hands.length}` : loading ? "Carregando..." : "Sem mãos"}
            </p>
          </div>

          {userAction && hand && (
            <button
              onClick={nextHand}
              title="Próxima mão"
              style={{ display: "flex", alignItems: "center", gap: 6, background: "#FFFFFF", color: "#111111", border: 0, borderRadius: 10, padding: "10px 18px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}
            >
              Próxima <SkipForward size={14} />
            </button>
          )}
        </div>

        {/* Barra de contexto — controle primário do cenário */}
        <ContextBar filters={filters} onOpen={() => setFiltersOpen(true)}>
          <FilterDrawer
            open={filtersOpen}
            onOpen={() => setFiltersOpen(true)}
            onClose={() => setFiltersOpen(false)}
            filters={filters}
            onSet={setFilter}
            onReset={resetFilters}
            activeCount={activeCount}
            facets={facets}
          />
        </ContextBar>

        {content}
      </div>
    </div>
  );
}
