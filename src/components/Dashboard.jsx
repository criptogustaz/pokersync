import React, { useEffect, useState } from "react";
import { Target, TrendingUp, Heart, Layers, Trophy } from "lucide-react";
import { C, font } from "./theme.js";
import Logo from "./Logo.jsx";
import Track from "./Track.jsx";
import ModuleCard from "./ModuleCard.jsx";
import Avatar from "./Avatar.jsx";
import ProfileMenu from "./ProfileMenu.jsx";
import NotificationsMenu from "./NotificationsMenu.jsx";
import HelpMenu from "./HelpMenu.jsx";
import HeroPanel from "./HeroPanel.jsx";
import BankrollView from "./bankroll/BankrollView.jsx";
import DrillView from "./drill/DrillView.jsx";
import HubView from "./hub/HubView.jsx";
import { fetchProfile } from "../services/profileService.js";

export default function Dashboard({ onLogout }) {
  const [view, setView] = useState("home");
  const [profile, setProfile] = useState({ nome: "", apelido: "", avatar_id: 1 });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetchProfile().then(setProfile).catch(console.error);
  }, []);

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

          <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
            <NotificationsMenu />
            <HelpMenu />
            <div style={{ position: "relative", marginLeft: 8 }}>
              <Avatar
                id={profile.avatar_id}
                size={38}
                onClick={() => setMenuOpen((v) => !v)}
                title="Perfil"
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

      {view === "bankroll" ? (
        <div style={{ maxWidth: 1152, margin: "0 auto", padding: "24px 24px 0" }}>
          <BankrollView onBack={() => setView("home")} />
        </div>
      ) : view === "drill" ? (
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "24px 24px 0" }}>
          <DrillView onBack={() => setView("home")} />
        </div>
      ) : view === "hub" ? (
        <div style={{ maxWidth: 1152, margin: "0 auto", padding: "24px 24px 0" }}>
          <HubView onBack={() => setView("home")} />
        </div>
      ) : (
        <>
          <div style={{ maxWidth: 1152, margin: "0 auto", padding: "32px 24px 0" }}>
            <HeroPanel nome={profile.nome} />
          </div>

          <main style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px 60px" }}>
            <Track title="Módulos">
              <ModuleCard
                title="Modo Treino"
                desc="Simulação de situações, drills e análise de mãos em tempo real."
                icon={Target}
                tint={C.felt}
                edge={C.feltEdge}
                onClick={() => setView("drill")}
              />
              <ModuleCard
                title="Gestão de Banca"
                desc="Controle financeiro, análise de lucros e evolução do bankroll."
                icon={TrendingUp}
                tint="#1a1710"
                edge={C.gold}
                onClick={() => setView("bankroll")}
              />
              <ModuleCard
                title="Hub de Evolução"
                desc="Missões diárias, XP, patentes e ofensiva de estudos."
                icon={Trophy}
                tint="#1a1710"
                edge={C.gold}
                onClick={() => setView("hub")}
              />
              <ModuleCard
                title="Revisão de Mãos"
                desc="Reveja spots marcados e compare suas ações com a solução ótima."
                icon={Heart}
                tint={C.panel2}
                edge={C.line}
                comingSoon
              />
              <ModuleCard
                title="Construtor de Range"
                desc="Monte e edite ranges pré-flop e por rua com base em nós GTO."
                icon={Layers}
                tint={C.panel2}
                edge={C.line}
                comingSoon
              />
            </Track>
          </main>
        </>
      )}
    </div>
  );
}
