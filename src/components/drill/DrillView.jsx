import React, { useCallback, useMemo, useState } from "react";
import { ArrowLeft, Loader2, AlertTriangle, SkipForward } from "lucide-react";
import { C, font } from "../theme.js";
import PokerTable from "./PokerTable.jsx";
import ActionBar from "./ActionBar.jsx";
import GtoFeedback from "./GtoFeedback.jsx";
import { useDrillBatch } from "../../services/useDrillBatch.js";
import { parseBoard, randomHeroCards } from "../../utils/parseBoard.js";

// Posições default (6-max) — futuramente pode vir do banco
const DEFAULT_SEATS = [
  { left: "50%", top: "12%", label: "CO", sub: "Vilão", stack: "" },
  { left: "15%", top: "30%", label: "MP", sub: "Vilão", stack: "" },
  { left: "85%", top: "30%", label: "BTN", sub: "Você", stack: "", active: true },
  { left: "15%", top: "72%", label: "SB", sub: "Vilão", stack: "" },
  { left: "85%", top: "72%", label: "BB", sub: "Vilão", stack: "" },
];

export default function DrillView({ onBack }) {
  const { hands, loading, error, reload } = useDrillBatch(20);

  const [idx, setIdx] = useState(0);
  const [userAction, setUserAction] = useState(null);
  const [stats, setStats] = useState({ hits: 0, total: 0, evLossSum: 0 });
  const [heroCards, setHeroCards] = useState(null);

  const hand = hands[idx] || null;

  // Board e hero derivados da mão atual
  const board = useMemo(() => (hand ? parseBoard(hand.board) : []), [hand]);
  const hero = useMemo(() => {
    if (heroCards) return heroCards;
    if (!hand) return [];
    const cards = randomHeroCards(hand.board);
    setHeroCards(cards);
    return cards;
  }, [hand, heroCards]);

  // Seats com stack baseado no effective_stack
  const seats = useMemo(() => {
    if (!hand) return DEFAULT_SEATS;
    const stackLabel = `${hand.effectiveStack} bb`;
    return DEFAULT_SEATS.map((s) => ({ ...s, stack: stackLabel }));
  }, [hand]);

  // Contexto textual
  const context = useMemo(() => {
    if (!hand) return "";
    return `Pot ${hand.pot} · Stack ${hand.effectiveStack} bb`;
  }, [hand]);

  // Sizing range derivado dos gtoNodes
  const sizingRange = useMemo(() => {
    if (!hand?.gtoNodes) return { min: 2, max: 6 };
    const sizings = hand.gtoNodes.filter((n) => n.sizing > 0).map((n) => n.sizing);
    if (sizings.length === 0) return { min: 2, max: 6 };
    const min = Math.max(1, Math.floor(Math.min(...sizings) * 0.5));
    const max = Math.ceil(Math.max(...sizings) * 1.5);
    return { min, max };
  }, [hand]);

  const [sizing, setSizing] = useState(2.5);

  // Callback de ação do jogador
  const onAction = useCallback(
    (action, size) => {
      setUserAction({ action, sizing: size });
    },
    []
  );

  // Avançar para próxima mão
  const nextHand = useCallback(() => {
    setUserAction(null);
    setHeroCards(null);
    if (idx + 1 < hands.length) {
      setIdx((i) => i + 1);
    } else {
      reload();
      setIdx(0);
    }
  }, [idx, hands.length, reload]);

  // Atualizar stats quando feedback é mostrado
  const onFeedbackResult = useCallback((result) => {
    setStats((prev) => ({
      hits: prev.hits + (result.verdict === "PERFECT" ? 1 : 0),
      total: prev.total + 1,
      evLossSum: prev.evLossSum + result.evLoss,
    }));
  }, []);

  const sessionPct = stats.total > 0 ? Math.round((stats.hits / stats.total) * 100) : 0;
  const avgLoss = stats.total > 0 ? (stats.evLossSum / stats.total).toFixed(2) : "0.00";

  // --- Loading ---
  if (loading) {
    return (
      <div style={{ ...font, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, minHeight: 300 }}>
        <Loader2 size={32} color={C.accent} style={{ animation: "spin 1s linear infinite" }} />
        <p style={{ color: C.sub, fontSize: 14 }}>Carregando mãos...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  // --- Error ---
  if (error) {
    return (
      <div style={{ ...font, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, minHeight: 300 }}>
        <AlertTriangle size={32} color={C.neg} />
        <p style={{ color: C.sub, fontSize: 14 }}>Erro ao carregar mãos.</p>
        <button onClick={reload} style={{ background: C.accent, color: "#fff", border: 0, borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontWeight: 600 }}>
          Tentar novamente
        </button>
      </div>
    );
  }

  // --- Sem mãos ---
  if (!hand) {
    return (
      <div style={{ ...font, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, minHeight: 300 }}>
        <p style={{ color: C.sub, fontSize: 14 }}>Nenhuma mão disponível no banco. Importe spots com o solver primeiro.</p>
        <button onClick={onBack} style={{ background: C.panel2, color: C.text, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontWeight: 600 }}>
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div style={{ ...font, display: "flex", flexDirection: "column", gap: 20, paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onBack}
          title="Voltar"
          style={{ display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: 10, background: C.panel2, border: `1px solid ${C.line}`, color: C.sub, cursor: "pointer" }}
        >
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Modo Treino · Drill de Sizing</h1>
          <p style={{ fontSize: 13, color: C.sub, marginTop: 2 }}>
            Mão {idx + 1} de {hands.length} · Escolha sua ação e receba o feedback GTO.
          </p>
        </div>
        {userAction && (
          <button
            onClick={nextHand}
            title="Próxima mão"
            style={{ display: "flex", alignItems: "center", gap: 6, background: C.accent, color: "#fff", border: 0, borderRadius: 10, padding: "10px 18px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}
          >
            Próxima <SkipForward size={16} />
          </button>
        )}
      </div>

      {/* Mesa + Painel lateral */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px", gap: 20, alignItems: "start" }}>
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

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {userAction ? (
            <GtoFeedback
              userAction={userAction}
              gtoNodes={hand.gtoNodes}
              context={context}
              onResult={onFeedbackResult}
            />
          ) : (
            <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Análise GTO</h3>
              <p style={{ fontSize: 13, color: C.sub }}>Escolha sua ação para ver o feedback.</p>
            </section>
          )}

          {/* Stats da sessão */}
          <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Sessão de drill</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.pos }}>
                  {stats.hits}/{stats.total}
                </div>
                <div style={{ fontSize: 12, color: C.sub }}>acertos GTO</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{avgLoss} bb</div>
                <div style={{ fontSize: 12, color: C.sub }}>EV loss médio</div>
              </div>
            </div>
            {stats.total > 0 && (
              <>
                <div style={{ marginTop: 14, height: 8, borderRadius: 5, background: C.panel2 }}>
                  <div style={{ width: `${sessionPct}%`, height: "100%", borderRadius: 5, background: C.accent }} />
                </div>
                <div style={{ fontSize: 12, color: C.sub, marginTop: 6 }}>
                  {sessionPct}% de acerto · Mão {idx + 1} de {hands.length}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
