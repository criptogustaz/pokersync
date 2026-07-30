import React, { useEffect, useState } from "react";
import Login from "./components/Login.jsx";
import Dashboard from "./components/Dashboard.jsx";
import VerifyEmail from "./components/VerifyEmail.jsx";
import ConfirmedView from "./components/ConfirmedView.jsx";
import { signOut, onAuthChange } from "./services/authService.js";
import { supabase } from "./services/supabaseClient.js";

export default function App() {
  const [view, setView] = useState("loading");
  const [pendingEmail, setPendingEmail] = useState("");

  // Ao montar: detecta retorno do link de confirmação OU sessão já ativa.
  useEffect(() => {
    const { search, hash } = window.location;
    const qs = new URLSearchParams(search);
    const hp = new URLSearchParams(hash.replace(/^#/, ""));
    const isConfirmed =
      qs.get("confirmed") === "1" ||
      hp.get("type") === "signup" ||
      hp.get("type") === "email_confirmation";

    if (isConfirmed) {
      setView("confirmed");
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setView(data.session ? "dashboard" : "login");
      } catch {
        setView("login");
      }
    })();
  }, []);

  useEffect(() => {
    const { data } = onAuthChange((event) => {
      if (event === "SIGNED_OUT") setView("login");
    });
    return () => data?.subscription?.unsubscribe?.();
  }, []);

  async function goToLoginFromConfirmed() {
    try { await signOut(); } catch { /* ignore */ }
    setView("login");
  }

  if (view === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0b0c0f", color: "#8b8f98", fontFamily: "system-ui" }}>
        Carregando…
      </div>
    );
  }
  if (view === "dashboard") {
    return <Dashboard onLogout={() => setView("login")} />;
  }
  if (view === "verify") {
    return <VerifyEmail email={pendingEmail} onBackToLogin={() => setView("login")} />;
  }
  if (view === "confirmed") {
    return <ConfirmedView onGoToLogin={goToLoginFromConfirmed} />;
  }
  return (
    <Login
      onEnter={() => setView("dashboard")}
      onSignUpSuccess={(email) => {
        setPendingEmail(email);
        setView("verify");
      }}
    />
  );
}
