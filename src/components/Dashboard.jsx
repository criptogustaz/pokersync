import React, { useMemo, useState } from "react";
import { Search, Bell, Settings, LogOut, Target, TrendingUp, BookOpen, Layers } from "lucide-react";
import { C, font } from "./theme.js";
import Logo from "./Logo.jsx";
import ModuleCard from "./ModuleCard.jsx";
import BankrollView from "./bankroll/BankrollView.jsx";
import DrillView from "./drill/DrillView.jsx";
import { signOut } from "../services/authService.js";
import { aggregate } from "../bankroll/calc.js";
import { loadState } from "../bankroll/storage.js";
import { SAMPLE_SESSIONS } from "../bankroll/sampleData.js";
import { fmtMoney, fmtPct } from "../bankroll/format.js";

const BANKROLL_DEFAULT = { sessions: SAMPLE_SESSIONS, bankroll: 1500, profile: "Padrão" };

// ── Botão de ícone da navbar ──────────────────────────────────────────────
function NavIconButton({ children, title, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: hov ? "rgba(255,255,255,0.08)" : "none", border: "none", cursor: "pointer", display: "grid", placeItems: "center", padding: 8, borderRadius: 9999, color: C.sub, transition: "background .2s" }}
    >
      {children}
    </button>
  );
}

// ── Métrica compacta ──────────────────────────────────────────────────────
function CompactMetric({ label, value, hint, dot }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, background: hov ? "rgba(255,255,255,0.04)" : "transparent", border: `1px solid ${hov ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)"}`, borderRadius: 8, padding: "10px 16px", transition: "background .2s, border-color .2s" }}
    >
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: dot, flexShrink: 0, boxShadow: hov ? `0 0 8px ${dot}` : "none", transition: "box-shadow .2s" }} />
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: C.sub, margin: 0, whiteSpace: "nowrap" }}>{label}</p>
      <p style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: "0 0 0 auto" }}>{value}</p>
      {hint && <p style={{ fontSize: 11, color: dot, margin: 0, whiteSpace: "nowrap", opacity: hov ? 1 : 0.7, transition: "opacity .2s" }}>{hint}</p>}
    </div>
  );
}

export default function Dashboard({ onLogout }) {
  const [q, setQ] = useState("");
  const [view, setView] = useState("home");
  const [nav, setNav] = useState("Início");

  // Métricas reais da banca (mesma fonte do módulo de Gestão de Banca).
  const bankrollState = useMemo(() => loadState(BANKROLL_DEFAULT), []);
  const agg = useMemo(() => aggregate(bankrollState.sessions), [bankrollState]);
  const currentBankroll = (Number(bankrollState.bankroll) || 0) + agg.profit;

  async function handleLogout() {
    await signOut();
    onLogout();
  }

  const modules = [
    { key: "drill",    icon: Target,     title: "Modo Treino",         subtitle: "Ranges e frequências GTO",   tag: "ATIVO", available: true,  onClick: () => setView("drill") },
    { key: "bankroll", icon: TrendingUp, title: "Gestão de Banca",     subtitle: "Controle de risco e ROI",    available: true,  onClick: () => setView("bankroll") },
    { key: "revisor",  icon: BookOpen,   title: "Revisor de Mãos",     subtitle: "Análise técnica de jogadas", available: false },
    { key: "ranges",   icon: Layers,     title: "Construtor de Ranges", subtitle: "Mapeamento estratégico",    available: false },
  ];

  return (
    <div style={{ ...font, minHeight: "100vh", background: C.bg, color: C.text }}>
      {/* ── Top Nav ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 16, padding: "0 24px", height: 72 }}>
          <Logo size="sm" />

          <nav style={{ display: "flex", alignItems: "center", gap: 24, marginLeft: 24 }}>
            {["Início", "Desempenho"].map((item) => {
              const activeItem = nav === item;
              return (
                <button
                  key={item}
                  onClick={() => setNav(item)}
                  style={{ position: "relative", fontWeight: 700, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: activeItem ? C.text : C.sub, background: "none", border: "none", cursor: "pointer", paddingBottom: 4, transition: "color .2s" }}
                >
                  {item}
                  <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: C.text, borderRadius: 1, transform: activeItem ? "scaleX(1)" : "scaleX(0)", transformOrigin: "left", transition: "transform .25s" }} />
                </button>
              );
            })}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, maxWidth: 360, margin: "0 auto", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.line}`, borderRadius: 12, padding: "9px 14px" }}>
            <Search size={16} color={C.sub} strokeWidth={1.5} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar módulos, drills, relatórios…"
              style={{ width: "100%", background: "transparent", border: 0, outline: "none", color: C.text, fontSize: 14, fontFamily: '"Space Grotesk", sans-serif' }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
            <NavIconButton title="Notificações"><Bell size={18} strokeWidth={1.5} /></NavIconButton>
            <NavIconButton title="Configurações"><Settings size={18} strokeWidth={1.5} /></NavIconButton>
            <NavIconButton title="Sair" onClick={handleLogout}><LogOut size={18} strokeWidth={1.5} /></NavIconButton>
            <span style={{ marginLeft: 6, display: "grid", placeItems: "center", width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: `1px solid ${C.line}`, color: C.text, fontWeight: 600, fontSize: 13 }}>JP</span>
          </div>
        </div>
      </header>

      {/* ── Views ── */}
      {view === "bankroll" ? (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px 0" }}>
          <BankrollView onBack={() => setView("home")} />
        </div>
      ) : view === "drill" ? (
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "24px 24px 0" }}>
          <DrillView onBack={() => setView("home")} />
        </div>
      ) : (
        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "36px 24px 60px", display: "flex", flexDirection: "column", gap: 28 }}>
          {/* Banner */}
          <div style={{ position: "relative", overflow: "hidden", borderRadius: 12, border: `1px solid ${C.line}`, background: C.panel, padding: "36px 40px" }}>
            <p style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: C.sub, fontWeight: 500, margin: 0 }}>Bem-vindo de volta</p>
            <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 10, color: C.text }}>Tudo em um único lugar.</h1>
          </div>

          {/* Métricas reais */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <CompactMetric label="BANCA ATUAL" value={fmtMoney(currentBankroll)} hint={fmtPct(agg.roi) + " ROI"} dot={agg.profit >= 0 ? C.pos : C.neg} />
            <CompactMetric label="SESSÕES" value={String(agg.n)} hint={agg.tourneyCount + " torneios"} dot={C.info} />
            <CompactMetric label="ITM (TORNEIOS)" value={agg.itm.toFixed(0) + "%"} hint="Estável" dot={C.warn} />
          </div>

          {/* Módulos */}
          <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: C.sub, margin: 0, letterSpacing: "0.02em" }}>Módulos Principais</p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {modules.map(({ key, ...mod }) => (
                <ModuleCard key={key} {...mod} />
              ))}
            </div>
          </section>
        </main>
      )}
    </div>
  );
}
