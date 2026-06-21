import { COMICS_TAG_OPTIONS, ANIME_TAG_OPTIONS } from "./constants.js";

// ---------------------------------------------------------------------------
// Metadata patches — known series get their type/tags/summary auto-filled.
// ---------------------------------------------------------------------------

const METADATA_PATCHES = {
  "one piece": {
    type: "manga",
    tags: [],
    altTitles: ["ワンピース", "OP"],
    summary:
      "A long-running pirate adventure following Luffy and his crew as they chase the legendary One Piece treasure.",
    needsReview: false,
  },
  "solo leveling": {
    type: "manhwa",
    tags: ["System"],
    altTitles: ["Only I Level Up", "Na Honjaman Level Up"],
    summary:
      "A weak hunter gains access to a unique system that lets him grow stronger without limit.",
    needsReview: false,
  },
  "nano machine": {
    type: "manhwa",
    tags: ["Murim", "System"],
    altTitles: ["Nano Mashin"],
    summary:
      "A bullied young martial artist receives futuristic nanotechnology that transforms his path through the murim world.",
    needsReview: false,
  },
  "murim login": {
    type: "manhwa",
    tags: ["Murim", "System"],
    altTitles: [],
    summary:
      "A hunter gets pulled into a murim game-like world and grows stronger in both realities.",
    needsReview: false,
  },
  "legend of the northern blade": {
    type: "manhwa",
    tags: ["Murim"],
    altTitles: ["Northern Blade"],
    summary:
      "The heir of a fallen sect rises from isolation to reclaim his father's legacy in the martial world.",
    needsReview: false,
  },
  "return of the mount hua sect": {
    type: "manhwa",
    tags: ["Murim", "Regression"],
    altTitles: ["Return of the Blossoming Blade", "Return of the Hwasan Sect"],
    summary:
      "A legendary swordsman is reborn generations later and sets out to restore the ruined Mount Hua Sect.",
    needsReview: false,
  },
  "overgeared": {
    type: "manhwa",
    tags: ["System"],
    altTitles: [],
    summary:
      "An unlucky gamer stumbles into a legendary class and slowly becomes one of the strongest players in the game.",
    needsReview: false,
  },
  "pick me up infinite gatcha": {
    type: "manhwa",
    tags: ["System"],
    altTitles: ["Pick Me Up, Infinite Gacha"],
    summary:
      "A top player is pulled into a brutal gacha-style world where every choice can mean death.",
    needsReview: false,
  },
  "the beginning after the end": {
    type: "manhwa",
    tags: ["Regression"],
    altTitles: ["TBATE"],
    summary:
      "A powerful king is reincarnated into a new world and tries to live differently with the wisdom of his past life.",
    needsReview: false,
  },
  "the extra's academy survival guide": {
    type: "manhwa",
    tags: ["Academy"],
    altTitles: ["The Extra's Academy Survival Guide"],
    summary:
      "A minor character inside a game tries to survive an academy setting while avoiding the story's main disasters.",
    needsReview: false,
  },
  "i killed an academy player": {
    type: "manhwa",
    tags: ["Academy"],
    altTitles: [],
    summary:
      "A transported protagonist gets entangled in an academy story after killing a key player too early.",
    needsReview: false,
  },
  "academy's undercover professor": {
    type: "manhwa",
    tags: ["Academy"],
    altTitles: ["Academy's Undercover Professor"],
    summary:
      "A skilled man assumes a false identity and enters a prestigious academy while hiding dangerous secrets.",
    needsReview: false,
  },
  "the horizon": {
    type: "manhwa",
    tags: [],
    altTitles: [],
    summary:
      "A bleak and emotional post-apocalyptic story following two children wandering through a ruined world.",
    needsReview: false,
  },
  "pigpen": {
    type: "manhwa",
    tags: [],
    altTitles: [],
    summary:
      "A psychological thriller about a man trapped on a strange island with no memory of how he got there.",
    needsReview: false,
  },
  "death's game": {
    type: "manhwa",
    tags: ["Regression"],
    altTitles: ["Death's Game", "I Will Die Soon"],
    summary:
      "After giving up on life, a man is forced to experience multiple deaths and second chances in different bodies.",
    needsReview: false,
  },
  "leviathan": {
    type: "manhwa",
    tags: [],
    altTitles: [],
    summary:
      "In a world covered by rising seas, survivors battle terrifying sea monsters to stay alive.",
    needsReview: false,
  },
  "her summon": {
    type: "manhwa",
    tags: ["System"],
    altTitles: [],
    summary:
      "A shut-in is summoned to another world and becomes involved in a fantasy conflict with overwhelming power.",
    needsReview: false,
  },
  "sword sheath's child": {
    type: "manhwa",
    tags: ["Murim"],
    altTitles: ["Sword Sheath's Child"],
    summary:
      "A boy connected to a mysterious sword grows through a violent world filled with martial power and monsters.",
    needsReview: false,
  },
  "the warrior returns": {
    type: "manhwa",
    tags: ["Regression"],
    altTitles: ["Hero Has Returned"],
    summary:
      "Returned heroes from other worlds come back broken, and one of them pushes the modern world toward destruction.",
    needsReview: false,
  },
  "epic of gilgamesh": {
    type: "manhwa",
    tags: [],
    altTitles: [],
    summary:
      "A fantasy story centered on a legendary figure, blending mythic adventure with emotional character arcs.",
    needsReview: false,
  },
  "the ember knight (alt arcs)": {
    type: "manhwa",
    tags: [],
    altTitles: ["The Ember Knight", "The Knight of Embers"],
    summary:
      "A weak but clever young man enters a dangerous world of knights and schemes after the death of his brother.",
    needsReview: false,
  },
  "the knight of embers": {
    type: "manhwa",
    tags: [],
    altTitles: ["The Ember Knight"],
    summary:
      "A weak but strategic protagonist survives through intelligence in a world that values strength above all else.",
    needsReview: false,
  },
  "nano list": {
    type: "manhwa",
    tags: [],
    altTitles: [],
    summary:
      "A student's life changes when a highly advanced android girl appears and begins protecting him.",
    needsReview: false,
  },
  "the girl downstairs": {
    type: "manhwa",
    tags: ["Romance"],
    altTitles: ["Doona!"],
    summary:
      "A college student's quiet life changes when he ends up living near a former idol with a complicated past.",
    needsReview: false,
  },
  "your throne": {
    type: "manhwa",
    tags: ["Romance"],
    altTitles: [],
    summary:
      "Two women bound by rivalry and fate clash within a ruthless political world full of manipulation and revenge.",
    needsReview: false,
  },
  "villains are destined to die": {
    type: "manhwa",
    tags: ["Romance"],
    altTitles: ["Death Is the Only Ending for the Villainess"],
    summary:
      "A girl wakes up as the doomed villainess of an otome game and must survive impossible routes.",
    needsReview: false,
  },
  "like wind on a dry branch": {
    type: "manhwa",
    tags: ["Romance"],
    altTitles: [],
    summary:
      "A grief-stricken widow becomes entangled with a prince in a slow-burn historical romance.",
    needsReview: false,
  },
  "purple hyacinth": {
    type: "manhwa",
    tags: ["Romance"],
    altTitles: [],
    summary:
      "A detective who can hear lies teams up with a notorious assassin in a tense mystery thriller.",
    needsReview: false,
  },
  "unholy blood": {
    type: "manhwa",
    tags: ["Romance"],
    altTitles: ["White Blood"],
    summary:
      "A pure-blood vampire hiding as a human is forced into open conflict against violent vampires.",
    needsReview: false,
  },
  "see you in my 19th life": {
    type: "manhwa",
    tags: ["Romance", "Regression"],
    altTitles: [],
    summary:
      "A woman who remembers all her past lives reconnects with someone important from her previous one.",
    needsReview: false,
  },
  "seasons of blossom": {
    type: "manhwa",
    tags: ["Romance"],
    altTitles: [],
    summary:
      "A school drama that explores youth, love, grief, and healing through multiple connected storylines.",
    needsReview: false,
  },
  "after school lessons for unripe apples": {
    type: "manhwa",
    tags: ["Romance"],
    altTitles: [],
    summary:
      "A nostalgic coming-of-age romance with awkward teens, slow emotional growth, and warm character writing.",
    needsReview: false,
  },
  "positively yours": {
    type: "manhwa",
    tags: ["Romance"],
    altTitles: [],
    summary:
      "A one-night mistake turns into an unexpected romance between two adults navigating a sudden pregnancy.",
    needsReview: false,
  },
  "semantic error": {
    type: "manhwa",
    tags: ["Romance"],
    altTitles: [],
    summary:
      "A strict student and a popular senior clash repeatedly until academic tension turns into romance.",
    needsReview: false,
  },
  "the remarried empress": {
    type: "manhwa",
    tags: ["Romance"],
    altTitles: [],
    summary:
      "An empress responds to betrayal by choosing her own future in a political court romance.",
    needsReview: false,
  },
  "marry my husband": {
    type: "manhwa",
    tags: ["Romance", "Regression"],
    altTitles: [],
    summary:
      "A betrayed woman gets a second chance and rewrites her life to take revenge on those who ruined it.",
    needsReview: false,
  },
  "age matters": {
    type: "manhwa",
    tags: ["Romance"],
    altTitles: [],
    summary:
      "A light romance between an older woman rebuilding her life and a younger, mysterious CEO.",
    needsReview: false,
  },
  "subzero": {
    type: "manhwa",
    tags: ["Romance"],
    altTitles: [],
    summary:
      "Two heirs from enemy dragon clans enter a political marriage in a fantasy romance full of tension.",
    needsReview: false,
  },
  "midnight poppy land": {
    type: "manhwa",
    tags: ["Romance"],
    altTitles: [],
    summary:
      "A shy woman and a dangerous fixer grow closer in a stylish romance with crime-world undertones.",
    needsReview: false,
  },
  "suitor armor": {
    type: "manhwa",
    tags: ["Romance"],
    altTitles: [],
    summary:
      "A lady-in-waiting and a magical suit of armor become central to a fantasy romance and court conflict.",
    needsReview: false,
  },
  "parallel city": {
    type: "manhwa",
    tags: [],
    altTitles: [],
    summary:
      "A man discovers a terrifying parallel world version of his city where survival becomes a constant battle.",
    needsReview: false,
  },
  "hive": {
    type: "manhwa",
    tags: [],
    altTitles: [],
    summary:
      "Humanity struggles to survive after giant insects and hive-like threats overrun the city.",
    needsReview: false,
  },
  "shotgun boy": {
    type: "manhwa",
    tags: [],
    altTitles: [],
    summary:
      "A bullied boy ends up trapped in a deadly outbreak and is forced to fight to survive.",
    needsReview: false,
  },
  "sweet home (side stories)": {
    type: "manhwa",
    tags: [],
    altTitles: ["Sweet Home"],
    summary:
      "A horror survival story where people transform into monsters shaped by their deepest desires.",
    needsReview: false,
  },
  "bastard (alt arcs)": {
    type: "manhwa",
    tags: [],
    altTitles: ["Bastard"],
    summary:
      "A tense thriller about a boy living with his serial killer father and trying to escape that nightmare.",
    needsReview: false,
  },
  "dr. frost": {
    type: "manhwa",
    tags: [],
    altTitles: ["Dr. Frost"],
    summary:
      "A brilliant but emotionally distant psychologist solves human problems through careful observation and logic.",
    needsReview: false,
  },
  "flow": {
    type: "manhwa",
    tags: [],
    altTitles: [],
    summary:
      "A fantasy action story set in a world where gods shape people's powers and destinies.",
    needsReview: false,
  },
  "kubera": {
    type: "manhwa",
    tags: ["Romance"],
    altTitles: [],
    summary:
      "A massive fantasy story full of gods, sura, fate, and tragedy centered around a girl named Kubera.",
    needsReview: false,
  },
  "girls of the wild's": {
    type: "manhwa",
    tags: ["Romance", "Academy"],
    altTitles: ["Girls of the Wild's"],
    summary:
      "A boy attends a former all-girls school famous for combat sports and becomes involved with its strongest students.",
    needsReview: false,
  },
  "the breaker eternal force": {
    type: "manhwa",
    tags: ["Murim"],
    altTitles: ["The Breaker: Eternal Force"],
    summary:
      "A continuation of The Breaker series, mixing modern life with murim factions and martial arts conflict.",
    needsReview: false,
  },
  "promised orchid": {
    type: "manhwa",
    tags: [],
    altTitles: [],
    summary:
      "A supernatural action thriller involving spirits, curses, and a protagonist tied to dangerous hidden forces.",
    needsReview: false,
  },
  "duty after school": {
    type: "manhwa",
    tags: ["Academy"],
    altTitles: [],
    summary:
      "Students are drafted into a military crisis when mysterious alien spheres appear and begin attacking humanity.",
    needsReview: false,
  },
  "dreamcide": {
    type: "manhwa",
    tags: ["Regression"],
    altTitles: [],
    summary:
      "A man experiences the future in his dreams and tries to stop an approaching apocalypse.",
    needsReview: false,
  },
  "the first night with the duke": {
    type: "manhwa",
    tags: ["Romance"],
    altTitles: [],
    summary:
      "A woman wakes up inside a romance novel and accidentally changes the story by spending the night with the duke.",
    needsReview: false,
  },
  "the villainess lives again": {
    type: "manhwa",
    tags: ["Romance", "Regression"],
    altTitles: [],
    summary:
      "A manipulative noblewoman regresses and uses her intelligence to rewrite the future for her chosen ally.",
    needsReview: false,
  },
  "kill the villainess": {
    type: "manhwa",
    tags: ["Romance"],
    altTitles: [],
    summary:
      "A woman trapped inside a novel rejects the story's forced romance and desperately seeks a real way home.",
    needsReview: false,
  },
  "the villainess turns the hourglass": {
    type: "manhwa",
    tags: ["Romance", "Regression"],
    altTitles: [],
    summary:
      "After betrayal and execution, a villainess turns back time and uses her second chance for revenge.",
    needsReview: false,
  },
  "beware the villainess!": {
    type: "manhwa",
    tags: ["Romance"],
    altTitles: [],
    summary:
      "A sharp-tongued heroine takes over the role of a villainess and completely derails the expected romance routes.",
    needsReview: false,
  },
  "roxana": {
    type: "manhwa",
    tags: ["Romance"],
    altTitles: ["The Way to Protect the Female Lead's Older Brother"],
    summary:
      "A villain family daughter tries to survive and protect someone who was supposed to die in the original story.",
    needsReview: false,
  },
  "i shall master this family": {
    type: "manhwa",
    tags: ["Romance", "Regression"],
    altTitles: ["I'll Be the Matriarch in This Life"],
    summary:
      "A girl from a fallen noble line regresses and decides to seize control of her family's future herself.",
    needsReview: false,
  },
  "father, i don't want this marriage": {
    type: "manhwa",
    tags: ["Romance"],
    altTitles: ["Father, I Don't Want This Marriage"],
    summary:
      "A misunderstood noblewoman tries to avoid her bad ending while constantly misreading the people around her.",
    needsReview: false,
  },
  "who made me a princess": {
    type: "manhwa",
    tags: ["Romance"],
    altTitles: [],
    summary:
      "A girl wakes up as a doomed princess and tries to survive her dangerous imperial father.",
    needsReview: false,
  },
  "the reason why raeliana ended up at the duke's mansion": {
    type: "manhwa",
    tags: ["Romance"],
    altTitles: ["The Reason Why Raeliana Ended Up at the Duke's Mansion"],
    summary:
      "A woman reincarnates into a novel and makes a risky deal with a duke to avoid her original death.",
    needsReview: false,
  },
  "doctor elise": {
    type: "manhwa",
    tags: ["Romance", "Regression"],
    altTitles: [],
    summary:
      "A former empress gets another chance at life and chooses medicine in hopes of changing her fate.",
    needsReview: false,
  },
  "under the oak tree": {
    type: "manhwa",
    tags: ["Romance"],
    altTitles: [],
    summary:
      "A deeply emotional fantasy romance about a sheltered noblewoman and her distant husband rebuilding their relationship.",
    needsReview: false,
  },
  "a stepmother's märchen": {
    type: "manhwa",
    tags: ["Romance", "Regression"],
    altTitles: ["A Stepmother's Märchen", "The Fantasie of a Stepmother"],
    summary:
      "A widowed marchioness gets a second chance to protect her family and fix the painful mistakes of her first life.",
    needsReview: false,
  },
  "secret lady": {
    type: "manhwa",
    tags: ["Romance"],
    altTitles: [],
    summary:
      "A woman who sees ghosts becomes wrapped up in palace intrigue and a tense romantic storyline.",
    needsReview: false,
  },
  "the broken ring: this marriage will fail anyway": {
    type: "manhwa",
    tags: ["Romance", "Regression"],
    altTitles: [],
    summary:
      "A woman with memories of repeated lives enters a marriage she believes is doomed from the start.",
    needsReview: false,
  },
  "the perks of being a villainess": {
    type: "manhwa",
    tags: ["Romance"],
    altTitles: [],
    summary:
      "A modern-minded woman reincarnates as a villainess and uses intelligence and business sense to gain control.",
    needsReview: false,
  },
  "i became a leveling system": {
    type: "manhwa",
    tags: ["System"],
    altTitles: [],
    summary:
      "A protagonist becomes a system-like support existence rather than a normal fighter.",
    needsReview: false,
  },
  "the sss-rank hunter's lucky draw": {
    type: "manhwa",
    tags: ["System"],
    altTitles: ["The SSS-Rank Hunter's Lucky Draw"],
    summary:
      "A hunter gains progress and power through luck-based rewards and a game-style growth system.",
    needsReview: false,
  },
  "the max-level returner": {
    type: "manhwa",
    tags: ["System", "Regression"],
    altTitles: [],
    summary:
      "A powerful returner uses knowledge from before to dominate a system-driven world.",
    needsReview: false,
  },
  "the player hides his past": {
    type: "manhwa",
    tags: ["System"],
    altTitles: [],
    summary:
      "A player with a hidden history navigates a dangerous game-like reality while concealing his true background.",
    needsReview: false,
  },
  "the return of the crazy demon (alt arcs)": {
    type: "manhwa",
    tags: ["Murim", "Regression"],
    altTitles: ["The Return of the Crazy Demon", "Return of the Mad Demon"],
    summary:
      "A mad martial artist gets another chance and storms back into the murim world with chaotic energy.",
    needsReview: false,
  },
  "return of the crazy demon": {
    type: "manhwa",
    tags: ["Murim", "Regression"],
    altTitles: ["Return of the Mad Demon"],
    summary:
      "A mad martial artist gets another chance and tears through the murim world with brutal confidence.",
    needsReview: false,
  },
  "return of the disaster-class hero (alt arcs)": {
    type: "manhwa",
    tags: ["System", "Regression"],
    altTitles: ["Return of the Disaster-Class Hero"],
    summary:
      "A betrayed hero returns after years of being trapped and begins taking revenge with overwhelming strength.",
    needsReview: false,
  },
  "sss-class gacha hunter (alt arcs)": {
    type: "manhwa",
    tags: ["System"],
    altTitles: ["SSS-Class Gacha Hunter"],
    summary:
      "A hunter grows stronger through gacha mechanics and rare summon-style progression.",
    needsReview: false,
  },
  "boundless necromancer (alt arcs)": {
    type: "manhwa",
    tags: ["System"],
    altTitles: ["Boundless Necromancer"],
    summary:
      "A determined protagonist climbs through a trial-filled system world using necromancy and relentless ambition.",
    needsReview: false,
  },
  "dungeon reset (alt arcs)": {
    type: "manhwa",
    tags: ["System"],
    altTitles: ["Dungeon Reset"],
    summary:
      "A bugged dungeon event traps a protagonist in a survival situation that turns into an unusual growth story.",
    needsReview: false,
  },
};

// ---------------------------------------------------------------------------
// Core utilities — no React, safe to call anywhere
// ---------------------------------------------------------------------------

export function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `pv-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function normalizeTitle(raw) {
  return String(raw || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function uniqueNormalizedStrings(values) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    const trimmed = String(value || "").trim().replace(/\s+/g, " ");
    const normalized = normalizeTitle(trimmed);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(trimmed);
  }
  return result;
}

export function parseAltTitlesText(text, currentTitle = "") {
  const lines = String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return uniqueNormalizedStrings(lines).filter(
    (alt) => normalizeTitle(alt) !== normalizeTitle(currentTitle)
  );
}

export function formatAltTitlesText(altTitles) {
  return Array.isArray(altTitles) ? altTitles.join("\n") : "";
}

export function getAllNamesForItem(item) {
  const names = [item.title, ...(Array.isArray(item.altTitles) ? item.altTitles : [])];
  return uniqueNormalizedStrings(names).map((name) => normalizeTitle(name));
}

export function formatTypeLabel(type) {
  if (type === "manga")   return "Manga";
  if (type === "manhwa")  return "Manhwa";
  if (type === "manhua")  return "Manhua";
  if (type === "tv")      return "TV Series";
  if (type === "movie")   return "Movie";
  if (type === "ova")     return "OVA";
  if (type === "ona")     return "ONA";
  return "Unknown";
}

export function formatStatusLabel(status, mediaCategory = "comics") {
  if (mediaCategory === "anime") {
    if (status === "reading")  return "Watching";
    if (status === "readNext") return "Watch Next";
    if (status === "notRead")  return "Plan to Watch";
    if (status === "dropped")  return "Dropped";
    if (status === "finished") return "Finished";
    return status;
  }
  if (status === "reading")  return "Currently Reading";
  if (status === "readNext") return "Read Next";
  if (status === "notRead")  return "Backlog";
  if (status === "dropped")  return "Dropped";
  if (status === "finished") return "Finished";
  return status;
}

// ---------------------------------------------------------------------------
// Series normalization and patching
// ---------------------------------------------------------------------------

const ALL_TAG_OPTIONS = [...COMICS_TAG_OPTIONS, ...ANIME_TAG_OPTIONS];
const VALID_TYPES = ["manga", "manhwa", "manhua", "tv", "movie", "ova", "ona"];
const VALID_STATUSES = ["reading", "readNext", "notRead", "dropped", "finished"];

function dedupeTitles(items) {
  const seenTitles = new Set();
  const seenIds = new Set();

  return items.reduce((acc, item) => {
    const titleKey = normalizeTitle(item.title);
    if (!titleKey || seenTitles.has(titleKey)) return acc;
    seenTitles.add(titleKey);

    let safeItem = { ...item };
    if (
      safeItem.id === null ||
      safeItem.id === undefined ||
      safeItem.id === "" ||
      seenIds.has(String(safeItem.id))
    ) {
      safeItem.id = createId();
    }
    seenIds.add(String(safeItem.id));
    acc.push(safeItem);
    return acc;
  }, []);
}

export function normalizeSeries(items) {
  const validTags = new Set(ALL_TAG_OPTIONS);

  return dedupeTitles(
    items.map((item, index) => {
      const safeTags = Array.isArray(item.tags)
        ? uniqueNormalizedStrings(item.tags).filter((tag) => validTags.has(tag))
        : [];

      const safeType           = VALID_TYPES.includes(item.type) ? item.type : "";
      const safeStatus         = VALID_STATUSES.includes(item.status) ? item.status : "notRead";
      const safeMediaCategory  = item.mediaCategory === "anime" ? "anime" : "comics";
      const safeTitle =
        typeof item.title === "string" && item.title.trim() ? item.title.trim() : "Untitled";

      const safeAltTitles = Array.isArray(item.altTitles)
        ? uniqueNormalizedStrings(item.altTitles).filter(
            (alt) => normalizeTitle(alt) !== normalizeTitle(safeTitle)
          )
        : [];

      const hasMissingCoreData =
        !safeTitle ||
        !safeType ||
        typeof item.summary !== "string" ||
        item.summary.trim() === "";

      return {
        id:
          typeof item.id === "number" || typeof item.id === "string"
            ? item.id
            : createId(),
        mediaCategory: safeMediaCategory,
        title: safeTitle,
        image: typeof item.image === "string" ? item.image : "",
        type: safeType,
        status: safeStatus,
        tags: safeTags,
        summary: typeof item.summary === "string" ? item.summary : "",
        altTitles: safeAltTitles,
        needsReview:
          typeof item.needsReview === "boolean" ? item.needsReview : hasMissingCoreData,
        currentProgress:
          typeof item.currentProgress === "number"
            ? Math.max(0, Math.floor(item.currentProgress))
            : 0,
        totalProgress:
          typeof item.totalProgress === "number" && item.totalProgress > 0
            ? Math.floor(item.totalProgress)
            : null,
        rating:
          typeof item.rating === "number" && item.rating >= 1 && item.rating <= 10
            ? Math.round(item.rating)
            : null,
        createdAt:
          typeof item.createdAt === "number"
            ? item.createdAt
            : typeof item.id === "number"
            ? item.id
            : Date.now() + index,
      };
    })
  );
}

export function applyMetadataPatches(items) {
  return items.map((item) => {
    const patch = METADATA_PATCHES[normalizeTitle(item.title)];
    if (!patch) return item;

    const nextType = item.type || patch.type || "";
    const nextTags =
      Array.isArray(item.tags) && item.tags.length > 0
        ? item.tags
        : Array.isArray(patch.tags)
        ? uniqueNormalizedStrings(patch.tags)
        : [];
    const nextSummary =
      typeof item.summary === "string" && item.summary.trim()
        ? item.summary
        : patch.summary || "";
    const nextAltTitles =
      Array.isArray(item.altTitles) && item.altTitles.length > 0
        ? item.altTitles
        : Array.isArray(patch.altTitles)
        ? uniqueNormalizedStrings(patch.altTitles).filter(
            (alt) => normalizeTitle(alt) !== normalizeTitle(item.title)
          )
        : [];

    const shouldMarkReady =
      patch.needsReview === false &&
      !!nextType &&
      typeof nextSummary === "string" &&
      nextSummary.trim() !== "";

    return {
      ...item,
      type: nextType,
      tags: nextTags,
      summary: nextSummary,
      altTitles: nextAltTitles,
      needsReview: shouldMarkReady ? false : item.needsReview,
    };
  });
}

// ---------------------------------------------------------------------------
// Seed / import helpers
// ---------------------------------------------------------------------------

function makeImportedEntry(title, type = "", status = "notRead", mediaCategory = "comics") {
  return {
    id: createId(),
    createdAt: Date.now() + Math.random(),
    mediaCategory,
    title,
    image: "",
    type,
    status,
    tags: [],
    summary: "",
    altTitles: [],
    needsReview: true,
  };
}

export function getInitialData() {
  const existing = [
    { title: "Star embracing swordsman", type: "", status: "reading" },
    { title: "Rankers return", type: "", status: "reading" },
    { title: "One piece", type: "manga", status: "reading" },
    { title: "Dungeon Odyssey", type: "", status: "reading" },
    { title: "Return of the Mount Hua sect", type: "", status: "reading" },
    { title: "The indomitable martial king", type: "", status: "reading" },
    { title: "Player", type: "", status: "reading" },
    { title: "Solo max level newbie", type: "", status: "reading" },
    { title: "Eternally regressing knight", type: "", status: "reading" },
    { title: "Overgeared", type: "", status: "reading" },
    { title: "Pick me up infinite gatcha", type: "", status: "reading" },
    { title: "Nano Machine", type: "", status: "reading" },
    { title: "Murim login", type: "", status: "reading" },
    { title: "The regressed meecenarys machinations", type: "", status: "reading" },

    { title: "Infinite Mage", type: "", status: "dropped" },
    { title: "The lone necromancer", type: "", status: "dropped" },
    { title: "Talent swallowing magician", type: "", status: "dropped" },
    { title: "Survival story of a sword king in a fantasy world", type: "", status: "dropped" },
    { title: "Regressing as the reincarnated bastard of the sword clan", type: "", status: "dropped" },
    { title: "The regressed son of a duke is an assassin", type: "", status: "dropped" },
    { title: "Absolute sword sense", type: "", status: "dropped" },
    { title: "On my way to see my mom", type: "", status: "dropped" },
    { title: "Necromancers' evolutionary traits", type: "", status: "dropped" },
    { title: "Reincarnation of the heavenly demon", type: "", status: "dropped" },
    { title: "Player who returned 10,000 years later", type: "", status: "dropped" },
    { title: "To hell with being a saint, im a doctor", type: "", status: "dropped" },
    { title: "Return of the sss-class ranker", type: "", status: "dropped" },
    { title: "The dark magician transmigrates after 66666 years", type: "", status: "dropped" },
    { title: "Chronicles of the martial gods return", type: "", status: "dropped" },
    { title: "A dragonslayers peerless regression", type: "", status: "dropped" },
    { title: "Childhood friend of the zenith", type: "", status: "dropped" },
    { title: "The great mage returns after 4000 years", type: "", status: "dropped" },
    { title: "Revenge of the iron Blooded sword hound", type: "", status: "dropped" },
    { title: "Solo bug player", type: "", status: "dropped" },
    { title: "Return to player", type: "", status: "dropped" },
    { title: "Worthless profession: dragon tamer", type: "", status: "dropped" },
    { title: "The extra's academy survival guide", type: "", status: "dropped" },
    { title: "From goblin to goblin god", type: "", status: "dropped" },
    { title: "The last adventurer", type: "", status: "dropped" },
    { title: "Monster eater", type: "", status: "dropped" },
    { title: "Wild ranker", type: "", status: "dropped" },
    { title: "The beginning after the end", type: "", status: "dropped" },
    { title: "The knight of embers", type: "", status: "dropped" },
    { title: "I killed an academy player", type: "", status: "dropped" },
    { title: "Standard reincarnation", type: "", status: "dropped" },
    { title: "Mr. Devourer please act like a final boss", type: "", status: "dropped" },
    { title: "Return of the frozen player", type: "", status: "dropped" },
    { title: "Light of Arad: Forerunner", type: "", status: "dropped" },
    { title: "Return of the runebound professor", type: "", status: "dropped" },
    { title: "Swordmasters youngest son", type: "", status: "dropped" },

    { title: "Ice Lord", type: "", status: "finished" },
    { title: "Solo leveling", type: "", status: "finished" },
    { title: "Legend of the Northern Blade", type: "", status: "finished" },

    { title: "Absolute regression", type: "", status: "notRead" },
    { title: "Marital wild west", type: "", status: "notRead" },
    { title: "Return of the first patriach...", type: "", status: "notRead" },
    { title: "Sword Devouring swordmaster", type: "", status: "notRead" },
    { title: "The world class extras walkthrough", type: "", status: "notRead" },
    { title: "The hero returns", type: "", status: "notRead" },
    { title: "The illegitimate who devours weapons", type: "", status: "notRead" },
    { title: "Reincarnation of the fist king", type: "", status: "notRead" },
    { title: "Academy's undercover professor", type: "", status: "notRead" },
    { title: "The mad dog of the duke's estate", type: "", status: "notRead" },
    { title: "Chronicles of the lazy sovereign", type: "", status: "notRead" },
    { title: "The house without time", type: "", status: "notRead" },
    { title: "The youngest son...", type: "", status: "notRead" },
    { title: "Trait hoarder", type: "", status: "notRead" },
    { title: "I obtained a mythic item", type: "", status: "notRead" },
    { title: "I became the first prince...", type: "", status: "notRead" },
  ].map((item) => ({
    id: createId(),
    createdAt: Date.now() + Math.random(),
    mediaCategory: "comics",
    image: "",
    tags: [],
    summary: "",
    altTitles: [],
    needsReview: true,
    ...item,
  }));

  const importedTitles = [
    "The Horizon", "Pigpen", "Death's Game", "Leviathan", "Her Summon",
    "Sword Sheath's Child", "The Warrior Returns", "Epic of Gilgamesh",
    "The Ember Knight (Alt arcs)", "Nano List", "The Girl Downstairs",
    "Your Throne", "Villains Are Destined to Die", "Like Wind on a Dry Branch",
    "Purple Hyacinth", "Unholy Blood", "See You in My 19th Life",
    "Seasons of Blossom", "After School Lessons for Unripe Apples",
    "Positively Yours", "Semantic Error", "The Remarried Empress",
    "Marry My Husband", "Act Like You Love Me!", "Age Matters",
    "My Dear Cold-Blooded King", "SubZero", "Midnight Poppy Land",
    "Devil Number 4", "The Witch and the Bull", "Muted", "Suitor Armor",
    "The Croaking", "Code Adam", "Parallel City", "MicroHunter", "Hive",
    "Dead Days", "Shotgun Boy", "Flawed Almighty",
    "The Advanced Player (Alt arcs)", "The Blood of the Butterfly",
    "The Fever King", "Insector", "Distant Sky", "Sweet Home (Side stories)",
    "Bastard (Alt arcs)", "Escape Room", "Dr. Frost", "Flow",
    "I Don't Want This Kind of Hero", "Denma", "Kubera", "Knight Run",
    "LESSA", "LESSA 2", "LESSA 3", "Noblesse: Rai's Adventure",
    "Noblesse (Side stories)", "Girls of the Wild's", "The Breaker Eternal Force",
    "Trinity Wonder", "Promised Orchid", "Delivery Knight", "Burning Effect",
    "Warble", "Magician (Kim Sarae)", "Trace", "Trace 2.0",
    "A Fairytale for the Demon Lord", "The House Without Time (Alt arcs)",
    "Westwood Vibrato", "Duty After School", "Mosquito Wars",
    "The Savior's Time", "Dreamcide", "Rebirth (Webtoon)",
    "Return Survival (Alt arcs)", "The First Night With the Duke",
    "The Duke's Servant", "The Villainess Lives Again", "Kill the Villainess",
    "The Villainess Turns the Hourglass", "Beware the Villainess!", "Roxana",
    "The Symbiotic Relationship Between a Rabbit and a Black Panther",
    "I Shall Master This Family", "Father, I Don't Want This Marriage",
    "Who Made Me a Princess",
    "The Reason Why Raeliana Ended Up at the Duke's Mansion",
    "Doctor Elise", "The Lady and the Beast", "Under the Oak Tree",
    "Reminiscence Adonis", "Light and Shadow", "Golden Time",
    "The Villain Discovered My Identity", "The Princess Imprints a Traitor",
    "How to Get My Husband on My Side", "I Tamed a Tyrant and Ran Away",
    "The Tyrant Wants to Be Good", "I Became the Wife of the Male Lead",
    "The Villainess Needs a Tyrant", "I'll Be the Matriarch in This Life",
    "The Archvillain's Daughter-In-Law", "The Evil Lady's Hero",
    "The Monster Duchess and Contract Princess", "A Stepmother's Märchen",
    "Secret Lady", "The Broken Ring: This Marriage Will Fail Anyway",
    "I Married the Male Lead's Dad",
    "Please Don't Come to the Villainess' Stationery Store",
    "The Perks of Being a Villainess", "The Status Window to the Soul",
    "I Became a Leveling System", "The SSS-Rank Hunter's Lucky Draw",
    "The Max-Level Returner", "The Player Hides His Past",
    "The Return of the Crazy Demon (Alt arcs)",
    "The Strongest Florist (Alt arcs)",
    "Return of the Disaster-Class Hero (Alt arcs)", "The King of the Mound",
    "The Challenger (Alt arcs)", "SSS-Class Gacha Hunter (Alt arcs)",
    "Boundless Necromancer (Alt arcs)",
    "The Dungeon Cleaning Life of a Once Genius Hunter (Alt arcs)",
    "The Knight King Who Returned with a God (Alt arcs)",
    "The Priest of Corruption (Alt arcs)", "Dungeon Reset (Alt arcs)",
  ].map((t) => makeImportedEntry(t));

  return applyMetadataPatches(normalizeSeries([...existing, ...importedTitles]));
}
