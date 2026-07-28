import React, { useState } from "react";
import { C } from "./theme.js";

export default function Field({ label, type = "text", value = "", onChange, trailing }) {
  const [focus, setFocus] = useState(false);
  const active = focus || String(value).length > 0;
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 12,
        padding: "20px 16px 8px",
        background: C.panel2,
        border: `1px solid ${focus ? C.gold : C.line}`,
        boxShadow: focus ? "0 0 0 3px rgba(255,255,255,0.14)" : "none",
        transition: "all .3s",
      }}
    >
      <label
        style={{
          position: "absolute",
          left: 16,
          top: active ? 7 : 17,
          fontSize: active ? 11 : 15,
          letterSpacing: active ? "0.08em" : "0",
          textTransform: active ? "uppercase" : "none",
          color: active ? C.gold : C.sub,
          pointerEvents: "none",
          transition: "all .2s",
        }}
      >
        {label}
      </label>
      <div style={{ display: "flex", alignItems: "center" }}>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            width: "100%",
            background: "transparent",
            border: 0,
            outline: "none",
            color: C.text,
            fontSize: 15,
            paddingTop: 4,
          }}
        />
        {trailing}
      </div>
    </div>
  );
}
