import React, { useState, useEffect } from "react";

export const SETTINGS_KEY = "panelvault_settings";
export const ACTIVITY_KEY  = "panelvault_activity";

export function loadSettings() {
  try {
    return {
      defaultMediaCategory: "comics",
      defaultSort: "newest",
      autoCheckUpdates: false,
      ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"),
    };
  } catch {
    return { defaultMediaCategory: "comics", defaultSort: "newest", autoCheckUpdates: false };
  }
}

function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export default function SettingsModal({ onClose, onSignOut, onClearActivity, onClearAll }) {
  const [settings, setSettings] = useState(loadSettings);
  const [activityCount, setActivityCount] = useState(0);

  useEffect(() => {
    try {
      setActivityCount(JSON.parse(localStorage.getItem(ACTIVITY_KEY) || "[]").length);
    } catch {}
  }, []);

  function update(key, value) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings(next);
  }

  function handleClearActivity() {
    if (!window.confirm("Clear your reading activity log? This resets your streak.")) return;
    localStorage.removeItem(ACTIVITY_KEY);
    setActivityCount(0);
    onClearActivity?.();
  }

  function handleClearAll() {
    if (!window.confirm("Delete all local data and sign out? Your cloud library is safe.")) return;
    onClearAll?.();
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.card} onClick={(e) => e.stopPropagation()}>
        <div style={s.header}>
          <h2 style={s.heading}>Settings</h2>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>

        <Sect title="Preferences">
          <Row label="Default category">
            <select
              value={settings.defaultMediaCategory}
              onChange={(e) => update("defaultMediaCategory", e.target.value)}
              style={s.select}
            >
              <option value="comics">Comics</option>
              <option value="anime">Anime</option>
            </select>
          </Row>
          <Row label="Default sort">
            <select
              value={settings.defaultSort}
              onChange={(e) => update("defaultSort", e.target.value)}
              style={s.select}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="az">A–Z</option>
              <option value="za">Z–A</option>
            </select>
          </Row>
          <Row label="Auto-check updates daily" last>
            <Toggle checked={settings.autoCheckUpdates} onChange={(v) => update("autoCheckUpdates", v)} />
          </Row>
        </Sect>

        <Sect title="Account">
          {onSignOut && (
            <button onClick={onSignOut} style={s.actionBtn}>Sign Out</button>
          )}
        </Sect>

        <Sect title="Danger Zone">
          <button onClick={handleClearActivity} style={s.dangerBtn}>
            Clear activity log ({activityCount} entries)
          </button>
          <button onClick={handleClearAll} style={{ ...s.dangerBtn, ...s.dangerBtnRed }}>
            Clear all local data &amp; sign out
          </button>
        </Sect>
      </div>
    </div>
  );
}

function Sect({ title, children }) {
  return (
    <div>
      <p style={s.sectionLabel}>{title}</p>
      <div style={s.sectionBody}>{children}</div>
    </div>
  );
}

function Row({ label, children, last }) {
  return (
    <div style={{ ...s.row, ...(last ? { borderBottom: "none" } : {}) }}>
      <span style={s.rowLabel}>{label}</span>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      style={{ ...s.toggle, background: checked ? "#6366f1" : "rgba(255,255,255,0.1)" }}
    >
      <span style={{ ...s.knob, transform: checked ? "translateX(20px)" : "translateX(2px)" }} />
    </button>
  );
}

const ctrl = {
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  color: "#f8fafc",
  fontSize: "0.9rem",
  padding: "9px 12px",
  outline: "none",
  WebkitAppearance: "none",
  appearance: "none",
  cursor: "pointer",
};

const s = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2,6,23,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 1001,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 26,
    padding: "26px 22px",
    boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  heading: { margin: 0, fontSize: "1.35rem", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.03em" },
  closeBtn: {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "1rem",
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    margin: "0 0 8px",
    fontSize: "0.74rem",
    fontWeight: 800,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  sectionBody: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 14,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "13px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    gap: 12,
  },
  rowLabel: { fontSize: "0.92rem", fontWeight: 600, color: "#dbe4f0" },
  select: { ...ctrl, minWidth: 140 },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 999,
    border: "none",
    cursor: "pointer",
    position: "relative",
    flexShrink: 0,
    transition: "background 0.2s",
    padding: 0,
  },
  knob: {
    position: "absolute",
    top: 3,
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "#fff",
    transition: "transform 0.2s",
    display: "block",
  },
  actionBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#94a3b8",
    borderRadius: 12,
    padding: "12px 14px",
    fontSize: "0.9rem",
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
  },
  dangerBtn: {
    background: "rgba(239,68,68,0.07)",
    border: "1px solid rgba(239,68,68,0.18)",
    color: "#fca5a5",
    borderRadius: 12,
    padding: "12px 14px",
    fontSize: "0.9rem",
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    marginBottom: 8,
  },
  dangerBtnRed: {
    borderColor: "rgba(239,68,68,0.35)",
    color: "#f87171",
    marginBottom: 0,
  },
};
