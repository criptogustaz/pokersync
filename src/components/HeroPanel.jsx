import React, { useEffect, useState } from "react";
import { Club, TrendingUp, TrendingDown, Calendar, Target } from "lucide-react";
import { C } from "./theme.js";
import { fetchSessions, fetchSettings } from "../services/bankrollService.js";
import { aggregate } from "../bankroll/calc.js";

function daysSince(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function sessionsInLastDays(sessions, days) {
  const cutoff = Date.now() - days * 86400000;
  return sessions.filter((s) => new Date(s.date).getTime() >= cutoff).length;
}

export default function HeroPanel({ nome }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    bankroll: 0,
    profit: 0,
    roi: 0,
    lastSessionDays: null,
    sessionsLast30: 0,
    totalSessions: 0,
  });

  useEffect(() => {
    (async () => {
      try {
        const [sessions, settings] = await Promise.all([fetchSessions(), fetchSettings()]);
        const agg = aggregate(sessions);
        const lastDate = sessions.length ? sessions[sessions.length - 1].date : null;
        setData({
          bankroll: (Number(settings.bankroll) || 0) + agg.profit,
          profit: agg.profit,
          roi: agg.roi || 0,
          lastSessionDays: daysSince(lastDate),
          sessionsLast30: sessionsInLastDays(sessions, 30),
          totalSessions: sessions.length,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const firstName = nome ? nome.split(" ")[0] : "";
  const isNew = data.totalSessions === 0;
  const profitPositive = data.profit >= 0;

  return (
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
      <div style={{ position: "absolute", right: -16, bottom: -24, opacity: 0.2, color: C.goldSoft }}>
        <Club size={160} strokeWidth={1} />
      </div>

      <p style={{ fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: C.goldSoft }}>
        Bem-vindo de volta{firstName ? `, ${firstName}` : ""}
      </p>

      {isNew ? (
        <>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginTop: 6, maxWidth: 560, lineHeight: 1.2 }}>
            Vamos começar? Registre sua primeira sessão para acompanhar sua evolução.
          </h1>
          <p style={{ fontSize: 13, color: C.sub, marginTop: 8, maxWidth: 520 }}>
            Assim que você registrar dados, este painel mostra sua banca, ROI e ritmo de treino.
          </p>
        </>
      ) : (
        <>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginTop: 6, maxWidth: 560, lineHeight: 1.2 }}>
            Sua evolução em números.
          </h1>

          <div
            style={{
              marginTop: 20,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 16,
              position: "relative",
              zIndex: 1,
            }}
          >
            <Stat label="Banca atual" value={loading ? "…" : `R$ ${data.bankroll.toFixed(0)}`} tone="neutral" />
            <Stat
              label="Resultado"
              value={loading ? "…" : `${profitPositive ? "+" : ""}R$ ${data.profit.toFixed(0)}`}
              tone={profitPositive ? "pos" : "neg"}
              icon={profitPositive ? TrendingUp : TrendingDown}
            />
            <Stat
              label="ROI"
              value={loading ? "…" : `${data.roi.toFixed(1)}%`}
              tone={data.roi >= 0 ? "pos" : "neg"}
              icon={Target}
            />
            <Stat
              label="Sessões (30d)"
              value={loading ? "…" : `${data.sessionsLast30}`}
              tone="neutral"
              icon={Calendar}
              hint={
                data.lastSessionDays != null
                  ? data.lastSessionDays === 0
                    ? "Última: hoje"
                    : `Última: ${data.lastSessionDays}d atrás`
                  : ""
              }
            />
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, tone = "neutral", icon: Icon, hint }) {
  const color =
    tone === "pos" ? "#4ade80" : tone === "neg" ? "#f87171" : C.text;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        {Icon && <Icon size={12} color={C.sub} />}
        <span style={{ fontSize: 11, color: C.sub, textTransform: "uppercase", letterSpacing: ".06em" }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
      {hint && <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{hint}</div>}
    </div>
  );
}
