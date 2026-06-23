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
        <div style={s.brand}>
          Panel<span style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Vault</span>
        </div>
        <p style={s.tagline}>Track manga, manhwa, manhua & anime in one beautiful place.</p>

        <div style={s.miniShelf}>
          {[
            { bg: "linear-gradient(160deg, #ef444430, #7f1d1d18)", bar: "#ef4444", pct: 68 },
            { bg: "linear-gradient(160deg, #ec489930, #50001418)", bar: "#ec4899", pct: 42 },
            { bg: "linear-gradient(160deg, #8b5cf630, #3b076418)", bar: "#8b5cf6", pct: 85 },
            { bg: "linear-gradient(160deg, #f59e0b30, #78350f18)", bar: "#f59e0b", pct: 30 },
            { bg: "linear-gradient(160deg, #22c55e30, #14532d18)", bar: "#22c55e", pct: 55 },
          ].map((c, i) => (
            <div key={i} style={{ ...s.miniCard, background: c.bg }}>
              <div style={s.miniBarTrack}>
                <div style={{ ...s.miniBarFill, width: c.pct + "%", background: c.bar }} />
              </div>
            </div>
          ))}
        </div>

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
    color: "#475569",
    fontSize: "0.82rem",
  },
  miniShelf: {
    display: "flex",
    gap: 7,
    marginBottom: 24,
    padding: "14px 12px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 18,
  },
  miniCard: {
    flex: 1,
    aspectRatio: "0.6 / 1",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.07)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    padding: "8px 6px 6px",
  },
  miniBarTrack: {
    height: 3,
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  miniBarFill: {
    height: "100%",
    borderRadius: 999,
    opacity: 0.75,
  },
};
