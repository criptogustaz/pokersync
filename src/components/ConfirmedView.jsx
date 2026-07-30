import React from "react";
import { Spade, Diamond, CheckCircle2 } from "lucide-react";
import { C, font } from "./theme.js";
import Logo from "./Logo.jsx";

function Suit({ icon: Icon, style, size = 100, rot = 0 }) {
  return (
    <div style={{ position: "absolute", pointerEvents: "none", ...style }}>
      <Icon size={size} color={C.line} style={{ opacity: 0.5, transform: `rotate(${rot}deg)` }} />
    </div>
  );
}

export default function ConfirmedView({ onGoToLogin }) {
  return (
    <div
      style={{
        ...font,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        position: "relative",
        overflow: "hidden",
        color: C.text,
        background: `radial-gradient(700px circle at 25% 20%, rgba(201,162,39,0.10), transparent 55%),
                     radial-gradient(680px circle at 78% 82%, rgba(15,61,46,0.55), transparent 60%),
                     ${C.bg}`,
      }}
    >
      <Suit icon={Spade} style={{ top: "12%", left: "14%" }} size={120} rot={-18} />
      <Suit icon={Diamond} style={{ bottom: "14%", right: "16%" }} size={96} rot={14} />

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 400,
          borderRadius: 16,
          padding: 32,
          background: "rgba(22,24,29,0.72)",
          backdropFilter: "blur(16px)",
          border: `1px solid ${C.line}`,
          boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
          textAlign: "center",
        }}
      >
        <Logo center />

        <div
          style={{
            margin: "20px auto 16px",
            width: 64,
            height: 64,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background: "rgba(46,160,67,0.15)",
            border: `1px solid ${C.line}`,
          }}
        >
          <CheckCircle2 size={34} color="#3fb950" />
        </div>

        <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700 }}>
          Deu certo!
        </h2>
        <p style={{ margin: "0 0 24px", fontSize: 13, color: C.sub, lineHeight: 1.6 }}>
          Sua conta foi confirmada com sucesso.
          Agora é só entrar com suas novas credenciais.
        </p>

        <button
          onClick={onGoToLogin}
          style={{
            width: "100%",
            borderRadius: 12,
            padding: 12,
            fontSize: 15,
            fontWeight: 600,
            border: 0,
            cursor: "pointer",
            color: C.accentText,
            background: C.gold,
            boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
          }}
        >
          Fazer Login
        </button>
      </div>
    </div>
  );
}
