import React, { useEffect, useState } from "react";
import { Target, TrendingUp, BookOpen, Layers, Trophy } from "lucide-react";
import { C, font } from "./theme.js";
import ModuleCard from "./ModuleCard.jsx";
import Avatar from "./Avatar.jsx";
import ProfileMenu from "./ProfileMenu.jsx";
import NotificationsMenu from "./NotificationsMenu.jsx";
import HelpMenu from "./HelpMenu.jsx";
import HeroPanel from "./HeroPanel.jsx";
import StatCards from "./StatCards.jsx";
import ProgressStrip from "./ProgressStrip.jsx";
import BankrollView from "./bankroll/BankrollView.jsx";
import DrillView from "./drill/DrillView.jsx";
import HubView from "./hub/HubView.jsx";
import RevisorView from "./revisor/RevisorView.jsx";
import { fetchProfile } from "../services/profileService.js";
import { fetchProgress } from "../services/xpService.js";
import logoUrl from "../assets/pokersync-logo-h.png";

const ACCENT = {
  green: "#2FB89A",
  blue:  "#5AA6E0",
  gold:  "#E0B24C",
  amber: "#E0B24C",
  pink:  "#E0559E",
  purple:"#A855F7",
};

function AvatarWithLevel({ profile, level, onClick }) {
  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <Avatar id={profile.avatar_id} size={38} onClick={onClick} title="Perfil" />
      {level != null && (
        <span
          aria-label={`Nível ${level}`}
          style={{
            position: "absolute",
            bottom: -4,
            right: -4,
            minWidth: 20,
            height: 16,
            padding: "0 5px",
            borderRadius: 9,
            background: "#111",
            border: `1.5px solid ${ACCENT.gold}`,
            color: ACCENT.gold,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: "0.02em",
            display: "grid",
            placeItems: "center",
            pointerEvents: "none",
            lineHeight: 1,
          }}
        >
          {level}
        </span>
      )}
    </div>
  );
}

export default function Dashboard({ onLogout }) {
  const [view, setView] = useState("home");
  const [nav, setNav] = useState("Início");
  const [profile, setProfile] = useState({ nome: "", apelido: "", avatar_id: 1 });
  const [level, setLevel] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetchProfile().then(setProfile).catch(console.error);
    fetchProgress().then((p) => setLevel(p?.level ?? 1)).catch(() => setLevel(1));
  }, []);

  useEffect(() => {
    if (nav === "Desempenho" && view !== "hub") setView("hub");
    if (nav === "Início" && view === "hub") setView("home");
  }, [nav]); // eslint-disable-line react-hooks/exhaustive-deps

  const goHome = () => { setView("home"); setNav("Início"); };

  const modules = [
    { key: "drill",    icon: Target,     title: "Modo Treino",          subtitle: "Ranges e frequências GTO",   accent: ACCENT.green, tag: "ATIVO", available: true,  onClick: () => setView("drill") },
    { key: "bankroll", icon: TrendingUp, title: "Gestão de Banca",      subtitle: "Controle de risco e ROI",    accent: ACCENT.blue,                available: true,  onClick: () => setView("bankroll") },
    { key: "revisor",  icon: BookOpen,   title: "Revisão de Mãos",      subtitle: "Análise técnica de jogadas", accent: ACCENT.purple,              available: true,  onClick: () => setView("revisor") },
    { key: "revisor",  icon: Heart,      title: "Revisão de Mãos",      subtitle: "Análise técnica de jogadas", accent: ACCENT.amber,               available: false },
    { key: "ranges",   icon: Layers,     title: "Construtor de Ranges", subtitle: "Mapeamento estratégico",     accent: ACCENT.pink,                available: false },
  ];

  const isHome = view === "home";

  return (
    <div
      className={isHome ? "pokersync-shell-home" : undefined}
      style={{
        ...font,
        height: isHome ? "100vh" : "auto",
        minHeight: isHome ? undefined : "100vh",
        overflow: isHome ? "hidden" : "visible",
        background: C.bg,
        color: C.text,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        @media (max-width: 900px) {
          .pokersync-shell-home {
            height: auto !important;
            overflow: visible !important;
          }
        }
      `}</style>

      {/* Top nav compacto */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", padding: "0 28px", height: 64 }}>
          <button onClick={goHome} style={{ background: "none", border: 0, padding: 0, cursor: "pointer", justifySelf: "start" }} title="Início">
            <img src={logoUrl} alt="PokerSync" style={{ height: 40, width: "auto", objectFit: "contain", display: "block" }} />
          </button>

          <nav style={{ display: "flex", alignItems: "center", gap: 28, justifySelf: "center" }}>
            {["Início", "Desempenho"].map((item) => {
              const activeItem = nav === item;
              return (
                <button
                  key={item}
                  onClick={() => setNav(item)}
                  style={{ position: "relative", fontWeight: 700, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: activeItem ? C.text : C.sub, background: "none", border: "none", cursor: "pointer", paddingBottom: 5, transition: "color .2s" }}
                >
                  {item}
                  <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: C.text, borderRadius: 1, transform: activeItem ? "scaleX(1)" : "scaleX(0)", transformOrigin: "left", transition: "transform .25s" }} />
                </button>
              );
            })}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 4, justifySelf: "end" }}>
            <NotificationsMenu />
            <HelpMenu />
            <div style={{ position: "relative", marginLeft: 8 }}>
              <AvatarWithLevel profile={profile} level={level} onClick={() => setMenuOpen((v) => !v)} />
              {menuOpen && (
                <ProfileMenu profile={profile} onProfileChange={setProfile} onLogout={onLogout} onClose={() => setMenuOpen(false)} />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Views */}
      {view === "bankroll" ? (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 28px 0", width: "100%", boxSizing: "border-box" }}>
          <BankrollView onBack={goHome} />
        </div>
      ) : view === "drill" ? (
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 28px 0", width: "100%", boxSizing: "border-box" }}>
          <DrillView onBack={goHome} />
        </div>
      ) : view === "hub" ? (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 28px 0", width: "100%", boxSizing: "border-box" }}>
          <HubView onBack={goHome} />
        </div>
      ) : view === "revisor" ? (
  <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 28px 0", width: "100%", boxSizing: "border-box" }}>
    <RevisorView onBack={goHome} />
  </div>
      ) : (
        <main
          style={{
            maxWidth: 1280,
            width: "100%",
            margin: "0 auto",
            padding: "18px 28px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            flex: 1,
            minHeight: 0,
            boxSizing: "border-box",
          }}
        >
          <HeroPanel apelido={profile.apelido} nome={profile.nome} />
          <StatCards />

          <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: C.sub, margin: 0, letterSpacing: "0.02em" }}>Módulos Principais</p>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>5 módulos</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 12 }}>
              {modules.map(({ key, ...mod }) => (
                <ModuleCard key={key} {...mod} />
              ))}
            </div>
          </section>

          <ProgressStrip />
        </main>
      )}
    </div>
  );
}
