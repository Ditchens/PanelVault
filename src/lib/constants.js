export const STORAGE_KEY = "manga-tracker-v2";
export const LISTS_STORAGE_KEY = "panelvault-lists-v1";
export const CLOUD_IMPORT_FLAG_KEY = "panelvault-cloud-imported-v1";

// Top-level media category: comics (manga/manhwa/manhua) vs anime
export const MEDIA_CATEGORIES = [
  { key: "comics", label: "Comics" },
  { key: "anime", label: "Anime" },
];

// Status keys are shared across both categories; labels differ by context.
// "reading" means "Watching" for anime, etc.
export const STATUS_OPTIONS = [
  { key: "all",         label: "All" },
  { key: "reading",     label: "Currently Reading", animeLabel: "Watching" },
  { key: "readNext",    label: "Read Next",         animeLabel: "Watch Next" },
  { key: "notRead",     label: "Backlog",           animeLabel: "Plan to Watch" },
  { key: "dropped",     label: "Dropped" },
  { key: "finished",    label: "Finished" },
  { key: "needsReview", label: "Needs Review" },
];

export const COMICS_TYPE_OPTIONS = [
  { key: "all",     label: "All Types" },
  { key: "manga",   label: "Manga" },
  { key: "manhwa",  label: "Manhwa" },
  { key: "manhua",  label: "Manhua" },
];

export const ANIME_TYPE_OPTIONS = [
  { key: "all",    label: "All Types" },
  { key: "tv",     label: "TV Series" },
  { key: "movie",  label: "Movie" },
  { key: "ova",    label: "OVA" },
  { key: "ona",    label: "ONA" },
];

export const COMICS_TAG_OPTIONS = ["Murim", "System", "Regression", "Academy", "Romance"];
export const ANIME_TAG_OPTIONS  = ["Action", "Romance", "Isekai", "Shounen", "Slice of Life", "Fantasy"];

// Return the label for a status option, accounting for media category.
export function getStatusOptionLabel(option, mediaCategory) {
  if (mediaCategory === "anime" && option.animeLabel) return option.animeLabel;
  return option.label;
}

// Return the human-readable label for a raw status key.
export function getStatusLabel(status, mediaCategory = "comics") {
  const option = STATUS_OPTIONS.find((o) => o.key === status);
  if (!option) return status;
  return getStatusOptionLabel(option, mediaCategory);
}
