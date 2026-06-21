import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// Props:
//   profile       — { username, bio, is_public } | null
//   currentUser   — Supabase auth user object
//   onSave        — (updatedProfile) => void
//   onClose       — () => void
//   isSetup       — boolean  true = first-time setup (no close until saved)
export default function ProfileModal({ profile, currentUser, onSave, onClose, onSignOut, isSetup = false }) {
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio]           = useState(profile?.bio || "");
  const [isPublic, setIsPublic] = useState(profile?.is_public ?? false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [copied, setCopied]     = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setIsPublic(profile.is_public ?? false);
    }
  }, [profile]);

  async function handleSave() {
    const trimmed = username.trim().replace(/\s+/g, "_").toLowerCase();
    if (!trimmed) { setError("Username is required."); return; }
    if (!/^[a-z0-9_]{2,24}$/.test(trimmed)) {
      setError("Username must be 2–24 characters: letters, numbers, underscores only.");
      return;
    }

    setSaving(true);
    setError("");

    const { error: upsertErr } = await supabase.from("profiles").upsert({
      id: currentUser.id,
      username: trimmed,
      bio: bio.trim(),
      is_public: isPublic,
    });

    setSaving(false);

    if (upsertErr) {
      if (upsertErr.message?.includes("unique") || upsertErr.code === "23505") {
        setError("That username is already taken.");
      } else {
        setError(upsertErr.message || "Failed to save profile.");
      }
      return;
    }

    onSave({ username: trimmed, bio: bio.trim(), is_public: isPublic });
  }

  function handleCopyLink() {
    const url = `${window.location.origin}${window.location.pathname}?p=${username.trim() || profile?.username}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const shareableUsername = username.trim() || profile?.username || "";

  return (
    <div style={s.overlay} onClick={isSetup ? undefined : onClose}>
      <div style={s.card} onClick={(e) => e.stopPropagation()}>
        <div style={s.header}>
          <h2 style={s.heading}>{isSetup ? "Set up your profile" : "My Profile"}</h2>
          {!isSetup && (
            <button onClick={onClose} style={s.closeBtn} aria-label="Close">✕</button>
          )}
        </div>

        {isSetup && (
          <p style={s.setupDesc}>
            Choose a username to personalise your library and optionally share it.
          </p>
        )}

        <label style={s.label}>Username</label>
        <div style={s.usernameRow}>
          <span style={s.usernameAt}>@</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            placeholder="your_username"
            maxLength={24}
            style={s.input}
            autoFocus
          />
        </div>

        <label style={s.label}>Bio (optional)</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="What are you reading lately?"
          style={s.textarea}
          maxLength={160}
        />

        <label style={s.checkRow}>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            style={{ marginRight: 10 }}
          />
          <div>
            <strong style={{ color: "#f1f5f9", fontSize: "0.92rem" }}>Make library public</strong>
            <p style={{ margin: "3px 0 0", color: "#64748b", fontSize: "0.8rem" }}>
              Anyone with your link can view your library (read-only)
            </p>
          </div>
        </label>

        {isPublic && shareableUsername && (
          <button onClick={handleCopyLink} style={s.copyBtn}>
            {copied ? "✓ Copied!" : "📋 Copy share link"}
          </button>
        )}

        {error && <p style={s.error}>{error}</p>}

        <div style={s.actions}>
          {!isSetup && (
            <button onClick={onClose} style={s.cancelBtn}>Cancel</button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ ...s.saveBtn, opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}
          >
            {saving ? "Saving…" : isSetup ? "Create Profile" : "Save Changes"}
          </button>
        </div>

        <p style={s.emailNote}>Signed in as {currentUser?.email}</p>

        {!isSetup && onSignOut && (
          <button onClick={onSignOut} style={s.signOutBtn}>Sign Out</button>
        )}
      </div>
    </div>
  );
}

const ctrl = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 12,
  outline: "none",
  fontSize: "0.95rem",
  padding: "12px 14px",
  color: "#f8fafc",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "none",
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
    maxWidth: 460,
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 26,
    padding: "28px 24px",
    boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heading: {
    margin: 0,
    fontSize: "1.35rem",
    fontWeight: 900,
    color: "#ffffff",
    letterSpacing: "-0.03em",
  },
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
  setupDesc: {
    margin: 0,
    color: "#64748b",
    fontSize: "0.88rem",
    lineHeight: 1.5,
  },
  label: {
    color: "#94a3b8",
    fontWeight: 700,
    fontSize: "0.82rem",
    display: "block",
    marginBottom: -8,
  },
  usernameRow: {
    display: "flex",
    alignItems: "center",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    overflow: "hidden",
  },
  usernameAt: {
    padding: "12px 4px 12px 14px",
    color: "#475569",
    fontWeight: 700,
    fontSize: "0.95rem",
    flexShrink: 0,
  },
  input: { ...ctrl, border: "none", background: "transparent", borderRadius: 0, paddingLeft: 4 },
  textarea: { ...ctrl, minHeight: 80, resize: "vertical" },
  checkRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 0,
    cursor: "pointer",
    padding: "12px 14px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 12,
  },
  copyBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "0.88rem",
    fontWeight: 700,
    padding: "10px 14px",
    textAlign: "left",
  },
  error: {
    margin: 0,
    color: "#f87171",
    fontSize: "0.85rem",
    fontWeight: 600,
    background: "rgba(239,68,68,0.1)",
    borderRadius: 10,
    padding: "10px 14px",
  },
  actions: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
  },
  cancelBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#94a3b8",
    borderRadius: 12,
    padding: "11px 16px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  saveBtn: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "11px 20px",
    fontWeight: 800,
    fontSize: "0.9rem",
    boxShadow: "0 8px 20px rgba(99,102,241,0.25)",
  },
  emailNote: {
    margin: 0,
    textAlign: "center",
    color: "#334155",
    fontSize: "0.78rem",
  },
  signOutBtn: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#64748b",
    borderRadius: 12,
    padding: "11px 16px",
    fontWeight: 700,
    fontSize: "0.88rem",
    cursor: "pointer",
    width: "100%",
    textAlign: "center",
  },
};
