import React, { useEffect, useState } from "react";
import Login from "./components/Login.jsx";
import Dashboard from "./components/Dashboard.jsx";
import VerifyEmail from "./components/VerifyEmail.jsx";
import ConfirmedView from "./components/ConfirmedView.jsx";
import { signOut, onAuthChange } from "./services/authService.js";
import { supabase } from "./services/supabaseClient.js";

const INACTIVITY_LIMIT_MS = 60 * 60 * 1000; // 1 hora
const LAST_ACTIVITY_KEY = "pokersync_last_activity";

function markActivity() {
  localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
}

export default function App() {
  const [view, setView] = useState("loading");
  const [pendingEmail, setPendingEmail] = useState("");
  const [loginNotice, setLoginNotice] = useState("");

  // Ao montar: detecta retorno do link de confirmação, sessão ativa e inatividade acumulada.
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
        if (!data.session) {
          setView("login");
          return;
        }

        const last = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || 0);
        if (last && Date.now() - last > INACTIVITY_LIMIT_MS) {
          await signOut();
          setLoginNotice("Sua sessão expirou por inatividade.");
          setView("login");
          return;
        }

        markActivity();
        setView("dashboard");
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

  // Monitor de inatividade: só roda enquanto o jogador está logado.
  useEffect(() => {
    if (view !== "dashboard") return;

    const events = ["click", "keydown", "touchstart", "scroll"];
    events.forEach((ev) => window.addEventListener(ev, markActivity));

    const interval = setInterval(async () => {
      const last = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || 0);
      if (last && Date.now() - last > INACTIVITY_LIMIT_MS) {
        clearInterval(interval);
        await signOut();
        setLoginNotice("Sua sessão expirou por inatividade.");
        setView("login");
      }
    }, 30000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, markActivity));
      clearInterval(interval);
    };
  }, [view]);

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
    return <Dashboard onLogout={() => { setLoginNotice(""); setView("login"); }} />;
  }
  if (view === "verify") {
    return <VerifyEmail email={pendingEmail} onBackToLogin={() => setView("login")} />;
  }
  if (view === "confirmed") {
    return <ConfirmedView onGoToLogin={goToLoginFromConfirmed} />;
  }
  return (
    <Login
      onEnter={() => { markActivity(); setView("dashboard"); }}
      onSignUpSuccess={(email) => {
        setPendingEmail(email);
        setView("verify");
      }}
      initialNotice={loginNotice}
    />
  );
}
