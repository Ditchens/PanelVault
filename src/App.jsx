import React, { useEffect, useMemo, useState, Suspense, lazy } from "react";
import { supabase } from "./lib/supabase";
import {
  STORAGE_KEY,
  LISTS_STORAGE_KEY,
  CLOUD_IMPORT_FLAG_KEY,
  MEDIA_CATEGORIES,
  STATUS_OPTIONS,
  COMICS_TYPE_OPTIONS,
  ANIME_TYPE_OPTIONS,
  COMICS_TAG_OPTIONS,
  ANIME_TAG_OPTIONS,
  getStatusOptionLabel,
} from "./lib/constants";
import {
  createId,
  normalizeTitle,
  uniqueNormalizedStrings,
  getAllNamesForItem,
  normalizeSeries,
  applyMetadataPatches,
  getInitialData,
  formatTypeLabel,
} from "./lib/seriesUtils";
import SeriesModal from "./components/SeriesModal";
import OnboardingModal from "./components/OnboardingModal";
import ProfileModal from "./components/ProfileModal";
import PublicProfileView from "./components/PublicProfileView";
import SettingsModal, { loadSettings, ACTIVITY_KEY } from "./components/SettingsModal";
import ToastStack from "./components/ToastStack";
import Dashboard from "./components/Dashboard";
import LandingPage from "./components/LandingPage";

const DiscoverModal         = lazy(() => import("./components/DiscoverModal"));
const StatsModal            = lazy(() => import("./components/StatsModal"));
const ImportModal           = lazy(() => import("./components/ImportModal"));
const HistoryModal          = lazy(() => import("./components/HistoryModal"));
const RecommendationsModal  = lazy(() => import("./components/RecommendationsModal"));

// ─── Responsive hook ──────────────────────────────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1024
  );
  useEffect(() => {
    const fn = () => setWidth(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return width;
}

export default function PanelVaultApp() {
  // ── Responsive ────────────────────────────────────────────────────────────
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 640;

  // ── Auth ──────────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // ── Series state ──────────────────────────────────────────────────────────
  const [series, setSeries] = useState([]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const [activeMediaCategory, setActiveMediaCategory] = useState(() => loadSettings().defaultMediaCategory || "comics");
  const [activeStatus, setActiveStatus] = useState("all");
  const [activeType, setActiveType] = useState("all");
  const [activeTag, setActiveTag] = useState("all");
  const [activeListId, setActiveListId] = useState(null);

  // ── Add-series form ───────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [newType, setNewType] = useState("");
  const [newStatus, setNewStatus] = useState("notRead");

  // ── UI flags ──────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState(() => loadSettings().defaultSort || "newest");
  const [isFetchingCovers, setIsFetchingCovers] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDiscover, setShowDiscover] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [favoriteIds, setFavoriteIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("panelvault_favorites") || "[]")); }
    catch { return new Set(); }
  });
  const [activeMainView, setActiveMainView] = useState("home"); // "home" | "library"
  const [activeBottomTab, setActiveBottomTab] = useState("home"); // mobile nav

  // ── Toasts ────────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);

  function addToast(message, type = "info") {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }

  function dismissToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  // ── Profile / social ──────────────────────────────────────────────────────
  const [profile, setProfile]             = useState(null);
  const [showProfile, setShowProfile]     = useState(false);
  const [profileSetupNeeded, setProfileSetupNeeded] = useState(false);
  const [publicProfileUser, setPublicProfileUser]   = useState(null); // ?p= param

  // ── Onboarding ────────────────────────────────────────────────────────────
  const [showOnboarding, setShowOnboarding] = useState(false);

  // ── Update checker ────────────────────────────────────────────────────────
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [updateBadge, setUpdateBadge]             = useState(0);

  // ── Detail modal ──────────────────────────────────────────────────────────
  const [selectedItem, setSelectedItem] = useState(null);

  // ── Custom lists ──────────────────────────────────────────────────────────
  const [lists, setLists] = useState([]);
  const [newListName, setNewListName] = useState("");
  const [showNewListInput, setShowNewListInput] = useState(false);

  // ── Cloud ─────────────────────────────────────────────────────────────────
  const [cloudStatus, setCloudStatus] = useState("local-only");
  const [cloudMessage, setCloudMessage] = useState("Using local backup.");
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [isImportingToCloud, setIsImportingToCloud] = useState(false);
  const [hasLoadedCloud, setHasLoadedCloud] = useState(false);
  const [cloudHasData, setCloudHasData] = useState(false);

  // ── Auth setup ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!supabase) {
      setAuthChecked(true);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user || null);
      setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setCurrentUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Startup ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const savedLists = localStorage.getItem(LISTS_STORAGE_KEY);
    if (savedLists) {
      try { setLists(JSON.parse(savedLists) || []); } catch { /* ignore */ }
    }

    // Check for public profile in URL (?p=username)
    const urlParams = new URLSearchParams(window.location.search);
    const profileParam = urlParams.get("p");
    if (profileParam) setPublicProfileUser(profileParam);

    // Only seed with demo data when there's no auth configured (local-only mode)
    const localSeries = loadSeriesFromLocal();
    if (localSeries.length > 0) {
      setSeries(localSeries);
    } else if (!supabase) {
      // Local-only mode: seed with demo data
      const seeded = getInitialData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      setSeries(seeded);
    }
    // If supabase is configured, wait for cloud load before deciding to show onboarding

    async function loadCloudSeries() {
      if (!supabase) {
        setCloudStatus("local-only");
        setCloudMessage("Supabase not configured. Using local backup only.");
        setHasLoadedCloud(true);
        return;
      }

      setCloudStatus("checking");
      setCloudMessage("Checking cloud library…");

      const { data: rows, error } = await supabase
        .from("series")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load from cloud:", error);
        setCloudStatus("error");
        setCloudMessage("Cloud load failed. Using local backup.");
        setHasLoadedCloud(true);
        return;
      }

      if (Array.isArray(rows) && rows.length > 0) {
        const cloudSeries = applyMetadataPatches(normalizeSeries(rows.map(fromCloudRow)));
        setSeries(cloudSeries);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudSeries));
        setCloudHasData(true);
        localStorage.setItem(CLOUD_IMPORT_FLAG_KEY, "true");
        setCloudStatus("ready");
        setCloudMessage(`Loaded ${cloudSeries.length} series from cloud.`);
      } else {
        setCloudHasData(false);
        setCloudStatus("ready");
        setCloudMessage("Cloud is empty. Local library is still safe.");
        // New user with nothing stored anywhere — show onboarding
        if (localSeries.length === 0) setShowOnboarding(true);
      }

      setHasLoadedCloud(true);
    }

    loadCloudSeries();
  }, []);

  // ── Local storage ─────────────────────────────────────────────────────────

  function loadSeriesFromLocal() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      const patched = applyMetadataPatches(normalizeSeries(parsed));
      if (JSON.stringify(parsed) !== JSON.stringify(patched)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(patched));
      }
      return patched;
    } catch {
      return [];
    }
  }

  function saveListsToLocal(nextLists) {
    setLists(nextLists);
    localStorage.setItem(LISTS_STORAGE_KEY, JSON.stringify(nextLists));
    syncListsToCloud(nextLists);
  }

  // ── Lists cloud sync ──────────────────────────────────────────────────────

  function toListCloudRow(list) {
    return {
      id: list.id,
      user_id: currentUser?.id || null,
      name: list.name,
      created_at:
        typeof list.createdAt === "number"
          ? new Date(list.createdAt).toISOString()
          : new Date().toISOString(),
      item_ids: Array.isArray(list.itemIds) ? list.itemIds : [],
    };
  }

  function fromListCloudRow(row) {
    return {
      id: row.id,
      name: row.name || "",
      createdAt:
        typeof row.created_at === "string"
          ? new Date(row.created_at).getTime()
          : Date.now(),
      itemIds: Array.isArray(row.item_ids) ? row.item_ids : [],
    };
  }

  async function syncListsToCloud(nextLists) {
    if (!supabase || !currentUser) return;
    try {
      const { data: existingRows } = await supabase.from("lists").select("id");
      const nextIds = new Set(nextLists.map((l) => l.id));
      const toDelete = (existingRows || []).map((r) => r.id).filter((id) => !nextIds.has(id));
      if (toDelete.length > 0) await supabase.from("lists").delete().in("id", toDelete);
      if (nextLists.length > 0) await supabase.from("lists").upsert(nextLists.map(toListCloudRow));
    } catch (err) {
      console.error("Lists cloud sync failed:", err);
    }
  }

  async function loadListsFromCloud() {
    if (!supabase || !currentUser) return;
    try {
      const { data, error } = await supabase.from("lists").select("*");
      if (error || !data || data.length === 0) return;
      const cloudLists = data.map(fromListCloudRow);
      setLists(cloudLists);
      localStorage.setItem(LISTS_STORAGE_KEY, JSON.stringify(cloudLists));
    } catch (err) {
      console.error("Lists cloud load failed:", err);
    }
  }

  // Load lists + profile from cloud whenever the user logs in
  useEffect(() => {
    if (currentUser && supabase) {
      loadListsFromCloud();
      loadProfile();
    }
  }, [currentUser]);

  // Auto-check updates once per day if the setting is enabled
  useEffect(() => {
    if (!currentUser || !series.length) return;
    const settings = loadSettings();
    if (!settings.autoCheckUpdates) return;
    const today = new Date().toISOString().split("T")[0];
    const lastCheck = localStorage.getItem("panelvault_last_update_check");
    if (lastCheck === today) return;
    localStorage.setItem("panelvault_last_update_check", today);
    checkForUpdates(true);
  }, [currentUser, series.length > 0]);

  async function loadProfile() {
    if (!supabase || !currentUser) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();
      if (error || !data) {
        setProfileSetupNeeded(true);
        return;
      }
      setProfile(data);
      setProfileSetupNeeded(false);
    } catch {
      setProfileSetupNeeded(true);
    }
  }

  // ── Cloud data mapping ────────────────────────────────────────────────────

  function toCloudRow(item) {
    return {
      id: item.id,
      user_id: currentUser?.id || null,
      media_category: item.mediaCategory || "comics",
      title: item.title || "",
      image: item.image || "",
      type: item.type || "",
      status: item.status || "notRead",
      tags: Array.isArray(item.tags) ? item.tags : [],
      summary: item.summary || "",
      alt_titles: Array.isArray(item.altTitles) ? item.altTitles : [],
      needs_review: !!item.needsReview,
      current_progress: item.currentProgress || 0,
      total_progress: item.totalProgress ?? null,
      rating: item.rating ?? null,
      created_at:
        typeof item.createdAt === "number"
          ? new Date(item.createdAt).toISOString()
          : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  function fromCloudRow(row) {
    return {
      id: row.id,
      mediaCategory: row.media_category || row.mediaCategory || "comics",
      title: row.title || "",
      image: row.image || "",
      type: row.type || "",
      status: row.status || "notRead",
      tags: Array.isArray(row.tags) ? row.tags : [],
      summary: row.summary || "",
      altTitles: Array.isArray(row.alt_titles)
        ? row.alt_titles
        : Array.isArray(row.altTitles)
        ? row.altTitles
        : [],
      needsReview:
        typeof row.needs_review === "boolean"
          ? row.needs_review
          : typeof row.needsReview === "boolean"
          ? row.needsReview
          : true,
      currentProgress: typeof row.current_progress === "number" ? row.current_progress : 0,
      totalProgress: typeof row.total_progress === "number" ? row.total_progress : null,
      rating: row.rating != null ? Number(row.rating) : null,
      createdAt:
        typeof row.created_at === "string"
          ? new Date(row.created_at).getTime()
          : typeof row.createdAt === "number"
          ? row.createdAt
          : Date.now(),
    };
  }

  async function replaceCloudSeries(nextSeries) {
    const rows = nextSeries.map(toCloudRow);

    const { data: existingRows, error: existingError } = await supabase
      .from("series")
      .select("id");

    if (existingError) return { error: existingError };

    const nextIds = new Set(rows.map((r) => String(r.id)));
    const idsToDelete = (existingRows || [])
      .map((r) => String(r.id))
      .filter((id) => !nextIds.has(id));

    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("series")
        .delete()
        .in("id", idsToDelete);
      if (deleteError) return { error: deleteError };
    }

    if (rows.length > 0) {
      const { error: upsertError } = await supabase.from("series").upsert(rows);
      if (upsertError) return { error: upsertError };
    }

    return { error: null };
  }

  // ── Persist ───────────────────────────────────────────────────────────────

  async function persistSeries(nextSeries, options = {}) {
    const {
      showLocalError = true,
      syncCloud = true,
      successMessage = "",
      closeModalAfterSave = false,
    } = options;

    const normalized = applyMetadataPatches(normalizeSeries(nextSeries));

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      setSeries(normalized);
    } catch (err) {
      console.error("Failed to save locally:", err);
      if (showLocalError) {
        addToast("Could not save. Browser storage may be full.", "error");
      }
      return { ok: false, cloudOk: false };
    }

    if (!syncCloud || !supabase || !hasLoadedCloud) {
      return { ok: true, cloudOk: false };
    }

    setIsCloudSyncing(true);
    setCloudStatus("syncing");
    setCloudMessage("Saving to cloud…");

    const { error } = await replaceCloudSeries(normalized);
    setIsCloudSyncing(false);

    if (error) {
      console.error("Cloud sync failed:", error);
      setCloudStatus("error");
      setCloudMessage("Saved locally, but cloud sync failed.");
      addToast("Saved locally but cloud sync failed.", "error");
      return { ok: true, cloudOk: false };
    }

    setCloudHasData(normalized.length > 0);
    localStorage.setItem(CLOUD_IMPORT_FLAG_KEY, "true");
    setCloudStatus("ready");
    setCloudMessage(successMessage || "Saved and synced to cloud.");

    if (closeModalAfterSave) setSelectedItem(null);

    return { ok: true, cloudOk: true };
  }

  // ── Activity log ──────────────────────────────────────────────────────────

  function logActivity(seriesId, title, delta = 1) {
    const today = new Date().toISOString().split("T")[0];
    let log = [];
    try { log = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || "[]"); } catch {}
    log = [...log.slice(-999), { seriesId, title, date: today, delta, ts: Date.now() }];
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(log));
  }

  function getActivityLog() {
    try { return JSON.parse(localStorage.getItem(ACTIVITY_KEY) || "[]"); } catch { return []; }
  }

  // ── Cover fetching ────────────────────────────────────────────────────────

  async function fetchCover(seriesTitle) {
    // Try MangaDex first (higher quality covers)
    try {
      const searchRes = await fetch(
        `https://api.mangadex.org/manga?title=${encodeURIComponent(seriesTitle)}&limit=1` +
        `&contentRating[]=safe&contentRating[]=suggestive`
      );
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const mangaId = searchData?.data?.[0]?.id;
        if (mangaId) {
          const coverRes = await fetch(
            `https://api.mangadex.org/cover?manga[]=${mangaId}&limit=1`
          );
          if (coverRes.ok) {
            const coverData = await coverRes.json();
            const filename = coverData?.data?.[0]?.attributes?.fileName;
            if (filename) {
              return `https://uploads.mangadex.org/covers/${mangaId}/${filename}.256.jpg`;
            }
          }
        }
      }
    } catch {}

    // Fall back to Jikan/MAL
    try {
      const res = await fetch(
        `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(seriesTitle)}&limit=1`
      );
      const data = await res.json();
      return data?.data?.[0]?.images?.jpg?.image_url || "";
    } catch {
      return "";
    }
  }

  async function autoFetchMissingCovers() {
    setIsFetchingCovers(true);
    let updated = [...series];
    for (let i = 0; i < updated.length; i++) {
      if (!updated[i].image) {
        const img = await fetchCover(updated[i].title);
        if (img) updated[i] = { ...updated[i], image: img };
        await new Promise((r) => setTimeout(r, 400));
      }
    }
    await persistSeries(updated, { successMessage: "Covers updated." });
    setIsFetchingCovers(false);
  }

  // ── Series CRUD ───────────────────────────────────────────────────────────

  function entryConflictsWithSeries({ title: t, altTitles, excludeId = null }) {
    const candidates = uniqueNormalizedStrings([t, ...(altTitles || [])]).map(normalizeTitle);
    return series.some((item) => {
      if (excludeId !== null && item.id === excludeId) return false;
      return candidates.some((name) => getAllNamesForItem(item).includes(name));
    });
  }

  async function addSeries() {
    if (!title.trim()) { addToast("Please enter a title.", "error"); return; }

    const newItem = {
      id: createId(),
      createdAt: Date.now(),
      mediaCategory: activeMediaCategory,
      title: title.trim(),
      image: image.trim(),
      type: newType,
      status: newStatus,
      tags: [],
      summary: "",
      altTitles: [],
      needsReview: true,
      currentProgress: 0,
      totalProgress: null,
      rating: null,
    };

    if (entryConflictsWithSeries({ title: newItem.title, altTitles: [] })) {
      addToast("That title already exists in your library.", "error");
      return;
    }

    const result = await persistSeries([newItem, ...series], {
      successMessage: "Series added.",
    });
    if (!result.ok) return;

    setTitle("");
    setImage("");
    setNewType("");
    setNewStatus("notRead");
  }

  async function handleSaveDetails(id, updates) {
    const updated = series.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    const result = await persistSeries(updated, { successMessage: "Changes saved." });
    if (result.ok) {
      const refreshed = updated.find((item) => item.id === id);
      setSelectedItem(refreshed || null);
    }
    return result.ok;
  }

  async function deleteSeries(id) {
    await persistSeries(series.filter((item) => item.id !== id), {
      successMessage: "Series deleted.",
      closeModalAfterSave: true,
    });
  }

  async function clearAllCovers() {
    if (!window.confirm("Remove all cover images? Series data is kept.")) return;
    const result = await persistSeries(
      series.map((item) => ({ ...item, image: "" })),
      { successMessage: "" }
    );
    if (result.ok) addToast("All cover images cleared.", "success");
  }

  async function importLocalLibraryToCloud() {
    if (!supabase)           { addToast("Supabase is not configured.", "error"); return; }
    if (!hasLoadedCloud)     { addToast("Please wait for the cloud check to finish.", "info"); return; }
    if (cloudHasData)        { addToast("Cloud already has data.", "info"); return; }
    if (series.length === 0) { addToast("No local data to import.", "info"); return; }

    if (!window.confirm(`Import ${series.length} local series to Supabase?`)) return;

    setIsImportingToCloud(true);
    setCloudStatus("syncing");
    setCloudMessage("Importing local library to cloud…");

    const result = await persistSeries(series, {
      successMessage: "Library imported to cloud.",
    });
    setIsImportingToCloud(false);

    if (result.ok && result.cloudOk) {
      setCloudHasData(true);
      localStorage.setItem(CLOUD_IMPORT_FLAG_KEY, "true");
      addToast("Library imported to cloud.", "success");
    }
  }

  // ── MAL bulk import ───────────────────────────────────────────────────────

  async function handleBulkImport(items) {
    const newItems = items.map((item) => ({
      id: createId(),
      createdAt: Date.now() + Math.random(),
      ...item,
    }));
    await persistSeries([...newItems, ...series], {
      successMessage: `${newItems.length} series imported.`,
    });
  }

  // ── Quick progress increment ──────────────────────────────────────────────

  async function quickIncrementProgress(id) {
    const item = series.find((s) => s.id === id);
    if (!item) return;
    const next = (item.currentProgress || 0) + 1;
    logActivity(id, item.title);
    const updated = series.map((s) =>
      s.id === id ? { ...s, currentProgress: next } : s
    );
    if (selectedItem?.id === id) {
      setSelectedItem((prev) => ({ ...prev, currentProgress: next }));
    }
    await persistSeries(updated, { successMessage: "" });
  }

  // ── Bulk edit ─────────────────────────────────────────────────────────────

  function toggleBulkSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function bulkChangeStatus(newStatus) {
    const updated = series.map((item) =>
      selectedIds.has(item.id) ? { ...item, status: newStatus } : item
    );
    await persistSeries(updated, { successMessage: `${selectedIds.size} series updated.` });
    setSelectedIds(new Set());
    setBulkSelectMode(false);
  }

  async function bulkDelete() {
    if (!window.confirm(`Delete ${selectedIds.size} series? This cannot be undone.`)) return;
    const updated = series.filter((item) => !selectedIds.has(item.id));
    await persistSeries(updated, { successMessage: `${selectedIds.size} series deleted.` });
    setSelectedIds(new Set());
    setBulkSelectMode(false);
  }

  function exitBulkMode() {
    setBulkSelectMode(false);
    setSelectedIds(new Set());
  }

  function toggleFavorite(id, e) {
    e.stopPropagation();
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem("panelvault_favorites", JSON.stringify([...next]));
      return next;
    });
  }

  // ── Discover ──────────────────────────────────────────────────────────────

  async function addFromDiscover(seriesData) {
    if (entryConflictsWithSeries({ title: seriesData.title, altTitles: seriesData.altTitles })) {
      return;
    }
    const newItem = {
      id: createId(),
      createdAt: Date.now(),
      currentProgress: 0,
      totalProgress: null,
      rating: null,
      ...seriesData,
    };
    await persistSeries([newItem, ...series], { successMessage: `${newItem.title} added.` });
  }

  // ── Custom lists ──────────────────────────────────────────────────────────

  function createList() {
    const name = newListName.trim();
    if (!name) return;
    const newList = { id: createId(), name, createdAt: Date.now(), itemIds: [] };
    saveListsToLocal([...lists, newList]);
    setNewListName("");
    setShowNewListInput(false);
  }

  function deleteList(id) {
    if (!window.confirm("Delete this list?")) return;
    saveListsToLocal(lists.filter((l) => l.id !== id));
    if (activeListId === id) setActiveListId(null);
  }

  function toggleInList(listId, seriesId) {
    const updated = lists.map((l) => {
      if (l.id !== listId) return l;
      const inList = l.itemIds.includes(seriesId);
      return {
        ...l,
        itemIds: inList ? l.itemIds.filter((id) => id !== seriesId) : [...l.itemIds, seriesId],
      };
    });
    saveListsToLocal(updated);
  }

  // ── Navigation helpers ────────────────────────────────────────────────────

  function switchMediaCategory(cat) {
    setActiveMediaCategory(cat);
    setActiveType("all");
    setActiveTag("all");
    setActiveListId(null);
  }

  // ── Counts ────────────────────────────────────────────────────────────────

  function getCountByStatus(statusKey) {
    const cat = series.filter((i) => (i.mediaCategory || "comics") === activeMediaCategory);
    if (statusKey === "all")         return cat.length;
    if (statusKey === "needsReview") return cat.filter((i) => i.needsReview).length;
    if (statusKey === "favorites")   return cat.filter((i) => favoriteIds.has(i.id)).length;
    return cat.filter((i) => i.status === statusKey).length;
  }

  function getCountByType(typeKey) {
    const cat = series.filter((i) => (i.mediaCategory || "comics") === activeMediaCategory);
    if (typeKey === "all") return cat.length;
    return cat.filter((i) => i.type === typeKey).length;
  }

  // ── Filtered + sorted grid ────────────────────────────────────────────────

  const filteredAndSorted = useMemo(() => {
    let filtered = [...series];

    if (activeListId) {
      const activeList = lists.find((l) => l.id === activeListId);
      const listIds = new Set(activeList?.itemIds || []);
      filtered = filtered.filter((item) => listIds.has(item.id));
    } else {
      filtered = filtered.filter(
        (item) => (item.mediaCategory || "comics") === activeMediaCategory
      );
      if (activeStatus !== "all") {
        if (activeStatus === "needsReview") {
          filtered = filtered.filter((item) => item.needsReview);
        } else if (activeStatus === "favorites") {
          filtered = filtered.filter((item) => favoriteIds.has(item.id));
        } else {
          filtered = filtered.filter((item) => item.status === activeStatus);
        }
      }
      if (activeType !== "all") filtered = filtered.filter((item) => item.type === activeType);
      if (activeTag !== "all") filtered = filtered.filter((item) => item.tags.includes(activeTag));
    }

    if (searchTerm.trim()) {
      const q = normalizeTitle(searchTerm);
      filtered = filtered.filter((item) => {
        const names = [item.title, ...(item.altTitles || [])];
        if (names.some((n) => normalizeTitle(n).includes(q))) return true;
        if (item.tags?.some((t) => normalizeTitle(t).includes(q))) return true;
        if (item.summary && normalizeTitle(item.summary).includes(q)) return true;
        return false;
      });
    }

    return filtered.sort((a, b) => {
      if (sortOption === "az")     return a.title.localeCompare(b.title);
      if (sortOption === "za")     return b.title.localeCompare(a.title);
      if (sortOption === "oldest") return (a.createdAt || 0) - (b.createdAt || 0);
      if (sortOption === "rating") return (b.rating ?? -1) - (a.rating ?? -1);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [series, activeMediaCategory, activeStatus, activeType, activeTag, searchTerm, sortOption, activeListId, lists]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const typeOptions = activeMediaCategory === "anime" ? ANIME_TYPE_OPTIONS : COMICS_TYPE_OPTIONS;
  const tagOptions  = activeMediaCategory === "anime" ? ANIME_TAG_OPTIONS  : COMICS_TAG_OPTIONS;
  const activeList  = lists.find((l) => l.id === activeListId);

  const pageTitle = activeListId
    ? activeList?.name || "List"
    : getStatusOptionLabel(
        STATUS_OPTIONS.find((o) => o.key === activeStatus) || STATUS_OPTIONS[0],
        activeMediaCategory
      );

  const categoryTotal = useMemo(
    () => series.filter((i) => (i.mediaCategory || "comics") === activeMediaCategory).length,
    [series, activeMediaCategory]
  );

  const normalizedLibraryTitles = useMemo(() => {
    const s = new Set();
    series.forEach((item) => {
      s.add(normalizeTitle(item.title));
      (item.altTitles || []).forEach((a) => s.add(normalizeTitle(a)));
    });
    return s;
  }, [series]);

  function cloudStatusLabel() {
    if (cloudStatus === "syncing")    return "Syncing";
    if (cloudStatus === "error")      return "Error";
    if (cloudStatus === "checking")   return "Checking";
    if (cloudStatus === "local-only") return "Local Only";
    return "Ready";
  }

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  function handleProfileSave(updatedProfile) {
    setProfile(updatedProfile);
    setProfileSetupNeeded(false);
    setShowProfile(false);
  }

  async function handleClearAll() {
    localStorage.clear();
    if (supabase) await supabase.auth.signOut();
    window.location.reload();
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(series, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "panelvault-library.json";
    a.click();
    URL.revokeObjectURL(url);
    addToast("Library exported as JSON.", "success");
  }

  function exportMALXML() {
    const statusMap = { reading: "Reading", finished: "Completed", notRead: "Plan to Read", readNext: "Plan to Read", dropped: "Dropped" };
    const manga = series.filter((s) => (s.mediaCategory || "comics") === "comics");
    const anime = series.filter((s) => (s.mediaCategory || "comics") === "anime");

    function mangaEntry(item) {
      return `  <manga>
    <manga_title><![CDATA[${item.title}]]></manga_title>
    <manga_chapters>${item.currentProgress || 0}</manga_chapters>
    <manga_volumes>0</manga_volumes>
    <my_status>${statusMap[item.status] || "Plan to Read"}</my_status>
    <my_score>${item.rating || 0}</my_score>
  </manga>`;
    }

    function animeEntry(item) {
      return `  <anime>
    <series_title><![CDATA[${item.title}]]></series_title>
    <my_watched_episodes>${item.currentProgress || 0}</my_watched_episodes>
    <my_status>${statusMap[item.status] || "Plan to Watch"}</my_status>
    <my_score>${item.rating || 0}</my_score>
  </anime>`;
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<myanimelist>
  <myinfo>
    <user_export_type>1</user_export_type>
  </myinfo>
${manga.map(mangaEntry).join("\n")}
${anime.map(animeEntry).join("\n")}
</myanimelist>`;

    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "panelvault-mal-export.xml";
    a.click();
    URL.revokeObjectURL(url);
    addToast("Library exported as MAL XML.", "success");
  }

  async function checkForUpdates(silent = false) {
    if (isCheckingUpdates) return;

    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }

    setIsCheckingUpdates(true);
    setUpdateBadge(0);

    const currentlyReading = series.filter((s) => s.status === "reading");

    const LAST_KNOWN_KEY = "panelvault_last_known_progress";
    let lastKnown = {};
    try { lastKnown = JSON.parse(localStorage.getItem(LAST_KNOWN_KEY) || "{}"); } catch {}

    let newCount = 0;

    for (const item of currentlyReading) {
      try {
        const isAnime = (item.mediaCategory || "comics") === "anime";
        const endpoint = isAnime
          ? `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(item.title)}&limit=1`
          : `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(item.title)}&limit=1`;
        const res = await fetch(endpoint);
        if (!res.ok) continue;
        const json = await res.json();
        const apiItem = json?.data?.[0];
        if (!apiItem) continue;

        const apiTotal = isAnime ? (apiItem.episodes || 0) : (apiItem.chapters || 0);
        const prevTotal = lastKnown[item.id] ?? (item.totalProgress || 0);

        if (apiTotal > 0 && apiTotal > prevTotal) {
          newCount++;
          const unit = isAnime ? "episode" : "chapter";
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`New ${unit}s — ${item.title}`, {
              body: `Now at ${apiTotal} total ${unit}s.`,
              icon: "/icon.svg",
            });
          }
          lastKnown[item.id] = apiTotal;
        }

        await new Promise((r) => setTimeout(r, 400));
      } catch {
        // skip this item on error
      }
    }

    localStorage.setItem(LAST_KNOWN_KEY, JSON.stringify(lastKnown));
    setUpdateBadge(newCount);
    setIsCheckingUpdates(false);

    if (!silent && newCount === 0) {
      addToast("All up to date — no new chapters or episodes found.", "info");
    } else if (newCount > 0) {
      addToast(`${newCount} series updated!`, "success");
    }
  }

  // ── Auth gate ─────────────────────────────────────────────────────────────

  if (supabase && !authChecked) {
    return (
      <div style={{ ...st.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#64748b", fontSize: "1.1rem" }}>Loading…</p>
      </div>
    );
  }

  if (supabase && authChecked && !currentUser) {
    return <LandingPage />;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ ...st.page, paddingBottom: isMobile ? 72 : 0 }}>
      <div style={st.bgGlowOne} />
      <div style={st.bgGlowTwo} />

      {/* ── TOPBAR ────────────────────────────────────────────────────── */}
      <header style={{ ...st.topbar, ...(isMobile ? st.topbarMobile : {}) }}>
        {/* Left: brand + desktop menu */}
        <div
          style={st.topbarLeft}
          onMouseEnter={() => !isMobile && setMenuOpen(true)}
          onMouseLeave={() => !isMobile && setMenuOpen(false)}
        >
          <div style={{ ...st.brand, ...(isMobile ? { fontSize: "1.4rem" } : {}) }}>PanelVault</div>

          {!isMobile && (
            <button
              style={st.burgerButton}
              onClick={() => setMenuOpen((p) => !p)}
              aria-label="Open menu"
            >
              <span style={st.burgerLine} />
              <span style={st.burgerLine} />
            </button>
          )}

          {!isMobile && menuOpen && (
            <div style={st.menuDropdown}>
              <div style={st.menuCatRow}>
                {MEDIA_CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => { switchMediaCategory(cat.key); setMenuOpen(false); }}
                    style={{
                      ...st.menuCatBtn,
                      ...(activeMediaCategory === cat.key ? st.menuCatBtnActive : {}),
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div style={st.menuDivider} />

              <button
                onClick={() => { setActiveMainView("home"); setMenuOpen(false); }}
                style={{ ...st.menuItem, ...(activeMainView === "home" ? st.menuItemActive : {}) }}
              >
                <span>🏠 Home</span>
              </button>

              <div style={st.menuSectionLabel}>Library Views</div>

              {[...STATUS_OPTIONS, { key: "favorites", label: "★ Favorites" }].map((view) => {
                const active = activeMainView === "library" && !activeListId && activeStatus === view.key;
                return (
                  <button
                    key={view.key}
                    onClick={() => { setActiveMainView("library"); setActiveStatus(view.key); setActiveListId(null); setMenuOpen(false); }}
                    style={{ ...st.menuItem, ...(active ? st.menuItemActive : {}) }}
                  >
                    <span>{getStatusOptionLabel(view, activeMediaCategory)}</span>
                    <span style={st.menuCount}>{getCountByStatus(view.key)}</span>
                  </button>
                );
              })}

              {lists.length > 0 && (
                <>
                  <div style={st.menuDivider} />
                  <div style={st.menuSectionLabel}>My Lists</div>
                  {lists.map((list) => {
                    const active = activeListId === list.id;
                    return (
                      <div key={list.id} style={st.menuListRow}>
                        <button
                          onClick={() => { setActiveListId(list.id); setMenuOpen(false); }}
                          style={{ ...st.menuItem, ...(active ? st.menuItemActive : {}), flex: 1 }}
                        >
                          <span>📋 {list.name}</span>
                          <span style={st.menuCount}>{list.itemIds.length}</span>
                        </button>
                        <button
                          onClick={() => deleteList(list.id)}
                          style={st.menuDeleteList}
                          title="Delete list"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </>
              )}

              <div style={st.menuDivider} />

              {showNewListInput ? (
                <div style={st.newListRow}>
                  <input
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") createList(); if (e.key === "Escape") setShowNewListInput(false); }}
                    placeholder="List name…"
                    style={st.newListInput}
                    autoFocus
                  />
                  <button onClick={createList} style={st.newListConfirm}>Add</button>
                </div>
              ) : (
                <button onClick={() => setShowNewListInput(true)} style={st.menuNewList}>
                  + New List
                </button>
              )}

              <div style={st.menuDivider} />

              <button
                onClick={() => { setShowStats(true); setMenuOpen(false); }}
                style={st.menuItem}
              >
                <span>📊 Stats</span>
              </button>
              <button
                onClick={() => { setShowHistory(true); setMenuOpen(false); }}
                style={st.menuItem}
              >
                <span>📅 History</span>
              </button>
              <button
                onClick={() => { setShowRecommendations(true); setMenuOpen(false); }}
                style={st.menuItem}
              >
                <span>✨ For You</span>
              </button>
              <button
                onClick={() => { setShowImport(true); setMenuOpen(false); }}
                style={st.menuItem}
              >
                <span>📥 Import from MAL</span>
              </button>
              <button
                onClick={() => { exportJSON(); setMenuOpen(false); }}
                style={st.menuItem}
              >
                <span>💾 Export JSON</span>
              </button>
              <button
                onClick={() => { exportMALXML(); setMenuOpen(false); }}
                style={st.menuItem}
              >
                <span>📤 Export MAL XML</span>
              </button>
              <button
                onClick={() => { setShowSettings(true); setMenuOpen(false); }}
                style={st.menuItem}
              >
                <span>⚙️ Settings</span>
              </button>
              <button
                onClick={() => { setShowProfile(true); setMenuOpen(false); }}
                style={st.menuItem}
              >
                <span>👤 {profile ? `@${profile.username}` : "Set up Profile"}</span>
              </button>
              <button
                onClick={() => { checkForUpdates(); setMenuOpen(false); }}
                disabled={isCheckingUpdates}
                style={{ ...st.menuItem, opacity: isCheckingUpdates ? 0.7 : 1 }}
              >
                <span>
                  {isCheckingUpdates ? "🔔 Checking…" : "🔔 Check for Updates"}
                  {updateBadge > 0 && (
                    <span style={{ marginLeft: 6, background: "#ef4444", color: "#fff", borderRadius: 999, padding: "1px 6px", fontSize: "0.75rem", fontWeight: 800 }}>
                      {updateBadge}
                    </span>
                  )}
                </span>
              </button>

              {currentUser && (
                <button onClick={handleSignOut} style={{ ...st.menuItem, color: "#94a3b8" }}>
                  <span>Sign Out ({currentUser.email})</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Center: search */}
        <div style={st.topbarCenter}>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${activeMediaCategory === "anime" ? "anime" : "comics"}…`}
            style={{ ...st.headerSearch, ...(isMobile ? { fontSize: "0.9rem" } : {}) }}
          />
        </div>

        {/* Right: category toggle + total + sign out */}
        {!isMobile && (
          <div style={st.topbarRight}>
            <div style={st.catToggleGroup}>
              {MEDIA_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => switchMediaCategory(cat.key)}
                  style={{
                    ...st.catToggleBtn,
                    ...(activeMediaCategory === cat.key ? st.catToggleBtnActive : {}),
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div style={st.totalPill}>Total {categoryTotal}</div>
            {currentUser && (
              <>
                <button
                  onClick={() => setShowProfile(true)}
                  style={st.profileTopBtn}
                  title={profile ? `@${profile.username}` : "Set up profile"}
                >
                  {profile ? `@${profile.username}` : "Profile"}
                  {updateBadge > 0 && <span style={st.updateDot}>{updateBadge}</span>}
                </button>
                <button onClick={handleSignOut} style={st.signOutBtn} title={currentUser.email}>
                  Sign Out
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {/* ── MAIN ──────────────────────────────────────────────────────── */}
      <main style={{ ...st.main, ...(isMobile ? { padding: "16px 14px" } : {}) }}>
      {activeMainView === "home" ? (
        <Dashboard
          series={series}
          profile={profile}
          onOpenSeries={setSelectedItem}
          onDiscover={() => setShowDiscover(true)}
          onViewLibrary={(status) => {
            setActiveMainView("library");
            setActiveStatus(status);
            setActiveListId(null);
            setActiveBottomTab("library");
          }}
        />
      ) : (<>

        {/* Hero row */}
        <section style={{ ...st.heroRow, ...(isMobile ? { flexDirection: "column", gap: 12 } : {}) }}>
          <div>
            <p style={st.kicker}>Your {activeMediaCategory === "anime" ? "anime" : "comics"} library</p>
            <h1 style={{ ...st.pageTitle, ...(isMobile ? { fontSize: "1.5rem" } : {}) }}>
              {pageTitle}
              {!activeListId && activeType !== "all"
                ? ` · ${typeOptions.find((o) => o.key === activeType)?.label || ""}`
                : ""}
              {!activeListId && activeTag !== "all" ? ` · ${activeTag}` : ""}
            </h1>
            {!isMobile && (
              <p style={st.pageSubtitle}>Click any card to view details.</p>
            )}
          </div>

          <div style={{ ...st.heroActions, ...(isMobile ? { width: "100%", flexDirection: "row", flexWrap: "wrap" } : {}) }}>
            {!isMobile && (
              <div style={st.cloudStatusWrap}>
                <div style={st.cloudStatusPill}>Cloud: {cloudStatusLabel()}</div>
                <p style={st.cloudStatusText}>{cloudMessage}</p>
              </div>
            )}

            <button onClick={() => setShowDiscover(true)} style={st.discoverButton}>
              Discover
            </button>

            {!cloudHasData && series.length > 0 && (
              <button
                onClick={importLocalLibraryToCloud}
                disabled={isImportingToCloud || isCloudSyncing || !hasLoadedCloud}
                style={{ ...st.secondaryButton, opacity: isImportingToCloud ? 0.7 : 1 }}
              >
                {isImportingToCloud ? "Importing…" : "Import to Cloud"}
              </button>
            )}

            {!isMobile && (
              <>
                <button onClick={clearAllCovers} style={st.ghostButton}>Clear Covers</button>
                <button
                  onClick={autoFetchMissingCovers}
                  disabled={isFetchingCovers || isCloudSyncing}
                  style={{ ...st.primaryButton, opacity: isFetchingCovers ? 0.7 : 1 }}
                >
                  {isFetchingCovers ? "Fetching…" : "Auto Fetch Covers"}
                </button>
              </>
            )}
          </div>
        </section>

        {/* Mobile category switcher */}
        {isMobile && (
          <div style={st.mobileCatRow}>
            {MEDIA_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => switchMediaCategory(cat.key)}
                style={{
                  ...st.mobileCatBtn,
                  ...(activeMediaCategory === cat.key ? st.mobileCatBtnActive : {}),
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Mobile status filter strip */}
        {isMobile && !activeListId && (
          <div style={st.mobileStatusRow}>
            {STATUS_OPTIONS.filter((o) => o.key !== "needsReview").map((opt) => {
              const active = activeStatus === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setActiveStatus(opt.key)}
                  style={{ ...st.mobileStatusBtn, ...(active ? st.mobileStatusBtnActive : {}) }}
                >
                  {getStatusOptionLabel(opt, activeMediaCategory)}
                  <span style={st.mobileStatusCount}>{getCountByStatus(opt.key)}</span>
                </button>
              );
            })}
            <button
              onClick={() => setActiveStatus(activeStatus === "favorites" ? "all" : "favorites")}
              style={{ ...st.mobileStatusBtn, ...(activeStatus === "favorites" ? st.mobileStatusBtnActive : {}) }}
            >
              ★ Fav
              <span style={st.mobileStatusCount}>{getCountByStatus("favorites")}</span>
            </button>
          </div>
        )}

        {/* Type + tag filter chips */}
        {!activeListId && (
          <>
            <section style={{ ...st.filterRow, ...(isMobile ? { gap: 7, marginBottom: 8 } : {}) }}>
              {typeOptions.map((type) => (
                <button
                  key={type.key}
                  onClick={() => setActiveType(type.key)}
                  style={{
                    ...st.typeChip,
                    ...(activeType === type.key ? st.typeChipActive : {}),
                    ...(isMobile ? { padding: "8px 10px", fontSize: "0.82rem" } : {}),
                  }}
                >
                  {type.label}
                  <span style={st.typeChipCount}>{getCountByType(type.key)}</span>
                </button>
              ))}
            </section>

            <section style={{ ...st.filterRow, ...(isMobile ? { gap: 7, marginBottom: 10 } : {}) }}>
              <button
                onClick={() => setActiveTag("all")}
                style={{
                  ...st.typeChip,
                  ...(activeTag === "all" ? st.typeChipActive : {}),
                  ...(isMobile ? { padding: "7px 10px", fontSize: "0.8rem" } : {}),
                }}
              >
                All Tags
              </button>
              {tagOptions.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  style={{
                    ...st.typeChip,
                    ...(activeTag === tag ? st.typeChipActive : {}),
                    ...(isMobile ? { padding: "7px 10px", fontSize: "0.8rem" } : {}),
                  }}
                >
                  {tag}
                </button>
              ))}
            </section>
          </>
        )}

        {/* Add form */}
        {!activeListId && (
          <section style={st.addPanel}>
            <div style={st.addPanelHeader}>
              <h2 style={st.sectionTitle}>
                Add {activeMediaCategory === "anime" ? "Anime" : "Series"}
              </h2>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                style={st.compactSelect}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="az">A–Z</option>
                <option value="za">Z–A</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>

            <div style={isMobile ? st.formGridMobile : st.formGrid}>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSeries()}
                placeholder="Title"
                style={st.input}
              />
              <input
                value={image}
                onChange={(e) => setImage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSeries()}
                placeholder="Cover URL (optional)"
                style={st.input}
              />
              <select value={newType} onChange={(e) => setNewType(e.target.value)} style={st.input}>
                <option value="">Type (optional)</option>
                {typeOptions.filter((o) => o.key !== "all").map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} style={st.input}>
                {STATUS_OPTIONS.filter((o) => o.key !== "all" && o.key !== "needsReview").map((o) => (
                  <option key={o.key} value={o.key}>
                    {getStatusOptionLabel(o, activeMediaCategory)}
                  </option>
                ))}
              </select>
              <button onClick={addSeries} style={st.primaryButton}>Add</button>
            </div>
          </section>
        )}

        {/* Grid */}
        <section>
          <div style={st.sectionHeader}>
            <h2 style={st.sectionHeading}>{filteredAndSorted.length} results</h2>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {activeListId && (
                <button onClick={() => setActiveListId(null)} style={st.exitListBtn}>
                  ← Back
                </button>
              )}
              {!bulkSelectMode && filteredAndSorted.length > 0 && (
                <button
                  onClick={() => { setBulkSelectMode(true); setSelectedIds(new Set()); }}
                  style={st.exitListBtn}
                >
                  Select
                </button>
              )}
              {bulkSelectMode && (
                <button onClick={exitBulkMode} style={st.exitListBtn}>Cancel</button>
              )}
            </div>
          </div>

          {filteredAndSorted.length === 0 ? (
            <div style={st.emptyState}>
              <div style={{ fontSize: "2.6rem", lineHeight: 1 }}>
                {activeStatus === "reading" ? "📖" :
                 activeStatus === "finished" ? "🏆" :
                 activeStatus === "favorites" ? "⭐" :
                 activeStatus === "dropped" ? "📦" :
                 activeStatus === "readNext" ? "🔖" : "✨"}
              </div>
              <p style={st.emptyTitle}>
                {activeListId ? "This list is empty" :
                 activeStatus === "all" ? "Your library is empty" :
                 activeStatus === "reading" ? "Nothing in progress" :
                 activeStatus === "finished" ? "Nothing finished yet" :
                 activeStatus === "readNext" ? "Queue is empty" :
                 activeStatus === "dropped" ? "Nothing dropped" :
                 activeStatus === "favorites" ? "No favourites yet" :
                 "Nothing here yet"}
              </p>
              <p style={st.emptyText}>
                {activeListId ? "Add series to this list from their detail card." :
                 activeStatus === "all" ? "Tap Discover to find something to read." :
                 activeStatus === "reading" ? "Move a series to Reading to track it here." :
                 activeStatus === "finished" ? "Completed series will appear here." :
                 activeStatus === "readNext" ? "Add series to your queue and they'll show up here." :
                 activeStatus === "favorites" ? "Tap ★ on any card to favourite it." :
                 "Try another filter or add a new title above."}
              </p>
              {activeStatus === "all" && !activeListId && (
                <button onClick={() => setShowDiscover(true)} style={st.emptyDiscoverBtn}>
                  Discover Something →
                </button>
              )}
            </div>
          ) : (
            <div style={{ ...st.grid, ...(isMobile ? { gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12 } : {}) }}>
              {filteredAndSorted.map((item) => {
                const hasImage = !!item.image?.trim();
                const hasProgress = item.currentProgress > 0 || item.totalProgress != null;
                return (
                  <button
                    key={item.id}
                    onClick={() => bulkSelectMode ? toggleBulkSelect(item.id) : setSelectedItem(item)}
                    style={st.cardButton}
                    className="pv-card"
                    title={bulkSelectMode ? `Select ${item.title}` : `Open ${item.title}`}
                  >
                    <div style={st.card}>
                      <div style={st.coverWrap}>
                        {hasImage ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            style={st.coverImage}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              if (e.currentTarget.nextSibling)
                                e.currentTarget.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div style={{ ...st.noCover, display: hasImage ? "none" : "flex" }}>
                          <span style={st.noCoverText}>No Cover</span>
                        </div>

                        <div style={st.cardTypeBadge}>{formatTypeLabel(item.type)}</div>

                        {(item.mediaCategory || "comics") === "anime" && (
                          <div style={st.animeBadge}>Anime</div>
                        )}

                        {item.needsReview && (
                          <div style={st.reviewBadge}>Review</div>
                        )}

                        {item.rating != null && (
                          <div style={st.ratingBadge}>★ {item.rating}</div>
                        )}

                        {/* Progress bar */}
                        {item.totalProgress > 0 && item.currentProgress > 0 && (
                          <div style={st.cardProgressBar}>
                            <div style={{
                              ...st.cardProgressFill,
                              width: `${Math.min(100, (item.currentProgress / item.totalProgress) * 100)}%`,
                              background: item.currentProgress >= item.totalProgress
                                ? "linear-gradient(90deg,#22c55e,#4ade80)"
                                : "linear-gradient(90deg,#6366f1,#8b5cf6)",
                            }} />
                          </div>
                        )}

                        {/* Star / favourite */}
                        {!bulkSelectMode && (
                          <button
                            style={{
                              ...st.starBtn,
                              color: favoriteIds.has(item.id) ? "#fbbf24" : "rgba(255,255,255,0.25)",
                            }}
                            onClick={(e) => toggleFavorite(item.id, e)}
                            title={favoriteIds.has(item.id) ? "Remove from favourites" : "Add to favourites"}
                          >
                            ★
                          </button>
                        )}

                        {bulkSelectMode && (
                          <div style={{
                            ...st.bulkOverlay,
                            background: selectedIds.has(item.id) ? "rgba(99,102,241,0.35)" : "transparent",
                          }}>
                            <div style={{
                              ...st.bulkCheck,
                              background: selectedIds.has(item.id) ? "#6366f1" : "rgba(15,23,42,0.7)",
                              border: selectedIds.has(item.id) ? "none" : "2px solid rgba(255,255,255,0.5)",
                            }}>
                              {selectedIds.has(item.id) && "✓"}
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={st.cardMeta}>
                        <p title={item.title} style={st.cardTitle}>{item.title}</p>
                        {(hasProgress || item.status === "reading") && (
                          <div style={st.progressRow}>
                            <span style={st.progressText}>
                              {item.mediaCategory === "anime" ? "Ep" : "Ch"}{" "}
                              {item.currentProgress}
                              {item.totalProgress != null ? `/${item.totalProgress}` : ""}
                            </span>
                            <button
                              style={st.quickPlusBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                quickIncrementProgress(item.id);
                              }}
                              title="Increment progress"
                            >
                              +1
                            </button>
                          </div>
                        )}
                        {item.tags.length > 0 && (
                          <div style={st.cardTagRow}>
                            {item.tags.slice(0, 2).map((tag) => (
                              <span key={tag} style={st.smallTag}>{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </>)}
      </main>

      {/* ── BULK ACTION BAR ───────────────────────────────────────────── */}
      {bulkSelectMode && selectedIds.size > 0 && (
        <div style={st.bulkBar}>
          <span style={st.bulkCount}>{selectedIds.size} selected</span>
          <button
            onClick={() => setSelectedIds(new Set(filteredAndSorted.map((i) => i.id)))}
            style={st.bulkActionBtn}
          >
            All
          </button>
          <select
            defaultValue=""
            onChange={(e) => { if (e.target.value) { bulkChangeStatus(e.target.value); e.target.value = ""; } }}
            style={st.bulkSelect}
          >
            <option value="">Move to…</option>
            {STATUS_OPTIONS
              .filter((o) => o.key !== "all" && o.key !== "needsReview")
              .map((o) => (
                <option key={o.key} value={o.key}>
                  {getStatusOptionLabel(o, activeMediaCategory)}
                </option>
              ))}
          </select>
          <button onClick={bulkDelete} style={st.bulkDeleteBtn}>Delete</button>
        </div>
      )}

      {/* ── MOBILE BOTTOM NAV ─────────────────────────────────────────── */}
      {isMobile && (
        <nav style={st.bottomNav}>
          {[
            { key: "home",     icon: "🏠", label: "Home"     },
            { key: "library",  icon: "📚", label: "Library",
              badge: series.filter((s) => s.status === "reading" && (s.mediaCategory || "comics") === activeMediaCategory).length || 0 },
            { key: "discover", icon: "🔍", label: "Discover" },
            { key: "profile",  icon: "👤", label: "Account"  },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                if (tab.key === "discover") {
                  setShowDiscover(true);
                } else if (tab.key === "profile") {
                  setShowProfile(true);
                } else if (tab.key === "home") {
                  setActiveMainView("home");
                  setActiveBottomTab("home");
                } else {
                  setActiveMainView("library");
                  setActiveBottomTab("library");
                  setActiveListId(null);
                }
              }}
              style={{
                ...st.bottomNavBtn,
                ...(activeBottomTab === tab.key ? st.bottomNavBtnActive : {}),
              }}
            >
              <div style={{ position: "relative", display: "inline-flex" }}>
                <span style={{ fontSize: "1.3rem" }}>{tab.icon}</span>
                {tab.badge > 0 && (
                  <span style={st.navBadge}>{tab.badge > 9 ? "9+" : tab.badge}</span>
                )}
              </div>
              <span style={st.bottomNavLabel}>{tab.label}</span>
            </button>
          ))}
        </nav>
      )}

      {/* Mobile lists sheet */}
      {isMobile && menuOpen && (
        <div style={st.mobileSheet} onClick={() => setMenuOpen(false)}>
          <div style={st.mobileSheetContent} onClick={(e) => e.stopPropagation()}>
            <div style={st.mobileSheetHandle} />
            <p style={st.menuSectionLabel}>My Lists</p>

            {lists.map((list) => (
              <div key={list.id} style={st.menuListRow}>
                <button
                  onClick={() => { setActiveListId(list.id); setMenuOpen(false); setActiveBottomTab("library"); }}
                  style={{ ...st.menuItem, flex: 1, ...(activeListId === list.id ? st.menuItemActive : {}) }}
                >
                  <span>📋 {list.name}</span>
                  <span style={st.menuCount}>{list.itemIds.length}</span>
                </button>
                <button onClick={() => deleteList(list.id)} style={st.menuDeleteList}>✕</button>
              </div>
            ))}

            {showNewListInput ? (
              <div style={st.newListRow}>
                <input
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") createList(); }}
                  placeholder="List name…"
                  style={st.newListInput}
                  autoFocus
                />
                <button onClick={createList} style={st.newListConfirm}>Add</button>
              </div>
            ) : (
              <button onClick={() => setShowNewListInput(true)} style={st.menuNewList}>
                + New List
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── MODALS ────────────────────────────────────────────────────── */}
      <Suspense fallback={null}>

      {selectedItem && (
        <SeriesModal
          selectedItem={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSave={handleSaveDetails}
          onDelete={deleteSeries}
          lists={lists}
          onToggleInList={toggleInList}
          onCheckConflict={entryConflictsWithSeries}
          currentUser={currentUser}
        />
      )}

      {showDiscover && (
        <DiscoverModal
          onClose={() => setShowDiscover(false)}
          onAdd={addFromDiscover}
          existingTitles={normalizedLibraryTitles}
          defaultMediaCategory={activeMediaCategory}
        />
      )}

      {showStats && (
        <StatsModal
          series={series}
          activityLog={getActivityLog()}
          onClose={() => setShowStats(false)}
        />
      )}

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImport={handleBulkImport}
          existingTitles={normalizedLibraryTitles}
        />
      )}

      {showOnboarding && (
        <OnboardingModal
          onImport={() => { setShowOnboarding(false); setShowImport(true); }}
          onDiscover={() => { setShowOnboarding(false); setShowDiscover(true); }}
          onSkip={() => setShowOnboarding(false)}
        />
      )}

      {(showProfile || profileSetupNeeded) && currentUser && !showOnboarding && (
        <ProfileModal
          profile={profile}
          currentUser={currentUser}
          onSave={handleProfileSave}
          onClose={() => setShowProfile(false)}
          onSignOut={handleSignOut}
          isSetup={profileSetupNeeded && !showProfile}
        />
      )}

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onSignOut={handleSignOut}
          onClearActivity={() => {}}
          onClearAll={handleClearAll}
        />
      )}

      {showHistory && (
        <HistoryModal onClose={() => setShowHistory(false)} />
      )}

      {showRecommendations && (
        <RecommendationsModal
          series={series}
          onOpenSeries={(item) => { setSelectedItem(item); setShowRecommendations(false); }}
          onClose={() => setShowRecommendations(false)}
        />
      )}

      {publicProfileUser && (
        <PublicProfileView
          username={publicProfileUser}
          onClose={() => {
            setPublicProfileUser(null);
            const url = new URL(window.location.href);
            url.searchParams.delete("p");
            window.history.replaceState({}, "", url.toString());
          }}
        />
      )}

      </Suspense>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const ctrl = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 14,
  outline: "none",
  fontSize: "0.95rem",
  padding: "12px 14px",
  color: "#f8fafc",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "none",
  WebkitAppearance: "none",
  appearance: "none",
};

const st = {
  page: {
    minHeight: "100vh",
    width: "100%",
    background:
      "radial-gradient(circle at top left, rgba(118,75,162,0.18), transparent 24%), radial-gradient(circle at top right, rgba(67,206,162,0.14), transparent 20%), linear-gradient(180deg, #0b0f18 0%, #0d111a 45%, #0a0e16 100%)",
    color: "#f8fafc",
    position: "relative",
    overflowX: "hidden",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  bgGlowOne: {
    position: "absolute",
    width: 300, height: 300,
    borderRadius: "50%",
    background: "rgba(99,102,241,0.14)",
    filter: "blur(90px)",
    top: -80, left: -60,
    pointerEvents: "none",
  },
  bgGlowTwo: {
    position: "absolute",
    width: 260, height: 260,
    borderRadius: "50%",
    background: "rgba(34,211,238,0.1)",
    filter: "blur(90px)",
    top: 120, right: -70,
    pointerEvents: "none",
  },

  // ── Topbar ───────────────────────────────────────────────────────────────
  topbar: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    alignItems: "center",
    gap: 20,
    padding: "16px 28px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    backdropFilter: "blur(16px)",
    background: "rgba(10,14,22,0.72)",
  },
  topbarMobile: {
    gridTemplateColumns: "auto 1fr",
    padding: "12px 14px",
    gap: 12,
  },
  topbarLeft: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 14,
    paddingBottom: 12,
    marginBottom: -12,
  },
  brand: {
    fontSize: "1.75rem",
    fontWeight: 900,
    letterSpacing: "-0.04em",
    color: "#f8fafc",
    whiteSpace: "nowrap",
  },
  burgerButton: {
    width: 48, height: 48,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    cursor: "pointer",
    padding: 0,
    flexShrink: 0,
  },
  burgerLine: {
    width: 22, height: 2.5,
    background: "#f8fafc",
    borderRadius: 999,
    display: "block",
  },
  menuDropdown: {
    position: "absolute",
    top: "calc(100% - 4px)",
    left: 0,
    minWidth: 300,
    padding: 10,
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(19,24,35,0.98)",
    boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    zIndex: 30,
  },
  menuCatRow: { display: "flex", gap: 8, padding: "4px 4px 8px" },
  menuCatBtn: {
    flex: 1,
    padding: "9px 0",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    color: "#dbe4f0",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "0.9rem",
  },
  menuCatBtnActive: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
    border: "none",
    boxShadow: "0 6px 16px rgba(99,102,241,0.3)",
  },
  menuDivider: { height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" },
  menuSectionLabel: {
    padding: "6px 10px 2px",
    color: "#8ea3bd",
    fontSize: "0.75rem",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    background: "transparent",
    color: "#dbe4f0",
    border: "none",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: "0.95rem",
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "left",
  },
  menuItemActive: { background: "rgba(99,102,241,0.18)", color: "#ffffff" },
  menuCount: {
    background: "rgba(255,255,255,0.1)",
    borderRadius: 999,
    padding: "3px 8px",
    fontSize: "0.8rem",
    fontWeight: 800,
  },
  menuListRow: { display: "flex", alignItems: "center", gap: 4 },
  menuDeleteList: {
    background: "transparent",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    fontSize: "0.8rem",
    padding: "6px 8px",
    borderRadius: 8,
    flexShrink: 0,
  },
  menuNewList: {
    background: "rgba(255,255,255,0.05)",
    border: "1px dashed rgba(255,255,255,0.12)",
    color: "#94a3b8",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: "0.9rem",
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "left",
  },
  newListRow: { display: "flex", gap: 8, padding: "4px 0" },
  newListInput: {
    flex: 1,
    ...ctrl,
    padding: "9px 12px",
    fontSize: "0.9rem",
    borderRadius: 10,
  },
  newListConfirm: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "9px 14px",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  topbarCenter: { display: "flex", justifyContent: "center" },
  headerSearch: {
    ...ctrl,
    maxWidth: 520,
    width: "100%",
    borderRadius: 18,
    padding: "13px 16px",
    fontSize: "1rem",
    background: "rgba(255,255,255,0.08)",
  },
  topbarRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    justifyContent: "flex-end",
  },
  catToggleGroup: {
    display: "flex",
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  catToggleBtn: {
    padding: "9px 16px",
    background: "rgba(255,255,255,0.05)",
    color: "#94a3b8",
    border: "none",
    fontWeight: 700,
    fontSize: "0.88rem",
    cursor: "pointer",
  },
  catToggleBtnActive: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
  },
  totalPill: {
    borderRadius: 999,
    padding: "9px 14px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    fontSize: "0.9rem",
    fontWeight: 800,
    color: "#e2e8f0",
    whiteSpace: "nowrap",
  },
  signOutBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#94a3b8",
    borderRadius: 12,
    padding: "9px 14px",
    fontWeight: 700,
    fontSize: "0.85rem",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  profileTopBtn: {
    background: "rgba(99,102,241,0.12)",
    border: "1px solid rgba(99,102,241,0.3)",
    color: "#a5b4fc",
    borderRadius: 12,
    padding: "9px 14px",
    fontWeight: 700,
    fontSize: "0.85rem",
    cursor: "pointer",
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  updateDot: {
    background: "#ef4444",
    color: "#fff",
    borderRadius: 999,
    padding: "1px 6px",
    fontSize: "0.7rem",
    fontWeight: 800,
    lineHeight: 1.6,
  },

  // ── Main ─────────────────────────────────────────────────────────────────
  main: { padding: "28px" },
  heroRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 18,
    flexWrap: "wrap",
    marginBottom: 18,
  },
  kicker: {
    margin: 0,
    color: "#8ea3bd",
    fontSize: "0.88rem",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  pageTitle: {
    margin: "8px 0",
    fontSize: "2rem",
    lineHeight: 1.05,
    fontWeight: 900,
    letterSpacing: "-0.04em",
    color: "#ffffff",
  },
  pageSubtitle: { margin: 0, color: "#a6b3c5", fontSize: "0.98rem" },
  heroActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "flex-end",
  },
  cloudStatusWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginRight: 4,
    minWidth: 200,
  },
  cloudStatusPill: {
    borderRadius: 999,
    padding: "9px 14px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    fontSize: "0.88rem",
    fontWeight: 800,
    color: "#e2e8f0",
    whiteSpace: "nowrap",
    alignSelf: "flex-start",
  },
  cloudStatusText: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "0.84rem",
    lineHeight: 1.45,
    maxWidth: 280,
  },
  discoverButton: {
    background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    padding: "12px 18px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(14,165,233,0.25)",
    whiteSpace: "nowrap",
  },

  // ── Mobile category row ───────────────────────────────────────────────────
  mobileCatRow: {
    display: "flex",
    gap: 10,
    marginBottom: 12,
  },
  mobileCatBtn: {
    flex: 1,
    padding: "10px 0",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    color: "#dbe4f0",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "0.92rem",
  },
  mobileCatBtnActive: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
    border: "none",
    boxShadow: "0 6px 16px rgba(99,102,241,0.3)",
  },
  mobileStatusRow: {
    display: "flex",
    gap: 7,
    overflowX: "auto",
    paddingBottom: 4,
    marginBottom: 4,
    scrollbarWidth: "none",
  },
  mobileStatusBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    flexShrink: 0,
    padding: "7px 11px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    color: "#94a3b8",
    fontSize: "0.8rem",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  mobileStatusBtnActive: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
    border: "none",
  },
  mobileStatusCount: {
    background: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    padding: "1px 5px",
    fontSize: "0.7rem",
    fontWeight: 800,
  },

  // ── Filters ───────────────────────────────────────────────────────────────
  filterRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  typeChip: {
    background: "rgba(255,255,255,0.05)",
    color: "#dbe4f0",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 999,
    padding: "10px 14px",
    display: "flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    fontWeight: 700,
  },
  typeChipActive: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
    boxShadow: "0 10px 24px rgba(99,102,241,0.25)",
  },
  typeChipCount: {
    background: "rgba(255,255,255,0.16)",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: "0.8rem",
    fontWeight: 800,
  },

  // ── Add panel ─────────────────────────────────────────────────────────────
  addPanel: {
    background: "rgba(15,23,42,0.5)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 22,
    padding: 18,
    boxShadow: "0 14px 34px rgba(0,0,0,0.22)",
    backdropFilter: "blur(10px)",
    marginBottom: 18,
  },
  addPanelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  sectionTitle: { margin: 0, fontSize: "1rem", fontWeight: 800, color: "#ffffff" },
  compactSelect: {
    ...ctrl,
    width: "auto",
    minWidth: 140,
    padding: "10px 12px",
    fontSize: "0.9rem",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1.35fr 1.45fr 170px 170px auto",
    gap: 12,
    alignItems: "center",
  },
  formGridMobile: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  // ── Grid section ──────────────────────────────────────────────────────────
  sectionHeader: {
    marginBottom: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionHeading: { margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#ffffff" },
  exitListBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#94a3b8",
    borderRadius: 10,
    padding: "8px 14px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "0.88rem",
  },
  input: { ...ctrl },
  emptyState: {
    background: "rgba(15,23,42,0.5)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 22,
    padding: "52px 28px",
    textAlign: "center",
    color: "#cbd5e1",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: { margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#f1f5f9" },
  emptyText: { margin: 0, color: "#64748b", fontSize: "0.9rem", maxWidth: 280 },
  emptyDiscoverBtn: {
    marginTop: 6,
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    padding: "11px 22px",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: "0.9rem",
    boxShadow: "0 10px 24px rgba(99,102,241,0.28)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: 18,
  },

  // ── Cards ─────────────────────────────────────────────────────────────────
  cardButton: {
    background: "transparent",
    border: "none",
    padding: 0,
    margin: 0,
    textAlign: "left",
    cursor: "pointer",
  },
  card: { display: "flex", flexDirection: "column", gap: 8 },
  coverWrap: {
    width: "100%",
    aspectRatio: "0.72 / 1",
    background: "#0f172a",
    position: "relative",
    overflow: "hidden",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 12px 28px rgba(0,0,0,0.3)",
  },
  coverImage: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  noCover: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, rgba(51,65,85,0.9) 0%, rgba(30,41,59,0.95) 100%)",
    color: "#94a3b8",
    fontWeight: 800,
    fontSize: "0.82rem",
  },
  noCoverText: { opacity: 0.9 },
  cardTypeBadge: {
    position: "absolute",
    left: 8,
    bottom: 8,
    background: "rgba(37,99,235,0.95)",
    color: "#ffffff",
    borderRadius: 999,
    padding: "4px 8px",
    fontSize: "0.68rem",
    fontWeight: 800,
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
  },
  animeBadge: {
    position: "absolute",
    left: 8,
    top: 8,
    background: "rgba(14,165,233,0.9)",
    color: "#ffffff",
    borderRadius: 999,
    padding: "3px 7px",
    fontSize: "0.64rem",
    fontWeight: 800,
  },
  reviewBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    background: "rgba(239,68,68,0.95)",
    color: "#ffffff",
    borderRadius: 999,
    padding: "4px 8px",
    fontSize: "0.64rem",
    fontWeight: 800,
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
  },
  ratingBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    background: "rgba(245,158,11,0.95)",
    color: "#ffffff",
    borderRadius: 999,
    padding: "4px 8px",
    fontSize: "0.68rem",
    fontWeight: 800,
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
  },
  cardMeta: { padding: "0 2px" },
  cardTitle: {
    margin: 0,
    fontSize: "0.88rem",
    fontWeight: 700,
    lineHeight: 1.3,
    color: "#dfe8f4",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    minHeight: "2.3em",
  },
  progressRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  progressText: {
    fontSize: "0.76rem",
    color: "#64748b",
    fontWeight: 700,
    margin: 0,
  },
  quickPlusBtn: {
    background: "rgba(99,102,241,0.18)",
    border: "none",
    borderRadius: 6,
    color: "#a5b4fc",
    fontSize: "0.68rem",
    fontWeight: 800,
    padding: "2px 6px",
    cursor: "pointer",
    lineHeight: 1.4,
    flexShrink: 0,
  },
  cardTagRow: { display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 },
  smallTag: {
    fontSize: "0.68rem",
    padding: "3px 7px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    color: "#cbd5e1",
    fontWeight: 700,
  },

  // ── Buttons ───────────────────────────────────────────────────────────────
  primaryButton: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    padding: "12px 16px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(99,102,241,0.22)",
    WebkitAppearance: "none",
    appearance: "none",
    whiteSpace: "nowrap",
  },
  secondaryButton: {
    background: "rgba(255,255,255,0.08)",
    color: "#e2e8f0",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: "11px 14px",
    fontWeight: 700,
    cursor: "pointer",
    WebkitAppearance: "none",
    appearance: "none",
  },
  ghostButton: {
    background: "rgba(255,255,255,0.04)",
    color: "#cbd5e1",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: "12px 16px",
    fontWeight: 700,
    cursor: "pointer",
    WebkitAppearance: "none",
    appearance: "none",
  },

  // ── Card extras ───────────────────────────────────────────────────────────
  cardProgressBar: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    height: 3,
    background: "rgba(0,0,0,0.35)",
  },
  cardProgressFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 0.3s ease",
  },
  starBtn: {
    position: "absolute",
    top: 6, right: 6,
    background: "rgba(0,0,0,0.45)",
    border: "none",
    borderRadius: 6,
    fontSize: "0.9rem",
    lineHeight: 1,
    padding: "3px 5px",
    cursor: "pointer",
    zIndex: 2,
    backdropFilter: "blur(4px)",
    transition: "color 0.15s",
  },

  // ── Bulk action bar ───────────────────────────────────────────────────────
  bulkBar: {
    position: "fixed",
    bottom: 80,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(15,23,42,0.97)",
    border: "1px solid rgba(99,102,241,0.35)",
    borderRadius: 999,
    padding: "10px 16px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    zIndex: 45,
    backdropFilter: "blur(16px)",
    flexWrap: "wrap",
    maxWidth: "calc(100vw - 32px)",
  },
  bulkCount: {
    fontSize: "0.88rem",
    fontWeight: 800,
    color: "#a5b4fc",
    whiteSpace: "nowrap",
  },
  bulkActionBtn: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#dbe4f0",
    borderRadius: 999,
    padding: "6px 12px",
    fontWeight: 700,
    fontSize: "0.82rem",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  bulkSelect: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#dbe4f0",
    borderRadius: 999,
    padding: "6px 12px",
    fontWeight: 700,
    fontSize: "0.82rem",
    cursor: "pointer",
    WebkitAppearance: "none",
    appearance: "none",
  },
  bulkDeleteBtn: {
    background: "rgba(239,68,68,0.15)",
    border: "1px solid rgba(239,68,68,0.3)",
    color: "#fca5a5",
    borderRadius: 999,
    padding: "6px 12px",
    fontWeight: 700,
    fontSize: "0.82rem",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  bulkOverlay: {
    position: "absolute",
    inset: 0,
    borderRadius: 16,
    transition: "background 0.15s",
    pointerEvents: "none",
  },
  bulkCheck: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 22,
    height: 22,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    fontWeight: 800,
    color: "#fff",
    transition: "background 0.15s",
  },

  // ── Mobile bottom nav ─────────────────────────────────────────────────────
  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    display: "flex",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    backdropFilter: "blur(20px)",
    background: "rgba(10,14,22,0.94)",
    zIndex: 50,
    paddingBottom: "env(safe-area-inset-bottom, 0px)",
  },
  bottomNavBtn: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "#64748b",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 0",
    gap: 3,
    cursor: "pointer",
  },
  bottomNavBtnActive: { color: "#818cf8" },
  bottomNavLabel: { fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.02em" },
  navBadge: {
    position: "absolute",
    top: -4,
    right: -6,
    background: "#6366f1",
    color: "#fff",
    borderRadius: 999,
    fontSize: "0.58rem",
    fontWeight: 800,
    minWidth: 16,
    height: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 3px",
    lineHeight: 1,
  },

  // ── Mobile lists sheet ────────────────────────────────────────────────────
  mobileSheet: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    zIndex: 40,
    display: "flex",
    alignItems: "flex-end",
  },
  mobileSheetContent: {
    width: "100%",
    background: "#0f172a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: "16px 16px 32px",
    maxHeight: "70vh",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  mobileSheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 999,
    background: "rgba(255,255,255,0.15)",
    alignSelf: "center",
    marginBottom: 12,
  },
};
