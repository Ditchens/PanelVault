import React, { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AuthModal({ initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setMessage("Check your email for a confirmation link, then sign in.");
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function switchMode(m) {
    setMode(m);
    setError("");
    setMessage("");
  }

  return (
    <div style={s.overlay}>
      <div style={s.card}>
        <div style={s.brand}>PanelVault</div>
        <p style={s.tagline}>Your manga, manhwa & anime library</p>

        <div style={s.tabs}>
          <button
            onClick={() => switchMode("login")}
            style={{ ...s.tab, ...(mode === "login" ? s.tabActive : {}) }}
          >
            Sign In
          </button>
          <button
            onClick={() => switchMode("signup")}
            style={{ ...s.tab, ...(mode === "signup" ? s.tabActive : {}) }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          <label style={s.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus
            style={s.input}
          />

          <label style={s.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "signup" ? "Choose a password (6+ chars)" : "Your password"}
            required
            style={s.input}
          />

          {error   && <p style={s.error}>{error}</p>}
          {message && <p style={s.success}>{message}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ ...s.submit, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading
              ? "Please wait…"
              : mode === "login"
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        <p style={s.foot}>
          {mode === "login"
            ? "No account yet? "
            : "Already have an account? "}
          <button
            onClick={() => switchMode(mode === "login" ? "signup" : "login")}
            style={s.switchBtn}
          >
            {mode === "login" ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}

const ctrl = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 14,
  outline: "none",
  fontSize: "1rem",
  padding: "13px 15px",
  color: "#f8fafc",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "none",
};

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
    zIndex: 9999,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "rgba(15,23,42,0.95)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 28,
    padding: "36px 32px",
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
    fontSize: "0.9rem",
  },
  tabs: {
    display: "flex",
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    padding: "10px 0",
    background: "rgba(255,255,255,0.04)",
    color: "#94a3b8",
    border: "none",
    fontWeight: 700,
    fontSize: "0.95rem",
    cursor: "pointer",
  },
  tabActive: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
  },
  form: { display: "flex", flexDirection: "column", gap: 4 },
  label: {
    color: "#94a3b8",
    fontWeight: 700,
    fontSize: "0.85rem",
    marginBottom: 4,
    marginTop: 12,
  },
  input: ctrl,
  error: {
    margin: "10px 0 0",
    color: "#f87171",
    fontSize: "0.88rem",
    fontWeight: 600,
  },
  success: {
    margin: "10px 0 0",
    color: "#4ade80",
    fontSize: "0.88rem",
    fontWeight: 600,
  },
  submit: {
    marginTop: 18,
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    padding: "14px",
    fontWeight: 800,
    fontSize: "1rem",
    boxShadow: "0 12px 28px rgba(99,102,241,0.28)",
    width: "100%",
  },
  foot: {
    marginTop: 20,
    textAlign: "center",
    color: "#64748b",
    fontSize: "0.88rem",
  },
  switchBtn: {
    background: "none",
    border: "none",
    color: "#818cf8",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "0.88rem",
    textDecoration: "underline",
    padding: 0,
  },
};
