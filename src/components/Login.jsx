import React, { useState } from "react";
import { Spade, Diamond, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { C, font } from "./theme.js";
import Logo from "./Logo.jsx";
import Field from "./Field.jsx";
import { signIn, signUp } from "../services/authService.js";

function Suit({ icon: Icon, style, size = 100, rot = 0 }) {
  return (
    <div style={{ position: "absolute", pointerEvents: "none", ...style }}>
      <Icon size={size} color={C.line} style={{ opacity: 0.5, transform: `rotate(${rot}deg)` }} />
    </div>
  );
}

// Botão dourado padrão do app, com estado de loading.
function PrimaryButton({ onClick, loading, children }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={loading}
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
        cursor: loading ? "default" : "pointer",
        color: C.accentText,
        background: hover ? C.accent : C.gold,
        boxShadow: hover ? "0 8px 26px rgba(0,0,0,0.55)" : "0 4px 14px rgba(0,0,0,0.4)",
        transform: hover && !loading ? "translateY(-1px)" : "none",
        transition: "all .3s",
        opacity: loading ? 0.7 : 1,
      }}
    >
      {children}
    </button>
  );
}

export default function Login({ onEnter }) {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);

  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  function reset() {
    setErr("");
    setOk("");
  }

  function switchMode(next) {
    reset();
    setPass("");
    setMode(next);
  }

  async function handleSignIn() {
    reset();
    if (!email || !pass) return setErr("Informe e-mail e senha.");
    setLoading(true);
    try {
      await signIn(email, pass);
      onEnter();
    } catch (e) {
      console.error("Falha no login:", e);
      setErr(e?.message || "Não foi possível entrar. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp() {
    reset();
    if (!name || !email || !pass) return setErr("Preencha nome, e-mail e senha.");
    if (pass.length < 6) return setErr("A senha precisa ter ao menos 6 caracteres.");
    setLoading(true);
    try {
      const { needsConfirmation } = await signUp(name, email, pass);
      if (needsConfirmation) {
        setOk("Conta criada! Enviamos um e-mail de confirmação — confirme para entrar.");
        setMode("signin");
      } else {
        onEnter(); // confirmação desativada no projeto: entra direto
      }
    } catch (e) {
      console.error("Falha no cadastro:", e);
      setErr(e?.message || "Não foi possível criar a conta.");
    } finally {
      setLoading(false);
    }
  }

  const isSignup = mode === "signup";

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
        background: `radial-gradient(700px circle at 25% 20%, rgba(255,255,255,0.05), transparent 55%),
                     radial-gradient(680px circle at 78% 82%, rgba(255,255,255,0.03), transparent 60%),
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
        {isSignup && (
          <button
            onClick={() => switchMode("signin")}
            aria-label="Voltar ao login"
            style={{
              position: "absolute",
              top: 20,
              left: 20,
              display: "grid",
              placeItems: "center",
              width: 34,
              height: 34,
              borderRadius: 9,
              background: C.panel2,
              border: `1px solid ${C.line}`,
              color: C.sub,
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={17} />
          </button>
        )}

        <Logo center />
        <p style={{ textAlign: "center", margin: "8px 0 28px", fontSize: 13, color: C.sub }}>
          {isSignup ? "Crie sua conta para começar a treinar." : "Treino de poker GTO. Entre para continuar."}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {isSignup && <Field label="Nome completo" value={name} onChange={setName} />}
          <Field label="E-mail" value={email} onChange={setEmail} />
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

        {err && <p style={{ color: C.negSoft, fontSize: 12, marginTop: 10 }}>{err}</p>}
        {ok && <p style={{ color: C.posSoft, fontSize: 12, marginTop: 10 }}>{ok}</p>}

        {!isSignup && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
            <a href="#" style={{ fontSize: 12, color: C.sub, textDecoration: "none" }}>
              Esqueci minha senha
            </a>
          </div>
        )}

        <PrimaryButton onClick={isSignup ? handleSignUp : handleSignIn} loading={loading}>
          {loading
            ? isSignup ? "Criando…" : "Entrando…"
            : isSignup ? "Criar conta" : "Entrar"}
        </PrimaryButton>

        <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: C.sub }}>
          {isSignup ? (
            <>
              Já tem conta?{" "}
              <button
                onClick={() => switchMode("signin")}
                style={{ background: "none", border: 0, color: C.gold, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
              >
                Entrar
              </button>
            </>
          ) : (
            <>
              Não tem conta?{" "}
              <button
                onClick={() => switchMode("signup")}
                style={{ background: "none", border: 0, color: C.gold, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
              >
                Criar nova conta
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
