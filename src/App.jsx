import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "manga-tracker-v2";

const STATUS_OPTIONS = [
  { key: "all", label: "All" },
  { key: "reading", label: "Currently Reading" },
  { key: "readNext", label: "Read Next" },
  { key: "notRead", label: "Backlog" },
  { key: "dropped", label: "Dropped" },
  { key: "finished", label: "Finished" },
  { key: "needsReview", label: "Needs Review" },
];

const TYPE_OPTIONS = [
  { key: "all", label: "All Types" },
  { key: "manga", label: "Manga" },
  { key: "manhwa", label: "Manhwa" },
  { key: "manhua", label: "Manhua" },
];

const TAG_OPTIONS = ["Murim", "System", "Regression", "Academy", "Romance"];

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
      "The heir of a fallen sect rises from isolation to reclaim his father’s legacy in the martial world.",
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
  "the extra’s academy survival guide": {
    type: "manhwa",
    tags: ["Academy"],
    altTitles: ["The Extra's Academy Survival Guide"],
    summary:
      "A minor character inside a game tries to survive an academy setting while avoiding the story’s main disasters.",
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
  "academy’s undercover professor": {
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
  "death’s game": {
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
  "sword sheath’s child": {
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
      "A student’s life changes when a highly advanced android girl appears and begins protecting him.",
    needsReview: false,
  },
  "the girl downstairs": {
    type: "manhwa",
    tags: ["Romance"],
    altTitles: ["Doona!"],
    summary:
      "A college student’s quiet life changes when he ends up living near a former idol with a complicated past.",
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
      "A fantasy action story set in a world where gods shape people’s powers and destinies.",
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
  "girls of the wild’s": {
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
      "A woman trapped inside a novel rejects the story’s forced romance and desperately seeks a real way home.",
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
      "A girl from a fallen noble line regresses and decides to seize control of her family’s future herself.",
    needsReview: false,
  },
  "father, i don’t want this marriage": {
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
  "the reason why raeliana ended up at the duke’s mansion": {
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
  "a stepmother’s märchen": {
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
  "the sss-rank hunter’s lucky draw": {
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

export default function PanelVaultApp() {
  const [series, setSeries] = useState([]);
  const [activeStatus, setActiveStatus] = useState("all");
  const [activeType, setActiveType] = useState("all");
  const [activeTag, setActiveTag] = useState("all");

  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [newType, setNewType] = useState("manhwa");
  const [newStatus, setNewStatus] = useState("notRead");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [isFetchingCovers, setIsFetchingCovers] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [detailMode, setDetailMode] = useState("info");

  const [editTitle, setEditTitle] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editType, setEditType] = useState("manhwa");
  const [editStatus, setEditStatus] = useState("notRead");
  const [editSummary, setEditSummary] = useState("");
  const [editTags, setEditTags] = useState([]);
  const [editNeedsReview, setEditNeedsReview] = useState(false);
  const [editAltTitlesText, setEditAltTitlesText] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          const normalized = normalizeSeries(parsed);
          const patched = applyMetadataPatches(normalized);
          setSeries(patched);

          if (JSON.stringify(parsed) !== JSON.stringify(patched)) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(patched));
          }
        } else {
          const seeded = getInitialData();
          safeSaveSeries(seeded, false);
        }
      } catch {
        const seeded = getInitialData();
        safeSaveSeries(seeded, false);
      }
    } else {
      const seeded = getInitialData();
      safeSaveSeries(seeded, false);
    }
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (!selectedItem) return;

      if (e.key === "Escape") {
        closeDetailsModal();
      }

      if (detailMode === "edit" && (e.metaKey || e.ctrlKey) && e.key === "Enter") {
        saveDetails();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedItem,
    detailMode,
    editTitle,
    editImage,
    editType,
    editStatus,
    editSummary,
    editTags,
    editNeedsReview,
    editAltTitlesText,
  ]);

  function createId() {
    return Date.now() + Math.random();
  }

  function normalizeTitle(raw) {
    return String(raw || "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
  }

  function uniqueNormalizedStrings(values) {
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

  function parseAltTitlesText(text, currentTitle = "") {
    const lines = String(text || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    return uniqueNormalizedStrings(lines).filter(
      (alt) => normalizeTitle(alt) !== normalizeTitle(currentTitle)
    );
  }

  function formatAltTitlesText(altTitles) {
    return Array.isArray(altTitles) ? altTitles.join("\n") : "";
  }

  function dedupeTitles(items) {
    const seen = new Set();

    return items.filter((item) => {
      const key = normalizeTitle(item.title);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function getAllNamesForItem(item) {
    const names = [item.title, ...(Array.isArray(item.altTitles) ? item.altTitles : [])];
    return uniqueNormalizedStrings(names).map((name) => normalizeTitle(name));
  }

  function normalizeSeries(items) {
    const validStatuses = ["reading", "readNext", "notRead", "dropped", "finished"];
    const validTypes = ["manga", "manhwa", "manhua"];
    const validTags = new Set(TAG_OPTIONS);

    return dedupeTitles(
      items.map((item, index) => {
        const safeTags = Array.isArray(item.tags)
          ? uniqueNormalizedStrings(item.tags).filter((tag) => validTags.has(tag))
          : [];

        const safeType = validTypes.includes(item.type) ? item.type : "";
        const safeStatus = validStatuses.includes(item.status) ? item.status : "notRead";
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
          title: safeTitle,
          image: typeof item.image === "string" ? item.image : "",
          type: safeType,
          status: safeStatus,
          tags: safeTags,
          summary: typeof item.summary === "string" ? item.summary : "",
          altTitles: safeAltTitles,
          needsReview:
            typeof item.needsReview === "boolean" ? item.needsReview : hasMissingCoreData,
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

  function applyMetadataPatches(items) {
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

  function makeImportedEntry(title, type = "", status = "notRead") {
    return {
      id: createId(),
      createdAt: Date.now() + Math.random(),
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

  function getInitialData() {
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
      { title: "The extra’s academy survival guide", type: "", status: "dropped" },
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
      { title: "Academy’s undercover professor", type: "", status: "notRead" },
      { title: "The mad dog of the duke’s estate", type: "", status: "notRead" },
      { title: "Chronicles of the lazy sovereign", type: "", status: "notRead" },
      { title: "The house without time", type: "", status: "notRead" },
      { title: "The youngest son...", type: "", status: "notRead" },
      { title: "Trait hoarder", type: "", status: "notRead" },
      { title: "I obtained a mythic item", type: "", status: "notRead" },
      { title: "I became the first prince...", type: "", status: "notRead" },
    ].map((item) => ({
      id: createId(),
      createdAt: Date.now() + Math.random(),
      image: "",
      tags: [],
      summary: "",
      altTitles: [],
      needsReview: true,
      ...item,
    }));

    const importedTitles = [
      "The Horizon",
      "Pigpen",
      "Death’s Game",
      "Leviathan",
      "Her Summon",
      "Sword Sheath’s Child",
      "The Warrior Returns",
      "Epic of Gilgamesh",
      "The Ember Knight (Alt arcs)",
      "Nano List",
      "The Girl Downstairs",
      "Your Throne",
      "Villains Are Destined to Die",
      "Like Wind on a Dry Branch",
      "Purple Hyacinth",
      "Unholy Blood",
      "See You in My 19th Life",
      "Seasons of Blossom",
      "After School Lessons for Unripe Apples",
      "Positively Yours",
      "Semantic Error",
      "The Remarried Empress",
      "Marry My Husband",
      "Act Like You Love Me!",
      "Age Matters",
      "My Dear Cold-Blooded King",
      "SubZero",
      "Midnight Poppy Land",
      "Devil Number 4",
      "The Witch and the Bull",
      "Muted",
      "Suitor Armor",
      "The Croaking",
      "Code Adam",
      "Parallel City",
      "MicroHunter",
      "Hive",
      "Dead Days",
      "Shotgun Boy",
      "Flawed Almighty",
      "The Advanced Player (Alt arcs)",
      "The Blood of the Butterfly",
      "The Fever King",
      "Insector",
      "Distant Sky",
      "Sweet Home (Side stories)",
      "Bastard (Alt arcs)",
      "Escape Room",
      "Dr. Frost",
      "Flow",
      "I Don’t Want This Kind of Hero",
      "Denma",
      "Kubera",
      "Knight Run",
      "LESSA",
      "LESSA 2",
      "LESSA 3",
      "Noblesse: Rai’s Adventure",
      "Noblesse (Side stories)",
      "Girls of the Wild’s",
      "The Breaker Eternal Force",
      "Trinity Wonder",
      "Promised Orchid",
      "Delivery Knight",
      "Burning Effect",
      "Warble",
      "Magician (Kim Sarae)",
      "Trace",
      "Trace 2.0",
      "A Fairytale for the Demon Lord",
      "The House Without Time (Alt arcs)",
      "Westwood Vibrato",
      "Duty After School",
      "Mosquito Wars",
      "The Savior’s Time",
      "Dreamcide",
      "Rebirth (Webtoon)",
      "Return Survival (Alt arcs)",
      "The First Night With the Duke",
      "The Duke’s Servant",
      "The Villainess Lives Again",
      "Kill the Villainess",
      "The Villainess Turns the Hourglass",
      "Beware the Villainess!",
      "Roxana",
      "The Symbiotic Relationship Between a Rabbit and a Black Panther",
      "I Shall Master This Family",
      "Father, I Don’t Want This Marriage",
      "Who Made Me a Princess",
      "The Reason Why Raeliana Ended Up at the Duke’s Mansion",
      "Doctor Elise",
      "The Lady and the Beast",
      "Under the Oak Tree",
      "Reminiscence Adonis",
      "Light and Shadow",
      "Golden Time",
      "The Villain Discovered My Identity",
      "The Princess Imprints a Traitor",
      "How to Get My Husband on My Side",
      "I Tamed a Tyrant and Ran Away",
      "The Tyrant Wants to Be Good",
      "I Became the Wife of the Male Lead",
      "The Villainess Needs a Tyrant",
      "I’ll Be the Matriarch in This Life",
      "The Archvillain’s Daughter-In-Law",
      "The Evil Lady’s Hero",
      "The Monster Duchess and Contract Princess",
      "A Stepmother’s Märchen",
      "Secret Lady",
      "The Broken Ring: This Marriage Will Fail Anyway",
      "I Married the Male Lead’s Dad",
      "Please Don’t Come to the Villainess’ Stationery Store",
      "The Perks of Being a Villainess",
      "The Status Window to the Soul",
      "I Became a Leveling System",
      "The SSS-Rank Hunter’s Lucky Draw",
      "The Max-Level Returner",
      "The Player Hides His Past",
      "The Return of the Crazy Demon (Alt arcs)",
      "The Strongest Florist (Alt arcs)",
      "Return of the Disaster-Class Hero (Alt arcs)",
      "The King of the Mound",
      "The Challenger (Alt arcs)",
      "SSS-Class Gacha Hunter (Alt arcs)",
      "Boundless Necromancer (Alt arcs)",
      "The Dungeon Cleaning Life of a Once Genius Hunter (Alt arcs)",
      "The Knight King Who Returned with a God (Alt arcs)",
      "The Priest of Corruption (Alt arcs)",
      "Dungeon Reset (Alt arcs)",
    ].map((title) => makeImportedEntry(title));

    return applyMetadataPatches(normalizeSeries([...existing, ...importedTitles]));
  }

  function safeSaveSeries(nextSeries, showError = true) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSeries));
      setSeries(nextSeries);
      return true;
    } catch (error) {
      console.error("Failed to save series:", error);

      if (showError) {
        alert(
          "Could not save this change. Browser storage is probably full. Try using fewer cover URLs or clearing some older data."
        );
      }

      return false;
    }
  }

  async function fetchCover(title) {
    try {
      const res = await fetch(
        `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(title)}&limit=1`
      );
      const data = await res.json();
      return data?.data?.[0]?.images?.jpg?.image_url || "";
    } catch {
      return "";
    }
  }

  async function autoFetchMissingCovers() {
    setIsFetchingCovers(true);

    const updated = [...series];

    for (let i = 0; i < updated.length; i++) {
      if (!updated[i].image) {
        const img = await fetchCover(updated[i].title);
        if (img) updated[i].image = img;
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }

    safeSaveSeries(updated);
    setIsFetchingCovers(false);
  }

  function entryConflictsWithSeries({ title, altTitles, excludeId = null }) {
    const candidateNames = uniqueNormalizedStrings([title, ...(altTitles || [])]).map((name) =>
      normalizeTitle(name)
    );

    return series.some((item) => {
      if (excludeId !== null && item.id === excludeId) return false;
      const existingNames = getAllNamesForItem(item);
      return candidateNames.some((name) => existingNames.includes(name));
    });
  }

  function addSeries() {
    if (!title.trim()) {
      alert("Please enter a title.");
      return;
    }

    const newItem = {
      id: createId(),
      createdAt: Date.now(),
      title: title.trim(),
      image: image.trim(),
      type: newType,
      status: newStatus,
      tags: [],
      summary: "",
      altTitles: [],
      needsReview: true,
    };

    const alreadyExists = entryConflictsWithSeries({
      title: newItem.title,
      altTitles: newItem.altTitles,
    });

    if (alreadyExists) {
      alert("That title already exists or matches an alternate title already in your library.");
      return;
    }

    const updated = [newItem, ...series];
    const saved = safeSaveSeries(updated);

    if (!saved) return;

    setTitle("");
    setImage("");
    setNewType("manhwa");
    setNewStatus("notRead");
  }

  function openDetailsModal(item) {
    setSelectedItem(item);
    setDetailMode("info");
    setEditTitle(item.title || "");
    setEditImage(item.image || "");
    setEditType(item.type || "");
    setEditStatus(item.status || "notRead");
    setEditSummary(item.summary || "");
    setEditTags(Array.isArray(item.tags) ? item.tags : []);
    setEditNeedsReview(!!item.needsReview);
    setEditAltTitlesText(formatAltTitlesText(item.altTitles));
  }

  function closeDetailsModal() {
    setSelectedItem(null);
    setDetailMode("info");
    setEditTitle("");
    setEditImage("");
    setEditType("manhwa");
    setEditStatus("notRead");
    setEditSummary("");
    setEditTags([]);
    setEditNeedsReview(false);
    setEditAltTitlesText("");
  }

  function saveDetails() {
    if (!selectedItem) return;

    if (!editTitle.trim()) {
      alert("Title cannot be empty.");
      return;
    }

    const parsedAltTitles = parseAltTitlesText(editAltTitlesText, editTitle);

    const duplicate = entryConflictsWithSeries({
      title: editTitle.trim(),
      altTitles: parsedAltTitles,
      excludeId: selectedItem.id,
    });

    if (duplicate) {
      alert("This title or one of its alternate titles already belongs to another entry.");
      return;
    }

    const updated = series.map((item) =>
      item.id === selectedItem.id
        ? {
            ...item,
            title: editTitle.trim(),
            image: editImage.trim(),
            type: editType,
            status: editStatus,
            summary: editSummary.trim(),
            tags: uniqueNormalizedStrings(editTags),
            altTitles: parsedAltTitles,
            needsReview: editNeedsReview,
          }
        : item
    );

    const saved = safeSaveSeries(updated);
    if (saved) {
      const refreshed = updated.find((item) => item.id === selectedItem.id);
      setSelectedItem(refreshed || null);
      setDetailMode("info");
    }
  }

  function deleteSeries(id) {
    const updated = series.filter((item) => item.id !== id);
    const saved = safeSaveSeries(updated);
    if (saved) closeDetailsModal();
  }

  function removeCoverInEdit() {
    setEditImage("");
  }

  function toggleTag(tag) {
    setEditTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  }

  function clearAllCovers() {
    const confirmed = window.confirm(
      "This will remove all cover images but keep titles, types, alternate titles, tags, summaries, and statuses. Continue?"
    );

    if (!confirmed) return;

    const cleaned = series.map((item) => ({
      ...item,
      image: "",
    }));

    const saved = safeSaveSeries(cleaned);
    if (saved) {
      alert("All cover images were cleared.");
    }
  }

  function handleAddKeyDown(e) {
    if (e.key === "Enter") {
      addSeries();
    }
  }

  function getCountByStatus(statusKey) {
    if (statusKey === "all") return series.length;
    if (statusKey === "needsReview") return series.filter((item) => item.needsReview).length;
    return series.filter((item) => item.status === statusKey).length;
  }

  function getCountByType(typeKey) {
    if (typeKey === "all") return series.length;
    return series.filter((item) => item.type === typeKey).length;
  }

  const filteredAndSorted = useMemo(() => {
    let filtered = [...series];

    if (activeStatus !== "all") {
      if (activeStatus === "needsReview") {
        filtered = filtered.filter((item) => item.needsReview);
      } else {
        filtered = filtered.filter((item) => item.status === activeStatus);
      }
    }

    if (activeType !== "all") {
      filtered = filtered.filter((item) => item.type === activeType);
    }

    if (activeTag !== "all") {
      filtered = filtered.filter((item) => item.tags.includes(activeTag));
    }

    if (searchTerm.trim()) {
      const normalizedSearch = normalizeTitle(searchTerm);

      filtered = filtered.filter((item) => {
        const names = [item.title, ...(Array.isArray(item.altTitles) ? item.altTitles : [])];
        return names.some((name) => normalizeTitle(name).includes(normalizedSearch));
      });
    }

    return filtered.sort((a, b) => {
      if (sortOption === "az") {
        return a.title.localeCompare(b.title);
      }

      if (sortOption === "za") {
        return b.title.localeCompare(a.title);
      }

      if (sortOption === "oldest") {
        return (a.createdAt || 0) - (b.createdAt || 0);
      }

      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [series, activeStatus, activeType, activeTag, searchTerm, sortOption]);

  const activeStatusLabel =
    STATUS_OPTIONS.find((option) => option.key === activeStatus)?.label || "All";

  const activeTypeLabel =
    TYPE_OPTIONS.find((option) => option.key === activeType)?.label || "All Types";

  return (
    <div style={styles.page}>
      <div style={styles.bgGlowOne} />
      <div style={styles.bgGlowTwo} />

      <header style={styles.topbar}>
        <div
          style={styles.topbarLeft}
          onMouseEnter={() => setMenuOpen(true)}
          onMouseLeave={() => setMenuOpen(false)}
        >
          <div style={styles.brand}>PanelVault</div>

          <button
            style={styles.burgerButton}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Open menu"
          >
            <span style={styles.burgerLine} />
            <span style={styles.burgerLine} />
          </button>

          {menuOpen && (
            <div style={styles.menuDropdown}>
              <div style={styles.menuSectionLabel}>Library Views</div>

              {STATUS_OPTIONS.map((view) => {
                const active = activeStatus === view.key;

                return (
                  <button
                    key={view.key}
                    onClick={() => {
                      setActiveStatus(view.key);
                      setMenuOpen(false);
                    }}
                    style={{
                      ...styles.menuItem,
                      ...(active ? styles.menuItemActive : {}),
                    }}
                  >
                    <span>{view.label}</span>
                    <span style={styles.menuCount}>{getCountByStatus(view.key)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={styles.topbarCenter}>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${activeStatusLabel.toLowerCase()}...`}
            style={styles.headerSearch}
          />
        </div>

        <div style={styles.topbarRight}>
          <div style={styles.totalPill}>Total {series.length}</div>
        </div>
      </header>

      <main style={styles.main}>
        <section style={styles.heroRow}>
          <div>
            <p style={styles.kicker}>Your library</p>
            <h1 style={styles.pageTitle}>
              {activeStatusLabel}
              {activeType !== "all" ? ` · ${activeTypeLabel}` : ""}
              {activeTag !== "all" ? ` · ${activeTag}` : ""}
            </h1>
            <p style={styles.pageSubtitle}>
              Click any card to view info first, then go to the edit screen.
            </p>
          </div>

          <div style={styles.heroActions}>
            <button onClick={clearAllCovers} style={styles.ghostButton}>
              Clear All Covers
            </button>

            <button
              onClick={autoFetchMissingCovers}
              disabled={isFetchingCovers}
              style={{
                ...styles.primaryButton,
                opacity: isFetchingCovers ? 0.7 : 1,
                cursor: isFetchingCovers ? "not-allowed" : "pointer",
              }}
            >
              {isFetchingCovers ? "Fetching Covers..." : "Auto Fetch Missing Covers"}
            </button>
          </div>
        </section>

        <section style={styles.filterRow}>
          {TYPE_OPTIONS.map((type) => {
            const active = activeType === type.key;

            return (
              <button
                key={type.key}
                onClick={() => setActiveType(type.key)}
                style={{
                  ...styles.typeChip,
                  ...(active ? styles.typeChipActive : {}),
                }}
              >
                {type.label}
                <span style={styles.typeChipCount}>{getCountByType(type.key)}</span>
              </button>
            );
          })}
        </section>

        <section style={styles.filterRow}>
          <button
            onClick={() => setActiveTag("all")}
            style={{
              ...styles.typeChip,
              ...(activeTag === "all" ? styles.typeChipActive : {}),
            }}
          >
            All Tags
          </button>

          {TAG_OPTIONS.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              style={{
                ...styles.typeChip,
                ...(activeTag === tag ? styles.typeChipActive : {}),
              }}
            >
              {tag}
            </button>
          ))}
        </section>

        <section style={styles.addPanel}>
          <div style={styles.addPanelHeader}>
            <h2 style={styles.sectionTitle}>Add New Series</h2>

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              style={styles.compactSelect}
            >
              <option value="newest">Newest Added</option>
              <option value="oldest">Oldest Added</option>
              <option value="az">Title A–Z</option>
              <option value="za">Title Z–A</option>
            </select>
          </div>

          <div style={styles.formGrid}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleAddKeyDown}
              placeholder="Title"
              style={styles.input}
            />

            <input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              onKeyDown={handleAddKeyDown}
              placeholder="Cover URL (optional)"
              style={styles.input}
            />

            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              style={styles.input}
            >
              <option value="manga">Manga</option>
              <option value="manhwa">Manhwa</option>
              <option value="manhua">Manhua</option>
            </select>

            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              style={styles.input}
            >
              <option value="reading">Currently Reading</option>
              <option value="readNext">Read Next</option>
              <option value="notRead">Backlog</option>
              <option value="dropped">Dropped</option>
              <option value="finished">Finished</option>
            </select>

            <button onClick={addSeries} style={styles.primaryButton}>
              Add
            </button>
          </div>

          <p style={styles.helperText}>
            New entries start in Needs Review until you add summary, alternate titles, and confirm them.
          </p>
        </section>

        <section>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionHeading}>{filteredAndSorted.length} results</h2>
          </div>

          {filteredAndSorted.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyTitle}>Nothing here yet.</p>
              <p style={styles.emptyText}>Try another filter or add a new title above.</p>
            </div>
          ) : (
            <div style={styles.grid}>
              {filteredAndSorted.map((item) => {
                const hasImage = item.image && item.image.trim() !== "";

                return (
                  <button
                    key={item.id}
                    onClick={() => openDetailsModal(item)}
                    style={styles.cardButton}
                    title={`Open ${item.title}`}
                  >
                    <div style={styles.card}>
                      <div style={styles.coverWrap}>
                        {hasImage ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            style={styles.coverImage}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              const fallback = e.currentTarget.nextSibling;
                              if (fallback) fallback.style.display = "flex";
                            }}
                          />
                        ) : null}

                        <div
                          style={{
                            ...styles.noCover,
                            display: hasImage ? "none" : "flex",
                          }}
                        >
                          <span style={styles.noCoverText}>No Cover</span>
                        </div>

                        <div style={styles.cardTypeBadge}>{formatTypeLabel(item.type)}</div>

                        {item.needsReview && <div style={styles.reviewBadge}>Needs Review</div>}
                      </div>

                      <div style={styles.cardMeta}>
                        <p title={item.title} style={styles.cardTitle}>
                          {item.title}
                        </p>

                        {item.tags.length > 0 ? (
                          <div style={styles.cardTagRow}>
                            {item.tags.slice(0, 2).map((tag) => (
                              <span key={tag} style={styles.smallTag}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {selectedItem && (
        <div style={styles.modalOverlay} onClick={closeDetailsModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            {detailMode === "info" ? (
              <>
                <div style={styles.modalTop}>
                  <div style={styles.modalPreviewWrap}>
                    {selectedItem.image ? (
                      <img
                        src={selectedItem.image}
                        alt={selectedItem.title}
                        style={styles.modalPreviewImage}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const fallback = e.currentTarget.nextSibling;
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                    ) : null}

                    <div
                      style={{
                        ...styles.modalNoCover,
                        display: selectedItem.image ? "none" : "flex",
                      }}
                    >
                      No Cover
                    </div>
                  </div>

                  <div style={styles.modalTopInfo}>
                    <h2 style={styles.modalTitle}>{selectedItem.title}</h2>
                    <p style={styles.infoMetaLine}>
                      Type: <strong>{formatTypeLabel(selectedItem.type)}</strong>
                    </p>
                    <p style={styles.infoMetaLine}>
                      Status: <strong>{formatStatusLabel(selectedItem.status)}</strong>
                    </p>
                    <p style={styles.infoMetaLine}>
                      Review: <strong>{selectedItem.needsReview ? "Needs Review" : "Ready"}</strong>
                    </p>
                  </div>
                </div>

                <div style={styles.infoBlock}>
                  <p style={styles.infoBlockTitle}>Alternate Titles</p>
                  <div style={styles.tagWrap}>
                    {selectedItem.altTitles && selectedItem.altTitles.length > 0 ? (
                      selectedItem.altTitles.map((alt) => (
                        <span key={alt} style={styles.tagPill}>
                          {alt}
                        </span>
                      ))
                    ) : (
                      <span style={styles.emptyInline}>No alternate titles yet</span>
                    )}
                  </div>
                </div>

                <div style={styles.infoBlock}>
                  <p style={styles.infoBlockTitle}>Tags</p>
                  <div style={styles.tagWrap}>
                    {selectedItem.tags.length > 0 ? (
                      selectedItem.tags.map((tag) => (
                        <span key={tag} style={styles.tagPill}>
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span style={styles.emptyInline}>No tags yet</span>
                    )}
                  </div>
                </div>

                <div style={styles.infoBlock}>
                  <p style={styles.infoBlockTitle}>Summary</p>
                  <p style={styles.summaryText}>
                    {selectedItem.summary?.trim()
                      ? selectedItem.summary
                      : "No summary yet. Add one in the edit screen."}
                  </p>
                </div>

                <div style={styles.modalButtons}>
                  <button onClick={() => setDetailMode("edit")} style={styles.primaryButton}>
                    Go to Edit
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={styles.modalTop}>
                  <div style={styles.modalPreviewWrap}>
                    {editImage ? (
                      <img
                        src={editImage}
                        alt={editTitle}
                        style={styles.modalPreviewImage}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const fallback = e.currentTarget.nextSibling;
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                    ) : null}

                    <div
                      style={{
                        ...styles.modalNoCover,
                        display: editImage ? "none" : "flex",
                      }}
                    >
                      No Cover
                    </div>
                  </div>

                  <div style={styles.modalTopInfo}>
                    <h2 style={styles.modalTitle}>Edit Series</h2>
                    <p style={styles.modalHintText}>Esc = close</p>
                    <p style={styles.modalHintText}>Cmd/Ctrl + Enter = save</p>
                  </div>
                </div>

                <label style={styles.label}>Title</label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Edit title"
                  style={styles.input}
                />

                <label style={styles.label}>Alternate Titles</label>
                <textarea
                  value={editAltTitlesText}
                  onChange={(e) => setEditAltTitlesText(e.target.value)}
                  placeholder={"One alternate title per line\nExample:\nReturn of the Mad Demon"}
                  style={styles.textarea}
                />

                <label style={styles.label}>Cover URL</label>
                <input
                  value={editImage}
                  onChange={(e) => setEditImage(e.target.value)}
                  placeholder="Paste a new cover URL"
                  style={styles.input}
                />

                <label style={styles.label}>Type</label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  style={styles.input}
                >
                  <option value="">Select type</option>
                  <option value="manga">Manga</option>
                  <option value="manhwa">Manhwa</option>
                  <option value="manhua">Manhua</option>
                </select>

                <label style={styles.label}>Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  style={styles.input}
                >
                  <option value="reading">Currently Reading</option>
                  <option value="readNext">Read Next</option>
                  <option value="notRead">Backlog</option>
                  <option value="dropped">Dropped</option>
                  <option value="finished">Finished</option>
                </select>

                <label style={styles.label}>Summary</label>
                <textarea
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  placeholder="Add a short summary..."
                  style={styles.textarea}
                />

                <label style={styles.label}>Tags</label>
                <div style={styles.tagWrap}>
                  {TAG_OPTIONS.map((tag) => {
                    const active = editTags.includes(tag);

                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        style={{
                          ...styles.tagToggle,
                          ...(active ? styles.tagToggleActive : {}),
                        }}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>

                <label style={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={editNeedsReview}
                    onChange={(e) => setEditNeedsReview(e.target.checked)}
                  />
                  <span>Keep this in Needs Review</span>
                </label>

                <div style={styles.modalButtons}>
                  <button onClick={() => setDetailMode("info")} style={styles.secondaryButton}>
                    Back
                  </button>

                  <button onClick={removeCoverInEdit} style={styles.secondaryButton}>
                    Remove Cover
                  </button>

                  <button onClick={() => deleteSeries(selectedItem.id)} style={styles.deleteButton}>
                    Delete
                  </button>

                  <button onClick={saveDetails} style={styles.primaryButton}>
                    Save Changes
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTypeLabel(type) {
  if (type === "manga") return "Manga";
  if (type === "manhwa") return "Manhwa";
  if (type === "manhua") return "Manhua";
  return "Unknown";
}

function formatStatusLabel(status) {
  if (status === "reading") return "Currently Reading";
  if (status === "readNext") return "Read Next";
  if (status === "notRead") return "Backlog";
  if (status === "dropped") return "Dropped";
  if (status === "finished") return "Finished";
  return status;
}

const controlBase = {
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

const styles = {
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
    width: 300,
    height: 300,
    borderRadius: "50%",
    background: "rgba(99, 102, 241, 0.14)",
    filter: "blur(90px)",
    top: -80,
    left: -60,
    pointerEvents: "none",
  },
  bgGlowTwo: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: "50%",
    background: "rgba(34, 211, 238, 0.1)",
    filter: "blur(90px)",
    top: 120,
    right: -70,
    pointerEvents: "none",
  },
  topbar: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    alignItems: "center",
    gap: 20,
    padding: "20px 28px 18px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    backdropFilter: "blur(16px)",
    background: "rgba(10, 14, 22, 0.72)",
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
    fontSize: "2rem",
    fontWeight: 900,
    letterSpacing: "-0.04em",
    color: "#f8fafc",
    whiteSpace: "nowrap",
  },
  burgerButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    cursor: "pointer",
    padding: 0,
    flexShrink: 0,
  },
  burgerLine: {
    width: 24,
    height: 2.5,
    background: "#f8fafc",
    borderRadius: 999,
    display: "block",
  },
  menuDropdown: {
    position: "absolute",
    top: "calc(100% - 4px)",
    left: 0,
    minWidth: 290,
    padding: 10,
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(19, 24, 35, 0.98)",
    boxShadow: "0 24px 48px rgba(0,0,0,0.42)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  menuSectionLabel: {
    padding: "8px 10px 4px",
    color: "#8ea3bd",
    fontSize: "0.78rem",
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
    borderRadius: 14,
    padding: "12px 14px",
    fontSize: "0.98rem",
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "left",
  },
  menuItemActive: {
    background: "rgba(99, 102, 241, 0.18)",
    color: "#ffffff",
  },
  menuCount: {
    background: "rgba(255,255,255,0.1)",
    borderRadius: 999,
    padding: "4px 9px",
    fontSize: "0.82rem",
    fontWeight: 800,
  },
  topbarCenter: {
    display: "flex",
    justifyContent: "center",
  },
  headerSearch: {
    ...controlBase,
    maxWidth: 560,
    width: "100%",
    borderRadius: 18,
    padding: "14px 16px",
    fontSize: "1rem",
    background: "rgba(255,255,255,0.08)",
  },
  topbarRight: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  totalPill: {
    borderRadius: 999,
    padding: "10px 14px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    fontSize: "0.95rem",
    fontWeight: 800,
    color: "#e2e8f0",
    whiteSpace: "nowrap",
  },
  main: {
    padding: "28px",
  },
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
    margin: "8px 0 8px",
    fontSize: "2rem",
    lineHeight: 1.05,
    fontWeight: 900,
    letterSpacing: "-0.04em",
    color: "#ffffff",
  },
  pageSubtitle: {
    margin: 0,
    color: "#a6b3c5",
    fontSize: "0.98rem",
  },
  heroActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
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
  addPanel: {
    background: "rgba(15, 23, 42, 0.5)",
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
  sectionTitle: {
    margin: 0,
    fontSize: "1rem",
    fontWeight: 800,
    color: "#ffffff",
  },
  compactSelect: {
    ...controlBase,
    width: "auto",
    minWidth: 180,
    padding: "10px 12px",
    fontSize: "0.9rem",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1.35fr 1.45fr 170px 170px auto",
    gap: 12,
    alignItems: "center",
  },
  helperText: {
    marginTop: 10,
    marginBottom: 0,
    color: "#90a0b5",
    fontSize: "0.88rem",
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionHeading: {
    margin: 0,
    fontSize: "1.15rem",
    fontWeight: 800,
    color: "#ffffff",
  },
  input: {
    ...controlBase,
  },
  textarea: {
    ...controlBase,
    minHeight: 110,
    resize: "vertical",
  },
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
  deleteButton: {
    background: "rgba(239,68,68,0.18)",
    color: "#fecaca",
    border: "1px solid rgba(239,68,68,0.25)",
    borderRadius: 14,
    padding: "11px 14px",
    fontWeight: 700,
    cursor: "pointer",
    WebkitAppearance: "none",
    appearance: "none",
  },
  emptyState: {
    background: "rgba(15, 23, 42, 0.5)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 22,
    padding: 28,
    textAlign: "center",
    color: "#cbd5e1",
  },
  emptyTitle: {
    fontSize: "1.05rem",
    fontWeight: 700,
    marginBottom: 6,
    color: "#f8fafc",
  },
  emptyText: {
    margin: 0,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: 18,
  },
  cardButton: {
    background: "transparent",
    border: "none",
    padding: 0,
    margin: 0,
    textAlign: "left",
    cursor: "pointer",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
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
  coverImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  noCover: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, rgba(51,65,85,0.9) 0%, rgba(30,41,59,0.95) 100%)",
    color: "#94a3b8",
    fontWeight: 800,
    fontSize: "0.82rem",
  },
  noCoverText: {
    opacity: 0.9,
  },
  cardTypeBadge: {
    position: "absolute",
    left: 8,
    bottom: 8,
    background: "rgba(37, 99, 235, 0.95)",
    color: "#ffffff",
    borderRadius: 999,
    padding: "4px 8px",
    fontSize: "0.7rem",
    fontWeight: 800,
    letterSpacing: "0.01em",
    boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
  },
  reviewBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    background: "rgba(239, 68, 68, 0.95)",
    color: "#ffffff",
    borderRadius: 999,
    padding: "4px 8px",
    fontSize: "0.68rem",
    fontWeight: 800,
    boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
  },
  cardMeta: {
    padding: "0 2px",
  },
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
  cardTagRow: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    marginTop: 6,
  },
  smallTag: {
    fontSize: "0.68rem",
    padding: "3px 7px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    color: "#cbd5e1",
    fontWeight: 700,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2, 6, 23, 0.82)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 999,
  },
  modal: {
    width: "100%",
    maxWidth: 680,
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 26,
    padding: 24,
    boxShadow: "0 24px 60px rgba(0,0,0,0.48)",
  },
  modalTop: {
    display: "flex",
    gap: 18,
    alignItems: "flex-start",
    marginBottom: 18,
    flexWrap: "wrap",
  },
  modalPreviewWrap: {
    width: 150,
    aspectRatio: "2 / 3",
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#111827",
    position: "relative",
    flexShrink: 0,
  },
  modalPreviewImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  modalNoCover: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    color: "#94a3b8",
    fontWeight: 800,
  },
  modalTopInfo: {
    flex: 1,
    minWidth: 180,
  },
  modalTitle: {
    margin: "0 0 10px 0",
    fontSize: "1.35rem",
    fontWeight: 900,
    color: "#ffffff",
  },
  modalHintText: {
    margin: "4px 0",
    color: "#cbd5e1",
    fontSize: "0.9rem",
  },
  infoMetaLine: {
    margin: "6px 0",
    color: "#cbd5e1",
    fontSize: "0.95rem",
  },
  infoBlock: {
    marginTop: 16,
  },
  infoBlockTitle: {
    margin: "0 0 10px 0",
    color: "#ffffff",
    fontWeight: 800,
    fontSize: "0.96rem",
  },
  summaryText: {
    margin: 0,
    color: "#cbd5e1",
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
  },
  emptyInline: {
    color: "#94a3b8",
    fontSize: "0.92rem",
  },
  label: {
    display: "block",
    marginBottom: 8,
    marginTop: 12,
    color: "#cbd5e1",
    fontWeight: 700,
    fontSize: "0.92rem",
  },
  tagWrap: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  tagPill: {
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(99,102,241,0.18)",
    color: "#e9eaff",
    fontWeight: 700,
    fontSize: "0.84rem",
  },
  tagToggle: {
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    color: "#dbe4f0",
    cursor: "pointer",
    fontWeight: 700,
  },
  tagToggleActive: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
    color: "#dbe4f0",
    fontWeight: 700,
  },
  modalButtons: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
    flexWrap: "wrap",
    marginTop: 20,
  },
};