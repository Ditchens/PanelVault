import React, { useState } from "react";
import { supabase } from "../lib/supabase";

// mode: "login" | "signup" | "forgot" | "signup_done" | "forgot_done" | "reset_password"
export default function AuthModal({ initialMode = "login", onPasswordUpdated, onBack }) {
  const [mode, setMode]       = useState(initialMode);
  const [email, setEmail]     = useState("");
  const [password, setPassword]   = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        // Auth state change handled in App.jsx
      } else if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setMode("signup_done");
      } else if (mode === "forgot") {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (err) throw err;
        setMode("forgot_done");
      } else if (mode === "reset_password") {
        if (password !== password2) throw new Error("Passwords don't match.");
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        const { error: err } = await supabase.auth.updateUser({ password });
        if (err) throw err;
        onPasswordUpdated?.();
      }
    } catch (err) {
      const raw = err.message || "";
      if (raw.includes("Invalid login credentials")) setError("Incorrect email or password.");
      else if (raw.includes("Email not confirmed")) setError("Please confirm your email first — check your inbox.");
      else if (raw.includes("User already registered")) setError("An account with this email already exists. Try signing in instead.");
      else if (raw.includes("Password should be")) setError("Password must be at least 6 characters.");
      else if (raw.includes("rate limit") || raw.includes("too many")) setError("Too many attempts — please wait a moment and try again.");
      else setError(raw || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset(m) {
    setMode(m);
    setError("");
    setPassword("");
    setPassword2("");
  }

  // ── Email sent confirmation screens ─────────────────────────────────────────

  if (mode === "signup_done") {
    return (
      <div style={s.overlay}>
        <div style={s.card}>
          <div style={s.checkCircle}>✉️</div>
          <h2 style={s.heading}>Check your inbox</h2>
          <p style={s.confirmDesc}>
            We sent a confirmation link to <strong style={{ color: "#e2e8f0" }}>{email}</strong>.
            Click it to verify your account, then come back here and sign in.
          </p>
          <button onClick={() => reset("login")} style={s.submit}>
            Back to Sign In
          </button>
          <p style={s.foot}>
            Didn't get it?{" "}
            <button onClick={() => reset("signup")} style={s.switchBtn}>Try again</button>
          </p>
        </div>
      </div>
    );
  }

  if (mode === "forgot_done") {
    return (
      <div style={s.overlay}>
        <div style={s.card}>
          <div style={s.checkCircle}>🔑</div>
          <h2 style={s.heading}>Reset link sent</h2>
          <p style={s.confirmDesc}>
            We sent a password reset link to <strong style={{ color: "#e2e8f0" }}>{email}</strong>.
            Check your email and click the link — it'll bring you back here to set a new password.
          </p>
          <button onClick={() => reset("login")} style={s.submit}>
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  // ── Set new password (after clicking reset link in email) ────────────────────

  if (mode === "reset_password") {
    return (
      <div style={s.overlay}>
        <div style={s.card}>
          <div style={s.brand}>PanelVault</div>
          <h2 style={{ ...s.heading, marginBottom: 4 }}>Set a new password</h2>
          <p style={{ ...s.confirmDesc, marginBottom: 20 }}>Choose something secure — at least 6 characters.</p>
          <form onSubmit={handleSubmit} style={s.form}>
            <label style={s.label}>New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password (6+ chars)"
              required
              autoFocus
              style={s.input}
            />
            <label style={s.label}>Confirm password</label>
            <input
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              placeholder="Confirm password"
              required
              style={s.input}
            />
            {error && <p style={s.error}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              style={{ ...s.submit, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
            >
              {loading ? "Updating…" : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Login / Signup / Forgot ────────────────────────────────────────────────

  return (
    <div style={s.overlay}>
      <div style={s.card}>
        <div style={s.brand}>PanelVault</div>
        <p style={s.tagline}>Your manga, manhwa & anime library</p>

        {mode !== "forgot" && (
          <div style={s.tabs}>
            <button
              onClick={() => reset("login")}
              style={{ ...s.tab, ...(mode === "login" ? s.tabActive : {}) }}
            >
              Sign In
            </button>
            <button
              onClick={() => reset("signup")}
              style={{ ...s.tab, ...(mode === "signup" ? s.tabActive : {}) }}
            >
              Sign Up
            </button>
          </div>
        )}

        {mode === "forgot" && (
          <div style={s.forgotHeader}>
            <h3 style={s.forgotTitle}>Forgot your password?</h3>
            <p style={s.forgotDesc}>Enter your email and we'll send you a reset link.</p>
          </div>
        )}

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

          {mode !== "forgot" && (
            <>
              <label style={s.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "Choose a password (6+ chars)" : "Your password"}
                required
                style={s.input}
              />
            </>
          )}

          {error && <p style={s.error}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ ...s.submit, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading
              ? "Please wait…"
              : mode === "login" ? "Sign In"
              : mode === "signup" ? "Create Account"
              : "Send Reset Link"}
          </button>
        </form>

        {mode === "login" && (
          <button onClick={() => reset("forgot")} style={s.forgotLink}>
            Forgot password?
          </button>
        )}

        {mode === "forgot" ? (
          <p style={s.foot}>
            <button onClick={() => reset("login")} style={s.switchBtn}>← Back to Sign In</button>
          </p>
        ) : (
          <p style={s.foot}>
            {mode === "login" ? "No account yet? " : "Already have an account? "}
            <button
              onClick={() => reset(mode === "login" ? "signup" : "login")}
              style={s.switchBtn}
            >
              {mode === "login" ? "Sign Up" : "Sign In"}
            </button>
          </p>
        )}

        {onBack && (
          <p style={{ ...s.foot, marginTop: 4 }}>
            <button onClick={onBack} style={{ ...s.switchBtn, color: "#475569" }}>← Back to home</button>
          </p>
        )}
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
  forgotHeader: { marginBottom: 20 },
  forgotTitle: {
    margin: "0 0 6px",
    fontSize: "1.2rem",
    fontWeight: 800,
    color: "#f1f5f9",
  },
  forgotDesc: {
    margin: 0,
    color: "#64748b",
    fontSize: "0.88rem",
    lineHeight: 1.5,
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
    background: "rgba(239,68,68,0.08)",
    borderRadius: 10,
    padding: "10px 14px",
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
    cursor: "pointer",
  },
  forgotLink: {
    display: "block",
    margin: "12px auto 0",
    background: "none",
    border: "none",
    color: "#818cf8",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "underline",
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
  // Confirmation screens
  checkCircle: {
    fontSize: "3rem",
    textAlign: "center",
    display: "block",
    marginBottom: 16,
  },
  heading: {
    margin: "0 0 12px",
    fontSize: "1.4rem",
    fontWeight: 900,
    color: "#f1f5f9",
    textAlign: "center",
  },
  confirmDesc: {
    margin: "0 0 24px",
    color: "#64748b",
    fontSize: "0.9rem",
    lineHeight: 1.6,
    textAlign: "center",
  },
};
