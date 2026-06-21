import React from "react";

// Shown to authenticated users who have an empty library.
// Props:
//   onImport   — () => void  open MAL import
//   onDiscover — () => void  open Discover
//   onSkip     — () => void  dismiss and start with empty library
export default function OnboardingModal({ onImport, onDiscover, onSkip }) {
  return (
    <div style={s.overlay}>
      <div style={s.card}>
        <div style={s.brand}>PanelVault</div>
        <p style={s.tagline}>Welcome! Let's build your library.</p>

        <div style={s.paths}>
          <button onClick={onImport} style={s.pathBtn}>
            <span style={s.pathIcon}>📥</span>
            <div style={s.pathText}>
              <strong style={s.pathTitle}>Import from MAL</strong>
              <span style={s.pathDesc}>
                Bring in your existing MyAnimeList library in seconds
              </span>
            </div>
            <span style={s.pathArrow}>→</span>
          </button>

          <button onClick={onDiscover} style={s.pathBtn}>
            <span style={s.pathIcon}>🔍</span>
            <div style={s.pathText}>
              <strong style={s.pathTitle}>Discover something new</strong>
              <span style={s.pathDesc}>
                Browse top charts, seasonal anime, and search MAL
              </span>
            </div>
            <span style={s.pathArrow}>→</span>
          </button>

          <button onClick={onSkip} style={s.pathBtnGhost}>
            <span style={s.pathIcon}>✏️</span>
            <div style={s.pathText}>
              <strong style={s.pathTitle}>Start from scratch</strong>
              <span style={s.pathDesc}>
                Add series manually one by one
              </span>
            </div>
            <span style={s.pathArrow}>→</span>
          </button>
        </div>

        <p style={s.foot}>
          You can import or discover more titles any time from the menu.
        </p>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed",
    inset: 0,
    background:
      "radial-gradient(circle at top left, rgba(118,75,162,0.25), transparent 40%), linear-gradient(180deg, #070b14 0%, #0b0f1a 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 9998,
  },
  card: {
    width: "100%",
    maxWidth: 480,
    background: "rgba(15,23,42,0.97)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 28,
    padding: "36px 28px",
    boxShadow: "0 32px 72px rgba(0,0,0,0.6)",
  },
  brand: {
    fontSize: "2rem",
    fontWeight: 900,
    letterSpacing: "-0.04em",
    color: "#f8fafc",
    textAlign: "center",
    marginBottom: 8,
  },
  tagline: {
    margin: "0 0 28px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "0.95rem",
  },
  paths: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  pathBtn: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    background: "rgba(99,102,241,0.1)",
    border: "1px solid rgba(99,102,241,0.25)",
    borderRadius: 18,
    padding: "18px 20px",
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    color: "inherit",
    transition: "background 0.15s",
  },
  pathBtnGhost: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: "18px 20px",
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    color: "inherit",
  },
  pathIcon: { fontSize: "1.6rem", flexShrink: 0 },
  pathText: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  pathTitle: {
    color: "#f1f5f9",
    fontSize: "0.98rem",
    fontWeight: 800,
  },
  pathDesc: {
    color: "#64748b",
    fontSize: "0.82rem",
    fontWeight: 500,
  },
  pathArrow: {
    color: "#475569",
    fontSize: "1.1rem",
    flexShrink: 0,
  },
  foot: {
    marginTop: 20,
    textAlign: "center",
    color: "#334155",
    fontSize: "0.82rem",
  },
};
