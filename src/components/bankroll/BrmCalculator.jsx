import React from "react";
import { C } from "../theme.js";
import { Input, Segmented } from "./ui.jsx";
import { fmtMoney } from "../../bankroll/format.js";
import { RISK_PROFILES, suggestLimits, bankrollHealth } from "../../bankroll/brm.js";

const HEALTH = {
  good: { color: C.pos, label: "Banca saudável" },
  warn: { color: C.warn, label: "Banca justa" },
  bad: { color: C.neg, label: "Banca curta" },
  info: { color: C.sub, label: "Sem stake médio" },
};

export default function BrmCalculator({ bankroll, onBankroll, avgBuyIn, profile, onProfile }) {
  const limits = suggestLimits(bankroll, profile);
  const health = bankrollHealth(bankroll, avgBuyIn, profile);
  const h = HEALTH[health.status];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "end" }}>
        <Input
          label="Sua banca total (R$)"
          type="number"
          min="0"
          step="1"
          value={bankroll}
          onChange={(e) => onBankroll(e.target.value)}
        />
        <Segmented
          options={RISK_PROFILES.map((p) => ({ value: p, label: p }))}
          value={profile}
          onChange={onProfile}
        />
      </div>

      <div style={{ fontSize: 12, color: h.color }}>
        {h.label}
        {health.buyIns > 0 && (
          <span style={{ color: C.sub }}> · cobre {health.buyIns} buy-ins do stake médio</span>
        )}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ color: C.sub, textAlign: "left" }}>
            <th style={{ padding: "6px 0", fontWeight: 600 }}>Formato</th>
            <th style={{ padding: "6px 0", fontWeight: 600 }}>Buy-ins mín.</th>
            <th style={{ padding: "6px 0", fontWeight: 600, textAlign: "right" }}>Buy-in máximo</th>
          </tr>
        </thead>
        <tbody>
          {limits.map((l) => (
            <tr key={l.format} style={{ borderTop: `1px solid ${C.line}` }}>
              <td style={{ padding: "8px 0", color: C.text, fontWeight: 600 }}>{l.format}</td>
              <td style={{ padding: "8px 0", color: C.sub }}>{l.requiredBuyIns}</td>
              <td style={{ padding: "8px 0", textAlign: "right", color: C.goldSoft, fontWeight: 600 }}>
                {fmtMoney(l.maxBuyIn)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
