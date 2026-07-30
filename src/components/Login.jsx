import React, { useState } from "react";
import { User, AtSign, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { font } from "./theme.js";
import logoUrl from "../assets/pokersync-logo.png";
import { signIn, signUp } from "../services/authService.js";

// Paleta local — design monocromático (preto puro / branco).
const P = {
  void: "#000000",
  glass: "rgba(30,30,30,0.6)",
  inputBg: "#0e0e0e",
  hairline: "rgba(255,255,255,0.08)",
  white: "#ffffff",
  muted: "#c4c7c8",
  danger: "#E0555A",
  ok: "#2FB89A",
};

// Campo com ícone à esquerda e foco branco.
function LoginField({ icon: Icon, label, type = "text", value, onChange, placeholder, right, autoComplete }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: P.muted }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        <Icon size={22} color={P.muted} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: P.inputBg,
            border: `1px solid ${focus ? P.white : P.hairline}`,
            boxShadow: focus ? `0 0 0 1px ${P.white}` : "none",
            borderRadius: 8,
            padding: `14px ${right ? 48 : 18}px 14px 46px`,
            color: P.white,
            fontSize: 16,
            fontWeight: 500,
            outline: "none",
            transition: "border-color .2s, box-shadow .2s",
          }}
        />
        {right && <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }}>{right}</div>}
      </div>
    </div>
  );
}

export default function Login({ onEnter, onSignUpSuccess, initialMode = "signin" }) {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const [secHover, setSecHover] = useState(false);

  const isSignup = mode === "signup";

  const reset = () => { setErr(""); setOk(""); };
  const switchMode = (next) => { reset(); setPass(""); setMode(next); };

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
    if (!name || !nickname || !email || !pass) {
      return setErr("Preencha nome, apelido, e-mail e senha.");
    }
    if (pass.length < 6) return setErr("A senha precisa ter ao menos 6 caracteres.");
    setLoading(true);
    try {
      const { needsConfirmation } = await signUp({ name, nickname, email, password: pass });
      if (needsConfirmation) {
        onSignUpSuccess?.(email);
      } else {
        onEnter();
      }
    } catch (e) {
      console.error("Falha no cadastro:", e);
      const msg = e?.message?.toLowerCase() || "";
      if (msg.includes("registered") || msg.includes("already")) {
        setErr("Este e-mail já está cadastrado.");
      } else {
        setErr(e?.message || "Não foi possível criar a conta.");
      }
    } finally {
      setLoading(false);
    }
  }

  const submit = isSignup ? handleSignUp : handleSignIn;

  return (
    <div style={{ ...font, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px", background: P.void, color: P.white, overflow: "hidden" }}>
      {/* Animação sutil da logo — loop contínuo monocromático */}
      <style>{`
        @keyframes pokersyncLogoPulse {
          0%   { opacity: 1;    filter: brightness(1); }
          50%  { opacity: 0.72; filter: brightness(0.88); }
          100% { opacity: 1;    filter: brightness(1); }
        }
        .pokersync-logo {
          animation: pokersyncLogoPulse 3s ease-in-out infinite;
        }
      `}</style>

      <main style={{ width: "100%", maxWidth: 460, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <section style={{ position: "relative", width: "100%", background: P.glass, backdropFilter: "blur(20px)", border: `1px solid ${P.hairline}`, borderRadius: 12, padding: "32px 40px 40px", boxShadow: "0 30px 80px rgba(0,0,0,0.55)" }}>
          {isSignup && (
            <button
              onClick={() => switchMode("signin")}
              aria-label="Voltar ao login"
              style={{ position: "absolute", top: 20, left: 20, display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: 9, background: P.inputBg, border: `1px solid ${P.hairline}`, color: P.muted, cursor: "pointer" }}
            >
              <ArrowLeft size={18} />
            </button>
          )}

          {/* Logo — PNG transparente, animação sutil em loop */}
          <img
            src={logoUrl}
            alt="PokerSync"
            className="pokersync-logo"
            style={{ display: "block", width: 280, maxWidth: "88%", height: "auto", objectFit: "contain", margin: "4px auto 24px" }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {isSignup && (
              <>
                <LoginField icon={User} label="Nome completo" value={name} onChange={setName} placeholder="Seu nome" autoComplete="name" />
                <LoginField icon={AtSign} label="Apelido" value={nickname} onChange={setNickname} placeholder="Como quer ser chamado" autoComplete="nickname" />
              </>
            )}

            <LoginField icon={User} label="E-mail ou Usuário" value={email} onChange={setEmail} placeholder="exemplo@pokersync.com" autoComplete="username" />

            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: P.muted }}>Senha</span>
                {!isSignup && <a href="#" style={{ fontSize: 14, color: P.muted, textDecoration: "none" }}>Esqueci minha senha</a>}
              </div>
              <LoginField
                icon={Lock}
                type={show ? "text" : "password"}
                value={pass}
                onChange={setPass}
                placeholder="••••••••"
                autoComplete={isSignup ? "new-password" : "current-password"}
                right={
                  <button type="button" onClick={() => setShow((s) => !s)} aria-label="Mostrar senha" style={{ background: "none", border: 0, color: P.muted, cursor: "pointer", display: "grid", placeItems: "center" }}>
                    {show ? <EyeOff size={22} /> : <Eye size={22} />}
                  </button>
                }
              />
            </div>

            {err && <p style={{ color: P.danger, fontSize: 14, margin: 0 }}>{err}</p>}
            {ok && <p style={{ color: P.ok, fontSize: 14, margin: 0 }}>{ok}</p>}

            <button
              onClick={submit}
              disabled={loading}
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
              style={{ width: "100%", marginTop: 4, padding: "13px", borderRadius: 8, border: 0, background: btnHover && !loading ? "#f0f0f0" : P.white, color: P.inputBg, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", cursor: loading ? "default" : "pointer", boxShadow: "0 4px 14px rgba(255,255,255,0.05)", transform: btnHover && !loading ? "translateY(-1px)" : "none", transition: "background .3s, transform .3s", opacity: loading ? 0.8 : 1 }}
            >
              {loading ? (isSignup ? "Criando…" : "Verificando…") : isSignup ? "Criar conta" : "Acessar Dashboard"}
            </button>
          </div>

          <div style={{ position: "relative", margin: "28px 0" }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center" }}>
              <span style={{ width: "100%", borderTop: `1px solid ${P.hairline}` }} />
            </div>
            <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
              <span style={{ background: P.glass, padding: "0 10px", fontSize: 13, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: P.muted }}>Ou</span>
            </div>
          </div>

          <button
            onClick={() => switchMode(isSignup ? "signin" : "signup")}
            onMouseEnter={() => setSecHover(true)}
            onMouseLeave={() => setSecHover(false)}
            style={{ width: "100%", padding: "11px", borderRadius: 8, background: secHover ? "rgba(255,255,255,0.06)" : "transparent", border: `1px solid ${P.hairline}`, color: P.white, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer", transition: "background .2s" }}
          >
            {isSignup ? "Já tenho conta" : "Criar conta"}
          </button>
        </section>
      </main>
    </div>
  );
}
