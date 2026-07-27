import React, { useEffect, useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { C } from "../theme.js";
import { Input, Select } from "./ui.jsx";
import { FORMATS, suggestFormat, suggestBuyIn, knownVenues, todayISO } from "../../bankroll/format.js";

const uid = () =>
  (globalThis.crypto?.randomUUID?.() ?? `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);

export default function SmartEntryForm({ sessions, onAdd }) {
  const smartFormat = suggestFormat(sessions);
  const [form, setForm] = useState({
    date: todayISO(),
    time: "20:00",
    format: smartFormat,
    buyIn: suggestBuyIn(sessions, smartFormat),
    reentries: 0,
    cashout: "",
    venue: "",
    notes: "",
  });
  const [error, setError] = useState("");

  // Inteligência: ao trocar o formato, sugere o último buy-in usado nele.
  useEffect(() => {
    setForm((f) => ({ ...f, buyIn: suggestBuyIn(sessions, f.format) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.format]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function submit() {
    const buyIn = Number(form.buyIn);
    if (!buyIn || buyIn <= 0) {
      setError("Informe um buy-in válido.");
      return;
    }
    setError("");
    onAdd({
      id: uid(),
      date: form.date,
      time: form.time,
      format: form.format,
      buyIn,
      reentries: Number(form.reentries) || 0,
      cashout: Number(form.cashout) || 0,
      venue: form.venue.trim(),
      notes: form.notes.trim(),
    });
    // mantém data/formato/local para input rápido em sequência
    setForm((f) => ({ ...f, cashout: "", reentries: 0, notes: "" }));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: C.goldSoft,
        }}
      >
        <Sparkles size={13} />
        Sugerido pelo seu histórico: <strong style={{ color: C.text }}>{smartFormat}</strong>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        <Input label="Data" type="date" value={form.date} onChange={set("date")} />
        <Input label="Hora" type="time" value={form.time} onChange={set("time")} />
        <Select label="Formato" options={FORMATS} value={form.format} onChange={set("format")} />
        <Input label="Buy-in (R$)" type="number" min="0" step="0.01" value={form.buyIn} onChange={set("buyIn")} />
        <Input label="Reentradas" type="number" min="0" step="1" value={form.reentries} onChange={set("reentries")} />
        <Input label="Cashout (R$)" type="number" min="0" step="0.01" value={form.cashout} onChange={set("cashout")} placeholder="0" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <Input label="Plataforma / Local" value={form.venue} onChange={set("venue")} list="venues" placeholder="PokerStars, GGPoker…" />
        <Input label="Notas" value={form.notes} onChange={set("notes")} placeholder="Observações da sessão" />
      </div>
      <datalist id="venues">
        {knownVenues(sessions).map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>

      {error && <span style={{ color: C.negSoft, fontSize: 12 }}>{error}</span>}

      <button
        onClick={submit}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          alignSelf: "flex-start",
          border: 0,
          cursor: "pointer",
          borderRadius: 10,
          padding: "10px 18px",
          fontSize: 14,
          fontWeight: 600,
          color: "#141207",
          background: C.gold,
        }}
      >
        <Plus size={16} /> Registrar sessão
      </button>
    </div>
  );
}
