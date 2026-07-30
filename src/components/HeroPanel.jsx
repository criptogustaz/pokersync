import React from "react";
import { Flame, Sparkles } from "lucide-react";
import { C } from "./theme.js";

/**
 * Chip decorativo — círculo com borda tracejada + inner ring sutil.
 * Reproduz os "poker chips" abstratos do layout v0.
 */
function Chip({ size, style }) {
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        border: "1px dashed rgba(255,255,255,0.15)",
        ...style,
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: 8,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.06)",
          background: "linear-gradient(135deg, rgba(255,255,255,0.05), transparent)",
        }}
      />
    </span>
  );
}

export default function HeroPanel({ apelido, nome, streakDays = 4, patente = "Prata II" }) {
  const displayName =
    (apelido && apelido.trim()) || (nome && nome.split(" ")[0]) || "Jogador";

  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 16,
        border: `1px solid ${C.line}`,
        background: C.panel,
        padding: "24px 28px",
        minHeight: 150,
      }}
    >
      {/* Glow ambiente (canto superior direito) */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          right: -64,
          top: -96,
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          filter: "blur(64px)",
          pointerEvents: "none",
        }}
      />

      {/* Grid de pontinhos ao fundo */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.4,
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)",
          backgroundSize: "22px 22px",
          pointerEvents: "none",
        }}
      />

      {/* Chips decorativos — escondidos em telas pequenas */}
      <div
        aria-hidden
        className="pokersync-hero-chips"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <Chip size={190} style={{ right: 24, top: "50%", transform: "translateY(-50%)", opacity: 0.7 }} />
        <Chip size={130} style={{ right: 160, top: 24, opacity: 0.6 }} />
        <Chip size={96}  style={{ right: 96, bottom: -24, opacity: 0.5 }} />
        <Chip size={64}  style={{ right: 8,  top: 32, opacity: 0.4 }} />
      </div>
      <style>{`
        @media (max-width: 640px) {
          .pokersync-hero-chips { display: none; }
        }
      `}</style>

      {/* Conteúdo */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: C.sub,
            margin: 0,
          }}
        >
          Bem-vindo de volta
        </p>

        <h1
          style={{
            fontSize: 40,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            marginTop: 6,
            marginBottom: 0,
            color: "#FFFFFF",
            lineHeight: 1.05,
          }}
        >
          {displayName}
        </h1>

        <p
          style={{
            marginTop: 10,
            marginBottom: 0,
            maxWidth: 420,
            fontSize: 13,
            lineHeight: 1.5,
            color: C.sub,
          }}
        >
          Você está em uma sequência sólida. Continue treinando ranges para
          manter a evolução constante.
        </p>

        <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.06)",
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 600,
              color: C.text,
            }}
          >
            <Flame size={13} />
            Sequência de {streakDays} dias
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 999,
              border: `1px solid ${C.line}`,
              background: "rgba(255,255,255,0.03)",
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 600,
              color: C.sub,
            }}
          >
            <Sparkles size={13} color={C.text} />
            Patente {patente}
          </span>
        </div>
      </div>
    </section>
  );
}
