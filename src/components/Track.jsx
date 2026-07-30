import React from "react";
import { C, font } from "./theme.js";

/**
 * Seção horizontal com título — usada no Dashboard para agrupar os cards
 * de módulos. Aceita qualquer conteúdo como children (normalmente ModuleCards).
 */
export default function Track({ title, children }) {
  return (
    <section style={{ ...font, marginTop: 32 }}>
      {title && (
        <h2
          style={{
            fontSize: 12,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: C.sub,
            marginBottom: 14,
            fontWeight: 600,
          }}
        >
          {title}
        </h2>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {children}
      </div>
    </section>
  );
}
