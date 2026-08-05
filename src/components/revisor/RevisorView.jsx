import React, { useState } from "react";
import { ArrowLeft, BookOpen } from "lucide-react";
import RevisorFila from "./RevisorFila.jsx";
import RevisorNovaMao from "./RevisorNovaMao.jsx";
import RevisorDetalhe from "./RevisorDetalhe.jsx";

/**
 * Wrapper que gerencia a navegação interna do módulo Revisor de Mãos,
 * seguindo o padrão dos outros views (HubView, BankrollView, DrillView).
 */
export default function RevisorView({ onBack }) {
  const [screen, setScreen] = useState("fila");
  const [selectedId, setSelectedId] = useState(null);

  function goFila() { setSelectedId(null); setScreen("fila"); }
  function goNova() { setScreen("nova"); }
  function goDetalhe(id) { setSelectedId(id); setScreen("detalhe"); }

  return (
    <div style={{ color: "#fff" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button
          onClick={screen === "fila" ? onBack : goFila}
          style={{
            background: "transparent",
            border: "1px solid #2a2a2a",
            color: "#fff",
            borderRadius: 8,
            padding: 8,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Voltar"
        >
          <ArrowLeft size={18} />
        </button>
        <BookOpen size={20} color="#A855F7" />
        <h1 style={{ fontSize: 20, margin: 0, fontWeight: 600 }}>
          Revisão de Mãos
        </h1>
      </header>

      {screen === "fila" && (
        <RevisorFila onNova={goNova} onOpen={goDetalhe} />
      )}
      {screen === "nova" && (
        <RevisorNovaMao onSaved={goFila} onSavedAndReview={goDetalhe} onCancel={goFila} />
      )}
      {screen === "detalhe" && selectedId && (
        <RevisorDetalhe reviewId={selectedId} onBack={goFila} />
      )}
    </div>
  );
}
