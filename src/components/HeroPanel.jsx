import React, { useEffect, useState } from "react";
import { Club, TrendingUp, TrendingDown, Target, Percent } from "lucide-react";
import { C } from "./theme.js";
import { fetchSessions, fetchSettings } from "../services/bankrollService.js";
import { aggregate } from "../bankroll/calc.js";

export default function HeroPanel({ apelido, nome }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    bankroll: 0,
    profit: 0,
    roi: 0,
    itm: 0,
    tourneyCount: 0,
    totalSessions: 0,
  });

  useEffect(() => {
    (async () => {
      try {
        const [sessions, settings] = await Promise.all([fetchSessions(), fetchSettings()]);
        const agg = aggregate(sessions);
        setData({
          bankroll: (Number(settings.bankroll) || 0) + agg.profit,
          profit: agg.profit,
          roi: agg.roi || 0,
          itm: agg.itm || 0,
          tourneyCount: agg.tourneyCount || 0,
          totalSessions: sessions.length,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Nome exibido: apelido > primeiro nome > "Jogador".
  const displayName = (apelido && apelido.trim())
    || (nome && nome.split(" ")[0])
    || "Jogador";

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

      <p style={{ fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: C.goldSoft, margin: 0 }}>
        Bem-vindo de volta
      </p>
      <h1 style={{ fontSize: 34, fontWeight: 700, marginTop: 6, color: C.text, lineHeight: 1.1 }}>
        {displayName}
      </h1>

      {isNew ? (
        <p style={{ fontSize: 13, color: C.sub, marginTop: 12, maxWidth: 520 }}>
          Registre sua primeira sessão para acompanhar sua evolução — banca, ROI e ITM aparecerão aqui.
        </p>
      ) : (
        <div
          style={{
            marginTop: 22,
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
            gap: 20,
            position: "relative",
            zIndex: 1,
          }}
        >
          <Stat highlight label="Banca atual" value={loading ? "…" : `R$ ${data.bankroll.toFixed(0)}`} />
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
            label="ITM (torneios)"
            value={loading ? "…" : `${data.itm.toFixed(0)}%`}
            tone="neutral"
            icon={Percent}
            hint={data.tourneyCount > 0 ? `${data.tourneyCount} torneios` : "—"}
          />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone = "neutral", icon: Icon, hint, highlight }) {
  const color = tone === "pos" ? C.pos : tone === "neg" ? C.neg : C.text;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        {Icon && <Icon size={12} color={C.sub} />}
        <span style={{ fontSize: 11, color: C.sub, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: highlight ? 28 : 22, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
      {hint && <div style={{ fontSize: 11, color: C.sub, marginTop: 3 }}>{hint}</div>}
    </div>
  );
}
