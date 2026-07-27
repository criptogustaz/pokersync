import React from "react";
import { C } from "./theme.js";

export default function Track({ title, children }) {
  return (
    <section style={{ marginTop: 32 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 4px 12px", color: C.text }}>
        {title}
      </h2>
      <div
        style={{
          display: "flex",
          gap: 20,
          overflowX: "auto",
          padding: "8px 4px 24px",
          scrollbarWidth: "none",
        }}
      >
        {children}
      </div>
    </section>
  );
}
