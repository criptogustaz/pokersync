import React, { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { C, font } from "../theme.js";
import PokerTable from "./PokerTable.jsx";
import ActionBar from "./ActionBar.jsx";
import GtoFeedback from "./GtoFeedback.jsx";

// Spot de exemplo do drill de sizing (BTN, 100bb effective).
const SPOT = {
  context: "BTN abre · 100 bb effective",
  pot: "5.5",
  callAmount: 2.0,
  seats: [
    { left: "50%", top: "12%", label: "CO", sub: "Vilão", stack: "100 bb" },
    { left: "15%", top: "30%", label: "MP", sub: "Vilão", stack: "92 bb" },
    { left: "85%", top: "30%", label: "BTN", sub: "Você", stack: "118 bb", active: true },
    { left: "15%", top: "72%", label: "SB", sub: "Vilão", stack: "100 bb" },
    { left: "85%", top: "72%", label: "BB", sub: "Vilão", stack: "100 bb" },
  ],
  board: [
    { rank: "A", suit: "h" },
    { rank: "K", suit: "s" },
    { rank: "7", suit: "d" },
    { faceDown: true },
    { faceDown: true },
  ],
  hero: [
    { rank: "Q", suit: "c" },
    { rank: "J", suit: "d" },
  ],
  // Nós da solução GTO (ev em bb, freq p/ exibição).
  gtoNodes: [
    { action: "RAISE", sizing: 2.5, ev: 1.2, freq: 0.78 },
    { action: "RAISE", sizing: 3.0, ev: 1.1, freq: 0.17 },
    { action: "FOLD", sizing: 0, ev: 0.0, freq: 0.05 },
  ],
};

export default function DrillView({ onBack }) {
  const [sizing, setSizing] = useState(2.5);
  const [userAction, setUserAction] = useState({ action: "RAISE", sizing: 2.5 });
  const [stats, setStats] = useState({ hits: 18, total: 20, avgLoss: 0.4 });

  const onAction = (action, size) => setUserAction({ action, sizing: size });

  const sessionPct = useMemo(() => Math.round((stats.hits / stats.total) * 100), [stats]);

  return (
    <div style={{ ...font, display: "flex", flexDirection: "column", gap: 20, paddingBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onBack}
          title="Voltar"
          style={{ display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: 10, background: C.panel2, border: `1px solid ${C.line}`, color: C.sub, cursor: "pointer" }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Modo Treino · Drill de Sizing</h1>
          <p style={{ fontSize: 13, color: C.sub, marginTop: 2 }}>Escolha sua ação e receba o feedback GTO em tempo real.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px", gap: 20, alignItems: "start" }}>
        <PokerTable seats={SPOT.seats} pot={SPOT.pot} board={SPOT.board} hero={SPOT.hero}>
          <ActionBar sizing={sizing} onSizing={setSizing} onAction={onAction} callAmount={SPOT.callAmount} />
        </PokerTable>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <GtoFeedback userAction={userAction} gtoNodes={SPOT.gtoNodes} context={SPOT.context} />

          <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Sessão de drill</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.pos }}>{stats.hits}/{stats.total}</div>
                <div style={{ fontSize: 12, color: C.sub }}>acertos GTO</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{stats.avgLoss} bb</div>
                <div style={{ fontSize: 12, color: C.sub }}>EV loss médio</div>
              </div>
            </div>
            <div style={{ marginTop: 14, height: 8, borderRadius: 5, background: C.panel2 }}>
              <div style={{ width: `${sessionPct}%`, height: "100%", borderRadius: 5, background: `linear-gradient(90deg, ${C.goldSoft}, ${C.gold})` }} />
            </div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 6 }}>Mão {stats.total} de {stats.total}</div>
          </section>
        </div>
      </div>
    </div>
  );
}
