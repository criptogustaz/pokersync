import React, { useState } from "react";
import { Search, LogOut, Club, Target, TrendingUp, Heart, Spade, Diamond } from "lucide-react";
import { C, font } from "./theme.js";
import Logo from "./Logo.jsx";
import Track from "./Track.jsx";
import ModuleCard from "./ModuleCard.jsx";
import BankrollView from "./bankroll/BankrollView.jsx";
import DrillView from "./drill/DrillView.jsx";
import { signOut } from "../services/authService.js";

export default function Dashboard({ onLogout }) {
  const [q, setQ] = useState("");
  const [view, setView] = useState("home");

  async function handleLogout() {
    // Em produção: await signOut();
    onLogout();
  }

  return (
    <div style={{ ...font, minHeight: "100vh", background: C.bg, color: C.text }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(11,12,15,0.72)",
          backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <div
          style={{
            maxWidth: 1152,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "0 24px",
            height: 64,
          }}
        >
          <Logo />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flex: 1,
              maxWidth: 420,
              margin: "0 auto",
              background: C.panel2,
              border: `1px solid ${C.line}`,
              borderRadius: 12,
              padding: "9px 12px",
            }}
          >
            <Search size={17} color={C.sub} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar módulos, drills, relatórios…"
              style={{ width: "100%", background: "transparent", border: 0, outline: "none", color: C.text, fontSize: 14 }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto" }}>
            <button onClick={handleLogout} title="Sair" style={{ background: "none", border: 0, color: C.sub, cursor: "pointer" }}>
              <LogOut size={19} />
            </button>
            <span
              style={{
                display: "grid",
                placeItems: "center",
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: `linear-gradient(180deg, ${C.goldSoft}, ${C.gold})`,
                color: "#141207",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              JP
            </span>
          </div>
        </div>
      </header>

      {view === "bankroll" ? (
        <div style={{ maxWidth: 1152, margin: "0 auto", padding: "24px 24px 0" }}>
          <BankrollView onBack={() => setView("home")} />
        </div>
      ) : view === "drill" ? (
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "24px 24px 0" }}>
          <DrillView onBack={() => setView("home")} />
        </div>
      ) : (
        <>
      <div style={{ maxWidth: 1152, margin: "0 auto", padding: "32px 24px 0" }}>
        <div
          style={{
            borderRadius: 16,
            padding: 32,
            position: "relative",
            overflow: "hidden",
            background: `linear-gradient(120deg, ${C.felt}, ${C.panel})`,
            border: `1px solid ${C.line}`,
          }}
        >
          <div style={{ position: "absolute", right: -16, bottom: -24, opacity: 0.2, color: C.goldSoft }}>
            <Club size={160} strokeWidth={1} />
          </div>
          <p style={{ fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: C.goldSoft }}>
            Bem-vindo de volta
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginTop: 6, maxWidth: 520, lineHeight: 1.15 }}>
            Refine sua estratégia GTO onde ela vaza mais.
          </h1>
        </div>
      </div>

      <main style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px 60px" }}>
        <Track title="Continuar treinando">
          <ModuleCard title="Modo Treino" desc="Simulação de situações, drills e análise de mãos em tempo real." icon={Target} tint={C.felt} edge={C.feltEdge} onClick={() => setView("drill")} />
          <ModuleCard title="Gestão de Banca" desc="Controle financeiro, análise de lucros e evolução do bankroll." icon={TrendingUp} tint="#1a1710" edge={C.gold} onClick={() => setView("bankroll")} />
          <ModuleCard title="Revisão de Mãos" desc="Reveja spots marcados e compare suas ações com a solução ótima." icon={Heart} tint={C.panel2} edge={C.line} />
        </Track>

        <Track title="Recomendado para você">
          <ModuleCard title="Drills de Sizing" desc="Calibre bet sizing dentro da tolerância dos nós GTO." icon={Spade} tint={C.panel2} edge={C.line} />
          <ModuleCard title="Relatório de Evolução" desc="EV loss acumulado, blunders por rua e curva de progresso." icon={TrendingUp} tint="#1a1710" edge={C.gold} />
          <ModuleCard title="Ranges Pré-flop" desc="Estude aberturas, 3-bets e defesas por posição." icon={Diamond} tint={C.felt} edge={C.feltEdge} />
        </Track>
      </main>
        </>
      )}
    </div>
  );
}
