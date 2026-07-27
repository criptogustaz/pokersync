import React from "react";
import { C } from "../theme.js";
import { fmtMoney } from "../../bankroll/format.js";

export default function EvolutionChart({ data }) {
  if (!data || data.length < 2) {
    return (
      <p style={{ color: C.sub, fontSize: 13 }}>
        Registre ao menos 2 sessões para visualizar a evolução da banca.
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

  const last = values[values.length - 1];
  const first = values[0];
  const peak = max;
  const stroke = last >= first ? C.pos : C.neg;
  const line = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  const baseY = pad.t + innerH;
  const area = `${x(0)},${baseY} ${line} ${x(data.length - 1)},${baseY}`;
  const ticks = [0, Math.floor((data.length - 1) / 2), data.length - 1];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 8 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: stroke }}>{fmtMoney(last)}</span>
        <span style={{ fontSize: 12, color: C.sub }}>banca atual · pico {fmtMoney(peak)}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
        <defs>
          <linearGradient id="bkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#bkFill)" />
        <polyline
          points={line}
          fill="none"
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={x(data.length - 1)} cy={y(last)} r="4" fill={stroke} />
        {ticks.map((i) => (
          <text key={i} x={x(i)} y={H - 8} fontSize="11" fill={C.sub} textAnchor="middle">
            {data[i].label}
          </text>
        ))}
      </svg>
    </div>
  );
}
