import React, { useState } from "react";
import { Spade, Diamond, Eye, EyeOff } from "lucide-react";
import { C, font } from "./theme.js";
import Logo from "./Logo.jsx";
import Field from "./Field.jsx";
import { signIn } from "../services/authService.js";

function Suit({ icon: Icon, style, size = 100, rot = 0 }) {
  return (
    <div style={{ position: "absolute", pointerEvents: "none", ...style }}>
      <Icon size={size} color={C.line} style={{ opacity: 0.5, transform: `rotate(${rot}deg)` }} />
    </div>
  );
}

export default function Login({ onEnter }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [hover, setHover] = useState(false);
  const [err, setErr] = useState("");

  async function handleEnter() {
    setErr("");
    try {
      // Em produção: await signIn(email, pass);
      onEnter();
    } catch {
      setErr("Não foi possível entrar. Verifique suas credenciais.");
    }
  }

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
        }}
      >
        <Logo center />
        <p style={{ textAlign: "center", margin: "8px 0 28px", fontSize: 13, color: C.sub }}>
          Treino de poker GTO. Entre para continuar.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Usuário ou e-mail" value={email} onChange={setEmail} />
          <Field
            label="Senha"
            type={show ? "text" : "password"}
            value={pass}
            onChange={setPass}
            trailing={
              <button
                onClick={() => setShow((s) => !s)}
                aria-label="Mostrar senha"
                style={{ marginLeft: 8, background: "none", border: 0, color: C.sub, cursor: "pointer" }}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
        </div>

        {err && <p style={{ color: "#f87171", fontSize: 12, marginTop: 8 }}>{err}</p>}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
          <a href="#" style={{ fontSize: 12, color: C.sub, textDecoration: "none" }}>
            Esqueci minha senha
          </a>
        </div>

        <button
          onClick={handleEnter}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            width: "100%",
            marginTop: 24,
            borderRadius: 12,
            padding: 12,
            fontSize: 15,
            fontWeight: 600,
            border: 0,
            cursor: "pointer",
            color: "#141207",
            background: hover ? `linear-gradient(180deg, ${C.goldSoft}, ${C.gold})` : C.gold,
            boxShadow: hover ? "0 8px 26px rgba(201,162,39,0.45)" : "0 4px 14px rgba(201,162,39,0.22)",
            transform: hover ? "translateY(-1px)" : "none",
            transition: "all .3s",
          }}
        >
          Entrar
        </button>
      </div>
    </div>
  );
}
