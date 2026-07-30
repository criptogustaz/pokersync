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

const ACCENT = "#E0B24C"; // âmbar/dourado — coerente com o card "Hub" no dashboard

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

  if (loading) return <div style={{ ...font, padding: 40, color: C.sub, textAlign: "center" }}>Carregando Hub…</div>;
  if (err) return <div style={{ ...font, padding: 40, color: C.neg, textAlign: "center" }}>{err}</div>;

  const level = progress.level;
  const patente = getPatente(level);
  const xpNeeded = xpForNextLevel(level);
  const xpCurrent = progress.xp_current;
  const pct = Math.min(100, (xpCurrent / xpNeeded) * 100);

  const showingCatalog = missions.length === 0;
  const grp = (kind) => showingCatalog
    ? catalog.filter((m) => m.kind === kind)
    : missions.filter((m) => m.missions?.kind === kind);
  const dailyMissions = grp("daily");
  const weeklyMissions = grp("weekly");
  const challengeMissions = grp("challenge");

  return (
    <div style={{ ...font, display: "flex", flexDirection: "column", gap: 24, paddingBottom: 60 }}>
      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onBack}
          title="Voltar"
          style={{ display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: 10, background: C.panel, border: `1px solid ${C.line}`, color: C.sub, cursor: "pointer" }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, margin: 0 }}>Hub de Evolução</h1>
          <p style={{ fontSize: 13, color: C.sub, marginTop: 2 }}>
            Ganhe XP, mantenha a ofensiva e suba de patente.
          </p>
        </div>
      </div>

      {/* Card de nível — mono com acento âmbar sutil */}
      <div
        style={{
          borderRadius: 14,
          padding: 26,
          position: "relative",
          overflow: "hidden",
          background: C.panel,
          border: `1px solid ${C.line}`,
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 100% 0%, ${ACCENT}12 0%, transparent 60%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: -20, bottom: -28, opacity: 0.08, color: ACCENT }}>
          <Trophy size={170} strokeWidth={1} />
        </div>

        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 22, alignItems: "center" }}>
          {/* Distintivo de nível */}
          <div style={{
            width: 80, height: 80, borderRadius: 16,
            background: "#111",
            border: `2px solid ${ACCENT}`,
            display: "grid", placeItems: "center",
            color: ACCENT,
            boxShadow: `0 0 0 4px rgba(224,178,76,0.08)`,
          }}>
            <span style={{ fontSize: 34, fontWeight: 800, lineHeight: 1 }}>{level}</span>
          </div>

          {/* Patente + barra de XP */}
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: C.sub, margin: 0, fontWeight: 700 }}>
              Nível {level}
            </p>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginTop: 2, color: C.text, marginBottom: 0 }}>{patente}</h2>
            <div style={{ marginTop: 12 }}>
              <div style={{
                height: 8, borderRadius: 4,
                background: "rgba(255,255,255,0.06)",
                border: `1px solid ${C.line}`,
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", width: `${pct}%`,
                  background: `linear-gradient(90deg, ${ACCENT}, #F5D48C)`,
                  transition: "width .4s",
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: C.sub }}>
                <span>{xpCurrent} XP</span>
                <span>{xpNeeded} XP para o próximo</span>
              </div>
            </div>
          </div>

          {/* Streak em destaque */}
          <div style={{
            textAlign: "center", padding: "10px 14px", borderRadius: 12,
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${C.line}`,
            minWidth: 84,
          }}>
            <Flame size={22} color={progress.streak_days > 0 ? "#F97316" : C.sub} style={{ margin: "0 auto" }} />
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginTop: 2 }}>{progress.streak_days}</div>
            <div style={{ fontSize: 10, color: C.sub, textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700 }}>Dias</div>
          </div>
        </div>

        {/* Mini-estatísticas */}
        <div style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 14, marginTop: 22,
          paddingTop: 20,
          borderTop: `1px solid ${C.line}`,
        }}>
          <MiniStat icon={Zap} label="XP total" value={progress.xp_total.toLocaleString("pt-BR")} />
          <MiniStat icon={Target} label="Combo GTO" value={progress.combo_gto} />
          <MiniStat icon={Trophy} label="Recorde streak" value={progress.streak_best} />
        </div>
      </div>

      {showingCatalog && (
        <div style={{
          padding: "12px 16px", borderRadius: 10,
          background: `rgba(224,178,76,0.08)`,
          border: `1px solid rgba(224,178,76,0.25)`,
          fontSize: 12, color: ACCENT, fontWeight: 500,
        }}>
          As missões abaixo são um preview do catálogo. Em breve você receberá missões diárias personalizadas ao seu nível.
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
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        display: "grid", placeItems: "center",
        width: 32, height: 32, borderRadius: 8,
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${C.line}`,
      }}>
        <Icon size={14} color={C.sub} />
      </div>
      <div>
        <div style={{ fontSize: 10, color: C.sub, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{value}</div>
      </div>
    </div>
  );
}

function MissionSection({ title, icon: Icon, missions, preview }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <Icon size={16} color={ACCENT} />
        <h3 style={{ fontSize: 12, fontWeight: 800, color: C.text, textTransform: "uppercase", letterSpacing: ".12em", margin: 0 }}>{title}</h3>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
        {missions.map((item, idx) => (
          <MissionCard key={idx} item={item} preview={preview} />
        ))}
      </div>
    </div>
  );
}

function MissionCard({ item, preview }) {
  const m = preview ? item : item.missions;
  const Icon = ICON_MAP[m?.icon] || Circle;
  const goal = preview ? m.goal_base : item.goal_value;
  const progress = preview ? 0 : item.progress;
  const completed = !preview && item.status === "completed";
  const pct = Math.min(100, (progress / goal) * 100);

  return (
    <div style={{
      padding: 16, borderRadius: 12,
      background: completed ? "rgba(47,184,154,0.06)" : C.panel,
      border: `1px solid ${completed ? "rgba(47,184,154,0.35)" : C.line}`,
      opacity: preview ? 0.85 : 1,
      transition: "border-color .2s",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: completed ? "rgba(47,184,154,0.15)" : "rgba(224,178,76,0.10)",
          border: `1px solid ${completed ? "rgba(47,184,154,0.4)" : "rgba(224,178,76,0.25)"}`,
          display: "grid", placeItems: "center",
          flexShrink: 0,
        }}>
          <Icon size={18} color={completed ? C.pos : ACCENT} strokeWidth={1.75} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: C.text, flex: 1, margin: 0 }}>{m.title}</h4>
            <span style={{ fontSize: 11, color: ACCENT, fontWeight: 800 }}>+{m.xp_reward} XP</span>
          </div>
          <p style={{ fontSize: 12, color: C.sub, marginTop: 4, lineHeight: 1.4, margin: "4px 0 0" }}>{m.description}</p>

          <div style={{ marginTop: 12 }}>
            <div style={{
              height: 6, borderRadius: 3,
              background: "rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%", width: `${pct}%`,
                background: completed ? C.pos : ACCENT,
                transition: "width .4s",
              }} />
            </div>
            <div style={{ fontSize: 11, color: C.sub, marginTop: 5, fontWeight: 500 }}>
              {progress} / {goal}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
