import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Activity, Brain, Calculator, AlertTriangle, PlusCircle, History, Trash2 } from "lucide-react";
import { C, font, signColor } from "../theme.js";
import { aggregate, evolutionSeries, filterSeriesByRange, net } from "../../bankroll/calc.js";
import { buildCoachTips } from "../../bankroll/coach.js";
import { fmtSignedMoney } from "../../bankroll/format.js";
import {
  fetchSessions,
  fetchSettings,
  addSession as apiAddSession,
  deleteSession as apiDeleteSession,
  saveSettings,
} from "../../services/bankrollService.js";
import { Panel, Segmented } from "./ui.jsx";
import StatGrid from "./StatGrid.jsx";
import EvolutionChart from "./EvolutionChart.jsx";
import CoachPanel from "./CoachPanel.jsx";
import SmartEntryForm from "./SmartEntryForm.jsx";
import BrmCalculator from "./BrmCalculator.jsx";
import LeaksPanel from "./LeaksPanel.jsx";

const RANGES = [
  { value: "7D", label: "7D" },
  { value: "30D", label: "30D" },
  { value: "1Y", label: "Ano" },
  { value: "all", label: "Tudo" },
];

export default function BankrollView({ onBack }) {
  const [sessions, setSessions] = useState([]);
  const [bankroll, setBankroll] = useState(0);
  const [profile, setProfile] = useState("Padrão");
  const [range, setRange] = useState("all");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [s, cfg] = await Promise.all([fetchSessions(), fetchSettings()]);
        if (!alive) return;
        setSessions(s);
        setBankroll(cfg.bankroll);
        setProfile(cfg.profile);
      } catch (e) {
        console.error(e);
        if (alive) setErr(e?.message || "Falha ao carregar sua banca.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  async function addSession(s) {
    setSessions((prev) => [...prev, s]);
    try {
      const saved = await apiAddSession(s);
      setSessions((prev) => prev.map((x) => (x.id === s.id ? saved : x)));
    } catch (e) {
      console.error(e);
      setErr("Não foi possível salvar a sessão.");
      setSessions((prev) => prev.filter((x) => x.id !== s.id));
    }
  }

  async function removeSession(id) {
    const backup = sessions;
    setSessions((prev) => prev.filter((x) => x.id !== id));
    try {
      await apiDeleteSession(id);
    } catch (e) {
      console.error(e);
      setErr("Não foi possível excluir. Restaurando.");
      setSessions(backup);
    }
  }

  async function updateProfile(p) {
    setProfile(p);
    try { await saveSettings({ bankroll, profile: p }); }
    catch (e) { console.error(e); }
  }

  const base = Number(bankroll) || 0;
  const agg = useMemo(() => aggregate(sessions), [sessions]);
  const currentBankroll = base + agg.profit;
  const series = useMemo(() => evolutionSeries(sessions, base), [sessions, base]);
  const filteredSeries = useMemo(() => filterSeriesByRange(series, range), [series, range]);
  const tips = useMemo(() => buildCoachTips(sessions, { bankroll: currentBankroll }), [sessions, currentBankroll]);
  const recent = [...sessions].reverse().slice(0, 8);

  if (loading) {
    return (
      <div style={{ ...font, padding: 40, color: C.sub, textAlign: "center" }}>
        Carregando sua banca…
      </div>
    );
  }

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
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Gestão de Banca</h1>
          <p style={{ fontSize: 13, color: C.sub, marginTop: 2 }}>
            Inserção manual inteligente, análise de leaks e coach de bankroll.
          </p>
        </div>
      </div>

      {err && (
        <div style={{ color: C.neg, fontSize: 13, background: "rgba(239,68,68,0.08)", border: `1px solid rgba(239,68,68,0.35)`, padding: "8px 12px", borderRadius: 8 }}>
          {err}
        </div>
      )}

      <StatGrid agg={agg} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
        <Panel title="Evolução da banca" icon={Activity} right={<Segmented options={RANGES} value={range} onChange={setRange} />}>
          <EvolutionChart data={filteredSeries} />
        </Panel>
        <Panel title="AI Poker Coach" icon={Brain}>
          <CoachPanel tips={tips} />
        </Panel>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
        <Panel title="Registrar sessão" icon={PlusCircle}>
          <SmartEntryForm sessions={sessions} onAdd={addSession} />
        </Panel>
        <Panel title="Sessões recentes" icon={History}>
          {recent.length === 0 ? (
            <p style={{ color: C.sub, fontSize: 13 }}>Nenhuma sessão registrada.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {recent.map((s) => {
                const result = net(s);
                return (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: `1px solid ${C.line}` }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>
                        {s.format} · {s.date}{s.stake ? ` · ${s.stake}` : ""}
                      </div>
                      <div style={{ fontSize: 12, color: C.sub }}>
                        {s.venue || "—"}{s.notes ? ` · ${s.notes}` : ""}
                      </div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: signColor(result) }}>{fmtSignedMoney(result)}</span>
                    <button onClick={() => removeSession(s.id)} title="Excluir" style={{ background: "none", border: 0, color: C.sub, cursor: "pointer" }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
        <Panel title="Calculadora de Banca (BRM)" icon={Calculator}>
          <BrmCalculator currentBankroll={currentBankroll} avgBuyIn={agg.avgBuyIn} profile={profile} onProfile={updateProfile} />
        </Panel>
        <Panel title="Controle de Leaks" icon={AlertTriangle}>
          <LeaksPanel sessions={sessions} />
        </Panel>
      </div>
    </div>
  );
}
