import React, { useState } from "react";
import { C } from "../theme.js";
import { fmtMoney, fmtSignedMoney } from "../../bankroll/format.js";

export default function EvolutionChart({ data }) {
  const [hover, setHover] = useState(null);

  if (!data || data.length < 2) {
    return (
      <p style={{ color: C.sub, fontSize: 13 }}>
        Sem dados suficientes neste período. Registre mais sessões ou amplie o filtro de tempo.
      </p>
    );
  }

  const W = 720, H = 240;
  const pad = { l: 12, r: 12, t: 16, b: 28 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const x = (i) => pad.l + (i / (data.length - 1)) * innerW;
  const y = (v) => pad.t + innerH - ((v - min) / range) * innerH;
  const step = innerW / (data.length - 1);

  const last = values[values.length - 1];
  const first = values[0];
  const stroke = last >= first ? C.pos : C.neg;
  const line = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  const baseY = pad.t + innerH;
  const area = `${x(0)},${baseY} ${line} ${x(data.length - 1)},${baseY}`;
  const ticks = [0, Math.floor((data.length - 1) / 2), data.length - 1];

  const hp = hover !== null ? data[hover] : null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 8 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: stroke }}>{fmtMoney(last)}</span>
        <span style={{ fontSize: 12, color: C.sub }}>banca atual · pico {fmtMoney(max)}</span>
      </div>

      <div style={{ position: "relative" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
          <defs>
            <linearGradient id="bkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={area} fill="url(#bkFill)" />
          <polyline points={line} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {hp && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={baseY} stroke={C.line} strokeDasharray="3 3" />}
          <circle cx={x(data.length - 1)} cy={y(last)} r="4" fill={stroke} />
          {hp && <circle cx={x(hover)} cy={y(hp.value)} r="5" fill={stroke} stroke={C.bg} strokeWidth="2" />}
          {ticks.map((i) => (
            <text key={i} x={x(i)} y={H - 8} fontSize="11" fill={C.sub} textAnchor="middle">{data[i].label}</text>
          ))}
          {data.map((d, i) => (
            <rect
              key={i}
              x={x(i) - step / 2}
              y={pad.t}
              width={step}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </svg>

        {hp && (
          <div
            style={{
              position: "absolute",
              left: `${(x(hover) / W) * 100}%`,
              top: `${(y(hp.value) / H) * 100}%`,
              transform: "translate(-50%, calc(-100% - 10px))",
              background: C.panel2,
              border: `1px solid ${C.line}`,
              borderRadius: 10,
              padding: "8px 10px",
              pointerEvents: "none",
              whiteSpace: "nowrap",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              zIndex: 5,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{hp.format} · {hp.date}</div>
            <div style={{ fontSize: 12, color: hp.net >= 0 ? C.pos : C.neg, marginTop: 2 }}>
              Sessão: {fmtSignedMoney(hp.net)}
            </div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>Banca: {fmtMoney(hp.value)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
