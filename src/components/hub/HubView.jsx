import React, { useEffect, useState } from "react";
import {
  ArrowLeft, Trophy, Flame, Zap, Target, TrendingUp,
  CheckCircle2, Calendar, Shield, Circle,
} from "lucide-react";
import { C, font } from "../theme.js";
import {
  fetchProgress, fetchActiveMissions, fetchMissionCatalog,
  getPatente, xpForNextLevel,
} from "../../services/xpService.js";

const ICON_MAP = {
  "target": Target,
  "check-circle": CheckCircle2,
  "trending-up": TrendingUp,
  "flame": Flame,
  "calendar": Calendar,
  "shield": Shield,
};

export default function HubView({ onBack }) {
  const [progress, setProgress] = useState(null);
  const [missions, setMissions] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [p, m, c] = await Promise.all([
          fetchProgress(),
          fetchActiveMissions(),
          fetchMissionCatalog(),
        ]);
        if (!alive) return;
        setProgress(p);
        setMissions(m);
        setCatalog(c);
      } catch (e) {
        console.error(e);
        if (alive) setErr(e?.message || "Falha ao carregar Hub.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) {
    return <div style={{ ...font, padding: 40, color: C.sub, textAlign: "center" }}>Carregando Hub…</div>;
  }
  if (err) {
    return <div style={{ ...font, padding: 40, color: "#f87171", textAlign: "center" }}>{err}</div>;
  }

  const level = progress.level;
  const patente = getPatente(level);
  const xpNeeded = xpForNextLevel(level);
  const xpCurrent = progress.xp_current;
  const pct = Math.min(100, (xpCurrent / xpNeeded) * 100);

  const showingCatalog = missions.length === 0;
  const dailyMissions = showingCatalog
    ? catalog.filter((m) => m.kind === "daily")
    : missions.filter((m) => m.missions?.kind === "daily");
  const weeklyMissions = showingCatalog
    ? catalog.filter((m) => m.kind === "weekly")
    : missions.filter((m) => m.missions?.kind === "weekly");
  const challengeMissions = showingCatalog
    ? catalog.filter((m) => m.kind === "challenge")
    : missions.filter((m) => m.missions?.kind === "challenge");

  return (
    <div style={{ ...font, display: "flex", flexDirection: "column", gap: 24, paddingBottom: 60 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onBack}
          title="Voltar"
          style={{ display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: 10, background: C.panel2, border: `1px solid ${C.line}`, color: C.sub, cursor: "pointer" }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Hub de Evolução</h1>
          <p style={{ fontSize: 13, color: C.sub, marginTop: 2 }}>
            Ganhe XP, mantenha a ofensiva e suba de patente.
          </p>
        </div>
      </div>

      <div
        style={{
          borderRadius: 16,
          padding: 28,
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(120deg, ${C.felt}, ${C.panel})`,
          border: `1px solid ${C.line}`,
        }}
      >
        <div style={{ position: "absolute", right: -16, bottom: -24, opacity: 0.18, color: C.gold }}>
          <Trophy size={160} strokeWidth={1} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 20, alignItems: "center", position: "relative", zIndex: 1 }}>
          <div style={{
            width: 76, height: 76, borderRadius: 16,
            background: "rgba(201,162,39,0.15)",
            border: `2px solid ${C.gold}`,
            display: "grid", placeItems: "center",
            color: C.gold,
          }}>
            <span style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{level}</span>
          </div>

          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: C.goldSoft }}>
              Nível {level}
            </p>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginTop: 2, color: C.text }}>{patente}</h2>
            <div style={{ marginTop: 10 }}>
              <div style={{
                height: 8, borderRadius: 4,
                background: "rgba(255,255,255,0.06)",
                border: `1px solid ${C.line}`,
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", width: `${pct}%`,
                  background: `linear-gradient(90deg, ${C.gold}, ${C.goldSoft || C.gold})`,
                  transition: "width .4s",
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: C.sub }}>
                <span>{xpCurrent} XP</span>
                <span>{xpNeeded} XP para o próximo</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center", padding: "8px 12px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.line}` }}>
            <Flame size={22} color={progress.streak_days > 0 ? "#f97316" : C.sub} style={{ margin: "0 auto" }} />
            <div style={{ fontSize: 22, fontWeight: 700, color: C.text, marginTop: 2 }}>{progress.streak_days}</div>
            <div style={{ fontSize: 10, color: C.sub, textTransform: "uppercase", letterSpacing: ".08em" }}>Dias</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginTop: 20, position: "relative", zIndex: 1 }}>
          <MiniStat icon={Zap} label="XP total" value={progress.xp_total.toLocaleString("pt-BR")} />
          <MiniStat icon={Target} label="Combo GTO" value={progress.combo_gto} />
          <MiniStat icon={Trophy} label="Recorde streak" value={progress.streak_best} />
        </div>
      </div>

      {showingCatalog && (
        <div style={{
          padding: "10px 14px", borderRadius: 10,
          background: "rgba(201,162,39,0.08)",
          border: `1px solid rgba(201,162,39,0.3)`,
          fontSize: 12, color: C.goldSoft,
        }}>
          As missões abaixo são um preview do catálogo. Em breve, você receberá missões diárias personalizadas ao seu nível.
        </div>
      )}

      {dailyMissions.length > 0 && (
        <MissionSection title="Missões diárias" icon={Calendar} missions={dailyMissions} preview={showingCatalog} />
      )}
      {weeklyMissions.length > 0 && (
        <MissionSection title="Missões semanais" icon={Flame} missions={weeklyMissions} preview={showingCatalog} />
      )}
      {challengeMissions.length > 0 && (
        <MissionSection title="Desafios" icon={Shield} missions={challengeMissions} preview={showingCatalog} />
      )}
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Icon size={14} color={C.sub} />
      <div>
        <div style={{ fontSize: 10, color: C.sub, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{value}</div>
      </div>
    </div>
  );
}

function MissionSection({ title, icon: Icon, missions, preview }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Icon size={16} color={C.gold} />
        <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: ".06em" }}>{title}</h3>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        {missions.map((item, idx) => (
          <MissionCard key={idx} item={item} preview={preview} />
        ))}
      </div>
    </div>
  );
}

function MissionCard({ item, preview }) {
  const m = preview ? item : item.missions;
  const iconKey = m?.icon;
  const Icon = ICON_MAP[iconKey] || Circle;
  const goal = preview ? m.goal_base : item.goal_value;
  const progress = preview ? 0 : item.progress;
  const completed = !preview && item.status === "completed";
  const pct = Math.min(100, (progress / goal) * 100);

  return (
    <div style={{
      padding: 16, borderRadius: 12,
      background: completed ? "rgba(74,222,128,0.06)" : C.panel2,
      border: `1px solid ${completed ? "rgba(74,222,128,0.3)" : C.line}`,
      opacity: preview ? 0.75 : 1,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "rgba(201,162,39,0.12)",
          display: "grid", placeItems: "center",
          flexShrink: 0,
        }}>
          <Icon size={18} color={C.gold} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: C.text, flex: 1 }}>{m.title}</h4>
            <span style={{ fontSize: 11, color: C.gold, fontWeight: 700 }}>+{m.xp_reward} XP</span>
          </div>
          <p style={{ fontSize: 12, color: C.sub, marginTop: 4, lineHeight: 1.4 }}>{m.description}</p>

          <div style={{ marginTop: 10 }}>
            <div style={{
              height: 6, borderRadius: 3,
              background: "rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%", width: `${pct}%`,
                background: completed ? "#4ade80" : C.gold,
                transition: "width .4s",
              }} />
            </div>
            <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>
              {progress} / {goal}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
