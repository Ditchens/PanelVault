import React, { useState } from "react";
import { supabase } from "../lib/supabase";

export default function UserSearchModal({ onClose, onViewProfile }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null); // null | "not_found" | "private" | profile object
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    const q = query.trim().replace(/^@/, "").toLowerCase();
    if (!q || !supabase) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, bio, is_public")
        .eq("username", q)
        .single();
      if (error || !data) setResult("not_found");
      else if (!data.is_public) setResult("private");
      else setResult(data);
    } catch {
      setResult("not_found");
    }
    setLoading(false);
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} className="pv-modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={s.header}>
          <h2 style={s.heading}>Find Users</h2>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>
        <p style={s.desc}>Search by username to view someone's public library.</p>

        <div style={s.searchRow}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="@username"
            style={s.input}
            autoFocus
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            style={{ ...s.searchBtn, opacity: loading || !query.trim() ? 0.55 : 1 }}
          >
            {loading ? "…" : "Search"}
          </button>
        </div>

        {result === "not_found" && (
          <p style={s.errorMsg}>No public profile found for that username.</p>
        )}
        {result === "private" && (
          <p style={s.errorMsg}>This user's profile is set to private.</p>
        )}
        {result && typeof result === "object" && (
          <div style={s.profileCard}>
            <div style={s.avatar}>{result.username[0].toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={s.profileName}>@{result.username}</p>
              {result.bio && <p style={s.profileBio}>{result.bio}</p>}
            </div>
            <button onClick={() => onViewProfile(result.username)} style={s.viewBtn}>
              View →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(2,6,23,0.88)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20, zIndex: 1000,
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
  modal: {
    width: "100%", maxWidth: 440,
    background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 26, padding: 24,
    boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
    display: "flex", flexDirection: "column", gap: 16,
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  heading: {
    margin: 0, fontSize: "1.5rem", fontWeight: 900,
    color: "#fff", letterSpacing: "-0.03em",
  },
  closeBtn: {
    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, color: "#94a3b8", cursor: "pointer",
    width: 36, height: 36, fontSize: "1rem",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  desc: { margin: 0, color: "#64748b", fontSize: "0.88rem" },
  searchRow: { display: "flex", gap: 10 },
  input: {
    flex: 1, borderRadius: 14, outline: "none",
    fontSize: "0.95rem", padding: "12px 14px",
    color: "#f8fafc", background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.1)", boxSizing: "border-box",
  },
  searchBtn: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff", border: "none", borderRadius: 14,
    padding: "12px 20px", fontWeight: 800, fontSize: "0.9rem",
    cursor: "pointer", whiteSpace: "nowrap",
    boxShadow: "0 8px 20px rgba(99,102,241,0.25)",
  },
  errorMsg: { margin: 0, color: "#f87171", fontSize: "0.88rem", fontWeight: 600 },
  profileCard: {
    display: "flex", alignItems: "center", gap: 14,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, padding: "14px 16px",
  },
  avatar: {
    width: 48, height: 48, borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "1.3rem", fontWeight: 900, color: "#fff", flexShrink: 0,
  },
  profileName: { margin: 0, fontSize: "1rem", fontWeight: 800, color: "#f1f5f9" },
  profileBio: { margin: "4px 0 0", color: "#64748b", fontSize: "0.82rem" },
  viewBtn: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff", border: "none", borderRadius: 12,
    padding: "9px 16px", fontWeight: 800, fontSize: "0.88rem",
    cursor: "pointer", flexShrink: 0,
    boxShadow: "0 6px 16px rgba(99,102,241,0.25)",
  },
};
