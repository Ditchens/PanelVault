import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { normalizeSeries, formatTypeLabel } from "../lib/seriesUtils";
import { STATUS_OPTIONS, getStatusOptionLabel } from "../lib/constants";

// Full-screen read-only view of another user's public library.
// Props:
//   username — string (from ?p= URL param)
//   onClose  — () => void
export default function PublicProfileView({ username, onClose }) {
  const [profile, setProfile]   = useState(null);
  const [series, setSeries]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [activeStatus, setActiveStatus] = useState("all");
  const [activeCategory, setActiveCategory] = useState("comics");

  useEffect(() => {
    if (!username || !supabase) { setError("Profile not found."); setLoading(false); return; }
    load();
  }, [username]);

  async function load() {
    setLoading(true);
    setError("");

    const { data: profileData, error: profileErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username.toLowerCase())
      .single();

    if (profileErr || !profileData) {
      setError("Profile not found or not public.");
      setLoading(false);
      return;
    }

    if (!profileData.is_public) {
      setError("This profile is private.");
      setLoading(false);
      return;
    }

    setProfile(profileData);

    const { data: seriesData, error: seriesErr } = await supabase
      .from("series")
      .select("*")
      .eq("user_id", profileData.id)
      .order("created_at", { ascending: false });

    if (seriesErr) {
      setError("Could not load their library.");
      setLoading(false);
      return;
    }

    setSeries(normalizeSeries((seriesData || []).map(fromRow)));
    setLoading(false);
  }

  function fromRow(row) {
    return {
      id: row.id,
      mediaCategory: row.media_category || "comics",
      title: row.title || "",
      image: row.image || "",
      type: row.type || "",
      status: row.status || "notRead",
      tags: Array.isArray(row.tags) ? row.tags : [],
      summary: row.summary || "",
      altTitles: Array.isArray(row.alt_titles) ? row.alt_titles : [],
      needsReview: !!row.needs_review,
      currentProgress: row.current_progress || 0,
      totalProgress: row.total_progress || null,
      rating: row.rating || null,
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    };
  }

  const filtered = series.filter((item) => {
    if ((item.mediaCategory || "comics") !== activeCategory) return false;
    if (activeStatus === "all") return true;
    return item.status === activeStatus;
  });

  const catTotal = series.filter((i) => (i.mediaCategory || "comics") === activeCategory).length;

  if (loading) {
    return (
      <div style={s.overlay}>
        <p style={{ color: "#64748b", fontSize: "1.1rem" }}>Loading @{username}…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={s.overlay}>
        <div style={s.errorCard}>
          <p style={{ color: "#f87171", fontWeight: 700, margin: "0 0 16px" }}>{error}</p>
          <button onClick={onClose} style={s.backBtn}>← Go back</button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.overlay}>
      <div style={s.page}>
        {/* Header */}
        <div style={s.header}>
          <button onClick={onClose} style={s.backBtn}>← Back</button>
          <div style={s.profileInfo}>
            <div style={s.avatar}>{(profile.username || "?")[0].toUpperCase()}</div>
            <div>
              <p style={s.profileName}>@{profile.username}</p>
              {profile.bio && <p style={s.profileBio}>{profile.bio}</p>}
            </div>
          </div>
          <div style={s.catToggle}>
            {["comics", "anime"].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{ ...s.catBtn, ...(activeCategory === cat ? s.catBtnActive : {}) }}
              >
                {cat === "anime" ? "Anime" : "Comics"}
              </button>
            ))}
          </div>
        </div>

        {/* Status filters */}
        <div style={s.filterRow}>
          {STATUS_OPTIONS.filter((o) => o.key !== "needsReview").map((opt) => (
            <button
              key={opt.key}
              onClick={() => setActiveStatus(opt.key)}
              style={{ ...s.filterBtn, ...(activeStatus === opt.key ? s.filterBtnActive : {}) }}
            >
              {getStatusOptionLabel(opt, activeCategory)}
              <span style={s.filterCount}>
                {opt.key === "all"
                  ? catTotal
                  : series.filter((i) => (i.mediaCategory || "comics") === activeCategory && i.status === opt.key).length}
              </span>
            </button>
          ))}
        </div>

        {/* Grid */}
        <div style={s.grid}>
          {filtered.map((item) => (
            <div key={item.id} style={s.card}>
              <div style={s.coverWrap}>
                {item.image ? (
                  <img src={item.image} alt={item.title} style={s.coverImg}
                    onError={(e) => { e.currentTarget.style.display = "none"; }} />
                ) : (
                  <div style={s.noCover}>No Cover</div>
                )}
                <div style={s.typeBadge}>{formatTypeLabel(item.type)}</div>
                {item.rating && <div style={s.ratingBadge}>★ {item.rating}</div>}
              </div>
              <p style={s.cardTitle}>{item.title}</p>
              {item.currentProgress > 0 && (
                <p style={s.cardProgress}>
                  {item.mediaCategory === "anime" ? "Ep" : "Ch"} {item.currentProgress}
                  {item.totalProgress ? `/${item.totalProgress}` : ""}
                </p>
              )}
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p style={{ textAlign: "center", color: "#475569", marginTop: 48 }}>
            Nothing here yet.
          </p>
        )}

        <p style={s.footer}>Read-only view of @{profile.username}'s public library</p>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "#0b0f18",
    zIndex: 9000,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    color: "#f8fafc",
  },
  page: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "24px 20px 48px",
    width: "100%",
  },
  errorCard: {
    margin: "auto",
    padding: 32,
    textAlign: "center",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    flexWrap: "wrap",
    marginBottom: 24,
  },
  backBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#94a3b8",
    borderRadius: 10,
    padding: "9px 14px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "0.88rem",
    flexShrink: 0,
  },
  profileInfo: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.4rem",
    fontWeight: 900,
    color: "#fff",
    flexShrink: 0,
  },
  profileName: {
    margin: 0,
    fontSize: "1.2rem",
    fontWeight: 900,
    color: "#f1f5f9",
    letterSpacing: "-0.02em",
  },
  profileBio: {
    margin: "4px 0 0",
    fontSize: "0.88rem",
    color: "#64748b",
  },
  catToggle: {
    display: "flex",
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.1)",
    flexShrink: 0,
  },
  catBtn: {
    padding: "9px 16px",
    background: "rgba(255,255,255,0.05)",
    color: "#94a3b8",
    border: "none",
    fontWeight: 700,
    fontSize: "0.88rem",
    cursor: "pointer",
  },
  catBtnActive: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
  },
  filterRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  filterBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 999,
    padding: "8px 14px",
    color: "#dbe4f0",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "0.88rem",
  },
  filterBtnActive: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
    border: "none",
  },
  filterCount: {
    background: "rgba(255,255,255,0.15)",
    borderRadius: 999,
    padding: "2px 7px",
    fontSize: "0.76rem",
    fontWeight: 800,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: 16,
  },
  card: { display: "flex", flexDirection: "column", gap: 7 },
  coverWrap: {
    width: "100%",
    aspectRatio: "0.72 / 1",
    background: "#0f172a",
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    position: "relative",
  },
  coverImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  noCover: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#475569",
    fontSize: "0.8rem",
    fontWeight: 700,
  },
  typeBadge: {
    position: "absolute",
    left: 7,
    bottom: 7,
    background: "rgba(37,99,235,0.95)",
    color: "#fff",
    borderRadius: 999,
    padding: "3px 7px",
    fontSize: "0.64rem",
    fontWeight: 800,
  },
  ratingBadge: {
    position: "absolute",
    right: 7,
    bottom: 7,
    background: "rgba(245,158,11,0.95)",
    color: "#fff",
    borderRadius: 999,
    padding: "3px 7px",
    fontSize: "0.64rem",
    fontWeight: 800,
  },
  cardTitle: {
    margin: 0,
    fontSize: "0.84rem",
    fontWeight: 700,
    color: "#dfe8f4",
    lineHeight: 1.3,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  cardProgress: {
    margin: 0,
    fontSize: "0.72rem",
    color: "#475569",
    fontWeight: 700,
  },
  footer: {
    marginTop: 48,
    textAlign: "center",
    color: "#1e293b",
    fontSize: "0.8rem",
  },
};
