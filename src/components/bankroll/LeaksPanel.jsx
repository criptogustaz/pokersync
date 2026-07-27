import React, { useState } from "react";
import { C, signColor } from "../theme.js";
import { Segmented } from "./ui.jsx";
import { fmtSignedMoney, fmtPct } from "../../bankroll/format.js";
import { groupStats } from "../../bankroll/calc.js";
import { findLeaks } from "../../bankroll/leaks.js";

const DIMS = [
  { value: "format", label: "Formato" },
  { value: "weekday", label: "Dia" },
  { value: "time", label: "Horário" },
];
const DIM_NOUN = { format: "formato", weekday: "dia", time: "horário" };

export default function LeaksPanel({ sessions }) {
  const [dim, setDim] = useState("format");
  const rows = groupStats(sessions, dim);
  const worst = findLeaks(sessions, { minSample: 3 })[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {worst ? (
        <div
          style={{
            fontSize: 13,
            color: C.text,
            background: "rgba(239,68,68,0.10)",
            border: `1px solid rgba(239,68,68,0.35)`,
            borderRadius: 10,
            padding: "10px 12px",
          }}
        >
          Maior vazamento: <strong>{worst.key}</strong> ({DIM_NOUN[worst.dimension]}) — ROI{" "}
          <strong style={{ color: C.neg }}>{fmtPct(worst.roi)}</strong>, {fmtSignedMoney(worst.net)}
        </div>
      ) : (
        <div style={{ fontSize: 13, color: C.pos }}>Nenhum vazamento relevante detectado. 👌</div>
      )}

      <Segmented options={DIMS} value={dim} onChange={setDim} />

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ color: C.sub, textAlign: "left" }}>
            <th style={{ padding: "6px 0", fontWeight: 600 }}>{DIMS.find((d) => d.value === dim).label}</th>
            <th style={{ padding: "6px 0", fontWeight: 600 }}>Sessões</th>
            <th style={{ padding: "6px 0", fontWeight: 600, textAlign: "right" }}>ROI</th>
            <th style={{ padding: "6px 0", fontWeight: 600, textAlign: "right" }}>Resultado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.key}
              style={{
                borderTop: `1px solid ${C.line}`,
                background: r.net < 0 ? "rgba(239,68,68,0.06)" : "transparent",
              }}
            >
              <td style={{ padding: "8px 0", color: C.text, fontWeight: 600 }}>{r.key}</td>
              <td style={{ padding: "8px 0", color: C.sub }}>{r.n}</td>
              <td style={{ padding: "8px 0", textAlign: "right", color: signColor(r.roi) }}>{fmtPct(r.roi)}</td>
              <td style={{ padding: "8px 0", textAlign: "right", color: signColor(r.net), fontWeight: 600 }}>
                {fmtSignedMoney(r.net)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
