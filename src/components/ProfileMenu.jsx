import React, { useEffect, useRef, useState } from "react";
import { LogOut, KeyRound, Check } from "lucide-react";
import { C, font } from "./theme.js";
import Avatar, { AVATARS } from "./Avatar.jsx";
import { updateAvatar, updatePassword } from "../services/profileService.js";
import { signOut } from "../services/authService.js";

export default function ProfileMenu({ profile, onProfileChange, onLogout, onClose }) {
  const [tab, setTab] = useState("home");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  async function pickAvatar(id) {
    if (id === profile.avatar_id) return;
    try {
      await updateAvatar(id);
      onProfileChange({ ...profile, avatar_id: id });
      setMsg({ type: "ok", text: "Avatar atualizado." });
    } catch (e) {
      setMsg({ type: "err", text: e?.message || "Falha ao salvar avatar." });
    }
  }

  async function submitPassword() {
    setMsg({ type: "", text: "" });
    if (pass.length < 6) return setMsg({ type: "err", text: "Mínimo 6 caracteres." });
    if (pass !== pass2) return setMsg({ type: "err", text: "As senhas não coincidem." });
    setLoading(true);
    try {
      await updatePassword(pass);
      setPass(""); setPass2("");
      setMsg({ type: "ok", text: "Senha alterada com sucesso." });
    } catch (e) {
      setMsg({ type: "err", text: e?.message || "Não foi possível trocar a senha." });
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try { await signOut(); } catch { /* ignore */ }
    onLogout();
  }

  return (
    <div
      ref={ref}
      style={{
        ...font,
        position: "absolute",
        top: 52,
        right: 0,
        width: 300,
        background: "rgba(22,24,29,0.98)",
        backdropFilter: "blur(16px)",
        border: `1px solid ${C.line}`,
        borderRadius: 14,
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        zIndex: 50,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, borderBottom: `1px solid ${C.line}` }}>
        <Avatar id={profile.avatar_id} size={44} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {profile.nome || "Jogador"}
          </div>
          {profile.apelido && (
            <div style={{ fontSize: 12, color: C.sub }}>@{profile.apelido}</div>
          )}
        </div>
      </div>

      {tab === "home" && (
        <>
          <div style={{ padding: 16, borderBottom: `1px solid ${C.line}` }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: C.sub, marginBottom: 10 }}>
              Trocar avatar
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-start" }}>
              {AVATARS.map((a) => {
                const selected = a.id === profile.avatar_id;
                return (
                  <div key={a.id} style={{ position: "relative" }}>
                    <Avatar id={a.id} size={44} onClick={() => pickAvatar(a.id)} title={`Avatar ${a.id}`} />
                    {selected && (
                      <span style={{
                        position: "absolute", bottom: -2, right: -2,
                        width: 16, height: 16, borderRadius: "50%",
                        background: C.gold, display: "grid", placeItems: "center",
                        border: `2px solid ${C.bg}`,
                      }}>
                        <Check size={10} color={C.accentText} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={() => { setMsg({ type: "", text: "" }); setTab("password"); }} style={btnRow}>
            <KeyRound size={16} /> <span>Trocar senha</span>
          </button>
          <button onClick={handleLogout} style={{ ...btnRow, color: C.negSoft || "#f87171" }}>
            <LogOut size={16} /> <span>Sair</span>
          </button>
        </>
      )}

      {tab === "password" && (
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: C.sub }}>
            Nova senha
          </div>
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Mínimo 6 caracteres" style={inputStyle} />
          <input type="password" value={pass2} onChange={(e) => setPass2(e.target.value)} placeholder="Confirmar nova senha" style={inputStyle} />
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button onClick={() => setTab("home")} style={{ ...secondaryBtn, flex: 1 }}>Voltar</button>
            <button onClick={submitPassword} disabled={loading} style={{ ...primaryBtn, flex: 1 }}>
              {loading ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </div>
      )}

      {msg.text && (
        <div style={{
          padding: "10px 16px",
          fontSize: 12,
          color: msg.type === "ok" ? (C.posSoft || "#4ade80") : (C.negSoft || "#f87171"),
          borderTop: `1px solid ${C.line}`,
        }}>
          {msg.text}
        </div>
      )}
    </div>
  );
}

const btnRow = {
  display: "flex", alignItems: "center", gap: 10,
  width: "100%", padding: "12px 16px",
  background: "transparent", border: 0, cursor: "pointer",
  color: "#EAEAEA", fontSize: 13, textAlign: "left",
  borderBottom: `1px solid #232427`,
};
const inputStyle = {
  width: "100%", padding: "10px 12px",
  background: "#161820", border: `1px solid #232427`,
  borderRadius: 8, color: "#EAEAEA", fontSize: 13, outline: "none",
};
const primaryBtn = {
  padding: "10px 12px", borderRadius: 8, border: 0,
  background: "#C9A227", color: "#0b0c0f", fontWeight: 600, cursor: "pointer",
};
const secondaryBtn = {
  padding: "10px 12px", borderRadius: 8,
  background: "#161820", border: `1px solid #232427`,
  color: "#EAEAEA", cursor: "pointer",
};
