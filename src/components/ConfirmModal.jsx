import React from "react";

export default function ConfirmModal({ message, onConfirm, onCancel, confirmLabel = "Confirm", danger = false }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.88)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 2100 }}
      onClick={onCancel}
    >
      <div
        style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 22, padding: "26px 22px", maxWidth: 360, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,0.6)", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={{ margin: "0 0 22px", color: "#f1f5f9", fontSize: "0.95rem", fontWeight: 600, lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", borderRadius: 12, padding: "10px 18px", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              background: danger ? "rgba(239,68,68,0.15)" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
              border: danger ? "1px solid rgba(239,68,68,0.35)" : "none",
              color: danger ? "#f87171" : "#fff",
              borderRadius: 12,
              padding: "10px 18px",
              fontWeight: 800,
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
