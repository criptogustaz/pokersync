import React, { useState } from "react";
import { C, font } from "./theme.js";

/**
 * Input de formulário estilizado — label flutuante + área para ícone/botão à direita.
 * Usado no Login (Nome, Apelido, E-mail, Senha) e demais formulários.
 */
export default function Field({
  label,
  type = "text",
  value,
  onChange,
  trailing,
  placeholder,
}) {
  const [focus, setFocus] = useState(false);
  const hasValue = value !== "" && value != null;
  const floating = focus || hasValue;

  return (
    <label
      style={{
        ...font,
        position: "relative",
        display: "flex",
        alignItems: "center",
        background: C.panel2,
        border: `1px solid ${focus ? C.gold : C.line}`,
        borderRadius: 12,
        padding: "14px 14px 10px",
        transition: "border-color .2s",
        cursor: "text",
      }}
    >
      {label && (
        <span
          style={{
            position: "absolute",
            left: 14,
            top: floating ? 4 : 14,
            fontSize: floating ? 10 : 13,
            color: focus ? C.gold : C.sub,
            letterSpacing: floating ? ".08em" : "0",
            textTransform: floating ? "uppercase" : "none",
            transition: "all .15s",
            pointerEvents: "none",
          }}
        >
          {label}
        </span>
      )}
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        placeholder={floating ? placeholder : ""}
        style={{
          width: "100%",
          background: "transparent",
          border: 0,
          outline: "none",
          color: C.text,
          fontSize: 14,
          marginTop: label ? 8 : 0,
          padding: 0,
        }}
      />
      {trailing}
    </label>
  );
}
