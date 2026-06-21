import React, { useEffect, useState } from "react";

export default function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div style={s.stack}>
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const styles = {
    success: { bg: "rgba(34,197,94,0.15)",  border: "rgba(34,197,94,0.35)",  icon: "✓", iconColor: "#4ade80" },
    error:   { bg: "rgba(239,68,68,0.15)",  border: "rgba(239,68,68,0.35)",  icon: "✕", iconColor: "#f87171" },
    info:    { bg: "rgba(99,102,241,0.15)", border: "rgba(99,102,241,0.35)", icon: "ℹ", iconColor: "#818cf8" },
  };
  const c = styles[toast.type] || styles.info;

  return (
    <div
      style={{
        ...s.toast,
        background: c.bg,
        borderColor: c.border,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
      }}
    >
      <span style={{ ...s.icon, color: c.iconColor }}>{c.icon}</span>
      <span style={s.message}>{toast.message}</span>
      <button onClick={() => onDismiss(toast.id)} style={s.close}>✕</button>
    </div>
  );
}

const s = {
  stack: {
    position: "fixed",
    bottom: 88,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    flexDirection: "column-reverse",
    gap: 8,
    zIndex: 9999,
    width: "calc(100vw - 40px)",
    maxWidth: 420,
    pointerEvents: "none",
    alignItems: "stretch",
  },
  toast: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid",
    backdropFilter: "blur(20px)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    pointerEvents: "all",
    transition: "opacity 0.2s ease, transform 0.2s ease",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
  icon: {
    fontSize: "0.85rem",
    fontWeight: 900,
    flexShrink: 0,
    width: 18,
    textAlign: "center",
  },
  message: {
    flex: 1,
    fontSize: "0.88rem",
    fontWeight: 600,
    color: "#f1f5f9",
    lineHeight: 1.4,
  },
  close: {
    background: "transparent",
    border: "none",
    color: "#475569",
    cursor: "pointer",
    fontSize: "0.78rem",
    padding: "2px 4px",
    flexShrink: 0,
    lineHeight: 1,
  },
};
