import React, { useEffect, useMemo, useState } from "react";
import { Bell, Settings, LogOut, Target, TrendingUp, BookOpen, Layers } from "lucide-react";
import { C, font } from "./theme.js";
import ModuleCard from "./ModuleCard.jsx";
import BankrollView from "./bankroll/BankrollView.jsx";
import DrillView from "./drill/DrillView.jsx";
import { signOut, getCurrentUser } from "../services/authService.js";
import { aggregate } from "../bankroll/calc.js";
import { loadState } from "../bankroll/storage.js";
import { SAMPLE_SESSIONS } from "../bankroll/sampleData.js";
import { fmtMoney } from "../bankroll/format.js";
import logoUrl from "../assets/pokersync-logo-h.jpg";

const BANKROLL_DEFAULT = { sessions: SAMPLE_SESSIONS, bankroll: 1500, profile: "Padrão" };

// Acentos sutis por módulo (detalhe no hover).
const ACCENT = { green: "#2FB89A", blue: "#5AA6E0", amber: "#E0B24C", pink: "#E0559E" };

// Fundo do banner: pilhas de fichas de poker em P&B (SVG, sutil).
function ChipsBackground() {
  const Stack = ({ x, baseY, count, rx = 66, ry = 17, gap = 12 }) => {
    const items = [];
    for (let i = 0; i < count; i++) {
      const y = baseY - i * gap;
      items.push(<ellipse key={`b${i}`} cx={x} cy={y} rx={rx} ry={ry} fill="#161616" stroke="#ffffff" strokeWidth="1.4" />);
    }
    const topY = baseY - count * gap;
    items.push(<ellipse key="top" cx={x} cy={topY} rx={rx} ry={ry} fill="#242424" stroke="#ffffff" strokeWidth="1.4" />);
    items.push(<ellipse key="topin" cx={x} cy={topY} rx={rx * 0.6} ry={ry * 0.6} fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="5 7" />);
    return <g>{items}</g>;
  };
  return (
    <svg viewBox="0 0 640 240" preserveAspectRatio="xMaxYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.4, pointerEvents: "none" }}>
      <Stack x={430} baseY={200} count={7} />
      <Stack x={545} baseY={210} count={9} rx={70} />
      <Stack x={620} baseY={195} count={5} rx={58} />
    </svg>
  );
}

function NavIconButton({ children, title, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button title={title} onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? "rgba(255,255,255,0.08)" : "none", border: "none", cursor: "pointer", display: "grid", placeItems: "center", padding: 9, borderRadius: 9999, color: C.sub, transition: "background .2s" }}>
      {children}
    </button>
  );
}

function CompactMetric({ label, value, hint, dot, up }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ flex: 1, display: "flex", alignItems: "center", gap: 14, background: hov ? "rgba(255,255,255,0.04)" : "transparent", border: `1px solid ${hov ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)"}`, borderRadius: 10, padding: "13px 20px", transition: "background .2s, border-color .2s" }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: dot, flexShrink: 0, boxShadow: hov ? `0 0 8px ${dot}` : "none", transition: "box-shadow .2s" }} />
      <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: C.sub, margin: 0, whiteSpace: "nowrap" }}>{label}</p>
      <p style={{ fontSize: 19, fontWeight: 700, color: C.text, margin: "0 0 0 auto" }}>{value}</p>
      {hint && <p style={{ fontSize: 12, color: dot, margin: 0, whiteSpace: "nowrap", opacity: hov ? 1 : 0.75, transition: "opacity .2s" }}>{up === true ? "↑ " : up === false ? "→ " : ""}{hint}</p>}
    </div>
  );
}

function ProgressCard({ label, value, max, color }) {
  const [hov, setHov] = useState(false);
  const pct = Math.round((value / max) * 100);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ flex: 1, background: hov ? C.panel2 : C.panel, border: `1px solid ${hov ? "rgba(255,255,255,0.12)" : C.line}`, borderRadius: 10, padding: "15px 20px", display: "flex", flexDirection: "column", gap: 12, transition: "background .2s, border-color .2s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: C.sub, margin: 0, textTransform: "uppercase" }}>{label}</p>
        <p style={{ fontSize: 14, fontWeight: 600, color: hov ? C.text : "#c4c7c8", margin: 0, transition: "color .2s" }}>{value}<span style={{ color: C.sub, fontWeight: 400 }}>/{max}</span></p>
      </div>
      <div style={{ position: "relative", height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, boxShadow: hov ? `0 0 8px ${color}88` : "none", transition: "box-shadow .25s" }} />
      </div>
      <p style={{ fontSize: 12, color: hov ? color : C.sub, margin: 0, transition: "color .25s" }}>{pct}% concluído</p>
    </div>
  );
}

function SectionHeading({ children }) {
  return <p style={{ fontSize: 18, fontWeight: 600, color: C.sub, margin: 0, letterSpacing: "0.02em", flexShrink: 0 }}>{children}</p>;
}

export default function Dashboard({ onLogout }) {
  const [view, setView] = useState("home");
  const [nav, setNav] = useState("Início");
  const [userName, setUserName] = useState("Jogador");

  useEffect(() => {
    let alive = true;
    getCurrentUser()
      .then((u) => { if (alive) setUserName(u?.name || (u?.email ? u.email.split("@")[0] : "Jogador")); })
      .catch(() => alive && setUserName("Jogador"));
    return () => { alive = false; };
  }, []);

  // Banca real (mesma fonte da Gestão de Banca).
  const bankrollState = useMemo(() => loadState(BANKROLL_DEFAULT), []);
  const agg = useMemo(() => aggregate(bankrollState.sessions), [bankrollState]);
  const currentBankroll = (Number(bankrollState.bankroll) || 0) + agg.profit;

  async function handleLogout() {
    await signOut();
    onLogout();
  }

  const modules = [
    { key: "drill",    icon: Target,     title: "Modo Treino",          subtitle: "Ranges e frequências GTO",   accent: ACCENT.green, tag: "ATIVO", available: true, onClick: () => setView("drill") },
    { key: "bankroll", icon: TrendingUp, title: "Gestão de Banca",      subtitle: "Controle de risco e ROI",    accent: ACCENT.blue,                available: true, onClick: () => setView("bankroll") },
    { key: "revisor",  icon: BookOpen,   title: "Revisor de Mãos",      subtitle: "Análise técnica de jogadas", accent: ACCENT.amber, tag: "3 NOVAS", available: false },
    { key: "ranges",   icon: Layers,     title: "Construtor de Ranges", subtitle: "Mapeamento estratégico",     accent: ACCENT.pink,  available: false },
  ];

  const isHome = view === "home";

  return (
    <div style={{ ...font, height: "100vh", display: "flex", flexDirection: "column", background: C.bg, color: C.text, overflow: "hidden" }}>
      {/* ── Top Nav (fixo) ── */}
      <header style={{ flexShrink: 0, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", padding: "0 28px", height: 80 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <img src={logoUrl} alt="PokerSync" style={{ height: 40, width: "auto", objectFit: "contain" }} />
          </div>
          <nav style={{ display: "flex", alignItems: "center", gap: 36, justifySelf: "center" }}>
            {["Início", "Desempenho"].map((item) => {
              const activeItem = nav === item;
              return (
                <button key={item} onClick={() => setNav(item)}
                  style={{ position: "relative", fontWeight: 700, fontSize: 14, letterSpacing: "0.14em", textTransform: "uppercase", color: activeItem ? C.text : C.sub, background: "none", border: "none", cursor: "pointer", paddingBottom: 6, transition: "color .2s" }}>
                  {item}
                  <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: C.text, borderRadius: 1, transform: activeItem ? "scaleX(1)" : "scaleX(0)", transformOrigin: "left", transition: "transform .25s" }} />
                </button>
              );
            })}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 6, justifySelf: "end" }}>
            <NavIconButton title="Notificações"><Bell size={20} strokeWidth={1.5} /></NavIconButton>
            <NavIconButton title="Configurações"><Settings size={20} strokeWidth={1.5} /></NavIconButton>
            <NavIconButton title="Sair" onClick={handleLogout}><LogOut size={20} strokeWidth={1.5} /></NavIconButton>
            <span style={{ marginLeft: 6, display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: `1px solid ${C.line}`, color: C.text, fontWeight: 700, fontSize: 14 }}>
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      {/* ── Conteúdo ── */}
      {isHome ? (
        <main style={{ flex: 1, minHeight: 0, width: "100%", overflow: "auto" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "26px 28px 28px", display: "flex", flexDirection: "column", gap: 20, minHeight: "100%" }}>
            {/* Banner com fichas P&B + nome do usuário */}
            <div style={{ position: "relative", overflow: "hidden", borderRadius: 14, border: `1px solid ${C.line}`, background: "#0a0a0a", padding: "30px 40px", flexShrink: 0, minHeight: 150 }}>
              <ChipsBackground />
              <div style={{ position: "relative" }}>
                <p style={{ fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase", color: C.sub, fontWeight: 600, margin: 0 }}>Bem-vindo de volta</p>
                <h1 style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 10, color: "#FFFFFF", lineHeight: 1.1 }}>{userName}</h1>
              </div>
            </div>

            {/* Métricas (placeholder de winrate/GTO; banca é real) */}
            <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
              <CompactMetric label="WINRATE ATUAL" value="8.4 bb/100" hint="+1.2 vs mês passado" dot={C.pos} up={true} />
              <CompactMetric label="BANCA ATUAL" value={fmtMoney(currentBankroll)} hint={agg.profit >= 0 ? "no lucro" : "em queda"} dot={agg.profit >= 0 ? C.pos : C.neg} up={agg.profit >= 0} />
              <CompactMetric label="PRECISÃO GTO" value="92%" hint="Estável" dot={C.warn} up={null} />
            </div>

            {/* Módulos */}
            <section style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              <SectionHeading>Módulos Principais</SectionHeading>
              <div style={{ flex: 1, minHeight: 150, display: "flex", gap: 16 }}>
                {modules.map(({ key, ...mod }) => (<ModuleCard key={key} {...mod} />))}
              </div>
            </section>

            {/* Progresso Recente (placeholder — ligar a dados reais depois) */}
            <section style={{ display: "flex", flexDirection: "column", gap: 12, flexShrink: 0 }}>
              <SectionHeading>Progresso Recente</SectionHeading>
              <div style={{ display: "flex", gap: 14 }}>
                <ProgressCard label="Sessões este mês" value={24} max={30} color={ACCENT.green} />
                <ProgressCard label="Mãos revisadas" value={148} max={200} color={ACCENT.blue} />
                <ProgressCard label="Ranges mapeados" value={7} max={10} color={ACCENT.amber} />
              </div>
            </section>
          </div>
        </main>
      ) : (
        <main style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          <div style={{ maxWidth: view === "drill" ? 1280 : 1200, margin: "0 auto", padding: "24px 28px 40px" }}>
            {view === "bankroll" ? <BankrollView onBack={() => setView("home")} /> : <DrillView onBack={() => setView("home")} />}
          </div>
        </main>
      )}
    </div>
  );
}
