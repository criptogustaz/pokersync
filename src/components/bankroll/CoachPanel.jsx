import React from "react";
import { C } from "../theme.js";
import { TrendingUp, TrendingDown, AlertTriangle, Info } from "lucide-react";

const STYLES = {
  good: { color: C.pos, Icon: TrendingUp },
  warn: { color: C.warn, Icon: AlertTriangle },
  bad: { color: C.neg, Icon: TrendingDown },
  info: { color: C.info, Icon: Info },
};

export default function CoachPanel({ tips }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {tips.map((t) => {
        const s = STYLES[t.level] || STYLES.info;
        const { Icon } = s;
        return (
          <div
            key={t.id}
            style={{
              display: "flex",
              gap: 12,
              padding: 14,
              borderRadius: 12,
              background: C.panel2,
              borderLeft: `3px solid ${s.color}`,
            }}
          >
            <Icon size={18} color={s.color} style={{ flex: "none", marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{t.title}</div>
              <div style={{ fontSize: 12.5, color: C.sub, marginTop: 3, lineHeight: 1.4 }}>{t.text}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
