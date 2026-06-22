import React, { useState } from "react";
import AuthModal from "./AuthModal";

const FEATURES = [
  { icon: "📚", title: "Track Everything", desc: "Manga, manhwa, manhua, and anime — all in one place with status, progress, and ratings." },
  { icon: "🔍", title: "Discover New Titles", desc: "Browse top charts, seasonal anime, and search MAL and MangaDex without leaving the app." },
  { icon: "☁️", title: "Syncs Everywhere", desc: "Your library lives in the cloud. Sign in on any device and pick up exactly where you left off." },
  { icon: "📊", title: "Stats & Streaks", desc: "See your reading streak, chapters logged, and a breakdown of your library at a glance." },
  { icon: "🔗", title: "Share Your Library", desc: "Set a username and share a public link to your library with anyone." },
  { icon: "📥", title: "Import from MAL", desc: "Already on MyAnimeList? Import your full list in seconds with the MAL XML export." },
];

export default function LandingPage() {
  const [authMode, setAuthMode] = useState(null); // null | "login" | "signup"

  if (authMode) {
    return <AuthModal initialMode={authMode} />;
  }

  return (
    <div style={s.page}>
      <div style={s.glow1} />
      <div style={s.glow2} />

      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.brand}>PanelVault</div>
        <div style={s.navRight}>
          <button onClick={() => setAuthMode("login")} style={s.navSignIn}>Sign In</button>
          <button onClick={() => setAuthMode("signup")} style={s.navSignUp}>Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={s.hero}>
        <div style={s.heroBadge}>Free · No ads · Cloud sync</div>
        <h1 style={s.heroTitle}>
          Your manga &amp; anime<br />library, <span style={s.heroAccent}>organised</span>
        </h1>
        <p style={s.heroSub}>
          Track what you're reading, discover what's next, and never lose your place again.
          Works on any device as a progressive web app.
        </p>
        <div style={s.heroCtas}>
          <button onClick={() => setAuthMode("signup")} style={s.ctaPrimary}>
            Start for free →
          </button>
          <button onClick={() => setAuthMode("login")} style={s.ctaSecondary}>
            Sign in
          </button>
        </div>

        {/* App preview mockup */}
        <div style={s.previewWrap}>
          <div style={s.previewShelf}>
            {[
              { c: "linear-gradient(160deg,#6366f1,#8b5cf6)", label: "Action" },
              { c: "linear-gradient(160deg,#0ea5e9,#06b6d4)", label: "Shonen" },
              { c: "linear-gradient(160deg,#f43f5e,#e11d48)", label: "Romance" },
              { c: "linear-gradient(160deg,#10b981,#059669)", label: "Isekai" },
              { c: "linear-gradient(160deg,#f59e0b,#d97706)", label: "Horror" },
            ].map((card, i) => (
              <div key={i} style={{ ...s.previewCard, background: card.c }}>
                <span style={s.previewLabel}>{card.label}</span>
                <div style={s.previewBar}>
                  <div style={{ ...s.previewBarFill, width: `${40 + i * 12}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={s.features}>
        {FEATURES.map((f) => (
          <div key={f.title} style={s.featureCard} className="pv-feature-card">
            <span style={s.featureIcon}>{f.icon}</span>
            <strong style={s.featureTitle}>{f.title}</strong>
            <p style={s.featureDesc}>{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Bottom CTA */}
      <section style={s.bottomCta}>
        <h2 style={s.bottomTitle}>Ready to build your library?</h2>
        <button onClick={() => setAuthMode("signup")} style={s.ctaPrimary}>
          Create a free account →
        </button>
      </section>

      <footer style={s.footer}>
        <p style={s.footerText}>PanelVault · Built for readers</p>
      </footer>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top left, rgba(118,75,162,0.18), transparent 30%), linear-gradient(180deg, #070b14 0%, #0b0f1a 60%, #070b14 100%)",
    color: "#f8fafc",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    position: "relative",
    overflowX: "hidden",
  },
  glow1: {
    position: "absolute", width: 400, height: 400, borderRadius: "50%",
    background: "rgba(99,102,241,0.12)", filter: "blur(100px)",
    top: -100, left: -100, pointerEvents: "none",
  },
  glow2: {
    position: "absolute", width: 300, height: 300, borderRadius: "50%",
    background: "rgba(34,211,238,0.08)", filter: "blur(100px)",
    top: 200, right: -80, pointerEvents: "none",
  },
  nav: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "20px 32px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    backdropFilter: "blur(16px)",
    position: "sticky", top: 0, zIndex: 10,
    background: "rgba(7,11,20,0.7)",
  },
  brand: {
    fontSize: "1.5rem", fontWeight: 900, letterSpacing: "-0.04em", color: "#f8fafc",
  },
  navRight: { display: "flex", gap: 10, alignItems: "center" },
  navSignIn: {
    background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
    color: "#94a3b8", borderRadius: 12, padding: "9px 16px",
    fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
  },
  navSignUp: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff", border: "none", borderRadius: 12,
    padding: "9px 16px", fontWeight: 800, fontSize: "0.9rem", cursor: "pointer",
  },
  hero: {
    maxWidth: 720, margin: "0 auto", padding: "80px 24px 60px",
    textAlign: "center", position: "relative",
  },
  heroBadge: {
    display: "inline-block", marginBottom: 20,
    background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
    borderRadius: 999, padding: "6px 16px",
    fontSize: "0.82rem", fontWeight: 700, color: "#a5b4fc",
  },
  heroTitle: {
    margin: "0 0 20px", fontSize: "clamp(2.2rem, 6vw, 3.8rem)",
    fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.1,
    color: "#ffffff",
  },
  heroAccent: {
    background: "linear-gradient(135deg, #818cf8, #34d399)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  heroSub: {
    margin: "0 auto 32px", maxWidth: 560,
    color: "#94a3b8", fontSize: "1.1rem", lineHeight: 1.65,
  },
  heroCtas: { display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" },
  ctaPrimary: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff", border: "none", borderRadius: 16,
    padding: "14px 28px", fontWeight: 800, fontSize: "1rem",
    cursor: "pointer", boxShadow: "0 12px 28px rgba(99,102,241,0.3)",
  },
  ctaSecondary: {
    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
    color: "#dbe4f0", borderRadius: 16,
    padding: "14px 28px", fontWeight: 700, fontSize: "1rem", cursor: "pointer",
  },
  previewWrap: {
    marginTop: 40,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 24,
    padding: "20px 16px",
    overflow: "hidden",
    maxWidth: 600,
    margin: "40px auto 0",
  },
  previewShelf: {
    display: "flex",
    gap: 10,
    overflowX: "hidden",
    justifyContent: "center",
  },
  previewCard: {
    flexShrink: 0,
    width: 96,
    height: 136,
    borderRadius: 12,
    opacity: 0.85,
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    padding: 8,
    boxShadow: "0 10px 28px rgba(0,0,0,0.4)",
  },
  previewLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: "0.65rem",
    fontWeight: 800,
    letterSpacing: "0.04em",
    marginBottom: 5,
    display: "block",
  },
  previewBar: {
    height: 3,
    borderRadius: 999,
    background: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  previewBarFill: {
    height: "100%",
    borderRadius: 999,
    background: "rgba(255,255,255,0.8)",
  },
  features: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 16, maxWidth: 1000, margin: "0 auto", padding: "60px 24px 80px",
  },
  featureCard: {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 20, padding: "24px 22px",
    display: "flex", flexDirection: "column", gap: 8,
  },
  featureIcon: { fontSize: "1.8rem" },
  featureTitle: { fontSize: "1rem", fontWeight: 800, color: "#f1f5f9" },
  featureDesc: { margin: 0, color: "#64748b", fontSize: "0.88rem", lineHeight: 1.6 },
  bottomCta: {
    textAlign: "center", padding: "60px 24px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
  },
  bottomTitle: {
    margin: 0, fontSize: "1.8rem", fontWeight: 900,
    letterSpacing: "-0.03em", color: "#ffffff",
  },
  footer: { padding: "24px", borderTop: "1px solid rgba(255,255,255,0.04)" },
  footerText: { margin: 0, textAlign: "center", color: "#475569", fontSize: "0.82rem" },
};
