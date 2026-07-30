import React, { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Trash2, Info, CheckCircle2, AlertTriangle } from "lucide-react";
import { C, font } from "./theme.js";
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../services/notificationService.js";

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "agora";
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

const kindIcon = {
  info: { Icon: Info, color: "#60a5fa" },
  success: { Icon: CheckCircle2, color: "#4ade80" },
  warning: { Icon: AlertTriangle, color: "#fbbf24" },
};

export default function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const unread = items.filter((n) => !n.read).length;

  async function load() {
    setLoading(true);
    try { setItems(await fetchNotifications()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  async function handleItemClick(n) {
    if (n.read) return;
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    try { await markAsRead(n.id); } catch { load(); }
  }

  async function handleMarkAll() {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    try { await markAllAsRead(); } catch { load(); }
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    setItems((prev) => prev.filter((x) => x.id !== id));
    try { await deleteNotification(id); } catch { load(); }
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Notificações"
        style={{
          position: "relative",
          display: "grid", placeItems: "center",
          width: 38, height: 38, borderRadius: 10,
          background: "transparent", border: 0, color: C.sub, cursor: "pointer",
        }}
      >
        <Bell size={19} />
        {unread > 0 && (
          <span style={{
            position: "absolute", top: 4, right: 4,
            minWidth: 16, height: 16, padding: "0 4px",
            borderRadius: 8, background: C.gold, color: C.accentText,
            fontSize: 10, fontWeight: 700, display: "grid", placeItems: "center",
            border: `2px solid ${C.bg}`,
          }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          ...font,
          position: "absolute", top: 46, right: 0, width: 340,
          background: "rgba(22,24,29,0.98)", backdropFilter: "blur(16px)",
          border: `1px solid ${C.line}`, borderRadius: 14,
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)", zIndex: 50, overflow: "hidden",
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", borderBottom: `1px solid ${C.line}`,
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Notificações</span>
            {unread > 0 && (
              <button onClick={handleMarkAll} title="Marcar tudo como lido"
                style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: 0, color: C.sub, cursor: "pointer", fontSize: 12 }}>
                <CheckCheck size={14} /> Ler tudo
              </button>
            )}
          </div>

          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {loading && items.length === 0 ? (
              <p style={{ padding: 20, color: C.sub, fontSize: 13, textAlign: "center" }}>Carregando…</p>
            ) : items.length === 0 ? (
              <p style={{ padding: 24, color: C.sub, fontSize: 13, textAlign: "center" }}>
                Você está em dia. Sem notificações. 👌
              </p>
            ) : (
              items.map((n) => {
                const meta = kindIcon[n.kind] || kindIcon.info;
                const Icon = meta.Icon;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    style={{
                      display: "flex", gap: 10, padding: "12px 16px",
                      borderBottom: `1px solid ${C.line}`,
                      background: n.read ? "transparent" : "rgba(201,162,39,0.06)",
                      cursor: "pointer",
                    }}
                  >
                    <Icon size={16} color={meta.color} style={{ marginTop: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.text, flex: 1 }}>{n.title}</span>
                        <span style={{ fontSize: 11, color: C.sub, flexShrink: 0 }}>{timeAgo(n.created_at)}</span>
                      </div>
                      {n.body && <p style={{ fontSize: 12, color: C.sub, marginTop: 2, lineHeight: 1.4 }}>{n.body}</p>}
                    </div>
                    <button onClick={(e) => handleDelete(n.id, e)} title="Excluir"
                      style={{ background: "none", border: 0, color: C.sub, cursor: "pointer", padding: 2, flexShrink: 0 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
