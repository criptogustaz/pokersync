import React from "react";
import { C } from "../theme.js";

export function Panel({ title, icon: Icon, right, children, style }) {
  return (
    <section
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        borderRadius: 16,
        padding: 20,
        ...style,
      }}
    >
      {(title || right) && (
        <header style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          {Icon && <Icon size={16} color={C.goldSoft} />}
          {title && (
            <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{title}</h3>
          )}
          {right && <div style={{ marginLeft: "auto" }}>{right}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <div
      style={{
        display: "inline-flex",
        background: C.panel2,
        border: `1px solid ${C.line}`,
        borderRadius: 10,
        padding: 3,
        gap: 2,
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              border: 0,
              cursor: "pointer",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              transition: "all .2s",
              color: active ? "#141207" : C.sub,
              background: active ? C.gold : "transparent",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const fieldLabel = {
  fontSize: 11,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: C.sub,
};
const control = {
  background: C.panel2,
  border: `1px solid ${C.line}`,
  borderRadius: 10,
  padding: "10px 12px",
  color: C.text,
  fontSize: 14,
  outline: "none",
  width: "100%",
};

export function Input({ label, style, ...props }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={fieldLabel}>{label}</span>
      <input {...props} style={{ ...control, ...style }} />
    </label>
  );
}

export function Select({ label, options, ...props }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={fieldLabel}>{label}</span>
      <select {...props} style={control}>
        {options.map((o) => (
          <option key={o} value={o} style={{ background: C.panel2 }}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
