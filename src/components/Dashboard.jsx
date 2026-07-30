import React, { useEffect, useState } from "react";
import { Target, TrendingUp, Heart, Layers, Trophy } from "lucide-react";
import { C, font } from "./theme.js";
import ModuleCard from "./ModuleCard.jsx";
import Avatar from "./Avatar.jsx";
import ProfileMenu from "./ProfileMenu.jsx";
import NotificationsMenu from "./NotificationsMenu.jsx";
import HelpMenu from "./HelpMenu.jsx";
import HeroPanel from "./HeroPanel.jsx";
import ProgressStrip from "./ProgressStrip.jsx";
import BankrollView from "./bankroll/BankrollView.jsx";
import DrillView from "./drill/DrillView.jsx";
import HubView from "./hub/HubView.jsx";
import { fetchProfile } from "../services/profileService.js";
import { fetchProgress } from "../services/xpService.js";
import logoUrl from "../assets/pokersync-logo-h.png";

// Acentos por módulo — mantêm as cores semânticas do gestor de banca.
const ACCENT = {
  green: "#2FB89A",
  blue:  "#5AA6E0",
  gold:  "#E0B24C",
  amber: "#E0B24C",
  pink:  "#E0559E",
};

// Wrapper do avatar do topo com badge de nível.
function AvatarWithLevel({ profile, level, onClick }) {
  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <Avatar id={profile.avatar_id} size={42} onClick={onClick} title="Perfil" />
      {level != null && (
        <span
          aria-label={`Nível ${level}`}
          style={{
            position: "absolute",
            bottom: -4,
            right: -4,
            minWidth: 22,
            height: 18,
            padding: "0 6px",
            borderRadius: 10,
            background: "#111",
            border: `1.5px solid ${ACCENT.gold}`,
            color: ACCENT.gold,
            fontSize: 10,
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

  // Sincroniza nav "Desempenho" ↔ HubView.
  useEffect(() => {
    if (nav === "Desempenho" && view !== "hub") setView("hub");
    if (nav === "Início" && view === "hub") setView("home");
  }, [nav]); // eslint-disable-line react-hooks/exhaustive-deps

  const goHome = () => { setView("home"); setNav("Início"); };

  const modules = [
    { key: "drill",    icon: Target,     title: "Modo Treino",          subtitle: "Ranges e frequências GTO",   accent: ACCENT.green, tag: "ATIVO", available: true,  onClick: () => setView("drill") },
    { key: "bankroll", icon: TrendingUp, title: "Gestão de Banca",      subtitle: "Controle de risco e ROI",    accent: ACCENT.blue,                available: true,  onClick: () => setView("bankroll") },
    { key: "hub",      icon: Trophy,     title: "Hub de Evolução",      subtitle: "Missões, XP e patentes",     accent: ACCENT.gold,  tag: "NOVO",  available: true,  onClick: () => setView("hub") },
    { key: "revisor",  icon: Heart,      title: "Revisão de Mãos",      subtitle: "Análise técnica de jogadas", accent: ACCENT.amber,               available: false },
    { key: "ranges",   icon: Layers,     title: "Construtor de Ranges", subtitle: "Mapeamento estratégico",     accent: ACCENT.pink,                available: false },
  ];

  return (
    <div style={{ ...font, minHeight: "100vh", background: C.bg, color: C.text }}>
      {/* ── Top Nav (fixo) ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", padding: "0 28px", height: 88 }}>
          {/* Logo (maior) — clica para voltar à home */}
          <button
            onClick={goHome}
            style={{ background: "none", border: 0, padding: 0, cursor: "pointer", justifySelf: "start" }}
            title="Início"
          >
            <img src={logoUrl} alt="PokerSync" style={{ height: 54, width: "auto", objectFit: "contain", display: "block" }} />
          </button>

          {/* Botões centralizados */}
          <nav style={{ display: "flex", alignItems: "center", gap: 40, justifySelf: "center" }}>
            {["Início", "Desempenho"].map((item) => {
              const activeItem = nav === item;
              return (
                <button
                  key={item}
                  onClick={() => setNav(item)}
                  style={{ position: "relative", fontWeight: 700, fontSize: 14, letterSpacing: "0.14em", textTransform: "uppercase", color: activeItem ? C.text : C.sub, background: "none", border: "none", cursor: "pointer", paddingBottom: 6, transition: "color .2s" }}
                >
                  {item}
                  <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: C.text, borderRadius: 1, transform: activeItem ? "scaleX(1)" : "scaleX(0)", transformOrigin: "left", transition: "transform .25s" }} />
                </button>
              );
            })}
          </nav>

          {/* Ações à direita: Notificações, Ajuda, Avatar com nível */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, justifySelf: "end" }}>
            <NotificationsMenu />
            <HelpMenu />
            <div style={{ position: "relative", marginLeft: 10 }}>
              <AvatarWithLevel
                profile={profile}
                level={level}
                onClick={() => setMenuOpen((v) => !v)}
              />
              {menuOpen && (
                <ProfileMenu
                  profile={profile}
                  onProfileChange={setProfile}
                  onLogout={onLogout}
                  onClose={() => setMenuOpen(false)}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Views ── */}
      {view === "bankroll" ? (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 28px 0" }}>
          <BankrollView onBack={goHome} />
        </div>
      ) : view === "drill" ? (
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 28px 0" }}>
          <DrillView onBack={goHome} />
        </div>
      ) : view === "hub" ? (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 28px 0" }}>
          <HubView onBack={goHome} />
        </div>
      ) : (
        <main style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 28px 40px", display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Painel de boas-vindas — mostra APELIDO */}
          <HeroPanel apelido={profile.apelido} nome={profile.nome} />

          <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: C.sub, margin: 0, letterSpacing: "0.02em" }}>Módulos Principais</p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
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
