import React, { useEffect, useState } from "react";
import { C } from "../theme.js";
import { Input, Segmented } from "./ui.jsx";
import { fmtMoney } from "../../bankroll/format.js";
import { RISK_PROFILES, suggestLimits, bankrollHealth } from "../../bankroll/brm.js";

const HEALTH = {
  good: [C.pos, "Banca saudável"],
  warn: [C.warn, "Banca justa"],
  bad: [C.neg, "Banca curta"],
  info: [C.sub, "Sem stake médio"],
};

export default function BrmCalculator({ currentBankroll, avgBuyIn, profile, onProfile }) {
  const [sim, setSim] = useState(currentBankroll);
  const [dirty, setDirty] = useState(false);

  // Sincronização inteligente: enquanto o usuário não editar, o campo segue a Banca Atual real.
  useEffect(() => {
    if (!dirty) setSim(currentBankroll);
  }, [currentBankroll, dirty]);

  const limits = suggestLimits(sim, profile);
  const health = bankrollHealth(sim, avgBuyIn, profile);
  const [hcolor, hlabel] = HEALTH[health.status];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Input
            label="Sua banca total (R$)"
            type="number"
            min="0"
            step="1"
            value={sim}
            onChange={(e) => { setSim(e.target.value); setDirty(true); }}
          />
          <span style={{ fontSize: 11, color: C.sub }}>
            {dirty ? (
              <>
                Simulação · saldo real {fmtMoney(currentBankroll)}{" "}
                <button
                  onClick={() => { setDirty(false); setSim(currentBankroll); }}
                  style={{ background: "none", border: 0, color: C.goldSoft, cursor: "pointer", padding: 0, font: "inherit", textDecoration: "underline" }}
                >
                  usar saldo real
                </button>
              </>
            ) : (
              <>Preenchido com sua banca atual · editável para simular saques/depósitos.</>
            )}
          </span>
        </div>
        <Segmented options={RISK_PROFILES.map((p) => ({ value: p, label: p }))} value={profile} onChange={onProfile} />
      </div>

      <div style={{ fontSize: 12, color: hcolor }}>
        {hlabel}
        {health.buyIns > 0 && <span style={{ color: C.sub }}> · cobre {health.buyIns} buy-ins do stake médio</span>}
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
              <td style={{ padding: "8px 0", textAlign: "right", color: C.goldSoft, fontWeight: 600 }}>{fmtMoney(l.maxBuyIn)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
