import React, { useEffect, useRef, useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { C, font } from "./theme.js";

const FAQS = [
  {
    q: "Como registrar uma sessão de bankroll?",
    a: "Acesse Gestão de Banca → Registrar sessão. Preencha data, formato, buy-in e cashout. O sistema calcula ROI e leaks automaticamente.",
  },
  {
    q: "Meus dados ficam privados?",
    a: "Sim. Cada usuário só acessa suas próprias sessões, notificações e histórico de treinos — garantido por políticas de segurança no banco (RLS).",
  },
  {
    q: "Como funciona o Modo Treino?",
    a: "As mãos (spots) são resolvidas com solver GTO e ficam num catálogo compartilhado. Seu desempenho, porém, é individual e privado.",
  },
  {
    q: "Esqueci minha senha, o que faço?",
    a: "Na tela de login, clique em 'Esqueci minha senha' e siga as instruções enviadas no seu e-mail.",
  },
];

export default function HelpMenu() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Ajuda"
        style={{
          display: "grid", placeItems: "center",
          width: 38, height: 38, borderRadius: 10,
          background: "transparent", border: 0, color: C.sub, cursor: "pointer",
        }}
      >
        <HelpCircle size={19} />
      </button>

      {open && (
        <div style={{
          ...font,
          position: "absolute", top: 46, right: 0, width: 340,
          background: "rgba(22,24,29,0.98)", backdropFilter: "blur(16px)",
          border: `1px solid ${C.line}`, borderRadius: 14,
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)", zIndex: 50, overflow: "hidden",
        }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.line}` }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Central de Ajuda</span>
          </div>

          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {FAQS.map((f, i) => {
              const isOpen = expanded === i;
              const isLast = i === FAQS.length - 1;
              return (
                <div key={i} style={{ borderBottom: isLast ? 0 : `1px solid ${C.line}` }}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : i)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 8,
                      padding: "12px 16px", background: "transparent", border: 0,
                      color: C.text, fontSize: 13, textAlign: "left", cursor: "pointer",
                    }}
                  >
                    <span style={{ flex: 1 }}>{f.q}</span>
                    {isOpen ? <ChevronUp size={14} color={C.sub} /> : <ChevronDown size={14} color={C.sub} />}
                  </button>
                  {isOpen && (
                    <p style={{ padding: "0 16px 12px", fontSize: 12, color: C.sub, lineHeight: 1.5 }}>{f.a}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
