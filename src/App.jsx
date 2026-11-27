/* ======================================================================
   MealMitra — App.jsx
   Single-file React app (React 18 via CDN + Babel Standalone).
   No imports/exports: React is a global. Data persists in localStorage.
   All demo data is MOCK / SAMPLE data and is labelled as such in the UI.
   ====================================================================== */
const {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useContext,
  createContext,
} = React;

/* ---------- 1. CONSTANTS & HELPERS ---------- */
const PREFIX = "mealmitra:v1:";
const MIN = 60000,
  HOUR = 3600000,
  DAY = 86400000;
const MEAL_CATS = ["Breakfast", "Lunch", "Dinner", "Snacks"];
const FOOD_CATS = [
  "Cooked meals",
  "Bakery",
  "Produce",
  "Dairy",
  "Packaged",
  "Beverages",
];
const UNITS = ["kg", "trays", "portions", "litres", "loaves"];
const STORAGE = [
  "Room temperature",
  "Refrigerate (0–4°C)",
  "Keep hot (above 60°C)",
  "Frozen",
];
const VEHICLES = ["Two-wheeler", "Van", "Pickup truck", "On foot"];
const WINDOWS = [
  "Within 1 hour",
  "Within 2 hours",
  "Within 3 hours",
  "Before the deadline",
];
const KG_PER_SERVING = 0.35,
  CO2_PER_KG = 2.5;
const KITCHENS = {
  k1: { name: "Annapurna Community Kitchen", km: 3.2, contact: "Meera Iyer" },
  k2: { name: "Spice Route Canteen", km: 2.4, contact: "Arjun Rao" },
  k3: { name: "Sunrise Bakery & Catering", km: 6.1, contact: "Farah Khan" },
  k4: { name: "Greenleaf Hostel Mess", km: 4.7, contact: "Dev Malhotra" },
  k5: { name: "City Campus Mess", km: 9.8, contact: "Latha Nair" },
};
const NGOS = {
  n1: { name: "Asha Foundation" },
  n2: { name: "Roti Bank" },
  n3: { name: "Seva Trust" },
};
const IMPACT_BASE = {
  kitchen: {
    weekly: [310, 355, 402, 380, 441, 470, 455, 512],
    monthly: [1240, 1460, 1710, 1820, 2010, 2240],
    cats: {
      "Cooked meals": 62,
      Bakery: 14,
      Produce: 12,
      Packaged: 8,
      Dairy: 4,
    },
    partners: [
      ["Roti Bank", 3120],
      ["Asha Foundation", 2740],
      ["Seva Trust", 1980],
    ],
  },
  ngo: {
    weekly: [210, 260, 288, 310, 342, 361, 380, 415],
    monthly: [880, 1010, 1190, 1330, 1480, 1650],
    cats: {
      "Cooked meals": 58,
      Bakery: 18,
      Produce: 14,
      Packaged: 6,
      Dairy: 4,
    },
    partners: [
      ["Spice Route Canteen", 2210],
      ["Annapurna Community Kitchen", 1980],
      ["Sunrise Bakery & Catering", 1450],
      ["Greenleaf Hostel Mess", 900],
    ],
  },
};
const DEFAULT_SETTINGS = {
  name: "Demo User",
  email: "demo@mealmitra.app",
  phone: "+91 98765 43210",
  kitchenName: KITCHENS.k1.name,
  ngoName: NGOS.n1.name,
  address: "12 Market Road, Pune",
  license: "FSSAI 11522999000123",
  costPerMeal: 45,
  bufferPct: 5,
  pickupHours: 3,
  applyEvents: true,
  notify: {
    claims: true,
    surplus: true,
    pickup: true,
    expiry: true,
    digest: false,
  },
};

const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
const pad = (n) => String(n).padStart(2, "0");
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0);
const dkey = (d) =>
  d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const parseKey = (k) => {
  const p = k.split("-").map(Number);
  return new Date(p[0], p[1] - 1, p[2]);
};
const addDays = (k, n) => {
  const d = parseKey(k);
  d.setDate(d.getDate() + n);
  return dkey(d);
};
const todayKey = () => dkey(new Date());
const fmtN = (n) => Number(Math.round(n)).toLocaleString("en-IN");
const fmtShort = (k) =>
  parseKey(k).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const fmtWeekday = (k) =>
  parseKey(k).toLocaleDateString("en-IN", { weekday: "short" });
const fmtLong = (k) =>
  parseKey(k).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
const fmtDT = (ms) =>
  new Date(ms).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
const toInput = (ms) => {
  const d = new Date(ms);
  return dkey(d) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
};
const ago = (ms, now) => {
  const d = Math.max(0, now - ms);
  if (d < MIN) return "just now";
  if (d < HOUR) return Math.floor(d / MIN) + "m ago";
  if (d < DAY) return Math.floor(d / HOUR) + "h ago";
  return Math.floor(d / DAY) + "d ago";
};
const fmtLeft = (ms) => {
  if (ms <= 0) return "Expired";
  const m = Math.floor(ms / MIN);
  if (m < 60) return m + "m left";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h " + (m % 60) + "m left";
  return Math.floor(h / 24) + "d " + (h % 24) + "h left";
};
const effStatus = (l, now) =>
  l.status === "available" && l.deadline < now ? "expired" : l.status;
const nameFromEmail = (e) => {
  const s = (e.split("@")[0] || "User").replace(/[._-]+/g, " ");
  return s.replace(/\b\w/g, (m) => m.toUpperCase());
};
const compact = (n) =>
  n >= 1000
    ? (n / 1000).toFixed(n % 1000 ? 1 : 0).replace(/\.0$/, "") + "k"
    : String(Math.round(n));
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function downloadFile(filename, text, mime) {
  const blob = new Blob([text], { type: mime || "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

/* ---------- 2. ICONS (inline SVG, 1.75 stroke) ---------- */
const ICONS = {
  home: (
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  ),
  utensils: (
    <g>
      <path d="M4 3v7a3 3 0 0 0 3 3v8M7 3v7M10 3v7a3 3 0 0 1-3 3" />
      <path d="M18 21V3c-2.5 1.5-4 4.5-4 8h4" />
    </g>
  ),
  trend: (
    <g>
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </g>
  ),
  box: (
    <g>
      <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
      <path d="m3 8 9 5 9-5M12 13v8" />
    </g>
  ),
  truck: (
    <g>
      <path d="M2 6h11v10H2zM13 9h4l4 4v3h-8" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </g>
  ),
  leaf: (
    <g>
      <path d="M5 20c0-9 5-15 15-16 0 10-6 15-14 15" />
      <path d="M5 20c2-5 5-8 9-10" />
    </g>
  ),
  bell: (
    <g>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </g>
  ),
  sliders: (
    <g>
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </g>
  ),
  search: (
    <g>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </g>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  more: (
    <g>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </g>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowUp: <path d="M12 19V5M6 11l6-6 6 6" />,
  arrowDown: <path d="M12 5v14M6 13l6 6 6-6" />,
  clock: (
    <g>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </g>
  ),
  pin: (
    <g>
      <path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </g>
  ),
  eye: (
    <g>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </g>
  ),
  eyeOff: (
    <path d="M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.6 7.6C3.9 9.4 2 12 2 12s3.5 7 10 7c1.6 0 3-.4 4.3-1" />
  ),
  edit: (
    <g>
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
      <path d="m13.5 6.5 4 4" />
    </g>
  ),
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  logout: (
    <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9" />
  ),
  user: (
    <g>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </g>
  ),
  users: (
    <g>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2 20a7 7 0 0 1 14 0M16 4.5a3.5 3.5 0 0 1 0 7M18 20a7 7 0 0 0-3-5.8" />
    </g>
  ),
  shield: (
    <g>
      <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </g>
  ),
  sparkle: (
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
  ),
  calendar: (
    <g>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </g>
  ),
  chevronDown: <path d="m6 9 6 6 6-6" />,
  info: (
    <g>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </g>
  ),
  alert: (
    <g>
      <path d="M12 3 2 20h20z" />
      <path d="M12 10v4M12 17h.01" />
    </g>
  ),
  mail: (
    <g>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </g>
  ),
  lock: (
    <g>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </g>
  ),
  building: (
    <path d="M4 21V5l8-2v18M12 9h8v12M3 21h18M7 9h2M7 13h2M7 17h2M15 13h2M15 17h2" />
  ),
  refresh: (
    <path d="M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5" />
  ),
  copy: (
    <g>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </g>
  ),
  snow: <path d="M12 2v20M4 7l16 10M20 7 4 17" />,
  flame: (
    <path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z" />
  ),
  rupee: <path d="M7 5h10M7 9h10M8 5c5 0 6 5 1 7l7 7" />,
  command: (
    <path d="M9 9h6v6H9zM9 9V6a3 3 0 1 0-3 3zM15 9h3a3 3 0 1 0-3-3zM9 15H6a3 3 0 1 0 3 3zM15 15v3a3 3 0 1 0 3-3z" />
  ),
  panel: (
    <g>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
    </g>
  ),
  download: <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />,
  zap: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
};
function Icon({ name, size, className = "" }) {
  return (
    <svg
      className={
        "icon" +
        (size ? " icon--" + size : "") +
        (className ? " " + className : "")
      }
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {ICONS[name] || null}
    </svg>
  );
}
function Logo({ dark }) {
  return (
    <span className={"logo" + (dark ? " logo--dark" : "")}>
      <span className="logo__mark">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 19c0-8 5-13 14-14 0 9-5 14-12 14" />
          <path d="M5 19c2-4 5-7 9-9" />
        </svg>
      </span>
      <span className="logo__word">
        MealMitra<span className="logo__dot">.</span>
      </span>
    </span>
  );
}

/* ---------- 3. CONTEXTS & HOOKS ---------- */
const AppCtx = createContext(null);
const NowCtx = createContext(Date.now());
const ToastCtx = createContext(() => {});
const useApp = () => useContext(AppCtx);
const useNow = () => useContext(NowCtx);
const useToast = () => useContext(ToastCtx);

function useStored(key, init) {
  const [v, setV] = useState(() => {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw !== null) return JSON.parse(raw);
    } catch (e) {}
    return typeof init === "function" ? init() : init;
  });
  useEffect(() => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(v));
    } catch (e) {}
  }, [key, v]);
  return [v, setV];
}
function useTicker(ms) {
  const [n, setN] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setN(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return n;
}
function useWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(Math.round(el.getBoundingClientRect().width));
    if (!window.ResizeObserver) return;
    const ro = new ResizeObserver((es) =>
      setW(Math.round(es[0].contentRect.width)),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}
function useReveal() {
  useEffect(() => {
    const els = Array.prototype.slice.call(
      document.querySelectorAll(".reveal"),
    );
    if (!("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12 },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
}
function useRoute() {
  const get = () => (window.location.hash || "#/").slice(1) || "/";
  const [route, setRoute] = useState(get());
  useEffect(() => {
    const on = () => setRoute(get());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const go = useCallback((r) => {
    if ("#" + r === window.location.hash) setRoute(r);
    else window.location.hash = r;
    window.scrollTo(0, 0);
  }, []);
  return [route, go];
}

/* ---------- 4. SAMPLE DATA & FORECAST ENGINE ---------- */
function seedLogs() {
  const r = rng(20261127),
    today = todayKey(),
    logs = [];
  const wk = [0.82, 1.0, 1.02, 1.05, 1.08, 0.96, 0.78];
  const base = { Breakfast: 120, Lunch: 230, Dinner: 190 };
  const menus = {
    Breakfast: ["Poha & Chai", "Idli Sambar", "Upma", "Paratha & Curd"],
    Lunch: [
      "Veg Thali",
      "Rajma Rice",
      "Dal Khichdi",
      "Chole & Rice",
      "Sambar Rice",
    ],
    Dinner: ["Roti Sabzi Dal", "Veg Pulao", "Paneer & Naan", "Khichdi & Kadhi"],
  };
  for (let i = 56; i >= 0; i--) {
    const date = addDays(today, -i),
      dow = parseKey(date).getDay();
    Object.keys(base).forEach((cat) => {
      const f = wk[dow] * (0.94 + r() * 0.12);
      const consumed = Math.round(base[cat] * f);
      const prepared = Math.round(consumed * (1.07 + r() * 0.1));
      const list = menus[cat];
      logs.push({
        id: uid(),
        date,
        name: list[Math.floor(r() * list.length)],
        category: cat,
        prepared,
        consumed,
        notes: "",
        sample: true,
        createdAt: parseKey(date).getTime() + 3600000,
      });
    });
  }
  return logs;
}
function seedListings() {
  const n = Date.now();
  const mk = (
    id,
    kid,
    name,
    category,
    quantity,
    unit,
    servings,
    dl,
    storage,
    notes,
    status,
    extra,
  ) =>
    Object.assign(
      {
        id,
        kitchenId: kid,
        name,
        category,
        quantity,
        unit,
        servings,
        deadline: n + dl,
        storage,
        notes,
        status,
        claimId: null,
        createdAt: n - 2 * HOUR,
        sample: true,
        expiryNotified: false,
      },
      extra || {},
    );
  return [
    mk(
      "L1",
      "k1",
      "Dal Tadka & Jeera Rice",
      "Cooked meals",
      18,
      "kg",
      60,
      3 * HOUR,
      STORAGE[2],
      "Packed in insulated containers. Bring your own serving spoons.",
      "available",
      { createdAt: n - 40 * MIN },
    ),
    mk(
      "L2",
      "k1",
      "Vegetable Pulao",
      "Cooked meals",
      12,
      "kg",
      40,
      90 * MIN,
      STORAGE[2],
      "Ready at the back gate.",
      "claimed",
      { claimId: "C1", expiryNotified: true },
    ),
    mk(
      "L3",
      "k1",
      "Whole Wheat Rotis",
      "Bakery",
      90,
      "portions",
      90,
      5 * HOUR,
      STORAGE[0],
      "Wrapped in foil, 10 per pack.",
      "available",
    ),
    mk(
      "L4",
      "k1",
      "Paneer Butter Masala",
      "Cooked meals",
      8,
      "kg",
      28,
      45 * MIN,
      STORAGE[2],
      "Contains dairy and nuts.",
      "available",
      { expiryNotified: true },
    ),
    mk(
      "L5",
      "k2",
      "Veg Biryani",
      "Cooked meals",
      20,
      "kg",
      70,
      4 * HOUR,
      STORAGE[2],
      "Raita available on request.",
      "claimed",
      { claimId: "C2" },
    ),
    mk(
      "L6",
      "k1",
      "Idli & Sambar",
      "Cooked meals",
      14,
      "kg",
      50,
      -20 * HOUR,
      STORAGE[2],
      "",
      "collected",
      { claimId: "C3", collectedAt: n - 19 * HOUR, expiryNotified: true },
    ),
    mk(
      "L7",
      "k1",
      "Fruit Salad Cups",
      "Produce",
      30,
      "portions",
      30,
      8 * HOUR,
      STORAGE[1],
      "Draft — waiting for final count.",
      "draft",
    ),
    mk(
      "L8",
      "k3",
      "Bread Loaves",
      "Bakery",
      40,
      "loaves",
      120,
      20 * HOUR,
      STORAGE[0],
      "Day-old, sliced.",
      "available",
    ),
    mk(
      "L9",
      "k4",
      "Sprouts Salad",
      "Produce",
      6,
      "kg",
      30,
      2 * HOUR,
      STORAGE[1],
      "Keep chilled.",
      "available",
    ),
    mk(
      "L10",
      "k5",
      "Curd Rice",
      "Cooked meals",
      15,
      "kg",
      55,
      6 * HOUR,
      STORAGE[1],
      "",
      "available",
    ),
    mk(
      "L11",
      "k2",
      "Mixed Veg Curry",
      "Cooked meals",
      10,
      "kg",
      35,
      30 * HOUR,
      STORAGE[1],
      "",
      "available",
    ),
    mk(
      "L12",
      "k1",
      "Lemon Rice",
      "Cooked meals",
      9,
      "kg",
      32,
      -3 * HOUR,
      STORAGE[2],
      "",
      "expired",
      { expiryNotified: true },
    ),
    mk(
      "L13",
      "k1",
      "Veg Sandwich Trays",
      "Packaged",
      12,
      "trays",
      48,
      -70 * HOUR,
      STORAGE[0],
      "",
      "collected",
      { claimId: "C4", collectedAt: n - 68 * HOUR, expiryNotified: true },
    ),
    mk(
      "L14",
      "k2",
      "Poha",
      "Cooked meals",
      11,
      "kg",
      45,
      -46 * HOUR,
      STORAGE[2],
      "",
      "collected",
      { claimId: "C5", collectedAt: n - 45 * HOUR, expiryNotified: true },
    ),
  ];
}
function seedClaims() {
  const n = Date.now();
  const mk = (id, listingId, ngoId, status, code, hist, contact, vehicle) => ({
    id,
    listingId,
    ngoId,
    status,
    code,
    createdAt: hist[0][1],
    window: "Within 2 hours",
    contact,
    phone: "+91 98765 43210",
    vehicle,
    history: hist.map((h) => ({ status: h[0], at: h[1] })),
    sample: true,
    reminded: false,
  });
  return [
    mk(
      "C1",
      "L2",
      "n2",
      "on_the_way",
      "MM-4821",
      [
        ["claimed", n - 35 * MIN],
        ["on_the_way", n - 12 * MIN],
      ],
      "Imran (Roti Bank)",
      "Van",
    ),
    mk(
      "C2",
      "L5",
      "n1",
      "claimed",
      "MM-7305",
      [["claimed", n - 50 * MIN]],
      "Asha Foundation desk",
      "Pickup truck",
    ),
    mk(
      "C3",
      "L6",
      "n1",
      "collected",
      "MM-2290",
      [
        ["claimed", n - 22 * HOUR],
        ["on_the_way", n - 20 * HOUR],
        ["collected", n - 19 * HOUR],
      ],
      "Asha Foundation desk",
      "Van",
    ),
    mk(
      "C4",
      "L13",
      "n2",
      "collected",
      "MM-1184",
      [
        ["claimed", n - 71 * HOUR],
        ["on_the_way", n - 69 * HOUR],
        ["collected", n - 68 * HOUR],
      ],
      "Imran (Roti Bank)",
      "Two-wheeler",
    ),
    mk(
      "C5",
      "L14",
      "n1",
      "collected",
      "MM-5532",
      [
        ["claimed", n - 47 * HOUR],
        ["on_the_way", n - 46 * HOUR],
        ["collected", n - 45 * HOUR],
      ],
      "Asha Foundation desk",
      "Van",
    ),
  ];
}
function seedNotifs() {
  const n = Date.now();
  const mk = (type, audience, title, text, ago_, ref, read) => ({
    id: uid(),
    type,
    audience,
    title,
    text,
    at: n - ago_,
    read: !!read,
    ref,
  });
  return [
    mk(
      "claim",
      "kitchen",
      "Roti Bank claimed Vegetable Pulao",
      "40 servings reserved. Pickup code MM-4821.",
      35 * MIN,
      "claims",
    ),
    mk(
      "pickup",
      "kitchen",
      "Roti Bank is on the way",
      "Pickup for Vegetable Pulao started 12 minutes ago.",
      12 * MIN,
      "claims",
    ),
    mk(
      "expiry",
      "kitchen",
      "Paneer Butter Masala expires soon",
      "No NGO has claimed it yet. Pickup deadline is under an hour away.",
      10 * MIN,
      "surplus",
    ),
    mk(
      "surplus",
      "kitchen",
      "Predicted surplus tomorrow",
      "Sample forecast suggests listing surplus after lunch service.",
      2 * HOUR,
      "forecast",
    ),
    mk(
      "system",
      "kitchen",
      "Weekly summary is ready",
      "Your sample impact summary for last week is available.",
      26 * HOUR,
      "impact",
      true,
    ),
    mk(
      "claim",
      "ngo",
      "Claim confirmed: Veg Biryani",
      "Spice Route Canteen reserved 70 servings for you. Code MM-7305.",
      50 * MIN,
      "pickups",
    ),
    mk(
      "pickup",
      "ngo",
      "Pickup reminder",
      "Collect Veg Biryani from Spice Route Canteen before its deadline.",
      20 * MIN,
      "pickups",
    ),
    mk(
      "surplus",
      "ngo",
      "5 new listings within 10 km",
      "Fresh surplus from nearby kitchens is waiting to be claimed.",
      2 * HOUR,
      "available",
    ),
    mk(
      "system",
      "ngo",
      "Your NGO is verified",
      "You can claim listings from all participating kitchens.",
      30 * HOUR,
      "settings",
      true,
    ),
  ];
}
function seedEvents() {
  return [
    {
      id: uid(),
      date: addDays(todayKey(), 3),
      label: "Campus fest (sample)",
      pct: 25,
      sample: true,
    },
  ];
}

function dailyTotals(logs) {
  const m = {};
  logs.forEach((l) => {
    const t = m[l.date] || (m[l.date] = { prepared: 0, consumed: 0 });
    t.prepared += l.prepared;
    t.consumed += l.consumed;
  });
  return m;
}
/* Mock forecast: average of consumption on the last four matching weekdays, optional event uplift. */
function computeForecast(totals, date, events, applyEvents, buffer) {
  const samples = [];
  for (let k = 1; k <= 4; k++) {
    const d = addDays(date, -7 * k);
    const t = totals[d];
    if (t)
      samples.push({ date: d, consumed: t.consumed, prepared: t.prepared });
  }
  const n = samples.length;
  const ev = applyEvents ? (events || []).find((e) => e.date === date) : null;
  if (!n)
    return {
      date,
      samples,
      n: 0,
      base: 0,
      planned: 0,
      forecast: 0,
      recommended: 0,
      surplus: 0,
      reducible: 0,
      sd: 0,
      confidence: 30,
      level: "Low",
      bars: 1,
      pct: 0,
      eventLabel: null,
    };
  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  const base = mean(samples.map((s) => s.consumed));
  const planned = mean(samples.map((s) => s.prepared));
  const sd = Math.sqrt(
    mean(samples.map((s) => Math.pow(s.consumed - base, 2))),
  );
  const cv = base ? sd / base : 0;
  const pct = ev ? ev.pct : 0;
  const forecast = Math.round(base * (1 + pct / 100));
  const recommended = Math.round(forecast * (1 + buffer / 100));
  const confidence = Math.round(
    clamp(96 - cv * 220 - (4 - n) * 12 - (pct ? 4 : 0), 35, 96),
  );
  return {
    date,
    samples,
    n,
    base,
    planned,
    forecast,
    recommended,
    sd,
    pct,
    eventLabel: ev ? ev.label : null,
    surplus: Math.max(0, Math.round(planned) - forecast),
    reducible: Math.max(0, Math.round(planned) - recommended),
    confidence,
    level: confidence >= 80 ? "High" : confidence >= 60 ? "Medium" : "Low",
    bars:
      confidence >= 85 ? 4 : confidence >= 70 ? 3 : confidence >= 55 ? 2 : 1,
  };
}
function buildRows(totals, events, apply, buffer) {
  const today = todayKey(),
    rows = [];
  for (let i = -14; i <= 6; i++) {
    const date = addDays(today, i);
    if (i < 0) {
      const t = totals[date],
        p = computeForecast(totals, date, [], false, buffer);
      rows.push({
        date,
        label: fmtShort(date),
        future: false,
        actual: t ? t.consumed : null,
        predicted: p.n ? p.forecast : null,
      });
    } else {
      const f = computeForecast(totals, date, events, apply, buffer);
      rows.push({
        date,
        label: fmtShort(date),
        future: true,
        forecast: f.n ? f.forecast : null,
        planned: f.n ? Math.round(f.planned) : null,
        hi: f.n ? Math.round(f.forecast + f.sd) : null,
        lo: f.n ? Math.max(0, Math.round(f.forecast - f.sd)) : null,
        event: f.eventLabel,
      });
    }
  }
  return rows;
}

/* ---------- 5. UI ATOMS ---------- */
function CountUp({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 900,
}) {
  const [v, setV] = useState(0);
  const [seen, setSeen] = useState(false);
  const ref = useRef(null);
  const prev = useRef(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (es) => {
        if (es[0].isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!seen) return;
    const reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setV(value);
      prev.current = value;
      return;
    }
    let raf;
    const from = prev.current,
      t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration),
        e = 1 - Math.pow(1 - p, 3);
      setV(from + (value - from) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, seen]);
  return (
    <span className="num" ref={ref}>
      {prefix}
      {v.toLocaleString("en-IN", {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

let lockCount = 0;
function Modal({ title, sub, onClose, children, footer, size }) {
  const body = useRef(null);
  useEffect(() => {
    lockCount++;
    document.body.classList.add("is-locked");
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.activeElement;
    const t = setTimeout(() => {
      const el =
        body.current &&
        body.current.querySelector("input:not([type=hidden]),select,textarea");
      if (el) el.focus();
    }, 60);
    return () => {
      lockCount--;
      if (lockCount <= 0) {
        lockCount = 0;
        document.body.classList.remove("is-locked");
      }
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
      if (prev && prev.focus) prev.focus();
    };
  }, []);
  return (
    <div
      className="modal-scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={"modal" + (size ? " modal--" + size : "")}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal__head">
          <div>
            <h2 className="modal__title">{title}</h2>
            {sub && <p className="modal__sub">{sub}</p>}
          </div>
          <button
            className="modal__close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <Icon name="x" />
          </button>
        </div>
        <div className="modal__body" ref={body}>
          {children}
        </div>
        {footer && <div className="modal__foot">{footer}</div>}
      </div>
    </div>
  );
}
function ConfirmModal({
  title,
  text,
  confirmLabel = "Confirm",
  danger,
  onConfirm,
  onClose,
  icon = "alert",
}) {
  return (
    <Modal
      title={title}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className={"btn " + (danger ? "btn--danger" : "btn--primary")}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className={"modal__icon" + (danger ? " modal__icon--danger" : "")}>
        <Icon name={icon} size="lg" />
      </div>
      <p className="muted">{text}</p>
    </Modal>
  );
}
function Dropdown({ renderTrigger, children, menuClassName = "", left }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div className="dropdown" ref={ref}>
      {renderTrigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          className={
            "dropdown__menu " +
            (left ? "dropdown__menu--left " : "") +
            menuClassName
          }
          role="menu"
        >
          {typeof children === "function"
            ? children(() => setOpen(false))
            : children}
        </div>
      )}
    </div>
  );
}
function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const remove = useCallback((id) => {
    setItems((a) => a.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setItems((a) => a.filter((t) => t.id !== id)), 250);
  }, []);
  const push = useCallback(
    (title, opts) => {
      const o = opts || {},
        id = uid();
      setItems((a) =>
        a
          .slice(-3)
          .concat([
            {
              id,
              title,
              msg: o.msg,
              type: o.type || "success",
              action: o.action,
            },
          ]),
      );
      setTimeout(() => remove(id), o.duration || 4000);
      return id;
    },
    [remove],
  );
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-region" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            className={
              "toast toast--" + t.type + (t.leaving ? " is-leaving" : "")
            }
            role="status"
          >
            <span className="toast__icon">
              <Icon
                name={
                  t.type === "error"
                    ? "x"
                    : t.type === "info"
                      ? "info"
                      : "check"
                }
                size="sm"
              />
            </span>
            <div className="toast__body">
              <div className="toast__title">{t.title}</div>
              {t.msg && <div className="toast__msg">{t.msg}</div>}
            </div>
            {t.action && (
              <button
                className="toast__action"
                onClick={() => {
                  t.action.onClick();
                  remove(t.id);
                }}
              >
                {t.action.label}
              </button>
            )}
            <button
              className="toast__close"
              onClick={() => remove(t.id)}
              aria-label="Dismiss"
            >
              <Icon name="x" size="sm" />
            </button>
            <span className="toast__bar" />
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
function Field({ label, hint, error, id, children, className = "" }) {
  return (
    <div
      className={
        "field" +
        (error ? " has-error" : "") +
        (className ? " " + className : "")
      }
    >
      <label className="field__label" htmlFor={id}>
        <span>{label}</span>
        {hint && <span className="field__hint">{hint}</span>}
      </label>
      {children}
      {error && (
        <span className="field__error" role="alert">
          <Icon name="alert" size="sm" />
          {error}
        </span>
      )}
    </div>
  );
}
function Stepper({ value, onChange, step = 5, label, id }) {
  const n = Number(value) || 0;
  return (
    <div className="stepper">
      <button
        type="button"
        className="stepper__btn"
        onClick={() => onChange(String(Math.max(0, n - step)))}
        aria-label={"Decrease " + label}
      >
        <Icon name="minus" size="sm" />
      </button>
      <input
        id={id}
        className="stepper__input"
        type="number"
        inputMode="numeric"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
      />
      <button
        type="button"
        className="stepper__btn"
        onClick={() => onChange(String(n + step))}
        aria-label={"Increase " + label}
      >
        <Icon name="plus" size="sm" />
      </button>
    </div>
  );
}
function Switch({ checked, onChange, label }) {
  return (
    <label className="switch">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
      />
      <span className="switch__track" />
    </label>
  );
}
const STATUS_META = {
  available: ["badge--emerald", "Available"],
  claimed: ["badge--teal", "Claimed"],
  collected: ["badge--dark", "Collected"],
  expired: ["badge--red", "Expired"],
  draft: ["badge--outline", "Draft"],
  on_the_way: ["badge--amber", "On the way"],
  cancelled: ["badge--outline", "Cancelled"],
};
function StatusBadge({ status }) {
  const m = STATUS_META[status] || ["", status];
  return (
    <span className={"badge " + m[0]}>
      <span className="badge__dot" />
      {m[1]}
    </span>
  );
}
function Countdown({ deadline }) {
  const now = useNow(),
    ms = deadline - now;
  const cls =
    ms <= 0
      ? " expiry--urgent"
      : ms < HOUR
        ? " expiry--urgent"
        : ms < 3 * HOUR
          ? " expiry--soon"
          : "";
  return (
    <span className={"expiry" + cls}>
      <Icon name="clock" size="sm" />
      {fmtLeft(ms)}
    </span>
  );
}
function EmptyState({ title, text, children }) {
  return (
    <div className="empty">
      <svg className="empty__art" viewBox="0 0 120 72" aria-hidden="true">
        <path
          className="art-gap"
          d="M62 32C84 34 94 18 114 12L114 40C94 44 84 50 62 50Z"
        />
        <path className="art-solid" d="M6 56C30 54 40 30 62 32" />
        <path className="art-dash" d="M62 32C84 34 94 18 114 12" />
      </svg>
      <h3 className="empty__title">{title}</h3>
      <p className="empty__text">{text}</p>
      {children}
    </div>
  );
}
function SampleBanner({ children }) {
  return (
    <div className="sample-banner">
      <span className="sample-tag">Sample data</span>
      <span>{children}</span>
    </div>
  );
}
function PageHead({ title, sub, children }) {
  return (
    <div className="page__head">
      <div>
        <h1 className="page__title">{title}</h1>
        {sub && <p className="page__sub">{sub}</p>}
      </div>
      <div className="page__actions">{children}</div>
    </div>
  );
}
function Confidence({ level, bars, pct }) {
  return (
    <span className="confidence">
      <span className="confidence__bars">
        {[1, 2, 3, 4].map((i) => (
          <i key={i} className={i <= bars ? "is-on" : ""} />
        ))}
      </span>
      <span>
        <b>{level}</b> · {pct}%
      </span>
    </span>
  );
}

/* ---------- 6. CHARTS (hand-built SVG, sized by container) ---------- */
const niceMax = (v) => {
  if (v <= 0) return 10;
  const p = Math.pow(10, Math.floor(Math.log10(v))),
    n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
};
function smooth(pts, cont) {
  if (!pts.length) return "";
  let d = (cont ? "L" : "M") + pts[0][0] + "," + pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i],
      p1 = pts[i],
      p2 = pts[i + 1],
      p3 = pts[i + 2] || p2,
      t = 0.18;
    d +=
      "C" +
      (p1[0] + (p2[0] - p0[0]) * t) +
      "," +
      (p1[1] + (p2[1] - p0[1]) * t) +
      " " +
      (p2[0] - (p3[0] - p1[0]) * t) +
      "," +
      (p2[1] - (p3[1] - p1[1]) * t) +
      " " +
      p2[0] +
      "," +
      p2[1];
  }
  return d;
}
function ChartTip({ tip }) {
  if (!tip) return null;
  return (
    <div
      className="chart__tooltip is-visible"
      style={{ left: tip.x, top: tip.y }}
    >
      <span className="chart__tooltip-label">{tip.label}</span>
      {tip.rows.map((r, i) => (
        <div className="chart__tooltip-row" key={i}>
          <span>
            <i style={{ background: r.color, marginRight: 6 }} />
            {r.name}
          </span>
          <b>{r.value}</b>
        </div>
      ))}
    </div>
  );
}
function Sparkline({ values, cls = "" }) {
  const max = Math.max.apply(null, values.concat([1])),
    min = Math.min.apply(null, values.concat([0]));
  const pts = values.map((v, i) => [
    (i * 100) / (values.length - 1 || 1),
    40 - ((v - min) / (max - min || 1)) * 34 - 3,
  ]);
  const d = pts
    .map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1))
    .join(" ");
  return (
    <svg viewBox="0 0 100 44" preserveAspectRatio="none" aria-hidden="true">
      <path className="spark-area" d={d + " L100,44 L0,44 Z"} />
      <path
        className={"spark-line " + cls}
        d={d}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
function ForecastLegend() {
  return (
    <div className="panel__legend">
      <span className="legend__item">
        <span className="legend__swatch legend__swatch--forest" />
        Actual consumed
      </span>
      <span className="legend__item">
        <span className="legend__swatch legend__swatch--dashed" />
        Mock forecast
      </span>
      <span className="legend__item">
        <span className="legend__swatch legend__swatch--lime" />
        Surplus gap
      </span>
    </div>
  );
}
function ForecastChart({ rows, height = 300, selected, onPick }) {
  const [ref, w] = useWidth();
  const [hi, setHi] = useState(null);
  const n = rows.length,
    padL = 38,
    padR = 14,
    padT = 14,
    padB = 28;
  const iw = Math.max(10, w - padL - padR),
    ih = height - padT - padB;
  const vals = [];
  rows.forEach((r) =>
    ["actual", "predicted", "forecast", "planned", "hi"].forEach((k) => {
      if (r[k] != null) vals.push(r[k]);
    }),
  );
  const max = niceMax(Math.max.apply(null, vals.concat([10])) * 1.06);
  const x = (i) => padL + (n > 1 ? (i * iw) / (n - 1) : iw / 2);
  const y = (v) => padT + ih - (v / max) * ih;
  const pts = (k) =>
    rows.map((r, i) => (r[k] != null ? [x(i), y(r[k])] : null)).filter(Boolean);
  const actual = pts("actual"),
    pred = pts("predicted"),
    fc = pts("forecast"),
    planned = pts("planned"),
    up = pts("hi"),
    lo = pts("lo");
  const lastA = actual[actual.length - 1];
  const fcLine = lastA && fc.length ? [lastA].concat(fc) : fc;
  const gap =
    planned.length > 1
      ? smooth(planned) + smooth(fc.slice().reverse(), true) + "Z"
      : "";
  const band =
    up.length > 1 ? smooth(up) + smooth(lo.slice().reverse(), true) + "Z" : "";
  const ticks = [0, 1, 2, 3, 4].map((i) => (max * i) / 4);
  const step = w < 480 ? 4 : w < 760 ? 3 : 2;
  const split = rows.findIndex((r) => r.future);
  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHi(
      clamp(
        Math.round(((e.clientX - rect.left) / rect.width) * (n - 1)),
        0,
        n - 1,
      ),
    );
  };
  let tip = null;
  if (hi != null && rows[hi]) {
    const r = rows[hi],
      tops = [r.actual, r.predicted, r.forecast, r.planned].filter(
        (v) => v != null,
      );
    const trows = r.future
      ? [
          {
            name: "Forecast",
            value: r.forecast != null ? r.forecast : "–",
            color: "#12A06B",
          },
          {
            name: "Usual prep",
            value: r.planned != null ? r.planned : "–",
            color: "#C6F36B",
          },
          {
            name: "Surplus",
            value:
              r.forecast != null ? Math.max(0, r.planned - r.forecast) : "–",
            color: "#E8A317",
          },
        ].concat(
          r.event ? [{ name: "Event", value: r.event, color: "#fff" }] : [],
        )
      : [
          {
            name: "Actual",
            value: r.actual != null ? r.actual : "–",
            color: "#17503A",
          },
          {
            name: "Mock prediction",
            value: r.predicted != null ? r.predicted : "–",
            color: "#12A06B",
          },
        ];
    tip = {
      x: clamp(x(hi), 80, Math.max(80, w - 80)),
      y: y(tops.length ? Math.max.apply(null, tops) : 0),
      label: fmtWeekday(r.date) + " · " + r.label,
      rows: trows,
    };
  }
  const sel = selected != null ? selected : null;
  return (
    <div className="chart" ref={ref} style={{ height }}>
      {w > 0 && (
        <svg
          width={w}
          height={height}
          viewBox={"0 0 " + w + " " + height}
          role="img"
          aria-label="Forecast chart: actual consumption, mock predictions and the surplus gap"
        >
          {ticks.map((t, i) => (
            <g key={i}>
              <line
                className="chart__grid"
                x1={padL}
                x2={w - padR}
                y1={y(t)}
                y2={y(t)}
              />
              <text
                className="chart__tick chart__tick--end"
                x={padL - 8}
                y={y(t) + 4}
              >
                {compact(t)}
              </text>
            </g>
          ))}
          {rows.map((r, i) =>
            i % step === 0 || i === n - 1 ? (
              <text
                key={i}
                className={
                  "chart__tick chart__tick--mid" +
                  (i === sel ? " is-active" : "")
                }
                x={x(i)}
                y={height - 8}
              >
                {r.label}
              </text>
            ) : null,
          )}
          {split > 0 && (
            <g>
              <line
                className="chart__divider"
                x1={(x(split) + x(split - 1)) / 2}
                x2={(x(split) + x(split - 1)) / 2}
                y1={padT}
                y2={padT + ih}
              />
              <text
                className="chart__divider-label"
                x={(x(split) + x(split - 1)) / 2 + 6}
                y={padT + 10}
              >
                Forecast
              </text>
            </g>
          )}
          {band && <path className="chart__band" d={band} />}
          {gap && <path className="chart__gap" d={gap} />}
          {gap && fc.length > 2 && (
            <text
              className="chart__gap-label"
              x={fc[Math.floor(fc.length / 2)][0]}
              y={
                (fc[Math.floor(fc.length / 2)][1] +
                  planned[Math.floor(fc.length / 2)][1]) /
                  2 +
                3
              }
              textAnchor="middle"
            >
              Surplus gap
            </text>
          )}
          {pred.length > 1 && (
            <path
              className="chart__line"
              d={smooth(pred)}
              style={{
                strokeWidth: 1.75,
                opacity: 0.7,
                strokeDasharray: "2 4",
              }}
            />
          )}
          {actual.length > 1 && (
            <path
              pathLength="1"
              className="chart__line chart__line--consumed chart__line--draw"
              d={smooth(actual)}
            />
          )}
          {fcLine.length > 1 && (
            <path
              className="chart__line chart__line--proj"
              d={smooth(fcLine)}
            />
          )}
          {rows.map((r, i) =>
            r.forecast != null ? (
              <circle
                key={i}
                className="chart__dot chart__dot--lime"
                cx={x(i)}
                cy={y(r.forecast)}
                r={i === sel ? 6 : 3.5}
              />
            ) : null,
          )}
          {sel != null && rows[sel] && (
            <line
              className="chart__cursor is-visible"
              x1={x(sel)}
              x2={x(sel)}
              y1={padT}
              y2={padT + ih}
            />
          )}
          {hi != null && (
            <line
              className="chart__cursor is-visible"
              x1={x(hi)}
              x2={x(hi)}
              y1={padT}
              y2={padT + ih}
            />
          )}
          <rect
            x={padL}
            y={padT}
            width={iw}
            height={ih}
            className="chart__hit"
            onPointerMove={onMove}
            onPointerDown={onMove}
            onPointerLeave={() => setHi(null)}
            onClick={() => {
              if (hi != null && rows[hi] && rows[hi].future && onPick)
                onPick(hi);
            }}
          />
        </svg>
      )}
      <ChartTip tip={tip} />
    </div>
  );
}
function BarChart({ rows, keys, height = 240 }) {
  const [ref, w] = useWidth();
  const [hi, setHi] = useState(null);
  const n = rows.length,
    padL = 38,
    padR = 8,
    padT = 12,
    padB = 28;
  const iw = Math.max(10, w - padL - padR),
    ih = height - padT - padB;
  const max = niceMax(
    Math.max.apply(
      null,
      [10].concat(
        rows.map((r) =>
          Math.max.apply(
            null,
            keys.map((k) => r[k.k] || 0),
          ),
        ),
      ),
    ) * 1.05,
  );
  const gw = iw / n,
    bw = Math.min(18, gw * 0.3),
    y = (v) => padT + ih - (v / max) * ih;
  const ticks = [0, 1, 2, 3, 4].map((i) => (max * i) / 4);
  let tip = null;
  if (hi != null)
    tip = {
      x: clamp(padL + gw * hi + gw / 2, 80, Math.max(80, w - 80)),
      y: y(
        Math.max.apply(
          null,
          keys.map((k) => rows[hi][k.k] || 0),
        ),
      ),
      label: rows[hi].label,
      rows: keys.map((k) => ({
        name: k.name,
        value: fmtN(rows[hi][k.k] || 0),
        color: k.color,
      })),
    };
  return (
    <div className="chart" ref={ref} style={{ height }}>
      {w > 0 && (
        <svg
          width={w}
          height={height}
          viewBox={"0 0 " + w + " " + height}
          role="img"
          aria-label="Bar chart"
        >
          {ticks.map((t, i) => (
            <g key={i}>
              <line
                className="chart__grid"
                x1={padL}
                x2={w - padR}
                y1={y(t)}
                y2={y(t)}
              />
              <text
                className="chart__tick chart__tick--end"
                x={padL - 8}
                y={y(t) + 4}
              >
                {compact(t)}
              </text>
            </g>
          ))}
          {rows.map((r, i) => {
            const cx = padL + gw * i + gw / 2,
              total = keys.length * bw + (keys.length - 1) * 3;
            return (
              <g
                key={i}
                onPointerEnter={() => setHi(i)}
                onPointerLeave={() => setHi(null)}
              >
                <rect
                  x={padL + gw * i}
                  y={padT}
                  width={gw}
                  height={ih}
                  fill="transparent"
                />
                {keys.map((k, j) => {
                  const v = r[k.k] || 0;
                  return (
                    <rect
                      key={j}
                      className={
                        "chart__bar " +
                        k.cls +
                        (hi != null && hi !== i ? " is-dim" : "")
                      }
                      style={{ "--i": i }}
                      x={cx - total / 2 + j * (bw + 3)}
                      y={y(v)}
                      width={bw}
                      height={Math.max(0, padT + ih - y(v))}
                      rx="2"
                    />
                  );
                })}
                <text
                  className={
                    "chart__tick chart__tick--mid" +
                    (hi === i ? " is-active" : "")
                  }
                  x={cx}
                  y={height - 8}
                >
                  {r.label}
                </text>
              </g>
            );
          })}
        </svg>
      )}
      <ChartTip tip={tip} />
    </div>
  );
}
function AreaChart({ rows, height = 260, name = "Meals saved" }) {
  const [ref, w] = useWidth();
  const [hi, setHi] = useState(null);
  const n = rows.length,
    padL = 40,
    padR = 14,
    padT = 14,
    padB = 28;
  const iw = Math.max(10, w - padL - padR),
    ih = height - padT - padB;
  const max = niceMax(
    Math.max.apply(null, [10].concat(rows.map((r) => r.value))) * 1.08,
  );
  const x = (i) => padL + (n > 1 ? (i * iw) / (n - 1) : iw / 2),
    y = (v) => padT + ih - (v / max) * ih;
  const pts = rows.map((r, i) => [x(i), y(r.value)]);
  const line = smooth(pts),
    area =
      line +
      "L" +
      x(n - 1) +
      "," +
      (padT + ih) +
      "L" +
      x(0) +
      "," +
      (padT + ih) +
      "Z";
  const ticks = [0, 1, 2, 3, 4].map((i) => (max * i) / 4);
  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHi(
      clamp(
        Math.round(((e.clientX - rect.left) / rect.width) * (n - 1)),
        0,
        n - 1,
      ),
    );
  };
  const tip =
    hi != null
      ? {
          x: clamp(x(hi), 70, Math.max(70, w - 70)),
          y: y(rows[hi].value),
          label: rows[hi].label,
          rows: [{ name: name, value: fmtN(rows[hi].value), color: "#12A06B" }],
        }
      : null;
  return (
    <div className="chart" ref={ref} style={{ height }}>
      {w > 0 && (
        <svg
          width={w}
          height={height}
          viewBox={"0 0 " + w + " " + height}
          role="img"
          aria-label="Trend chart"
        >
          {ticks.map((t, i) => (
            <g key={i}>
              <line
                className="chart__grid"
                x1={padL}
                x2={w - padR}
                y1={y(t)}
                y2={y(t)}
              />
              <text
                className="chart__tick chart__tick--end"
                x={padL - 8}
                y={y(t) + 4}
              >
                {compact(t)}
              </text>
            </g>
          ))}
          {rows.map((r, i) => (
            <text
              key={i}
              className={
                "chart__tick chart__tick--mid" + (hi === i ? " is-active" : "")
              }
              x={x(i)}
              y={height - 8}
            >
              {r.label}
            </text>
          ))}
          <path className="chart__area" d={area} />
          <path
            pathLength="1"
            className="chart__line chart__line--draw"
            d={line}
          />
          {rows.map((r, i) => (
            <circle
              key={i}
              className="chart__dot"
              cx={x(i)}
              cy={y(r.value)}
              r={hi === i ? 5 : 3}
            />
          ))}
          {hi != null && (
            <line
              className="chart__cursor is-visible"
              x1={x(hi)}
              x2={x(hi)}
              y1={padT}
              y2={padT + ih}
            />
          )}
          <rect
            x={padL}
            y={padT}
            width={iw}
            height={ih}
            className="chart__hit"
            onPointerMove={onMove}
            onPointerDown={onMove}
            onPointerLeave={() => setHi(null)}
          />
        </svg>
      )}
      <ChartTip tip={tip} />
    </div>
  );
}
const DONUT_COLORS = ["#12A06B", "#17503A", "#C6F36B", "#E8A317", "#2F7F8F"];
function Donut({ segments, center, label }) {
  const r = 70,
    C = 2 * Math.PI * r,
    total = sum(segments, (s) => s.value) || 1;
  let off = 0;
  return (
    <div className="donut-wrap">
      <div className="donut">
        <svg
          viewBox="0 0 168 168"
          role="img"
          aria-label="Breakdown by category"
        >
          <circle className="donut__track" cx="84" cy="84" r={r} />
          {segments.map((s, i) => {
            const len = (s.value / total) * C,
              dash = Math.max(0, len - 2);
            const el = (
              <circle
                key={i}
                className="donut__seg"
                cx="84"
                cy="84"
                r={r}
                stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
                strokeDasharray={dash + " " + (C - dash)}
                strokeDashoffset={-off}
              />
            );
            off += len;
            return el;
          })}
        </svg>
        <div className="donut__center">
          <span className="donut__value">{center}</span>
          <span className="donut__label">{label}</span>
        </div>
      </div>
      <div className="donut-legend">
        {segments.map((s, i) => (
          <div className="donut-legend__row" key={i}>
            <span
              className="legend__swatch"
              style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
            />
            {s.label}
            <b>{Math.round((s.value / total) * 100)}%</b>
          </div>
        ))}
      </div>
    </div>
  );
}
function HBar({ rows }) {
  const max = Math.max.apply(null, [1].concat(rows.map((r) => r.value)));
  return (
    <div className="hbar">
      {rows.map((r, i) => (
        <div className="hbar__row" key={r.label}>
          <span className="hbar__label" title={r.label}>
            {r.label}
          </span>
          <span className="hbar__track">
            <span
              className={"hbar__fill " + (r.cls || "")}
              style={{ width: (r.value / max) * 100 + "%", "--i": i }}
            />
          </span>
          <span className="hbar__value">
            {r.display != null ? r.display : fmtN(r.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
function Heat({ cells }) {
  const first = parseKey(cells[0].date).getDay();
  return (
    <div className="heat">
      {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
        <span key={i} className="heat__head">
          {d}
        </span>
      ))}
      {Array.from({ length: first }).map((_, i) => (
        <span key={"p" + i} />
      ))}
      {cells.map((c) => (
        <span
          key={c.date}
          className={"heat__cell" + (c.level ? " heat__cell--" + c.level : "")}
          title={fmtShort(c.date) + ": " + c.value + " surplus meals"}
        />
      ))}
    </div>
  );
}

/* ---------- 7. LANDING PAGE ---------- */
const TICKER = [
  ["120 meals", "claimed by Asha Foundation", "2 min ago"],
  ["38 surplus meals", "predicted for tomorrow", "sample forecast"],
  ["Roti Bank", "collected 40 servings", "11 min ago"],
  ["Spice Route Canteen", "published 70 servings", "18 min ago"],
  ["1.2 t CO₂e", "avoided this week", "sample impact"],
  ["Seva Trust", "verified as a partner", "today"],
];
function Ticker() {
  const items = TICKER.concat(TICKER);
  return (
    <div className="ticker" aria-label="Sample activity feed">
      <div className="ticker__track">
        {items.map((t, i) => (
          <span
            className="ticker__item"
            key={i}
            aria-hidden={i >= TICKER.length}
          >
            <span className="live-dot" />
            <b>{t[0]}</b> {t[1]} <span>· {t[2]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
function PreviewDashboard() {
  return (
    <div className="preview" aria-hidden="true">
      <div className="preview__top">
        <span className="preview__dots">
          <i />
          <i />
          <i />
        </span>
        <span className="preview__url">app.mealmitra.in/overview</span>
        <span className="sample-tag">Sample</span>
      </div>
      <div className="preview__layout">
        <div className="preview__rail">
          <i className="is-active" />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="preview__main">
          <div className="preview__head">
            <span className="preview__title">
              Good morning, <em className="em-emerald">Meera</em>
            </span>
            <span className="badge badge--emerald">
              <span className="badge__dot" />
              Live
            </span>
          </div>
          <div className="preview__stats">
            <div className="preview__stat">
              <b>1,240</b>
              <span>Prepared</span>
            </div>
            <div className="preview__stat">
              <b>1,105</b>
              <span>Consumed</span>
            </div>
            <div className="preview__stat">
              <b style={{ color: "#0E8A5B" }}>135</b>
              <span>Surplus</span>
            </div>
          </div>
          <div className="preview__chart">
            <div className="row between" style={{ marginBottom: 6 }}>
              <span className="mono-label">Forecast · next 7 days</span>
              <span className="badge badge--lime">Mock</span>
            </div>
            <svg
              viewBox="0 0 400 130"
              style={{ width: "100%", height: "auto" }}
            >
              <path
                d="M200 60C240 56 280 40 392 30L392 92C300 88 250 100 200 92Z"
                fill="#C6F36B"
                opacity=".55"
              />
              <path
                d="M8 96C40 86 70 100 100 80S160 70 200 76"
                fill="none"
                stroke="#17503A"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M200 76C240 70 280 78 392 64"
                fill="none"
                stroke="#12A06B"
                strokeWidth="2.5"
                strokeDasharray="6 6"
                strokeLinecap="round"
              />
              <line
                x1="200"
                x2="200"
                y1="10"
                y2="115"
                stroke="#8A948D"
                strokeDasharray="2 4"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
function Landing() {
  const app = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useReveal();
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const scrollTo = (id) => {
    setOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const links = [
    ["how", "How it works"],
    ["features", "Platform"],
    ["who", "Kitchens & NGOs"],
    ["impact", "Impact"],
  ];
  const toast = useToast();
  return (
    <div className="landing">
      <a
        className="skip-link"
        href="#hero"
        onClick={(e) => {
          e.preventDefault();
          scrollTo("hero");
        }}
      >
        Skip to content
      </a>
      <nav
        className={"nav" + (scrolled ? " is-scrolled" : "")}
        aria-label="Main"
      >
        <div className="nav__inner">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="MealMitra home"
          >
            <Logo />
          </button>
          <div className="nav__links">
            {links.map((l) => (
              <button
                key={l[0]}
                className="nav__link"
                onClick={() => scrollTo(l[0])}
              >
                {l[1]}
              </button>
            ))}
          </div>
          <div className="nav__actions">
            <button
              className="btn btn--outline-light btn--sm hide-mobile"
              onClick={() => app.go(app.session ? "/app/overview" : "/login")}
            >
              {app.session ? "Open app" : "Sign in"}
            </button>
            <button
              className="btn btn--lime btn--sm"
              onClick={() => app.demoLogin("kitchen")}
            >
              Try the demo
            </button>
            <button
              className="nav__toggle"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              <Icon name={open ? "x" : "menu"} />
            </button>
          </div>
        </div>
        <div className={"nav__mobile" + (open ? " is-open" : "")}>
          {links.map((l) => (
            <button
              key={l[0]}
              className="nav__link"
              onClick={() => scrollTo(l[0])}
            >
              {l[1]}
            </button>
          ))}
          <button
            className="btn btn--outline-light btn--block"
            style={{ marginTop: 8 }}
            onClick={() => app.go(app.session ? "/app/overview" : "/login")}
          >
            {app.session ? "Open app" : "Sign in"}
          </button>
        </div>
      </nav>

      <header className="hero grain" id="hero">
        <div className="hero__bg" />
        <div className="hero__lines" />
        <div className="hero__inner">
          <div className="hero__copy">
            <span className="hero__eyebrow">
              <span className="live-dot" />
              Demand forecasting · surplus redistribution
            </span>
            <h1 className="hero__title">
              Predict surplus <em>before it exists.</em>
            </h1>
            <p className="hero__lead">
              MealMitra learns how your kitchen really eats, forecasts
              tomorrow’s surplus, and hands it to verified NGOs while it is
              still fresh. Fewer wasted meals, more fed people.
            </p>
            <div className="hero__cta">
              <button
                className="btn btn--lime btn--lg"
                onClick={() => app.demoLogin("kitchen")}
              >
                Try the live demo <Icon name="arrow" size="sm" />
              </button>
              <button
                className="btn btn--outline-light btn--lg"
                onClick={() => scrollTo("how")}
              >
                See how it works
              </button>
            </div>
            <div className="hero__proof">
              <div className="hero__proof-item">
                <span className="hero__proof-value">92%</span>
                <span className="hero__proof-label">
                  sample forecast accuracy
                </span>
              </div>
              <div className="hero__proof-item">
                <span className="hero__proof-value">38%</span>
                <span className="hero__proof-label">
                  sample waste reduction
                </span>
              </div>
              <div className="hero__proof-item">
                <span className="hero__proof-value">11 min</span>
                <span className="hero__proof-label">
                  sample median claim time
                </span>
              </div>
            </div>
            <div className="mt-4">
              <span className="sample-tag sample-tag--dark">
                Illustrative sample figures
              </span>
            </div>
          </div>
          <div className="hero__visual">
            <svg
              className="hero__curve"
              viewBox="0 0 600 200"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                className="curve-gap"
                d="M300 120C380 110 450 70 600 50L600 160C470 150 400 150 300 150Z"
              />
              <path
                className="curve-hist"
                d="M0 170C60 150 120 175 180 140S260 110 300 120"
              />
              <path className="curve-proj" d="M300 120C380 110 450 70 600 50" />
            </svg>
            <div className="float-card float-card--b">
              <span className="float-card__icon">
                <Icon name="sparkle" />
              </span>
              <div>
                <div className="float-card__title">
                  ~38 meals surplus tomorrow
                </div>
                <div className="float-card__sub">
                  Sample forecast · 91% confidence
                </div>
              </div>
            </div>
            <PreviewDashboard />
            <div className="float-card float-card--a">
              <span className="float-card__icon">
                <Icon name="truck" />
              </span>
              <div>
                <div className="float-card__title">
                  Roti Bank claimed 40 meals
                </div>
                <div className="float-card__sub">
                  Sample activity · 2 min ago
                </div>
              </div>
            </div>
          </div>
        </div>
        <Ticker />
      </header>

      <section className="section section--tint" id="how">
        <div className="container">
          <div className="section__head reveal">
            <span className="eyebrow eyebrow--emerald">How it works</span>
            <h2 className="section__title">
              From the pot to the plate, <em>in three moves.</em>
            </h2>
            <p className="section__lead">
              No new hardware, no spreadsheets. Log what you cook, trust the
              forecast, and let the network do the rest.
            </p>
          </div>
          <div className="steps">
            {[
              [
                "01",
                "Log what you cook and serve",
                "Add prepared and consumed quantities after every service. It takes seconds, and every entry sharpens the forecast.",
              ],
              [
                "02",
                "See surplus before it exists",
                "MealMitra compares the last four matching weekdays, adds event uplift, and tells you how much to prepare and how much will be left.",
              ],
              [
                "03",
                "Hand it to verified NGOs",
                "Publish a listing in a minute. Nearby NGOs claim it, track the pickup, and your impact updates automatically.",
              ],
            ].map((s, i) => (
              <div className="step reveal" style={{ "--i": i }} key={s[0]}>
                <span className="step__num">{s[0]}</span>
                <h3 className="step__title">{s[1]}</h3>
                <p className="step__text">{s[2]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="container">
          <div className="section__head reveal">
            <span className="eyebrow eyebrow--emerald">The platform</span>
            <h2 className="section__title">
              Everything a kitchen and an NGO need, <em>nothing they don’t.</em>
            </h2>
          </div>
          <div className="bento">
            <div className="bento__item bento__item--lg reveal">
              <span className="bento__icon">
                <Icon name="trend" />
              </span>
              <h3 className="bento__title">
                Forecasts that explain themselves
              </h3>
              <p className="bento__text">
                Every prediction shows the four weekdays behind it, the event
                uplift applied, and a confidence rating. No black boxes.
              </p>
              <div className="bento__visual">
                <svg
                  viewBox="0 0 400 70"
                  style={{ width: "100%", height: "auto" }}
                >
                  <path
                    d="M0 50C50 40 80 55 130 38S200 30 230 36"
                    fill="none"
                    stroke="#9fbfaf"
                    strokeWidth="2"
                  />
                  <path
                    d="M230 36C290 30 340 22 400 14"
                    fill="none"
                    stroke="#C6F36B"
                    strokeWidth="2.5"
                    strokeDasharray="6 6"
                  />
                </svg>
              </div>
            </div>
            <div className="bento__item reveal" style={{ "--i": 1 }}>
              <span className="bento__icon">
                <Icon name="box" />
              </span>
              <h3 className="bento__title">Surplus listings</h3>
              <p className="bento__text">
                Quantity, servings, storage and deadline, with a live countdown.
              </p>
            </div>
            <div className="bento__item reveal">
              <span className="bento__icon">
                <Icon name="utensils" />
              </span>
              <h3 className="bento__title">Fast meal logging</h3>
              <p className="bento__text">
                Add, edit and search every service in seconds.
              </p>
            </div>
            <div className="bento__item reveal" style={{ "--i": 1 }}>
              <span className="bento__icon">
                <Icon name="truck" />
              </span>
              <h3 className="bento__title">Claims & pickups</h3>
              <p className="bento__text">
                Claim, confirm, track and collect, with a pickup code for every
                handover.
              </p>
            </div>
            <div className="bento__item reveal" style={{ "--i": 2 }}>
              <span className="bento__icon">
                <Icon name="leaf" />
              </span>
              <h3 className="bento__title">Impact analytics</h3>
              <p className="bento__text">
                Meals, money and CO₂e, updated the moment food is collected.
              </p>
            </div>
            <div className="bento__item bento__item--md reveal">
              <span className="bento__icon">
                <Icon name="shield" />
              </span>
              <h3 className="bento__title">Verified NGO network</h3>
              <p className="bento__text">
                Only verified organisations can claim, so food reaches people
                safely.
              </p>
            </div>
            <div
              className="bento__item bento__item--md reveal"
              style={{ "--i": 1 }}
            >
              <span className="bento__icon">
                <Icon name="bell" />
              </span>
              <h3 className="bento__title">Timely alerts</h3>
              <p className="bento__text">
                Claim, pickup and expiry notifications keep every handover on
                time.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tint" id="who">
        <div className="container">
          <div className="section__head reveal">
            <span className="eyebrow eyebrow--emerald">Who it’s for</span>
            <h2 className="section__title">
              Built for both sides <em>of the table.</em>
            </h2>
          </div>
          <div className="split">
            <div className="split__panel split__panel--kitchen reveal">
              <span className="eyebrow eyebrow--lime">For kitchens</span>
              <h3 className="split__title">Cook what you’ll actually serve.</h3>
              <ul className="split__list">
                {[
                  "Forecast demand from your own history",
                  "Cut over-preparation and food cost",
                  "Publish surplus in under a minute",
                  "Track meals, money and carbon saved",
                ].map((t) => (
                  <li key={t}>
                    <Icon name="check" size="sm" />
                    {t}
                  </li>
                ))}
              </ul>
              <button
                className="btn btn--lime"
                onClick={() => app.demoLogin("kitchen")}
              >
                Explore the kitchen demo <Icon name="arrow" size="sm" />
              </button>
              <span className="split__big" aria-hidden="true">
                K
              </span>
            </div>
            <div
              className="split__panel split__panel--ngo reveal"
              style={{ "--i": 1 }}
            >
              <span className="eyebrow">For NGOs</span>
              <h3 className="split__title">
                Reliable, fresh food, close to you.
              </h3>
              <ul className="split__list">
                {[
                  "See available food sorted by distance",
                  "Know quantity, servings and storage up front",
                  "Claim in two taps and track the pickup",
                  "Report verified impact to your donors",
                ].map((t) => (
                  <li key={t}>
                    <Icon name="check" size="sm" />
                    {t}
                  </li>
                ))}
              </ul>
              <button
                className="btn btn--dark"
                onClick={() => app.demoLogin("ngo")}
              >
                Explore the NGO demo <Icon name="arrow" size="sm" />
              </button>
              <span className="split__big" aria-hidden="true">
                N
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--dark" id="impact">
        <div className="container">
          <div className="section__head reveal">
            <span className="eyebrow eyebrow--lime">Impact</span>
            <h2 className="section__title">
              Every rescued meal <em>adds up.</em>
            </h2>
            <p className="section__lead">
              What a network of kitchens and NGOs can achieve together. These
              figures are illustrative sample data.
            </p>
          </div>
          <div className="stat-band">
            <div className="stat-band__item">
              <div className="stat-band__value">
                <CountUp value={128400} />
              </div>
              <div className="stat-band__label">meals rescued</div>
            </div>
            <div className="stat-band__item">
              <div className="stat-band__value">
                <CountUp value={214} />
              </div>
              <div className="stat-band__label">kitchens on the network</div>
            </div>
            <div className="stat-band__item">
              <div className="stat-band__value">
                <CountUp value={112} />
                <small>t</small>
              </div>
              <div className="stat-band__label">CO₂e avoided</div>
            </div>
            <div className="stat-band__item">
              <div className="stat-band__value">
                <CountUp value={11} />
                <small>min</small>
              </div>
              <div className="stat-band__label">median time to claim</div>
            </div>
          </div>
          <div className="stat-band__note">
            <span className="sample-tag sample-tag--dark">
              Sample data · not real results
            </span>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container">
          <div className="cta__inner reveal">
            <h2 className="cta__title">
              Waste less. <em>Feed more.</em>
            </h2>
            <p className="cta__text">
              Open the demo in one click. It runs entirely in your browser with
              sample data.
            </p>
            <div className="cta__actions">
              <button
                className="btn btn--lime btn--lg"
                onClick={() => app.demoLogin("kitchen")}
              >
                Enter as a kitchen
              </button>
              <button
                className="btn btn--outline-light btn--lg"
                onClick={() => app.demoLogin("ngo")}
              >
                Enter as an NGO
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer__grid">
            <div>
              <Logo />
              <p className="footer__about">
                Food demand forecasting and surplus redistribution for kitchens
                and verified NGOs. Predict surplus before it exists.
              </p>
            </div>
            <div>
              <div className="footer__title">Product</div>
              <div className="footer__col">
                <button
                  className="footer__link"
                  onClick={() => scrollTo("how")}
                >
                  How it works
                </button>
                <button
                  className="footer__link"
                  onClick={() => scrollTo("features")}
                >
                  Platform
                </button>
                <button
                  className="footer__link"
                  onClick={() => scrollTo("impact")}
                >
                  Impact
                </button>
              </div>
            </div>
            <div>
              <div className="footer__title">Get started</div>
              <div className="footer__col">
                <button
                  className="footer__link"
                  onClick={() => app.demoLogin("kitchen")}
                >
                  Kitchen demo
                </button>
                <button
                  className="footer__link"
                  onClick={() => app.demoLogin("ngo")}
                >
                  NGO demo
                </button>
                <button
                  className="footer__link"
                  onClick={() => app.go("/login")}
                >
                  Sign in
                </button>
              </div>
            </div>
            <div>
              <div className="footer__title">Company</div>
              <div className="footer__col">
                <a className="footer__link" href="mailto:hello@mealmitra.app">
                  Contact
                </a>
                <button
                  className="footer__link"
                  onClick={() =>
                    toast("Privacy", {
                      type: "info",
                      msg: "This demo stores everything in your browser only. Nothing is sent anywhere.",
                    })
                  }
                >
                  Privacy
                </button>
              </div>
            </div>
          </div>
          <div className="footer__bottom">
            <span>© 2026 MealMitra. Demo build with sample data.</span>
            <span className="mono-label">
              Predict surplus before it exists.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ---------- 8. LOGIN (mock auth) ---------- */
function LoginPage() {
  const app = useApp();
  const [mode, setMode] = useState("signin");
  const [role, setRole] = useState("kitchen");
  const [f, setF] = useState({ name: "", org: "", email: "", password: "" });
  const [show, setShow] = useState(false);
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (mode === "signup" && f.name.trim().length < 2)
      er.name = "Enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim()))
      er.email = "Enter a valid email address.";
    if (f.password.length < 6)
      er.password = "Password must be at least 6 characters.";
    setErr(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    setTimeout(
      () =>
        app.signIn({
          name: f.name.trim() || nameFromEmail(f.email.trim()),
          email: f.email.trim(),
          role,
          org: f.org.trim(),
        }),
      700,
    );
  };
  return (
    <div className="auth">
      <aside className="auth__aside">
        <Logo />
        <svg className="auth__curve" viewBox="0 0 600 200" aria-hidden="true">
          <path
            d="M0 150C80 140 140 160 220 120S320 90 360 100"
            fill="none"
            stroke="#3cc48a"
            strokeWidth="2"
            opacity=".7"
          />
          <path
            d="M360 100C430 92 500 60 600 40"
            fill="none"
            stroke="#C6F36B"
            strokeWidth="2.5"
            strokeDasharray="6 8"
          />
        </svg>
        <div className="auth__quote">
          <p className="auth__quote-text">
            The best meal saved is the one we <em>never over-cooked.</em>
          </p>
          <p className="auth__quote-by">Sample testimonial · illustrative</p>
        </div>
        <div className="auth__metrics">
          <div className="auth__metric">
            <b>92%</b>
            <span>sample accuracy</span>
          </div>
          <div className="auth__metric">
            <b>38%</b>
            <span>sample less waste</span>
          </div>
        </div>
      </aside>
      <main className="auth__main">
        <button
          className="btn btn--ghost btn--sm auth__back"
          onClick={() => app.go("/")}
        >
          <Icon name="arrow" size="sm" className="" /> Back to site
        </button>
        <div className="auth__card">
          <h1 className="auth__title">
            {mode === "signin" ? (
              <>
                Welcome <em className="em-emerald">back.</em>
              </>
            ) : (
              <>
                Join <em className="em-emerald">MealMitra.</em>
              </>
            )}
          </h1>
          <p className="auth__sub">
            {mode === "signin"
              ? "Sign in to your workspace. This is a demo, so any valid email and a 6+ character password works."
              : "Create a demo account. Nothing leaves your browser."}
          </p>
          <div
            className="segmented segmented--block"
            role="tablist"
            aria-label="Account type"
          >
            <button
              type="button"
              className={
                "segmented__btn" + (role === "kitchen" ? " is-active" : "")
              }
              onClick={() => setRole("kitchen")}
            >
              <Icon name="utensils" size="sm" />
              Kitchen
            </button>
            <button
              type="button"
              className={
                "segmented__btn" + (role === "ngo" ? " is-active" : "")
              }
              onClick={() => setRole("ngo")}
            >
              <Icon name="users" size="sm" />
              NGO
            </button>
          </div>
          <form className="auth__form" onSubmit={submit} noValidate>
            {mode === "signup" && (
              <>
                <Field label="Your name" id="a-name" error={err.name}>
                  <input
                    id="a-name"
                    className="input"
                    value={f.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Meera Iyer"
                    autoComplete="name"
                  />
                </Field>
                <Field
                  label={
                    role === "kitchen" ? "Kitchen name" : "Organisation name"
                  }
                  id="a-org"
                  hint="Optional"
                >
                  <input
                    id="a-org"
                    className="input"
                    value={f.org}
                    onChange={(e) => set("org", e.target.value)}
                    placeholder={
                      role === "kitchen"
                        ? "Annapurna Community Kitchen"
                        : "Asha Foundation"
                    }
                  />
                </Field>
              </>
            )}
            <Field label="Email" id="a-email" error={err.email}>
              <div className="input-group">
                <Icon name="mail" size="sm" className="input-group__icon" />
                <input
                  id="a-email"
                  type="email"
                  className="input"
                  value={f.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="you@kitchen.org"
                  autoComplete="email"
                />
              </div>
            </Field>
            <Field label="Password" id="a-pass" error={err.password}>
              <div className="input-group">
                <Icon name="lock" size="sm" className="input-group__icon" />
                <input
                  id="a-pass"
                  type={show ? "text" : "password"}
                  className="input"
                  value={f.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                />
                <button
                  type="button"
                  className="input-group__btn"
                  onClick={() => setShow(!show)}
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  <Icon name={show ? "eyeOff" : "eye"} size="sm" />
                </button>
              </div>
            </Field>
            <button
              className={
                "btn btn--primary btn--lg btn--block" +
                (busy ? " is-loading" : "")
              }
              type="submit"
              disabled={busy}
            >
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
          <div className="auth__divider mt-4">or skip sign-in</div>
          <div className="auth__demo">
            <span className="mono-label">Demo access · sample data</span>
            <div className="row row--wrap">
              <button
                className="btn btn--dark grow"
                onClick={() => app.demoLogin("kitchen")}
              >
                Enter as Kitchen
              </button>
              <button
                className="btn btn--secondary grow"
                onClick={() => app.demoLogin("ngo")}
              >
                Enter as NGO
              </button>
            </div>
          </div>
          <p className="auth__switch">
            {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
            <button
              className="link"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setErr({});
              }}
            >
              {mode === "signin" ? "Create a demo account" : "Sign in"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}

/* ---------- 9. APP SHELL ---------- */
const NAV = {
  kitchen: [
    { id: "overview", label: "Overview", icon: "home" },
    { id: "log", label: "Log meals", icon: "utensils" },
    { id: "forecast", label: "Forecast", icon: "trend" },
    { id: "surplus", label: "Surplus", icon: "box" },
    { id: "claims", label: "Claims & pickups", icon: "truck" },
    { id: "impact", label: "Impact", icon: "leaf" },
    { id: "notifications", label: "Notifications", icon: "bell" },
    { id: "settings", label: "Settings", icon: "sliders" },
  ],
  ngo: [
    { id: "overview", label: "Overview", icon: "home" },
    { id: "available", label: "Available food", icon: "box" },
    { id: "pickups", label: "Pickups", icon: "truck" },
    { id: "impact", label: "Impact", icon: "leaf" },
    { id: "notifications", label: "Notifications", icon: "bell" },
    { id: "settings", label: "Settings", icon: "sliders" },
  ],
};
function NotifPopover() {
  const app = useApp(),
    now = useNow();
  const list = app.myNotifs.slice(0, 5);
  return (
    <Dropdown
      renderTrigger={(t) => (
        <button
          className="icon-btn icon-btn--bordered"
          onClick={t.toggle}
          aria-label={
            "Notifications" + (app.unread ? ", " + app.unread + " unread" : "")
          }
          aria-expanded={t.open}
        >
          <Icon name="bell" />
          {app.unread > 0 && (
            <span className="icon-btn__dot">{app.unread}</span>
          )}
        </button>
      )}
      menuClassName="popover-notifs"
    >
      {(close) => (
        <>
          <div className="popover-notifs__head">
            <span>Notifications</span>
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => {
                app.markAllRead();
              }}
            >
              Mark all read
            </button>
          </div>
          <div className="popover-notifs__list">
            {list.length === 0 && (
              <div className="empty" style={{ padding: 24 }}>
                <p className="empty__text">You’re all caught up.</p>
              </div>
            )}
            {list.map((n) => {
              const m = NOTIF_META[n.type] || NOTIF_META.system;
              return (
                <button
                  key={n.id}
                  className={"notif" + (n.read ? "" : " notif--unread")}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    gridTemplateColumns: "auto minmax(0,1fr)",
                  }}
                  onClick={() => {
                    app.markRead(n.id);
                    close();
                    app.go("/app/" + app.pageFor(n.ref));
                  }}
                >
                  <span className={"notif__icon " + m.cls}>
                    <Icon name={m.icon} size="sm" />
                  </span>
                  <span>
                    <span className="notif__title" style={{ display: "block" }}>
                      {n.title}
                    </span>
                    <span className="notif__time">{ago(n.at, now)}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="popover-notifs__foot">
            <button
              className="btn btn--secondary btn--sm w-full"
              onClick={() => {
                close();
                app.go("/app/notifications");
              }}
            >
              View all notifications
            </button>
          </div>
        </>
      )}
    </Dropdown>
  );
}
function CommandPalette({ onClose }) {
  const app = useApp();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const items = useMemo(() => {
    const nav = NAV[app.role].map((n) => ({
      group: "Go to",
      label: n.label,
      icon: n.icon,
      run: () => app.go("/app/" + n.id),
    }));
    const acts = [];
    if (app.role === "kitchen") {
      acts.push({
        group: "Actions",
        label: "Log a meal",
        icon: "plus",
        run: () => app.goIntent("log", { type: "new-log" }),
      });
      acts.push({
        group: "Actions",
        label: "Create a surplus listing",
        icon: "box",
        run: () => app.goIntent("surplus", { type: "new-listing", data: {} }),
      });
      acts.push({
        group: "Actions",
        label: "Add a forecast event",
        icon: "calendar",
        run: () => app.goIntent("forecast", { type: "add-event" }),
      });
    } else
      acts.push({
        group: "Actions",
        label: "Browse available food",
        icon: "search",
        run: () => app.go("/app/available"),
      });
    acts.push({
      group: "Actions",
      label: "Mark all notifications as read",
      icon: "check",
      run: () => {
        app.markAllRead();
        app.toast("All notifications marked as read");
      },
    });
    acts.push({
      group: "Actions",
      label:
        "Switch to " + (app.role === "kitchen" ? "NGO" : "Kitchen") + " view",
      icon: "refresh",
      run: () => app.switchRole(app.role === "kitchen" ? "ngo" : "kitchen"),
    });
    acts.push({
      group: "Actions",
      label: "Sign out",
      icon: "logout",
      run: () => app.signOut(),
    });
    return nav
      .concat(acts)
      .filter((i) => i.label.toLowerCase().includes(q.toLowerCase()));
  }, [q, app.role]);
  const run = (it) => {
    onClose();
    it.run();
  };
  const onKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && items[idx]) {
      e.preventDefault();
      run(items[idx]);
    } else if (e.key === "Escape") onClose();
  };
  let lastGroup = "";
  return (
    <div
      className="cmdk-scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="cmdk"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="cmdk__input-wrap">
          <Icon name="search" />
          <input
            className="cmdk__input"
            autoFocus
            placeholder="Jump to a page or run an action…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setIdx(0);
            }}
            onKeyDown={onKey}
            aria-label="Search commands"
          />
        </div>
        <div className="cmdk__list">
          {items.length === 0 && (
            <div className="cmdk__empty">No matches for “{q}”.</div>
          )}
          {items.map((it, i) => {
            const head =
              it.group !== lastGroup ? (
                <div className="cmdk__group" key={"g" + it.group}>
                  {it.group}
                </div>
              ) : null;
            lastGroup = it.group;
            return (
              <React.Fragment key={it.label}>
                {head}
                <button
                  className={"cmdk__item" + (i === idx ? " is-active" : "")}
                  onMouseEnter={() => setIdx(i)}
                  onClick={() => run(it)}
                >
                  <Icon name={it.icon} size="sm" />
                  {it.label}
                </button>
              </React.Fragment>
            );
          })}
        </div>
        <div className="cmdk__foot">
          <span>
            <span className="kbd">↑</span> <span className="kbd">↓</span>{" "}
            navigate
          </span>
          <span>
            <span className="kbd">↵</span> select
          </span>
          <span>
            <span className="kbd">esc</span> close
          </span>
        </div>
      </div>
    </div>
  );
}
function AppShell({ page }) {
  const app = useApp();
  const [pinned, setPinned] = useStored("pinned", false);
  const [cmd, setCmd] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const items = NAV[app.role];
  const Page = PAGES[app.role][page] || PAGES[app.role].overview;
  const current = items.find((i) => i.id === page) || items[0];
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmd(true);
      }
    };
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  useEffect(() => {
    setSheet(false);
    document.title = "MealMitra · " + current.label;
    return () => {
      document.title = "MealMitra";
    };
  }, [page]);
  const badge = (id) =>
    id === "notifications"
      ? app.unread
      : id === "claims" || id === "pickups"
        ? app.activeClaims
        : 0;
  const initials = app.session.name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const tabItems = items.slice(0, 4);
  return (
    <div className={"app" + (pinned ? " is-pinned" : "")}>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          const el = document.getElementById("main-content");
          if (el) el.focus();
        }}
      >
        Skip to content
      </a>
      <aside className="rail" aria-label="Sidebar">
        <div className="rail__brand">
          <Logo />
        </div>
        <nav className="rail__nav">
          <div className="rail__group-label">Workspace</div>
          {items.map((n, i) => (
            <React.Fragment key={n.id}>
              {n.id === "notifications" && (
                <div className="rail__group-label">Account</div>
              )}
              <button
                className={"rail__item" + (page === n.id ? " is-active" : "")}
                onClick={() => app.go("/app/" + n.id)}
                aria-current={page === n.id ? "page" : undefined}
              >
                <Icon name={n.icon} className="rail__icon" />
                <span className="rail__label">{n.label}</span>
                {badge(n.id) > 0 && (
                  <>
                    <span className="rail__badge">{badge(n.id)}</span>
                    <span className="rail__pip" />
                  </>
                )}
              </button>
            </React.Fragment>
          ))}
        </nav>
        <div className="rail__foot">
          <div
            className="segmented segmented--dark rail__role"
            role="group"
            aria-label="Switch role"
          >
            <button
              className={
                "segmented__btn" + (app.role === "kitchen" ? " is-active" : "")
              }
              onClick={() => app.switchRole("kitchen")}
            >
              Kitchen
            </button>
            <button
              className={
                "segmented__btn" + (app.role === "ngo" ? " is-active" : "")
              }
              onClick={() => app.switchRole("ngo")}
            >
              NGO
            </button>
          </div>
          <button
            className="rail__item rail__pin"
            onClick={() => setPinned(!pinned)}
          >
            <Icon name="panel" className="rail__icon" />
            <span className="rail__label">
              {pinned ? "Unpin sidebar" : "Pin sidebar"}
            </span>
          </button>
          <button
            className="rail__user"
            onClick={() => app.go("/app/settings")}
            aria-label="Open settings"
          >
            <span className="avatar">{initials}</span>
            <span className="rail__user-meta">
              <span className="rail__user-name" style={{ display: "block" }}>
                {app.session.name}
              </span>
              <span className="rail__user-role">
                {app.role === "kitchen" ? "Kitchen" : "NGO"} · {app.orgName}
              </span>
            </span>
          </button>
        </div>
      </aside>

      <div className="main">
        <header className={"topbar" + (scrolled ? " is-scrolled" : "")}>
          <div className="topbar__crumb">
            <span className="hide-mobile">
              {app.role === "kitchen" ? "Kitchen" : "NGO"} workspace /
            </span>
            <b>{current.label}</b>
          </div>
          <button
            className="topbar__search"
            onClick={() => setCmd(true)}
            aria-label="Open command palette"
          >
            <Icon name="search" size="sm" />
            <span>Search or jump to…</span>
            <span className="kbd">Ctrl K</span>
          </button>
          <div className="topbar__actions">
            <NotifPopover />
            <Dropdown
              renderTrigger={(t) => (
                <button
                  className="avatar"
                  onClick={t.toggle}
                  aria-label="Profile menu"
                  aria-expanded={t.open}
                  style={{ width: 40, height: 40 }}
                >
                  {initials}
                </button>
              )}
            >
              {(close) => (
                <>
                  <div className="dropdown__head">
                    <span className="avatar avatar--dark">{initials}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }} className="truncate">
                        {app.session.name}
                      </div>
                      <div className="text-xs muted truncate">
                        {app.session.email}
                      </div>
                    </div>
                  </div>
                  <div className="dropdown__sep" />
                  <div className="dropdown__label">Role</div>
                  <button
                    className={
                      "dropdown__item" +
                      (app.role === "kitchen" ? " is-active" : "")
                    }
                    onClick={() => {
                      close();
                      app.switchRole("kitchen");
                    }}
                  >
                    <Icon name="utensils" size="sm" />
                    Kitchen view
                  </button>
                  <button
                    className={
                      "dropdown__item" +
                      (app.role === "ngo" ? " is-active" : "")
                    }
                    onClick={() => {
                      close();
                      app.switchRole("ngo");
                    }}
                  >
                    <Icon name="users" size="sm" />
                    NGO view
                  </button>
                  <div className="dropdown__sep" />
                  <button
                    className="dropdown__item"
                    onClick={() => {
                      close();
                      app.go("/app/settings");
                    }}
                  >
                    <Icon name="sliders" size="sm" />
                    Settings
                  </button>
                  <button
                    className="dropdown__item"
                    onClick={() => {
                      close();
                      app.go("/");
                    }}
                  >
                    <Icon name="home" size="sm" />
                    Back to website
                  </button>
                  <button
                    className="dropdown__item dropdown__item--danger"
                    onClick={() => {
                      close();
                      app.signOut();
                    }}
                  >
                    <Icon name="logout" size="sm" />
                    Sign out
                  </button>
                </>
              )}
            </Dropdown>
          </div>
        </header>
        <main
          className="page"
          id="main-content"
          tabIndex="-1"
          key={app.role + page}
        >
          <Page />
        </main>
      </div>

      <nav className="tabbar" aria-label="Primary">
        {tabItems.map((n) => (
          <button
            key={n.id}
            className={"tabbar__item" + (page === n.id ? " is-active" : "")}
            onClick={() => app.go("/app/" + n.id)}
          >
            <Icon name={n.icon} />
            <span>{n.label.split(" ")[0]}</span>
          </button>
        ))}
        <button
          className={
            "tabbar__item" +
            (!tabItems.some((n) => n.id === page) ? " is-active" : "")
          }
          onClick={() => setSheet(true)}
        >
          <Icon name="more" />
          <span>More</span>
          {app.unread > 0 && <span className="tabbar__pip" />}
        </button>
      </nav>
      {sheet && (
        <>
          <div className="sheet-scrim" onClick={() => setSheet(false)} />
          <div className="sheet" role="dialog" aria-label="More">
            <div className="sheet__grip" />
            <div className="sheet__grid">
              {items.map((n) => (
                <button
                  key={n.id}
                  className={
                    "sheet__item" + (page === n.id ? " is-active" : "")
                  }
                  onClick={() => {
                    setSheet(false);
                    app.go("/app/" + n.id);
                  }}
                >
                  <Icon name={n.icon} />
                  {n.label.split(" ")[0]}
                </button>
              ))}
              <button
                className="sheet__item"
                onClick={() => {
                  setSheet(false);
                  app.switchRole(app.role === "kitchen" ? "ngo" : "kitchen");
                }}
              >
                <Icon name="refresh" />
                {app.role === "kitchen" ? "NGO view" : "Kitchen view"}
              </button>
              <button
                className="sheet__item"
                onClick={() => {
                  setSheet(false);
                  setCmd(true);
                }}
              >
                <Icon name="search" />
                Search
              </button>
              <button
                className="sheet__item"
                onClick={() => {
                  setSheet(false);
                  app.signOut();
                }}
              >
                <Icon name="logout" />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
      {cmd && <CommandPalette onClose={() => setCmd(false)} />}
    </div>
  );
}

/* ---------- 10. SHARED PAGE PIECES ---------- */
const NOTIF_META = {
  claim: { icon: "truck", cls: "notif__icon--teal", label: "Claims" },
  surplus: { icon: "box", cls: "", label: "Surplus" },
  pickup: { icon: "clock", cls: "notif__icon--lime", label: "Pickups" },
  expiry: { icon: "alert", cls: "notif__icon--amber", label: "Expiry" },
  system: { icon: "info", cls: "", label: "System" },
};
function TodayItem({ label, value, unit, delta, dir, spark, sparkCls }) {
  return (
    <div className="today__item">
      <span className="today__label">{label}</span>
      <span className="today__value">
        <CountUp value={value} />
        {unit && <small>{unit}</small>}
      </span>
      {delta != null && (
        <span
          className={
            "today__delta " +
            (dir === "up" ? "is-up" : dir === "down" ? "is-down" : "")
          }
        >
          <Icon name={dir === "down" ? "arrowDown" : "arrowUp"} size="sm" />
          {delta}
        </span>
      )}
      <div className="today__spark">
        <Sparkline values={spark} cls={sparkCls} />
      </div>
    </div>
  );
}
const pctDelta = (a, b) => (b ? Math.round(((a - b) / b) * 100) : 0);
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/* ----- Kitchen overview ----- */
function KitchenOverview() {
  const app = useApp(),
    now = useNow(),
    today = todayKey();
  const t = app.totals[today] || { prepared: 0, consumed: 0 },
    lw = app.totals[addDays(today, -7)] || { prepared: 0, consumed: 0 };
  const fc = app.getForecast(addDays(today, 1));
  const last7 = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const done7 = Array.from({ length: 7 }, (_, i) => addDays(today, i - 7));
  const get = (d, k) => (app.totals[d] ? app.totals[d][k] : 0);
  const collected = app.collectedFor("kitchen");
  const rescuedWeek = sum(
    collected.filter((x) => x.at >= now - 7 * DAY),
    (x) => x.l.servings,
  );
  const rescuedSpark = last7.map((d) =>
    sum(
      collected.filter((x) => dkey(new Date(x.at)) === d),
      (x) => x.l.servings,
    ),
  );
  const rows = useMemo(
    () =>
      buildRows(
        app.totals,
        app.events,
        app.settings.applyEvents,
        app.settings.bufferPct,
      ),
    [app.totals, app.events, app.settings.applyEvents, app.settings.bufferPct],
  );
  const active = app.listings
    .filter(
      (l) =>
        l.kitchenId === "k1" &&
        ["available", "claimed"].includes(effStatus(l, now)),
    )
    .sort((a, b) => a.deadline - b.deadline);
  const pending = app.claims.filter(
    (c) =>
      ["claimed", "on_the_way"].includes(c.status) &&
      app.listingById(c.listingId) &&
      app.listingById(c.listingId).kitchenId === "k1",
  );
  const weekRows = done7.map((d) => ({
    label: fmtWeekday(d),
    prepared: get(d, "prepared"),
    consumed: get(d, "consumed"),
  }));
  const wPrep = sum(weekRows, (r) => r.prepared),
    wCons = sum(weekRows, (r) => r.consumed);
  const first = app.session.name.split(" ")[0];
  return (
    <>
      <PageHead
        title={
          <>
            {greeting()}, <em>{first}</em>
          </>
        }
        sub={app.orgName + " · " + fmtLong(today)}
      >
        <button
          className="btn btn--secondary"
          onClick={() => app.goIntent("log", { type: "new-log" })}
        >
          <Icon name="plus" size="sm" />
          Log meal
        </button>
        <button
          className="btn btn--primary"
          onClick={() =>
            app.goIntent("surplus", { type: "new-listing", data: {} })
          }
        >
          <Icon name="box" size="sm" />
          New listing
        </button>
      </PageHead>
      <SampleBanner>
        Figures are generated sample data relative to today’s date.{" "}
        <button className="link" onClick={() => app.requestReset()}>
          Reset sample data
        </button>
      </SampleBanner>
      <div className="today stagger">
        <TodayItem
          label="Meals prepared · today"
          value={t.prepared}
          delta={
            Math.abs(pctDelta(t.prepared, lw.prepared)) +
            "% vs last " +
            fmtWeekday(today)
          }
          dir={t.prepared >= lw.prepared ? "up" : "down"}
          spark={last7.map((d) => get(d, "prepared"))}
        />
        <TodayItem
          label="Meals consumed · today"
          value={t.consumed}
          delta={
            Math.abs(pctDelta(t.consumed, lw.consumed)) +
            "% vs last " +
            fmtWeekday(today)
          }
          dir={t.consumed >= lw.consumed ? "up" : "down"}
          spark={last7.map((d) => get(d, "consumed"))}
          sparkCls="spark-line--lime"
        />
        <TodayItem
          label="Predicted surplus · tomorrow"
          value={fc.surplus}
          unit="meals"
          delta={fc.level + " confidence"}
          dir="up"
          spark={last7.map((d) =>
            Math.max(0, get(d, "prepared") - get(d, "consumed")),
          )}
          sparkCls="spark-line--amber"
        />
        <TodayItem
          label="Meals rescued · 7 days"
          value={rescuedWeek}
          unit="meals"
          delta={collected.length + " pickups complete"}
          dir="up"
          spark={
            rescuedSpark.some((v) => v) ? rescuedSpark : [0, 0, 0, 0, 0, 0, 1]
          }
        />
      </div>
      <div className="grid mt-5">
        <div className="card span-8">
          <div className="panel__head">
            <div>
              <h2 className="card__title">Demand forecast</h2>
              <p className="card__sub">
                Last 14 days and next 7 · illustrative mock forecast
              </p>
            </div>
            <ForecastLegend />
          </div>
          <div className="panel__body">
            <ForecastChart rows={rows} height={280} />
          </div>
        </div>
        <div className="card card--feature span-4">
          <div className="reco">
            <span className="reco__label">
              <span className="live-dot" />
              Recommended prep · tomorrow
            </span>
            <div className="reco__value">
              {fmtN(fc.recommended)}
              <small>meals</small>
            </div>
            <p className="reco__text">
              You usually prepare about {fmtN(fc.planned)}. Forecast demand is{" "}
              {fmtN(fc.forecast)}, so you could cook roughly{" "}
              {fmtN(fc.reducible)} fewer meals and still keep a{" "}
              {app.settings.bufferPct}% buffer.
            </p>
            <div className="row between text-xs">
              <span>Forecast confidence</span>
              <b>{fc.confidence}%</b>
            </div>
            <div className="reco__meter">
              <i style={{ width: fc.confidence + "%" }} />
            </div>
            <div className="reco__actions">
              <button
                className="btn btn--lime btn--sm"
                onClick={() => app.go("/app/forecast")}
              >
                Open forecast
              </button>
              <button
                className="btn btn--outline-light btn--sm"
                onClick={() =>
                  app.goIntent("surplus", {
                    type: "new-listing",
                    data: { servings: String(fc.surplus), name: "" },
                  })
                }
              >
                List predicted surplus
              </button>
            </div>
          </div>
        </div>
        <div className="card span-4">
          <div className="card__head">
            <div>
              <h2 className="card__title">Active listings</h2>
              <p className="card__sub">{active.length} live now</p>
            </div>
          </div>
          <div className="list mt-2">
            {active.slice(0, 4).map((l) => (
              <div className="list__item" key={l.id}>
                <span className="list__icon">
                  <Icon name="box" size="sm" />
                </span>
                <div className="list__main">
                  <div className="list__title truncate">{l.name}</div>
                  <div className="list__meta">
                    {l.servings} servings · <Countdown deadline={l.deadline} />
                  </div>
                </div>
                <div className="list__end">
                  <StatusBadge status={effStatus(l, now)} />
                </div>
              </div>
            ))}
            {active.length === 0 && (
              <div className="list__item">
                <div className="list__main muted">
                  No active listings. Publish surplus to get started.
                </div>
              </div>
            )}
          </div>
          <div className="card__foot">
            <button
              className="btn btn--secondary btn--sm"
              onClick={() => app.go("/app/surplus")}
            >
              Manage listings
            </button>
          </div>
        </div>
        <div className="card span-4">
          <div className="card__head">
            <div>
              <h2 className="card__title">Pending pickups</h2>
              <p className="card__sub">{pending.length} in progress</p>
            </div>
          </div>
          <div className="list mt-2">
            {pending.slice(0, 4).map((c) => {
              const l = app.listingById(c.listingId);
              return (
                <div className="list__item" key={c.id}>
                  <span className="list__icon list__icon--teal">
                    <Icon name="truck" size="sm" />
                  </span>
                  <div className="list__main">
                    <div className="list__title truncate">{l.name}</div>
                    <div className="list__meta">
                      {app.ngoName(c.ngoId)} · {c.code}
                    </div>
                  </div>
                  <div className="list__end">
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              );
            })}
            {pending.length === 0 && (
              <div className="list__item">
                <div className="list__main muted">No pickups waiting.</div>
              </div>
            )}
          </div>
          <div className="card__foot">
            <button
              className="btn btn--secondary btn--sm"
              onClick={() => app.go("/app/claims")}
            >
              View claims
            </button>
          </div>
        </div>
        <div className="card span-4">
          <div className="card__head">
            <div>
              <h2 className="card__title">Quick actions</h2>
              <p className="card__sub">Common tasks</p>
            </div>
          </div>
          <div className="card__body stack--sm stack">
            <button
              className="btn btn--secondary btn--block"
              onClick={() => app.goIntent("log", { type: "new-log" })}
            >
              <Icon name="utensils" size="sm" />
              Log a meal
            </button>
            <button
              className="btn btn--secondary btn--block"
              onClick={() =>
                app.goIntent("surplus", { type: "new-listing", data: {} })
              }
            >
              <Icon name="box" size="sm" />
              Create a listing
            </button>
            <button
              className="btn btn--secondary btn--block"
              onClick={() => app.goIntent("forecast", { type: "add-event" })}
            >
              <Icon name="calendar" size="sm" />
              Add a forecast event
            </button>
            <button
              className="btn btn--secondary btn--block"
              onClick={() => {
                app.markAllRead();
                app.toast("All notifications marked as read");
              }}
            >
              <Icon name="check" size="sm" />
              Mark notifications read
            </button>
          </div>
        </div>
        <div className="card span-7">
          <div className="panel__head">
            <div>
              <h2 className="card__title">Weekly statistics</h2>
              <p className="card__sub">
                {fmtN(wPrep)} prepared · {fmtN(wCons)} consumed ·{" "}
                {wPrep ? Math.round(((wPrep - wCons) / wPrep) * 100) : 0}% left
                over
              </p>
            </div>
            <div className="panel__legend">
              <span className="legend__item">
                <span className="legend__swatch" />
                Prepared
              </span>
              <span className="legend__item">
                <span className="legend__swatch legend__swatch--forest" />
                Consumed
              </span>
            </div>
          </div>
          <div className="panel__body">
            <BarChart
              rows={weekRows}
              keys={[
                { k: "prepared", name: "Prepared", cls: "", color: "#12A06B" },
                {
                  k: "consumed",
                  name: "Consumed",
                  cls: "chart__bar--forest",
                  color: "#17503A",
                },
              ]}
            />
          </div>
        </div>
        <div className="card span-5">
          <div className="card__head">
            <div>
              <h2 className="card__title">Recent activity</h2>
              <p className="card__sub">Latest events</p>
            </div>
          </div>
          <div className="list mt-2">
            {app.myNotifs.slice(0, 5).map((n) => {
              const m = NOTIF_META[n.type] || NOTIF_META.system;
              return (
                <div className="list__item" key={n.id}>
                  <span
                    className={
                      "list__icon " +
                      (n.type === "expiry"
                        ? "list__icon--amber"
                        : n.type === "claim"
                          ? "list__icon--teal"
                          : n.type === "pickup"
                            ? "list__icon--lime"
                            : "")
                    }
                  >
                    <Icon name={m.icon} size="sm" />
                  </span>
                  <div className="list__main">
                    <div className="list__title truncate">{n.title}</div>
                    <div className="list__meta">{ago(n.at, now)}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="card__foot">
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => app.go("/app/notifications")}
            >
              View all
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ----- NGO overview ----- */
function NgoOverview() {
  const app = useApp(),
    now = useNow(),
    today = todayKey();
  const avail = app.listings
    .filter((l) => effStatus(l, now) === "available")
    .sort((a, b) => KITCHENS[a.kitchenId].km - KITCHENS[b.kitchenId].km);
  const mine = app.claims.filter(
    (c) => c.ngoId === "n1" && ["claimed", "on_the_way"].includes(c.status),
  );
  const collected = app.collectedFor("ngo");
  const monthMeals = sum(
    collected.filter((x) => x.at >= now - 30 * DAY),
    (x) => x.l.servings,
  );
  const weeks = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const perDay = weeks.map((d) =>
    sum(
      collected.filter((x) => dkey(new Date(x.at)) === d),
      (x) => x.l.servings,
    ),
  );
  const first = app.session.name.split(" ")[0];
  const near = avail.filter((l) => KITCHENS[l.kitchenId].km <= 10);
  return (
    <>
      <PageHead
        title={
          <>
            {greeting()}, <em>{first}</em>
          </>
        }
        sub={app.orgName + " · " + fmtLong(today)}
      >
        <button
          className="btn btn--secondary"
          onClick={() => app.go("/app/pickups")}
        >
          <Icon name="truck" size="sm" />
          My pickups
        </button>
        <button
          className="btn btn--primary"
          onClick={() => app.go("/app/available")}
        >
          <Icon name="search" size="sm" />
          Browse food
        </button>
      </PageHead>
      <SampleBanner>
        Listings, kitchens and distances are sample data.{" "}
        <button className="link" onClick={() => app.requestReset()}>
          Reset sample data
        </button>
      </SampleBanner>
      <div className="card card--feature ngo-hero">
        <div>
          <span className="eyebrow eyebrow--lime">Available near you</span>
          <h2 className="ngo-hero__title">
            {near.length} listings within 10 km ·{" "}
            {fmtN(sum(near, (l) => l.servings))} servings
          </h2>
          <div className="ngo-hero__meta">
            <span className="badge badge--verified">
              <Icon name="shield" size="sm" />
              Verified NGO
            </span>
            <span className="badge badge--dark">
              {mine.length} active pickups
            </span>
          </div>
        </div>
        <button
          className="btn btn--lime btn--lg"
          onClick={() => app.go("/app/available")}
        >
          Claim food <Icon name="arrow" size="sm" />
        </button>
      </div>
      <div className="today mt-5">
        <TodayItem
          label="Available listings"
          value={avail.length}
          unit="live"
          delta="sorted by distance"
          dir="up"
          spark={[2, 3, 3, 4, 5, 4, avail.length]}
        />
        <TodayItem
          label="Servings available"
          value={sum(avail, (l) => l.servings)}
          unit="meals"
          delta="across all kitchens"
          dir="up"
          spark={[120, 180, 160, 240, 300, 280, sum(avail, (l) => l.servings)]}
          sparkCls="spark-line--lime"
        />
        <TodayItem
          label="Active pickups"
          value={mine.length}
          delta="claimed or on the way"
          dir="up"
          spark={[0, 1, 0, 1, 2, 1, mine.length]}
        />
        <TodayItem
          label="Collected · 30 days"
          value={monthMeals}
          unit="meals"
          delta={collected.length + " pickups complete"}
          dir="up"
          spark={perDay.some((v) => v) ? perDay : [0, 0, 0, 0, 0, 0, 1]}
        />
      </div>
      <div className="grid mt-5">
        <div className="span-8">
          <div className="section-title" style={{ marginTop: 0 }}>
            <h2>Nearest available food</h2>
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => app.go("/app/available")}
            >
              See all
            </button>
          </div>
          <div className="feed">
            {avail.slice(0, 4).map((l) => (
              <FeedItem key={l.id} l={l} />
            ))}
            {avail.length === 0 && (
              <div className="card">
                <EmptyState
                  title="Nothing available right now"
                  text="New listings appear here as kitchens publish surplus."
                />
              </div>
            )}
          </div>
        </div>
        <div className="span-4 stack">
          <div className="card">
            <div className="card__head">
              <div>
                <h2 className="card__title">Your pickups</h2>
                <p className="card__sub">In progress</p>
              </div>
            </div>
            <div className="list mt-2">
              {mine.map((c) => {
                const l = app.listingById(c.listingId);
                return (
                  <div className="list__item" key={c.id}>
                    <span className="list__icon list__icon--teal">
                      <Icon name="truck" size="sm" />
                    </span>
                    <div className="list__main">
                      <div className="list__title truncate">{l.name}</div>
                      <div className="list__meta">
                        {app.kitchenName(l.kitchenId)}
                      </div>
                    </div>
                    <div className="list__end">
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                );
              })}
              {mine.length === 0 && (
                <div className="list__item">
                  <div className="list__main muted">No active pickups.</div>
                </div>
              )}
            </div>
            <div className="card__foot">
              <button
                className="btn btn--secondary btn--sm"
                onClick={() => app.go("/app/pickups")}
              >
                Manage pickups
              </button>
            </div>
          </div>
          <div className="card">
            <div className="panel__head">
              <div>
                <h2 className="card__title">Servings collected</h2>
                <p className="card__sub">Last 7 days</p>
              </div>
            </div>
            <div className="panel__body">
              <BarChart
                height={200}
                rows={weeks.map((d, i) => ({
                  label: fmtWeekday(d).slice(0, 2),
                  v: perDay[i],
                }))}
                keys={[{ k: "v", name: "Servings", cls: "", color: "#12A06B" }]}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ----- Meal logging ----- */
function MealForm({
  initial,
  formId,
  onSubmit,
  showSubmit,
  submitLabel = "Save record",
}) {
  const [f, setF] = useState(() => ({
    name: "",
    category: "Lunch",
    date: todayKey(),
    prepared: "",
    consumed: "",
    notes: "",
    ...initial,
  }));
  const [err, setErr] = useState({});
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const prepared = Number(f.prepared) || 0,
    consumed = Number(f.consumed) || 0,
    diff = prepared - consumed;
  const p = formId || "mf";
  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (f.name.trim().length < 2)
      er.name = "Enter a meal name (2+ characters).";
    if (!(prepared > 0)) er.prepared = "Prepared must be greater than 0.";
    if (f.consumed === "" || consumed < 0)
      er.consumed = "Enter how many were consumed.";
    else if (consumed > prepared)
      er.consumed = "Consumed can’t exceed prepared.";
    if (!f.date) er.date = "Pick a date.";
    else if (f.date > todayKey()) er.date = "Date can’t be in the future.";
    setErr(er);
    if (Object.keys(er).length) return;
    onSubmit({
      ...(initial && initial.id ? { id: initial.id } : {}),
      name: f.name.trim(),
      category: f.category,
      date: f.date,
      prepared,
      consumed,
      notes: f.notes.trim(),
    });
    if (!initial || !initial.id)
      setF((s) => ({ ...s, name: "", prepared: "", consumed: "", notes: "" }));
  };
  return (
    <form id={formId} onSubmit={submit} noValidate className="stack">
      <Field label="Meal name" id={p + "-name"} error={err.name}>
        <input
          id={p + "-name"}
          className="input"
          value={f.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Veg Thali"
        />
      </Field>
      <div className="form-grid">
        <Field label="Category" id={p + "-cat"}>
          <select
            id={p + "-cat"}
            className="select"
            value={f.category}
            onChange={(e) => set("category", e.target.value)}
          >
            {MEAL_CATS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Date" id={p + "-date"} error={err.date}>
          <input
            id={p + "-date"}
            type="date"
            className="input"
            max={todayKey()}
            value={f.date}
            onChange={(e) => set("date", e.target.value)}
          />
        </Field>
        <Field label="Quantity prepared" id={p + "-prep"} error={err.prepared}>
          <Stepper
            id={p + "-prep"}
            label="Quantity prepared"
            value={f.prepared}
            onChange={(v) => set("prepared", v)}
          />
        </Field>
        <Field label="Quantity consumed" id={p + "-cons"} error={err.consumed}>
          <Stepper
            id={p + "-cons"}
            label="Quantity consumed"
            value={f.consumed}
            onChange={(v) => set("consumed", v)}
          />
        </Field>
      </div>
      <div className="quick-log__total">
        <span className="mono-label">
          {diff >= 0 ? "Surplus" : "Shortfall"}
        </span>
        <b className={diff > 0 ? "is-surplus" : diff < 0 ? "is-short" : ""}>
          {diff > 0 ? "+" : ""}
          {fmtN(diff)} meals
        </b>
      </div>
      <Field label="Notes" id={p + "-notes"} hint="Optional">
        <textarea
          id={p + "-notes"}
          className="textarea"
          value={f.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Weather, event, menu change…"
        />
      </Field>
      {showSubmit && (
        <button className="btn btn--primary btn--block" type="submit">
          <Icon name="check" size="sm" />
          {submitLabel}
        </button>
      )}
    </form>
  );
}
function MealLogPage() {
  const app = useApp(),
    toast = useToast();
  const [q, setQ] = useState(""),
    [cat, setCat] = useState("all"),
    [range, setRange] = useState("30"),
    [pageN, setPageN] = useState(1);
  const [edit, setEdit] = useState(null),
    [del, setDel] = useState(null);
  const size = 10,
    today = todayKey();
  useEffect(() => {
    if (app.intent && app.intent.type === "new-log") {
      app.setIntent(null);
      const el = document.getElementById("ql-name");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus();
      }
    }
  }, [app.intent]);
  const rows = useMemo(() => {
    const min = range === "all" ? "0000-00-00" : addDays(today, -Number(range));
    return app.logs
      .filter(
        (l) =>
          l.date >= min &&
          (cat === "all" || l.category === cat) &&
          (!q ||
            (l.name + " " + l.notes + " " + l.category)
              .toLowerCase()
              .includes(q.toLowerCase())),
      )
      .sort((a, b) =>
        a.date === b.date
          ? b.createdAt - a.createdAt
          : a.date < b.date
            ? 1
            : -1,
      );
  }, [app.logs, q, cat, range]);
  const pages = Math.max(1, Math.ceil(rows.length / size)),
    cur = Math.min(pageN, pages),
    slice = rows.slice((cur - 1) * size, cur * size);
  useEffect(() => setPageN(1), [q, cat, range]);
  const exportCsv = () => {
    const esc = (s) => '"' + String(s).replace(/"/g, '""') + '"';
    const csv = ["Date,Meal,Category,Prepared,Consumed,Surplus,Notes"]
      .concat(
        rows.map((l) =>
          [
            l.date,
            esc(l.name),
            l.category,
            l.prepared,
            l.consumed,
            l.prepared - l.consumed,
            esc(l.notes),
          ].join(","),
        ),
      )
      .join("\n");
    downloadFile("mealmitra-meal-logs.csv", csv, "text/csv");
    toast("Exported " + rows.length + " records", {
      msg: "mealmitra-meal-logs.csv",
    });
  };
  const onDelete = (l) => {
    app.deleteLog(l.id);
    toast("Record deleted", {
      msg: l.name,
      action: { label: "Undo", onClick: () => app.restoreLog(l) },
    });
  };
  return (
    <>
      <PageHead
        title={
          <>
            Log <em>meals</em>
          </>
        }
        sub="Record what you prepared and what was eaten. Every entry sharpens tomorrow’s forecast."
      >
        <button className="btn btn--secondary" onClick={exportCsv}>
          <Icon name="download" size="sm" />
          Export CSV
        </button>
      </PageHead>
      <div className="grid">
        <div className="span-4">
          <div className="card card--pad quick-log">
            <h2 className="card__title mb-4">Quick log</h2>
            <MealForm
              formId="ql"
              showSubmit
              onSubmit={(rec) => {
                app.saveLog(rec);
                toast("Meal logged", {
                  msg:
                    rec.name +
                    " · " +
                    rec.prepared +
                    " prepared, " +
                    rec.consumed +
                    " consumed",
                });
              }}
            />
          </div>
        </div>
        <div className="span-8">
          <div className="card">
            <div className="table-toolbar">
              <div className="input-group">
                <Icon name="search" size="sm" className="input-group__icon" />
                <input
                  className="input"
                  placeholder="Search meals or notes"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  aria-label="Search meal logs"
                />
              </div>
              <div className="row row--wrap">
                <select
                  className="select"
                  style={{ width: "auto" }}
                  value={cat}
                  onChange={(e) => setCat(e.target.value)}
                  aria-label="Filter by category"
                >
                  <option value="all">All categories</option>
                  {MEAL_CATS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <select
                  className="select"
                  style={{ width: "auto" }}
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  aria-label="Filter by date range"
                >
                  <option value="7">Last 7 days</option>
                  <option value="14">Last 14 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="all">All time</option>
                </select>
              </div>
            </div>
            {rows.length === 0 ? (
              <EmptyState
                title="No records found"
                text="Try a different search or filter, or log a meal using the form."
              />
            ) : (
              <div className="table-wrap">
                <table className="table table--cards">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Meal</th>
                      <th>Category</th>
                      <th className="table__num">Prepared</th>
                      <th className="table__num">Consumed</th>
                      <th className="table__num">Surplus</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {slice.map((l) => {
                      const s = l.prepared - l.consumed;
                      return (
                        <tr key={l.id}>
                          <td data-label="Date">
                            <span className="table__strong">
                              {fmtShort(l.date)}
                            </span>{" "}
                            <span className="muted text-xs">
                              {fmtWeekday(l.date)}
                            </span>
                          </td>
                          <td data-label="Meal">
                            <span className="table__strong">{l.name}</span>{" "}
                            {l.sample && (
                              <span className="sample-tag">Sample</span>
                            )}
                            {l.notes && (
                              <div className="muted text-xs">{l.notes}</div>
                            )}
                          </td>
                          <td data-label="Category">
                            <span
                              className={
                                "meal-pill meal-pill--" +
                                l.category.toLowerCase()
                              }
                            >
                              <i />
                              {l.category}
                            </span>
                          </td>
                          <td data-label="Prepared" className="table__num">
                            {fmtN(l.prepared)}
                          </td>
                          <td data-label="Consumed" className="table__num">
                            {fmtN(l.consumed)}
                          </td>
                          <td data-label="Surplus" className="table__num">
                            <span
                              className={
                                "surplus-cell " +
                                (s > 0 ? "is-pos" : s < 0 ? "is-neg" : "")
                              }
                            >
                              {s > 0 ? "+" : ""}
                              {fmtN(s)}
                            </span>
                          </td>
                          <td className="table__actions">
                            <div className="row-actions">
                              <button
                                className="icon-btn"
                                onClick={() => setEdit(l)}
                                aria-label={"Edit " + l.name}
                              >
                                <Icon name="edit" size="sm" />
                              </button>
                              <button
                                className="icon-btn"
                                onClick={() => setDel(l)}
                                aria-label={"Delete " + l.name}
                              >
                                <Icon name="trash" size="sm" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="table-foot">
              <span>
                {rows.length} records · page {cur} of {pages}
              </span>
              <div className="row">
                <button
                  className="btn btn--secondary btn--sm"
                  disabled={cur <= 1}
                  onClick={() => setPageN(cur - 1)}
                >
                  Previous
                </button>
                <button
                  className="btn btn--secondary btn--sm"
                  disabled={cur >= pages}
                  onClick={() => setPageN(cur + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {edit && (
        <Modal
          title="Edit meal log"
          sub={edit.name}
          onClose={() => setEdit(null)}
          footer={
            <>
              <button
                className="btn btn--secondary"
                onClick={() => setEdit(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn--primary"
                type="submit"
                form="edit-log"
              >
                Save changes
              </button>
            </>
          }
        >
          <MealForm
            formId="edit-log"
            initial={edit}
            onSubmit={(rec) => {
              app.saveLog(rec);
              setEdit(null);
              toast("Record updated", { msg: rec.name });
            }}
          />
        </Modal>
      )}
      {del && (
        <ConfirmModal
          danger
          title="Delete this record?"
          text={
            "“" +
            del.name +
            "” on " +
            fmtShort(del.date) +
            " will be removed and forecasts will update. You can undo right after."
          }
          confirmLabel="Delete"
          onConfirm={() => onDelete(del)}
          onClose={() => setDel(null)}
          icon="trash"
        />
      )}
    </>
  );
}

/* ----- Forecast ----- */
function ForecastPage() {
  const app = useApp(),
    toast = useToast(),
    today = todayKey();
  const [selOff, setSelOff] = useState(1),
    [evModal, setEvModal] = useState(false);
  useEffect(() => {
    if (app.intent && app.intent.type === "add-event") {
      app.setIntent(null);
      setEvModal(true);
    }
  }, [app.intent]);
  const rows = useMemo(
    () =>
      buildRows(
        app.totals,
        app.events,
        app.settings.applyEvents,
        app.settings.bufferPct,
      ),
    [app.totals, app.events, app.settings.applyEvents, app.settings.bufferPct],
  );
  const days = Array.from({ length: 7 }, (_, i) =>
    app.getForecast(addDays(today, i)),
  );
  const sel = days[selOff];
  const back = rows.filter((r) => !r.future && r.actual && r.predicted);
  const mape = back.length
    ? sum(back, (r) => Math.abs(r.predicted - r.actual) / r.actual) /
      back.length
    : 0;
  const maxS = Math.max.apply(
    null,
    [1].concat(sel.samples.map((s) => s.consumed)),
  );
  return (
    <>
      <PageHead
        title={
          <>
            Demand <em>forecast</em>
          </>
        }
        sub="Know how many meals you’ll need, and how many you’ll waste, before you cook."
      >
        <label className="row" style={{ gap: 8 }}>
          <Switch
            checked={app.settings.applyEvents}
            onChange={(v) => {
              app.setSettings((s) => ({ ...s, applyEvents: v }));
              toast(v ? "Event adjustments on" : "Event adjustments off", {
                type: "info",
              });
            }}
            label="Apply event adjustments"
          />
          <span className="text-sm">Apply events</span>
        </label>
        <button className="btn btn--primary" onClick={() => setEvModal(true)}>
          <Icon name="calendar" size="sm" />
          Add event
        </button>
      </PageHead>
      <div className="alert alert--info mb-4">
        <Icon name="info" size="sm" />
        <span>
          <b>Illustrative mock forecast.</b> Predicted demand is the average of
          consumption on the last four matching weekdays, plus an optional event
          uplift. It is a demonstration method, not a trained model.
        </span>
      </div>
      <div className="day-strip">
        {days.map((d, i) => (
          <button
            key={d.date}
            className={"day-chip" + (i === selOff ? " is-active" : "")}
            onClick={() => setSelOff(i)}
            aria-pressed={i === selOff}
          >
            <span className="day-chip__day">
              {i === 0 ? "Today" : fmtWeekday(d.date)}
            </span>
            <span className="day-chip__value">{fmtN(d.forecast)}</span>
            <span className="day-chip__sub">{d.surplus} surplus</span>
          </button>
        ))}
      </div>
      <div className="grid mt-5">
        <div className="card forecast-hero span-8">
          <div className="panel__head">
            <div>
              <h2 className="card__title">Actual vs predicted</h2>
              <p className="card__sub">
                Tap a forecast day on the chart to inspect it
              </p>
            </div>
            <ForecastLegend />
          </div>
          <div className="panel__body">
            <ForecastChart
              rows={rows}
              height={320}
              selected={14 + selOff}
              onPick={(i) => setSelOff(clamp(i - 14, 0, 6))}
            />
          </div>
          <div className="forecast-meta">
            <span>
              Backtest accuracy <b>{Math.round((1 - mape) * 100)}%</b>
            </span>
            <span>
              Average error <b>{(mape * 100).toFixed(1)}%</b>
            </span>
            <span>
              Days compared <b>{back.length}</b>
            </span>
          </div>
        </div>
        <div className="card card--feature span-4">
          <div className="reco">
            <span className="reco__label">
              <span className="live-dot" />
              {fmtLong(sel.date)}
            </span>
            <div className="reco__value">
              {fmtN(sel.recommended)}
              <small>recommended prep</small>
            </div>
            <div className="stack--sm stack text-sm">
              <div className="row between">
                <span className="muted">Predicted demand</span>
                <b>{fmtN(sel.forecast)}</b>
              </div>
              <div className="row between">
                <span className="muted">Usual preparation</span>
                <b>{fmtN(sel.planned)}</b>
              </div>
              <div className="row between">
                <span className="muted">Expected surplus</span>
                <b style={{ color: "#C6F36B" }}>{fmtN(sel.surplus)} meals</b>
              </div>
              {sel.eventLabel && (
                <div className="row between">
                  <span className="muted">Event uplift</span>
                  <b>+{sel.pct}%</b>
                </div>
              )}
            </div>
            <Confidence
              level={sel.level}
              bars={sel.bars}
              pct={sel.confidence}
            />
            <div className="reco__actions">
              <button
                className="btn btn--lime btn--sm"
                onClick={() =>
                  app.goIntent("surplus", {
                    type: "new-listing",
                    data: { servings: String(sel.surplus), name: "" },
                  })
                }
              >
                List predicted surplus
              </button>
            </div>
          </div>
        </div>
        <div className="card span-6">
          <div className="card__head">
            <div>
              <h2 className="card__title">How this forecast works</h2>
              <p className="card__sub">Transparent, in three steps</p>
            </div>
          </div>
          <div className="card__body">
            <div className="timeline">
              {[
                [
                  "Find matching weekdays",
                  "We take the last four " +
                    fmtWeekday(sel.date) +
                    "days from your logs (" +
                    sel.n +
                    " found).",
                ],
                [
                  "Average the consumption",
                  "Mean consumed meals: " +
                    fmtN(sel.base) +
                    ". Variation between those days sets the confidence.",
                ],
                [
                  "Apply event uplift & buffer",
                  (sel.eventLabel
                    ? sel.eventLabel + " adds " + sel.pct + "%. "
                    : "No event uplift applied. ") +
                    "A " +
                    app.settings.bufferPct +
                    "% safety buffer gives the recommended prep.",
                ],
              ].map((s, i) => (
                <div className="timeline__item is-done" key={i}>
                  <span className="timeline__dot">
                    <Icon name="check" size="sm" />
                  </span>
                  <div>
                    <div className="timeline__title">{s[0]}</div>
                    <div className="timeline__text">{s[1]}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card span-6">
          <div className="card__head">
            <div>
              <h2 className="card__title">Matching weekdays used</h2>
              <p className="card__sub">Consumed meals on each source day</p>
            </div>
          </div>
          <div className="card__body">
            {sel.samples.length ? (
              <HBar
                rows={sel.samples.map((s) => ({
                  label: fmtShort(s.date),
                  value: s.consumed,
                  cls: "hbar__fill--forest",
                }))}
              />
            ) : (
              <p className="muted">
                Not enough history yet. Log meals to enable forecasts.
              </p>
            )}
            <div className="divider" />
            <div className="factors">
              <div className="factor">
                <span className="factor__name">
                  <Icon name="layers" size="sm" className="" />
                  Sample size
                </span>
                <span className="factor__value">{sel.n} / 4 weeks</span>
                <div className="progress">
                  <div
                    className="progress__bar"
                    style={{ width: sel.n * 25 + "%" }}
                  />
                </div>
              </div>
              <div className="factor">
                <span className="factor__name">Stability of demand</span>
                <span className="factor__value">
                  {maxS
                    ? Math.round(100 - (sel.sd / (sel.base || 1)) * 100)
                    : 0}
                  %
                </span>
                <div className="progress">
                  <div
                    className="progress__bar progress__bar--lime"
                    style={{
                      width:
                        clamp(100 - (sel.sd / (sel.base || 1)) * 100, 0, 100) +
                        "%",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="card span-12">
          <div className="card__head">
            <div>
              <h2 className="card__title">Daily forecast</h2>
              <p className="card__sub">Next 7 days · illustrative mock data</p>
            </div>
          </div>
          <div className="table-wrap mt-2">
            <table className="table table--cards">
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="table__num">Predicted demand</th>
                  <th className="table__num">Usual prep</th>
                  <th className="table__num">Expected surplus</th>
                  <th>Event</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {days.map((d, i) => (
                  <tr
                    key={d.date}
                    onClick={() => setSelOff(i)}
                    style={{ cursor: "pointer" }}
                  >
                    <td data-label="Date">
                      <span className="table__strong">
                        {fmtWeekday(d.date)}
                      </span>{" "}
                      {fmtShort(d.date)}
                    </td>
                    <td data-label="Predicted" className="table__num">
                      {fmtN(d.forecast)}
                    </td>
                    <td data-label="Usual prep" className="table__num">
                      {fmtN(d.planned)}
                    </td>
                    <td data-label="Surplus" className="table__num">
                      <span className="surplus-cell is-pos">
                        {fmtN(d.surplus)}
                      </span>
                    </td>
                    <td data-label="Event">
                      {d.eventLabel ? (
                        <span className="badge badge--lime">
                          {d.eventLabel} +{d.pct}%
                        </span>
                      ) : (
                        <span className="muted">–</span>
                      )}
                    </td>
                    <td data-label="Confidence">
                      <Confidence
                        level={d.level}
                        bars={d.bars}
                        pct={d.confidence}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card span-12">
          <div className="card__head">
            <div>
              <h2 className="card__title">Events</h2>
              <p className="card__sub">Known occasions that change demand</p>
            </div>
            <button
              className="btn btn--secondary btn--sm"
              onClick={() => setEvModal(true)}
            >
              <Icon name="plus" size="sm" />
              Add
            </button>
          </div>
          <div className="list mt-2">
            {app.events.length === 0 && (
              <div className="list__item">
                <div className="list__main muted">
                  No events yet. Add one to adjust the forecast for that day.
                </div>
              </div>
            )}
            {app.events
              .slice()
              .sort((a, b) => (a.date < b.date ? -1 : 1))
              .map((e) => (
                <div className="list__item" key={e.id}>
                  <span className="list__icon list__icon--lime">
                    <Icon name="calendar" size="sm" />
                  </span>
                  <div className="list__main">
                    <div className="list__title">{e.label}</div>
                    <div className="list__meta">
                      {fmtLong(e.date)} · +{e.pct}% demand
                    </div>
                  </div>
                  <button
                    className="icon-btn"
                    aria-label={"Remove " + e.label}
                    onClick={() => {
                      app.deleteEvent(e.id);
                      toast("Event removed", { type: "info", msg: e.label });
                    }}
                  >
                    <Icon name="trash" size="sm" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      </div>
      {evModal && <EventModal onClose={() => setEvModal(false)} />}
    </>
  );
}
function EventModal({ onClose }) {
  const app = useApp(),
    toast = useToast();
  const [f, setF] = useState({
      date: addDays(todayKey(), 1),
      label: "",
      pct: 20,
    }),
    [err, setErr] = useState({});
  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (f.label.trim().length < 2) er.label = "Give the event a name.";
    if (f.date < todayKey() || f.date > addDays(todayKey(), 6))
      er.date = "Pick a date within the next 7 days.";
    setErr(er);
    if (Object.keys(er).length) return;
    app.addEvent({ date: f.date, label: f.label.trim(), pct: Number(f.pct) });
    toast("Event added", {
      msg: f.label + " · +" + f.pct + "% on " + fmtShort(f.date),
    });
    onClose();
  };
  return (
    <Modal
      title="Add forecast event"
      sub="Adjust expected demand for a specific day."
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" type="submit" form="event-form">
            Add event
          </button>
        </>
      }
    >
      <form id="event-form" className="stack" onSubmit={submit} noValidate>
        <Field label="Event name" id="ev-label" error={err.label}>
          <input
            id="ev-label"
            className="input"
            value={f.label}
            onChange={(e) => setF({ ...f, label: e.target.value })}
            placeholder="e.g. Annual day, exam week"
          />
        </Field>
        <Field label="Date" id="ev-date" error={err.date}>
          <input
            id="ev-date"
            type="date"
            className="input"
            min={todayKey()}
            max={addDays(todayKey(), 6)}
            value={f.date}
            onChange={(e) => setF({ ...f, date: e.target.value })}
          />
        </Field>
        <Field label={"Demand uplift: +" + f.pct + "%"} id="ev-pct">
          <input
            id="ev-pct"
            type="range"
            className="range"
            min="5"
            max="60"
            step="5"
            value={f.pct}
            onChange={(e) => setF({ ...f, pct: e.target.value })}
          />
        </Field>
      </form>
    </Modal>
  );
}

/* ----- Surplus (kitchen) ----- */
function ListingForm({ initial, formId, onSubmit }) {
  const app = useApp();
  const [f, setF] = useState(() => ({
    name: "",
    category: "Cooked meals",
    quantity: "",
    unit: "kg",
    servings: "",
    deadline: toInput(Date.now() + app.settings.pickupHours * HOUR),
    storage: STORAGE[2],
    notes: "",
    status: "available",
    ...initial,
  }));
  const [err, setErr] = useState({});
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    const er = {},
      dl = new Date(f.deadline).getTime();
    if (f.name.trim().length < 2) er.name = "Enter a food name.";
    if (!(Number(f.quantity) > 0))
      er.quantity = "Quantity must be greater than 0.";
    if (!(Number(f.servings) > 0))
      er.servings = "Servings must be greater than 0.";
    if (!dl) er.deadline = "Choose a pickup deadline.";
    else if (f.status === "available" && dl < Date.now() + 5 * MIN)
      er.deadline = "Deadline must be at least 5 minutes from now.";
    setErr(er);
    if (Object.keys(er).length) return;
    onSubmit({
      ...(initial && initial.id ? { id: initial.id } : {}),
      name: f.name.trim(),
      category: f.category,
      quantity: Number(f.quantity),
      unit: f.unit,
      servings: Number(f.servings),
      deadline: dl,
      storage: f.storage,
      notes: f.notes.trim(),
      status: f.status,
    });
  };
  return (
    <form id={formId} className="form-grid" onSubmit={submit} noValidate>
      <Field label="Food name" id="lf-name" error={err.name} className="full">
        <input
          id="lf-name"
          className="input"
          value={f.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Dal Tadka & Jeera Rice"
        />
      </Field>
      <Field label="Category" id="lf-cat">
        <select
          id="lf-cat"
          className="select"
          value={f.category}
          onChange={(e) => set("category", e.target.value)}
        >
          {FOOD_CATS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Field>
      <Field label="Storage requirement" id="lf-store">
        <select
          id="lf-store"
          className="select"
          value={f.storage}
          onChange={(e) => set("storage", e.target.value)}
        >
          {STORAGE.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Field>
      <Field label="Quantity" id="lf-qty" error={err.quantity}>
        <div className="row">
          <input
            id="lf-qty"
            type="number"
            min="0"
            step="any"
            className="input"
            value={f.quantity}
            onChange={(e) => set("quantity", e.target.value)}
            placeholder="0"
          />
          <select
            className="select"
            style={{ width: 110 }}
            value={f.unit}
            onChange={(e) => set("unit", e.target.value)}
            aria-label="Unit"
          >
            {UNITS.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </div>
      </Field>
      <Field label="Servings" id="lf-serv" error={err.servings}>
        <input
          id="lf-serv"
          type="number"
          min="0"
          className="input"
          value={f.servings}
          onChange={(e) => set("servings", e.target.value)}
          placeholder="Approx. people fed"
        />
      </Field>
      <Field label="Pickup deadline" id="lf-dl" error={err.deadline}>
        <input
          id="lf-dl"
          type="datetime-local"
          className="input"
          value={f.deadline}
          onChange={(e) => set("deadline", e.target.value)}
        />
      </Field>
      <Field label="Listing status" id="lf-status" hint="Drafts stay private">
        <select
          id="lf-status"
          className="select"
          value={f.status}
          onChange={(e) => set("status", e.target.value)}
        >
          <option value="available">Available (publish now)</option>
          <option value="draft">Draft</option>
        </select>
      </Field>
      <Field label="Notes" id="lf-notes" hint="Optional" className="full">
        <textarea
          id="lf-notes"
          className="textarea"
          value={f.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Allergens, packaging, access instructions…"
        />
      </Field>
    </form>
  );
}
function ListingDetails({ l, onClose, footer }) {
  const app = useApp(),
    now = useNow(),
    st = effStatus(l, now);
  const claim = l.claimId ? app.claims.find((c) => c.id === l.claimId) : null;
  const Row = ({ k, v }) => (
    <div className="field">
      <span className="mono-label">{k}</span>
      <b>{v}</b>
    </div>
  );
  return (
    <Modal
      title={l.name}
      sub={
        app.kitchenName(l.kitchenId) +
        " · " +
        KITCHENS[l.kitchenId].km +
        " km away"
      }
      onClose={onClose}
      footer={
        footer || (
          <button className="btn btn--secondary" onClick={onClose}>
            Close
          </button>
        )
      }
    >
      <div className="row row--wrap mb-4">
        <StatusBadge status={st} />
        <span className="badge badge--outline">{l.category}</span>
        {l.sample && <span className="sample-tag">Sample</span>}
        {(st === "available" || st === "claimed") && (
          <Countdown deadline={l.deadline} />
        )}
      </div>
      <div className="form-grid">
        <Row k="Quantity" v={l.quantity + " " + l.unit} />
        <Row k="Servings" v={fmtN(l.servings)} />
        <Row k="Pickup deadline" v={fmtDT(l.deadline)} />
        <Row k="Storage" v={l.storage} />
        <Row k="Contact" v={KITCHENS[l.kitchenId].contact} />
        <Row k="Posted" v={fmtDT(l.createdAt)} />
        <div className="field full">
          <span className="mono-label">Notes</span>
          <span>{l.notes || "No additional notes."}</span>
        </div>
      </div>
      {claim && (
        <>
          <hr />
          <div className="mono-label mb-4">Claim</div>
          <div className="row between">
            <span>
              {app.ngoName(claim.ngoId)} · {claim.code}
            </span>
            <StatusBadge status={claim.status} />
          </div>
        </>
      )}
    </Modal>
  );
}
function ListingCard({ l, onView, onEdit, onDelete, onPublish }) {
  const now = useNow(),
    st = effStatus(l, now);
  const media =
    {
      claimed: " listing__media--claimed",
      collected: " listing__media--teal",
      expired: " listing__media--amber",
      draft: " listing__media--claimed",
    }[st] || "";
  const app = useApp();
  return (
    <div className="card listing">
      <div className={"listing__media" + media}>
        <div className="listing__qty">
          {fmtN(l.servings)}
          <small>servings</small>
        </div>
        <span className="listing__status">
          <StatusBadge status={st} />
        </span>
      </div>
      <div className="listing__body">
        <h3 className="listing__title">{l.name}</h3>
        <div className="listing__meta">
          <span>
            <Icon name="box" size="sm" />
            {l.quantity} {l.unit}
          </span>
          <span>
            <Icon name="snow" size="sm" />
            {l.storage}
          </span>
          <span>
            <Icon name="calendar" size="sm" />
            {fmtDT(l.deadline)}
          </span>
        </div>
        <div className="listing__tags">
          <span className="badge badge--outline">{l.category}</span>
          {l.sample && <span className="sample-tag">Sample</span>}
          {(st === "available" || st === "claimed") && (
            <Countdown deadline={l.deadline} />
          )}
        </div>
        {st === "claimed" && l.claimId && (
          <div className="text-xs muted">
            Claimed by{" "}
            {app.ngoName(
              (app.claims.find((c) => c.id === l.claimId) || {}).ngoId || "n2",
            )}
          </div>
        )}
      </div>
      <div className="listing__foot">
        <button
          className="btn btn--secondary btn--sm"
          onClick={() => onView(l)}
        >
          Details
        </button>
        <div className="row">
          {st === "draft" && (
            <button
              className="btn btn--primary btn--sm"
              onClick={() => onPublish(l)}
            >
              Publish
            </button>
          )}
          {(st === "draft" || st === "available") && (
            <button
              className="icon-btn"
              onClick={() => onEdit(l)}
              aria-label={"Edit " + l.name}
            >
              <Icon name="edit" size="sm" />
            </button>
          )}
          {st === "expired" && (
            <button
              className="btn btn--primary btn--sm"
              onClick={() =>
                onEdit(
                  Object.assign({}, l, {
                    status: "available",
                    deadline: Date.now() + 3 * HOUR,
                  }),
                )
              }
            >
              Relist
            </button>
          )}
          {st !== "claimed" && (
            <button
              className="icon-btn"
              onClick={() => onDelete(l)}
              aria-label={"Delete " + l.name}
            >
              <Icon name="trash" size="sm" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
function SurplusPage() {
  const app = useApp(),
    toast = useToast(),
    now = useNow();
  const [tab, setTab] = useState("all"),
    [q, setQ] = useState(""),
    [cat, setCat] = useState("all"),
    [sort, setSort] = useState("deadline"),
    [view, setView] = useState("cards");
  const [modal, setModal] = useState(null),
    [detail, setDetail] = useState(null),
    [del, setDel] = useState(null);
  useEffect(() => {
    if (app.intent && app.intent.type === "new-listing") {
      setModal({ initial: app.intent.data || {} });
      app.setIntent(null);
    }
  }, [app.intent]);
  const mine = app.listings.filter((l) => l.kitchenId === "k1");
  const count = (s) =>
    s === "all"
      ? mine.length
      : mine.filter((l) => effStatus(l, now) === s).length;
  const list = mine
    .filter(
      (l) =>
        (tab === "all" || effStatus(l, now) === tab) &&
        (cat === "all" || l.category === cat) &&
        (!q ||
          (l.name + " " + l.notes + " " + l.category)
            .toLowerCase()
            .includes(q.toLowerCase())),
    )
    .sort((a, b) =>
      sort === "deadline"
        ? a.deadline - b.deadline
        : sort === "newest"
          ? b.createdAt - a.createdAt
          : b.servings - a.servings,
    );
  const doDelete = (l) => {
    app.deleteListing(l.id);
    toast("Listing deleted", {
      msg: l.name,
      action: { label: "Undo", onClick: () => app.restoreListing(l) },
    });
  };
  const publish = (l) => {
    app.saveListing({ id: l.id, status: "available" });
    toast("Listing published", { msg: l.name + " is now visible to NGOs." });
  };
  const cards = (arr) =>
    arr.map((l) => (
      <ListingCard
        key={l.id}
        l={l}
        onView={setDetail}
        onEdit={(x) =>
          setModal({ initial: { ...x, deadline: toInput(x.deadline) } })
        }
        onDelete={setDel}
        onPublish={publish}
      />
    ));
  const tabs = [
    ["all", "All"],
    ["available", "Available"],
    ["claimed", "Claimed"],
    ["collected", "Collected"],
    ["expired", "Expired"],
    ["draft", "Drafts"],
  ];
  return (
    <>
      <PageHead
        title={
          <>
            Surplus <em>listings</em>
          </>
        }
        sub="Publish food that would otherwise go to waste. Verified NGOs are notified instantly."
      >
        <button
          className="btn btn--primary"
          onClick={() => setModal({ initial: {} })}
        >
          <Icon name="plus" size="sm" />
          New listing
        </button>
      </PageHead>
      <div className="tabs mb-4" role="tablist">
        {tabs.map((t) => (
          <button
            key={t[0]}
            role="tab"
            aria-selected={tab === t[0]}
            className={"tabs__btn" + (tab === t[0] ? " is-active" : "")}
            onClick={() => setTab(t[0])}
          >
            {t[1]}
            <span className="chip__count">{count(t[0])}</span>
          </button>
        ))}
      </div>
      <div className="filter-bar">
        <div className="row row--wrap grow">
          <div
            className="input-group"
            style={{ flex: "1 1 220px", maxWidth: 320 }}
          >
            <Icon name="search" size="sm" className="input-group__icon" />
            <input
              className="input"
              placeholder="Search listings"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search listings"
            />
          </div>
          <select
            className="select"
            style={{ width: "auto" }}
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {FOOD_CATS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            className="select"
            style={{ width: "auto" }}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort listings"
          >
            <option value="deadline">Soonest deadline</option>
            <option value="newest">Newest</option>
            <option value="servings">Most servings</option>
          </select>
        </div>
        <div className="segmented">
          <button
            className={
              "segmented__btn" + (view === "cards" ? " is-active" : "")
            }
            onClick={() => setView("cards")}
          >
            Cards
          </button>
          <button
            className={
              "segmented__btn" + (view === "pipeline" ? " is-active" : "")
            }
            onClick={() => setView("pipeline")}
          >
            Pipeline
          </button>
        </div>
      </div>
      {view === "cards" ? (
        list.length ? (
          <div className="surplus-grid stagger">{cards(list)}</div>
        ) : (
          <div className="card">
            <EmptyState
              title="No listings here"
              text="Create a listing to share surplus food with nearby NGOs."
            >
              <button
                className="btn btn--primary"
                onClick={() => setModal({ initial: {} })}
              >
                Create listing
              </button>
            </EmptyState>
          </div>
        )
      ) : (
        <div className="pipeline">
          {[
            ["available", "Available"],
            ["claimed", "Claimed"],
            ["collected", "Collected"],
          ].map((col) => {
            const arr = list.filter((l) => effStatus(l, now) === col[0]);
            return (
              <div className="pipeline__col" key={col[0]}>
                <div className="pipeline__head">
                  {col[1]}
                  <span className="pipeline__count">{arr.length}</span>
                </div>
                {arr.length ? (
                  cards(arr)
                ) : (
                  <div className="pipeline__empty">Nothing here yet</div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {modal && (
        <Modal
          size="lg"
          title={
            modal.initial && modal.initial.id
              ? "Edit listing"
              : "New surplus listing"
          }
          sub="Tell NGOs what’s available and how to handle it."
          onClose={() => setModal(null)}
          footer={
            <>
              <button
                className="btn btn--secondary"
                onClick={() => setModal(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn--primary"
                type="submit"
                form="listing-form"
              >
                {modal.initial && modal.initial.id
                  ? "Save changes"
                  : "Save listing"}
              </button>
            </>
          }
        >
          <ListingForm
            formId="listing-form"
            initial={modal.initial}
            onSubmit={(rec) => {
              const s = app.saveListing(rec);
              toast(
                rec.id
                  ? "Listing updated"
                  : s.status === "draft"
                    ? "Draft saved"
                    : "Listing published",
                { msg: s.name },
              );
              setModal(null);
            }}
          />
        </Modal>
      )}
      {detail && (
        <ListingDetails
          l={app.listingById(detail.id) || detail}
          onClose={() => setDetail(null)}
        />
      )}
      {del && (
        <ConfirmModal
          danger
          title="Delete this listing?"
          text={
            "“" +
            del.name +
            "” will be removed from your listings. You can undo right after."
          }
          confirmLabel="Delete"
          onConfirm={() => doDelete(del)}
          onClose={() => setDel(null)}
          icon="trash"
        />
      )}
    </>
  );
}

/* ----- NGO: available food ----- */
function FeedItem({ l, onDetail }) {
  const app = useApp(),
    k = KITCHENS[l.kitchenId];
  return (
    <div className="card feed-item">
      <div className="feed-item__dist">
        <b>{k.km}</b>
        <span>km</span>
      </div>
      <div>
        <div className="feed-item__title">{l.name}</div>
        <div className="feed-item__meta">
          <span>
            <Icon name="building" size="sm" />
            {app.kitchenName(l.kitchenId)}
          </span>
          <span>
            <Icon name="users" size="sm" />
            {fmtN(l.servings)} servings
          </span>
          <span>
            <Icon name="snow" size="sm" />
            {l.storage}
          </span>
        </div>
        <div className="listing__tags mt-2">
          <span className="badge badge--outline">{l.category}</span>
          <Countdown deadline={l.deadline} />
          {l.sample && <span className="sample-tag">Sample</span>}
        </div>
      </div>
      <div className="feed-item__actions">
        <button className="btn btn--primary" onClick={() => app.openClaim(l)}>
          Claim
        </button>
        <button
          className="btn btn--secondary btn--sm"
          onClick={() => (onDetail ? onDetail(l) : app.openDetail(l))}
        >
          Details
        </button>
      </div>
    </div>
  );
}
function AvailablePage() {
  const app = useApp(),
    now = useNow();
  const [q, setQ] = useState(""),
    [cat, setCat] = useState("all"),
    [dist, setDist] = useState("any"),
    [sort, setSort] = useState("near");
  const items = useMemo(
    () =>
      app.listings
        .filter(
          (l) =>
            effStatus(l, now) === "available" &&
            (cat === "all" || l.category === cat) &&
            (dist === "any" || KITCHENS[l.kitchenId].km <= Number(dist)) &&
            (!q ||
              (l.name + " " + app.kitchenName(l.kitchenId) + " " + l.category)
                .toLowerCase()
                .includes(q.toLowerCase())),
        )
        .sort((a, b) =>
          sort === "near"
            ? KITCHENS[a.kitchenId].km - KITCHENS[b.kitchenId].km
            : sort === "soon"
              ? a.deadline - b.deadline
              : b.servings - a.servings,
        ),
    [app.listings, q, cat, dist, sort, now],
  );
  return (
    <>
      <PageHead
        title={
          <>
            Available <em>food</em>
          </>
        }
        sub="Fresh surplus from nearby kitchens. Claim it before the pickup deadline."
      >
        <span className="badge badge--verified">
          <Icon name="shield" size="sm" />
          Verified NGO
        </span>
      </PageHead>
      <SampleBanner>
        Kitchens, distances and listings are sample data.
      </SampleBanner>
      <div className="filter-bar">
        <div className="row row--wrap grow">
          <div
            className="input-group"
            style={{ flex: "1 1 220px", maxWidth: 320 }}
          >
            <Icon name="search" size="sm" className="input-group__icon" />
            <input
              className="input"
              placeholder="Search food or kitchen"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search available food"
            />
          </div>
          <select
            className="select"
            style={{ width: "auto" }}
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            aria-label="Category"
          >
            <option value="all">All categories</option>
            {FOOD_CATS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            className="select"
            style={{ width: "auto" }}
            value={dist}
            onChange={(e) => setDist(e.target.value)}
            aria-label="Distance"
          >
            <option value="any">Any distance</option>
            <option value="5">Within 5 km</option>
            <option value="10">Within 10 km</option>
          </select>
          <select
            className="select"
            style={{ width: "auto" }}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort"
          >
            <option value="near">Nearest first</option>
            <option value="soon">Soonest deadline</option>
            <option value="servings">Most servings</option>
          </select>
        </div>
        <span className="muted text-sm">{items.length} available</span>
      </div>
      <div className="feed stagger">
        {items.map((l, i) => (
          <div key={l.id} style={{ "--i": i }}>
            <FeedItem l={l} />
          </div>
        ))}
      </div>
      {items.length === 0 && (
        <div className="card">
          <EmptyState
            title="No matching food right now"
            text="Try widening your filters. New listings appear as kitchens publish surplus."
          />
        </div>
      )}
    </>
  );
}
function ClaimModal({ listing, onClose }) {
  const app = useApp(),
    toast = useToast();
  const [f, setF] = useState({
    window: WINDOWS[1],
    contact: app.settings.name,
    phone: app.settings.phone,
    vehicle: VEHICLES[1],
    agree: false,
  });
  const [err, setErr] = useState({});
  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (f.contact.trim().length < 2) er.contact = "Enter a contact person.";
    if (f.phone.replace(/\D/g, "").length < 10)
      er.phone = "Enter a valid phone number (10+ digits).";
    if (!f.agree) er.agree = "Please confirm before claiming.";
    setErr(er);
    if (Object.keys(er).length) return;
    const res = app.createClaim(listing.id, {
      window: f.window,
      contact: f.contact.trim(),
      phone: f.phone.trim(),
      vehicle: f.vehicle,
    });
    if (!res.ok) {
      toast("Couldn’t claim", { type: "error", msg: res.error });
      onClose();
      return;
    }
    toast("Claim confirmed", {
      msg: listing.name + " · code " + res.claim.code,
    });
    onClose();
    app.go("/app/pickups");
  };
  return (
    <Modal
      title="Confirm your claim"
      sub={listing.name + " · " + app.kitchenName(listing.kitchenId)}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" type="submit" form="claim-form">
            Confirm claim
          </button>
        </>
      }
    >
      <div className="alert mb-4">
        <Icon name="clock" size="sm" />
        <span>
          {fmtN(listing.servings)} servings · {listing.quantity} {listing.unit}.
          Collect before <b>{fmtDT(listing.deadline)}</b>. Storage:{" "}
          <b>{listing.storage}</b>.
        </span>
      </div>
      <form id="claim-form" className="form-grid" onSubmit={submit} noValidate>
        <Field label="Pickup window" id="cl-win">
          <select
            id="cl-win"
            className="select"
            value={f.window}
            onChange={(e) => setF({ ...f, window: e.target.value })}
          >
            {WINDOWS.map((w) => (
              <option key={w}>{w}</option>
            ))}
          </select>
        </Field>
        <Field label="Vehicle" id="cl-veh">
          <select
            id="cl-veh"
            className="select"
            value={f.vehicle}
            onChange={(e) => setF({ ...f, vehicle: e.target.value })}
          >
            {VEHICLES.map((w) => (
              <option key={w}>{w}</option>
            ))}
          </select>
        </Field>
        <Field label="Contact person" id="cl-contact" error={err.contact}>
          <input
            id="cl-contact"
            className="input"
            value={f.contact}
            onChange={(e) => setF({ ...f, contact: e.target.value })}
          />
        </Field>
        <Field label="Phone" id="cl-phone" error={err.phone}>
          <input
            id="cl-phone"
            className="input"
            inputMode="tel"
            value={f.phone}
            onChange={(e) => setF({ ...f, phone: e.target.value })}
          />
        </Field>
        <div className="full field">
          <label className="check">
            <input
              type="checkbox"
              checked={f.agree}
              onChange={(e) => setF({ ...f, agree: e.target.checked })}
            />
            <span>
              I confirm our team can safely transport and store this food (
              {listing.storage.toLowerCase()}).
            </span>
          </label>
          {err.agree && (
            <span className="field__error" role="alert">
              <Icon name="alert" size="sm" />
              {err.agree}
            </span>
          )}
        </div>
      </form>
    </Modal>
  );
}

/* ----- Claims & pickups ----- */
const CLAIM_STEPS = ["Claimed", "On the way", "Collected"];
const claimStage = (s) => (s === "claimed" ? 0 : s === "on_the_way" ? 1 : 2);
const HIST_LABEL = {
  claimed: "Claim confirmed",
  on_the_way: "Pickup started",
  collected: "Collected",
  cancelled: "Claim cancelled",
};
function ClaimCard({ claim, listing, role }) {
  const app = useApp(),
    toast = useToast(),
    now = useNow();
  const [hist, setHist] = useState(false),
    [cancel, setCancel] = useState(false),
    [detail, setDetail] = useState(false);
  const stage = claimStage(claim.status),
    active = ["claimed", "on_the_way"].includes(claim.status),
    mineNgo = claim.ngoId === "n1";
  const copy = () => {
    const done = () => toast("Code copied", { type: "info", msg: claim.code });
    if (navigator.clipboard)
      navigator.clipboard.writeText(claim.code).then(done, done);
    else done();
  };
  return (
    <div className="card claim">
      <div className="claim__head">
        <div>
          <h3 className="claim__title">{listing.name}</h3>
          <p className="card__sub">
            {role === "kitchen"
              ? "Claimed by " + app.ngoName(claim.ngoId)
              : "From " + app.kitchenName(listing.kitchenId)}{" "}
            · {fmtN(listing.servings)} servings
            {claim.sample && (
              <>
                {" "}
                · <span className="sample-tag">Sample</span>
              </>
            )}
          </p>
        </div>
        <StatusBadge status={claim.status} />
      </div>
      {claim.status !== "cancelled" && (
        <div
          className="track"
          aria-label={"Pickup progress: " + CLAIM_STEPS[stage]}
        >
          <span className="track__fill" style={{ width: stage * 33.4 + "%" }} />
          {CLAIM_STEPS.map((s, i) => {
            const done = i < stage || claim.status === "collected",
              cur = i === stage && claim.status !== "collected";
            return (
              <div
                key={s}
                className={
                  "track__step" +
                  (done ? " is-done" : "") +
                  (cur ? " is-current" : "")
                }
              >
                <span className="track__dot">
                  {done && <Icon name="check" size="sm" />}
                </span>
                {s}
              </div>
            );
          })}
        </div>
      )}
      <div className="listing__meta">
        <span>
          <Icon name="clock" size="sm" />
          {claim.window}
        </span>
        <span>
          <Icon name="user" size="sm" />
          {claim.contact}
        </span>
        <span>
          <Icon name="truck" size="sm" />
          {claim.vehicle}
        </span>
        {active && <Countdown deadline={listing.deadline} />}
      </div>
      {active && (
        <div className="pickup-code">
          <div>
            <span className="mono-label">Pickup code</span>
            <div className="pickup-code__value">{claim.code}</div>
          </div>
          <button className="btn btn--secondary btn--sm" onClick={copy}>
            <Icon name="copy" size="sm" />
            Copy
          </button>
        </div>
      )}
      <div className="row row--wrap">
        {role === "ngo" && mineNgo && claim.status === "claimed" && (
          <button
            className="btn btn--primary btn--sm"
            onClick={() => {
              app.advanceClaim(claim.id);
              toast("Pickup started", {
                type: "info",
                msg: "The kitchen has been notified.",
              });
            }}
          >
            <Icon name="truck" size="sm" />
            Start pickup
          </button>
        )}
        {role === "ngo" && mineNgo && claim.status === "on_the_way" && (
          <button
            className="btn btn--primary btn--sm"
            onClick={() => {
              app.advanceClaim(claim.id);
              toast("Marked as collected", {
                msg: fmtN(listing.servings) + " meals added to your impact.",
              });
            }}
          >
            <Icon name="check" size="sm" />
            Mark collected
          </button>
        )}
        {role === "kitchen" && active && (
          <button
            className="btn btn--primary btn--sm"
            onClick={() => {
              app.completeClaim(claim.id);
              toast("Handover confirmed", {
                msg: listing.name + " collected by " + app.ngoName(claim.ngoId),
              });
            }}
          >
            <Icon name="check" size="sm" />
            Confirm handover
          </button>
        )}
        {role === "ngo" && mineNgo && active && (
          <button
            className="btn btn--danger btn--sm"
            onClick={() => setCancel(true)}
          >
            Cancel claim
          </button>
        )}
        <button
          className="btn btn--ghost btn--sm"
          onClick={() => setHist(true)}
        >
          <Icon name="clock" size="sm" />
          History
        </button>
        <button
          className="btn btn--ghost btn--sm"
          onClick={() => setDetail(true)}
        >
          Listing details
        </button>
      </div>
      {hist && (
        <Modal
          title="Pickup history"
          sub={listing.name + " · " + claim.code}
          onClose={() => setHist(false)}
        >
          <div className="timeline">
            {claim.history.map((h, i) => {
              const last = i === claim.history.length - 1 && active;
              return (
                <div
                  key={i}
                  className={
                    "timeline__item is-done" + (last ? " is-current" : "")
                  }
                >
                  <span className="timeline__dot">
                    <Icon name="check" size="sm" />
                  </span>
                  <div>
                    <div className="timeline__title">
                      {HIST_LABEL[h.status]}
                    </div>
                    <div className="timeline__text">
                      {fmtDT(h.at)} · {ago(h.at, now)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Modal>
      )}
      {detail && (
        <ListingDetails l={listing} onClose={() => setDetail(false)} />
      )}
      {cancel && (
        <ConfirmModal
          danger
          title="Cancel this claim?"
          text={
            "“" + listing.name + "” will become available to other NGOs again."
          }
          confirmLabel="Cancel claim"
          onConfirm={() => {
            app.cancelClaim(claim.id);
            toast("Claim cancelled", { type: "info", msg: listing.name });
          }}
          onClose={() => setCancel(false)}
        />
      )}
    </div>
  );
}
function ClaimsPage() {
  const app = useApp(),
    role = app.role;
  const [tab, setTab] = useState("active");
  const mine = app.claims
    .filter((c) => {
      const l = app.listingById(c.listingId);
      return (
        l && (role === "kitchen" ? l.kitchenId === "k1" : c.ngoId === "n1")
      );
    })
    .sort((a, b) => b.createdAt - a.createdAt);
  const groups = {
    active: mine.filter((c) => ["claimed", "on_the_way"].includes(c.status)),
    done: mine.filter((c) => c.status === "collected"),
    cancelled: mine.filter((c) => c.status === "cancelled"),
  };
  const list = groups[tab];
  return (
    <>
      <PageHead
        title={
          role === "kitchen" ? (
            <>
              Claims & <em>pickups</em>
            </>
          ) : (
            <>
              My <em>pickups</em>
            </>
          )
        }
        sub={
          role === "kitchen"
            ? "Track NGOs collecting your surplus and confirm each handover."
            : "Track your claimed food from reservation to collection."
        }
      >
        {role === "ngo" && (
          <button
            className="btn btn--primary"
            onClick={() => app.go("/app/available")}
          >
            <Icon name="search" size="sm" />
            Find more food
          </button>
        )}
      </PageHead>
      <div className="tabs mb-4">
        {[
          ["active", "Active"],
          ["done", "Completed"],
          ["cancelled", "Cancelled"],
        ].map((t) => (
          <button
            key={t[0]}
            className={"tabs__btn" + (tab === t[0] ? " is-active" : "")}
            onClick={() => setTab(t[0])}
          >
            {t[1]}
            <span className="chip__count">{groups[t[0]].length}</span>
          </button>
        ))}
      </div>
      {list.length ? (
        <div className="grid stagger">
          {list.map((c, i) => (
            <div className="span-6" style={{ "--i": i }} key={c.id}>
              <ClaimCard
                claim={c}
                listing={app.listingById(c.listingId)}
                role={role}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            title={
              tab === "active"
                ? "No active pickups"
                : tab === "done"
                  ? "No completed pickups yet"
                  : "No cancelled claims"
            }
            text={
              role === "ngo"
                ? "Claim available food to see it tracked here."
                : "When an NGO claims one of your listings, it appears here."
            }
          >
            {role === "ngo" && (
              <button
                className="btn btn--primary"
                onClick={() => app.go("/app/available")}
              >
                Browse available food
              </button>
            )}
          </EmptyState>
        </div>
      )}
    </>
  );
}

function PickupsPage() {
  const app = useApp();
  const [tab, setTab] = useState("active");

  const mine = app.claims
    .filter((c) => {
      const l = app.listingById(c.listingId);
      return l && c.ngoId === "n1";
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  const groups = {
    active: mine.filter((c) => ["claimed", "on_the_way"].includes(c.status)),
    done: mine.filter((c) => c.status === "collected"),
    cancelled: mine.filter((c) => c.status === "cancelled"),
  };

  const list = groups[tab];

  return (
    <>
      <PageHead
        title={
          <>
            My <em>pickups</em>
          </>
        }
        sub="Track your claimed food from reservation to collection."
      >
        <button
          className="btn btn--primary"
          onClick={() => app.go("/app/available")}
        >
          <Icon name="search" size="sm" />
          Find more food
        </button>
      </PageHead>

      <div className="tabs mb-4">
        {[
          ["active", "Active"],
          ["done", "Completed"],
          ["cancelled", "Cancelled"],
        ].map((t) => (
          <button
            key={t[0]}
            className={"tabs__btn" + (tab === t[0] ? " is-active" : "")}
            onClick={() => setTab(t[0])}
          >
            {t[1]}
            <span className="chip__count">{groups[t[0]].length}</span>
          </button>
        ))}
      </div>

      {list.length ? (
        <div className="grid stagger">
          {list.map((c, i) => (
            <div className="span-6" style={{ "--i": i }} key={c.id}>
              <ClaimCard
                claim={c}
                listing={app.listingById(c.listingId)}
                role="ngo"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            title={
              tab === "active"
                ? "No active pickups"
                : tab === "done"
                  ? "No completed pickups yet"
                  : "No cancelled claims"
            }
            text="Claim available food to see it tracked here."
          >
            {tab === "active" && (
              <button
                className="btn btn--primary"
                onClick={() => app.go("/app/available")}
              >
                Browse available food
              </button>
            )}
          </EmptyState>
        </div>
      )}
    </>
  );
}

/* ----- Impact ----- */
function ImpactPage() {
  const app = useApp(),
    now = useNow(),
    role = app.role,
    today = todayKey();
  const [mode, setMode] = useState("weekly");
  const base = IMPACT_BASE[role],
    live = app.collectedFor(role);
  const liveMeals = sum(live, (x) => x.l.servings),
    baseMeals = sum(base.monthly, (v) => v),
    total = baseMeals + liveMeals;
  const kg = total * KG_PER_SERVING,
    co2 = kg * CO2_PER_KG,
    cost = total * app.settings.costPerMeal;
  const weekly = base.weekly.map((v, i) => ({
    label: i === 7 ? "This week" : fmtShort(addDays(today, -7 * (7 - i))),
    value: v + (i === 7 ? liveMeals : 0),
  }));
  const monthly = base.monthly.map((v, i) => ({
    label: new Date(
      new Date().getFullYear(),
      new Date().getMonth() - 5 + i,
      1,
    ).toLocaleDateString("en-IN", { month: "short" }),
    value: v + (i === 5 ? liveMeals : 0),
  }));
  const cats = Object.keys(base.cats).map((k) => ({
    label: k,
    value:
      (base.cats[k] / 100) * baseMeals +
      sum(
        live.filter((x) => x.l.category === k),
        (x) => x.l.servings,
      ),
  }));
  const partners = base.partners
    .map((p) => ({ label: p[0], value: p[1] }))
    .concat([]);
  live.forEach((x) => {
    const nm =
      role === "kitchen"
        ? app.ngoName(x.c.ngoId)
        : app.kitchenName(x.l.kitchenId);
    const p = partners.find((r) => r.label === nm);
    if (p) p.value += x.l.servings;
    else partners.push({ label: nm, value: x.l.servings });
  });
  partners.sort((a, b) => b.value - a.value);
  const heat = Array.from({ length: 28 }, (_, i) => {
    const d = addDays(today, i - 27),
      t = app.totals[d] || { prepared: 0, consumed: 0 };
    return { date: d, value: Math.max(0, t.prepared - t.consumed) };
  });
  const mx = Math.max.apply(null, heat.map((h) => h.value).concat([1]));
  heat.forEach((h) => {
    h.level = h.value === 0 ? 0 : Math.min(4, Math.ceil((h.value / mx) * 4));
  });
  const miles = [1000, 5000, 10000, 25000];
  const recent = live
    .slice()
    .sort((a, b) => b.at - a.at)
    .slice(0, 4);
  return (
    <>
      <PageHead
        title={
          <>
            Impact <em>analytics</em>
          </>
        }
        sub={
          role === "kitchen"
            ? "What your surplus has done once it left the kitchen."
            : "The meals your organisation has rescued and delivered."
        }
      >
        <div className="segmented">
          <button
            className={
              "segmented__btn" + (mode === "weekly" ? " is-active" : "")
            }
            onClick={() => setMode("weekly")}
          >
            Weekly
          </button>
          <button
            className={
              "segmented__btn" + (mode === "monthly" ? " is-active" : "")
            }
            onClick={() => setMode("monthly")}
          >
            Monthly
          </button>
        </div>
      </PageHead>
      <SampleBanner>
        Historic totals are sample data; pickups you complete in this demo are
        added live. Conversion factors are illustrative ({KG_PER_SERVING} kg per
        serving, {CO2_PER_KG} kg CO₂e per kg).
      </SampleBanner>
      <div className="card card--feature impact-hero">
        <div className="impact-hero__item">
          <span className="eyebrow eyebrow--lime">Meals saved</span>
          <span className="impact-hero__value">
            <CountUp value={total} />
          </span>
          <span className="impact-hero__label">
            {fmtN(liveMeals)} from pickups completed in this demo
          </span>
        </div>
        <div className="impact-hero__item">
          <span className="eyebrow eyebrow--lime">Food rescued</span>
          <span className="impact-hero__value">
            <CountUp value={kg} />
            <small>kg</small>
          </span>
          <span className="impact-hero__label">
            ≈ {(kg / 1000).toFixed(1)} tonnes diverted from waste
          </span>
        </div>
        <div className="impact-hero__item">
          <span className="eyebrow eyebrow--lime">CO₂e avoided</span>
          <span className="impact-hero__value">
            <CountUp value={co2} />
            <small>kg</small>
          </span>
          <span className="impact-hero__label">
            Emissions avoided by not wasting food
          </span>
        </div>
      </div>
      <div className="equiv mt-5">
        <div className="equiv__item">
          <span className="mono-label">Cost saved</span>
          <span className="equiv__value">
            <CountUp value={cost} prefix="₹" />
          </span>
          <span className="text-xs muted">
            at ₹{app.settings.costPerMeal} per meal
          </span>
        </div>
        <div className="equiv__item">
          <span className="mono-label">Households fed (1 day)</span>
          <span className="equiv__value">
            <CountUp value={total / 4} />
          </span>
          <span className="text-xs muted">illustrative, 4 meals each</span>
        </div>
        <div className="equiv__item">
          <span className="mono-label">Car km avoided</span>
          <span className="equiv__value">
            <CountUp value={co2 / 0.17} />
          </span>
          <span className="text-xs muted">illustrative equivalent</span>
        </div>
        <div className="equiv__item">
          <span className="mono-label">Pickups completed</span>
          <span className="equiv__value">
            <CountUp value={live.length} />
          </span>
          <span className="text-xs muted">in this demo</span>
        </div>
      </div>
      <div className="grid mt-5">
        <div className="card span-8">
          <div className="panel__head">
            <div>
              <h2 className="card__title">
                Meals saved ·{" "}
                {mode === "weekly" ? "last 8 weeks" : "last 6 months"}
              </h2>
              <p className="card__sub">Sample history plus live pickups</p>
            </div>
          </div>
          <div className="panel__body">
            <AreaChart
              key={mode}
              rows={mode === "weekly" ? weekly : monthly}
              height={280}
            />
          </div>
        </div>
        <div className="card span-4">
          <div className="panel__head">
            <div>
              <h2 className="card__title">By food category</h2>
              <p className="card__sub">Share of meals saved</p>
            </div>
          </div>
          <div className="panel__body">
            <Donut segments={cats} center={compact(total)} label="meals" />
          </div>
        </div>
        <div className="card span-6">
          <div className="panel__head">
            <div>
              <h2 className="card__title">
                {role === "kitchen"
                  ? "Top NGO partners"
                  : "Top kitchen partners"}
              </h2>
              <p className="card__sub">Meals exchanged</p>
            </div>
          </div>
          <div className="panel__body">
            <HBar rows={partners.slice(0, 5)} />
          </div>
        </div>
        <div className="card span-6">
          <div className="panel__head">
            <div>
              <h2 className="card__title">Milestones</h2>
              <p className="card__sub">Meals saved</p>
            </div>
          </div>
          <div className="panel__body">
            <div
              className="milestones"
              style={{ gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}
            >
              {miles.map((m) => (
                <div
                  key={m}
                  className={"milestone" + (total >= m ? " is-reached" : "")}
                >
                  <span className="milestone__icon">
                    <Icon name={total >= m ? "check" : "leaf"} size="sm" />
                  </span>
                  <span className="milestone__title">{fmtN(m)} meals</span>
                  <div className="progress">
                    <div
                      className="progress__bar"
                      style={{ width: clamp((total / m) * 100, 0, 100) + "%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {role === "kitchen" && (
          <div className="card span-5">
            <div className="panel__head">
              <div>
                <h2 className="card__title">Surplus by day</h2>
                <p className="card__sub">Last 28 days · sample logs</p>
              </div>
            </div>
            <div className="panel__body">
              <Heat cells={heat} />
            </div>
          </div>
        )}
        <div className={"card " + (role === "kitchen" ? "span-7" : "span-12")}>
          <div className="card__head">
            <div>
              <h2 className="card__title">Recent impact activity</h2>
              <p className="card__sub">Collected food</p>
            </div>
          </div>
          <div className="list mt-2">
            {recent.map((x) => (
              <div className="list__item" key={x.c.id}>
                <span className="list__icon">
                  <Icon name="leaf" size="sm" />
                </span>
                <div className="list__main">
                  <div className="list__title">{x.l.name}</div>
                  <div className="list__meta">
                    {role === "kitchen"
                      ? app.ngoName(x.c.ngoId)
                      : app.kitchenName(x.l.kitchenId)}{" "}
                    · {ago(x.at, now)}
                    {x.c.sample && (
                      <>
                        {" "}
                        · <span className="sample-tag">Sample</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="list__end">
                  <b>{fmtN(x.l.servings)}</b>{" "}
                  <span className="muted text-xs">meals</span>
                </div>
              </div>
            ))}
            {recent.length === 0 && (
              <div className="list__item">
                <div className="list__main muted">
                  No collected pickups yet. Complete one to see it here.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ----- Notifications ----- */
function NotificationsPage() {
  const app = useApp(),
    now = useNow();
  const [filter, setFilter] = useState("all");
  const start = parseKey(todayKey()).getTime();
  const all = app.myNotifs;
  const list = all.filter((n) =>
    filter === "all" ? true : filter === "unread" ? !n.read : n.type === filter,
  );
  const groups = [
    ["Today", list.filter((n) => n.at >= start)],
    ["Earlier", list.filter((n) => n.at < start)],
  ];
  const count = (f) =>
    f === "all"
      ? all.length
      : f === "unread"
        ? all.filter((n) => !n.read).length
        : all.filter((n) => n.type === f).length;
  const filters = [
    ["all", "All"],
    ["unread", "Unread"],
    ["claim", "Claims"],
    ["surplus", "Surplus"],
    ["pickup", "Pickups"],
    ["expiry", "Expiry"],
  ];
  return (
    <>
      <PageHead
        title={
          <>
            Noti<em>fications</em>
          </>
        }
        sub="Claims, surplus alerts, pickup reminders and expiry warnings."
      >
        <button
          className="btn btn--secondary"
          disabled={!app.unread}
          onClick={() => {
            app.markAllRead();
            app.toast("All notifications marked as read");
          }}
        >
          <Icon name="check" size="sm" />
          Mark all read
        </button>
        <button
          className="btn btn--secondary"
          onClick={() => {
            app.clearRead();
            app.toast("Read notifications cleared", { type: "info" });
          }}
        >
          <Icon name="trash" size="sm" />
          Clear read
        </button>
      </PageHead>
      <div className="chips mb-4">
        {filters.map((f) => (
          <button
            key={f[0]}
            className={"chip" + (filter === f[0] ? " is-active" : "")}
            onClick={() => setFilter(f[0])}
            aria-pressed={filter === f[0]}
          >
            {f[1]}
            <span className="chip__count">{count(f[0])}</span>
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <div className="card">
          <EmptyState
            title="You’re all caught up"
            text="New claims, pickups and expiry alerts will appear here."
          />
        </div>
      ) : (
        groups.map((g) =>
          g[1].length ? (
            <div key={g[0]}>
              <div className="notif-group-label">{g[0]}</div>
              <div className="card">
                <div className="notif-list">
                  {g[1].map((n) => {
                    const m = NOTIF_META[n.type] || NOTIF_META.system;
                    return (
                      <div
                        key={n.id}
                        className={"notif" + (n.read ? "" : " notif--unread")}
                      >
                        <span className={"notif__icon " + m.cls}>
                          <Icon name={m.icon} size="sm" />
                        </span>
                        <div>
                          <div className="notif__title">{n.title}</div>
                          <div className="notif__text">{n.text}</div>
                          <div className="notif__actions">
                            <button
                              className="btn btn--secondary btn--sm"
                              onClick={() => {
                                app.markRead(n.id);
                                app.go("/app/" + app.pageFor(n.ref));
                              }}
                            >
                              Open
                            </button>
                            {!n.read && (
                              <button
                                className="btn btn--ghost btn--sm"
                                onClick={() => app.markRead(n.id)}
                              >
                                Mark read
                              </button>
                            )}
                            <button
                              className="btn btn--ghost btn--sm"
                              onClick={() => app.deleteNotif(n.id)}
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                        <div className="notif__end">
                          <span className="notif__time">{ago(n.at, now)}</span>
                          <span className="badge badge--outline">
                            {m.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null,
        )
      )}
    </>
  );
}

/* ----- Settings ----- */
function SettingsPage() {
  const app = useApp(),
    toast = useToast(),
    s = app.settings;
  const [tab, setTab] = useState("profile"),
    [busy, setBusy] = useState(false),
    [reset, setReset] = useState(false);
  const [d, setD] = useState({ ...s, notify: { ...s.notify } });
  const set = (k, v) => setD((x) => ({ ...x, [k]: v })),
    setN = (k, v) => setD((x) => ({ ...x, notify: { ...x.notify, [k]: v } }));
  const [err, setErr] = useState({});
  const save = (e, keys, check) => {
    e.preventDefault();
    const er = check ? check(d) : {};
    setErr(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    setTimeout(() => {
      const patch = {};
      keys.forEach((k) => {
        patch[k] = d[k];
      });
      app.setSettings((x) => ({ ...x, ...patch }));
      if (keys.includes("name") || keys.includes("email"))
        app.setSession((x) => ({ ...x, name: d.name, email: d.email }));
      setBusy(false);
      toast("Settings saved", {
        msg: "Your changes are stored in this browser.",
      });
    }, 500);
  };
  const tabs = [
    ["profile", "Profile", "user"],
    ["org", "Organisation", "building"],
    ["prefs", "Preferences", "sliders"],
    ["notify", "Notifications", "bell"],
    ["data", "Data & account", "shield"],
  ];
  const initials = d.name
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const saveBtn = (
    <div className="form-actions">
      <button
        className={"btn btn--primary" + (busy ? " is-loading" : "")}
        type="submit"
        disabled={busy}
      >
        Save changes
      </button>
    </div>
  );
  const isK = app.role === "kitchen";
  return (
    <>
      <PageHead
        title={
          <>
            <em>Settings</em>
          </>
        }
        sub="Manage your profile, organisation and preferences."
      />
      <div className="settings">
        <nav className="settings__nav" aria-label="Settings sections">
          {tabs.map((t) => (
            <button
              key={t[0]}
              className={"settings__tab" + (tab === t[0] ? " is-active" : "")}
              onClick={() => {
                setTab(t[0]);
                setErr({});
              }}
            >
              <Icon name={t[2]} size="sm" />
              {t[1]}
            </button>
          ))}
        </nav>
        <div className="settings__panel" key={tab}>
          {tab === "profile" && (
            <form
              className="card card--pad stack"
              noValidate
              onSubmit={(e) =>
                save(e, ["name", "email", "phone"], (v) => {
                  const er = {};
                  if (v.name.trim().length < 2) er.name = "Enter your name.";
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email))
                    er.email = "Enter a valid email.";
                  return er;
                })
              }
            >
              <div className="profile-card">
                <span className="avatar avatar--lg">{initials}</span>
                <div>
                  <h2 className="card__title">Your profile</h2>
                  <p className="card__sub">
                    Role:{" "}
                    <span className="badge badge--dark">
                      {isK ? "Kitchen" : "NGO"}
                    </span>
                  </p>
                </div>
              </div>
              <div className="form-grid">
                <Field label="Full name" id="s-name" error={err.name}>
                  <input
                    id="s-name"
                    className="input"
                    value={d.name}
                    onChange={(e) => set("name", e.target.value)}
                  />
                </Field>
                <Field label="Email" id="s-email" error={err.email}>
                  <input
                    id="s-email"
                    type="email"
                    className="input"
                    value={d.email}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </Field>
                <Field label="Phone" id="s-phone">
                  <input
                    id="s-phone"
                    className="input"
                    value={d.phone}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </Field>
              </div>
              {saveBtn}
            </form>
          )}
          {tab === "org" && (
            <form
              className="card card--pad stack"
              noValidate
              onSubmit={(e) =>
                save(
                  e,
                  [isK ? "kitchenName" : "ngoName", "address", "license"],
                  (v) => {
                    const er = {};
                    if ((isK ? v.kitchenName : v.ngoName).trim().length < 2)
                      er.org = "Enter an organisation name.";
                    return er;
                  },
                )
              }
            >
              <div>
                <h2 className="card__title">Organisation</h2>
                <p className="card__sub">
                  {isK
                    ? "Shown to NGOs on your listings."
                    : "Shown to kitchens when you claim food."}
                </p>
              </div>
              <div className="form-grid">
                <Field
                  label={isK ? "Kitchen name" : "NGO name"}
                  id="s-org"
                  error={err.org}
                  className="full"
                >
                  <input
                    id="s-org"
                    className="input"
                    value={isK ? d.kitchenName : d.ngoName}
                    onChange={(e) =>
                      set(isK ? "kitchenName" : "ngoName", e.target.value)
                    }
                  />
                </Field>
                <Field label="Address" id="s-addr" className="full">
                  <input
                    id="s-addr"
                    className="input"
                    value={d.address}
                    onChange={(e) => set("address", e.target.value)}
                  />
                </Field>
                <Field label={isK ? "Food licence" : "Registration"} id="s-lic">
                  <input
                    id="s-lic"
                    className="input"
                    value={d.license}
                    onChange={(e) => set("license", e.target.value)}
                  />
                </Field>
                <Field label="Verification" id="s-ver">
                  <div className="row" style={{ height: 42 }}>
                    <span className="badge badge--verified">
                      <Icon name="shield" size="sm" />
                      Verified (demo)
                    </span>
                  </div>
                </Field>
              </div>
              {saveBtn}
            </form>
          )}
          {tab === "prefs" && (
            <form
              className="card card--pad stack"
              noValidate
              onSubmit={(e) =>
                save(
                  e,
                  ["costPerMeal", "bufferPct", "pickupHours", "applyEvents"],
                  (v) => {
                    const er = {};
                    if (!(Number(v.costPerMeal) > 0))
                      er.cost = "Enter a cost greater than 0.";
                    return er;
                  },
                )
              }
            >
              <div>
                <h2 className="card__title">Preferences</h2>
                <p className="card__sub">
                  Used for forecasts, defaults and impact maths.
                </p>
              </div>
              <div className="form-grid">
                <Field label="Cost per meal (₹)" id="s-cost" error={err.cost}>
                  <input
                    id="s-cost"
                    type="number"
                    min="1"
                    className="input"
                    value={d.costPerMeal}
                    onChange={(e) => set("costPerMeal", Number(e.target.value))}
                  />
                </Field>
                <Field label="Default pickup window" id="s-hours">
                  <select
                    id="s-hours"
                    className="select"
                    value={d.pickupHours}
                    onChange={(e) => set("pickupHours", Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 6, 8].map((h) => (
                      <option key={h} value={h}>
                        {h} hour{h > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label={"Forecast safety buffer: " + d.bufferPct + "%"}
                  id="s-buf"
                  className="full"
                >
                  <input
                    id="s-buf"
                    type="range"
                    className="range"
                    min="0"
                    max="20"
                    value={d.bufferPct}
                    onChange={(e) => set("bufferPct", Number(e.target.value))}
                  />
                </Field>
              </div>
              <div className="setting-row">
                <div>
                  <div className="setting-row__title">
                    Apply event adjustments
                  </div>
                  <div className="setting-row__desc">
                    Include event uplift when calculating the forecast.
                  </div>
                </div>
                <Switch
                  checked={d.applyEvents}
                  onChange={(v) => set("applyEvents", v)}
                  label="Apply event adjustments"
                />
              </div>
              {saveBtn}
            </form>
          )}
          {tab === "notify" && (
            <form
              className="card card--pad stack"
              onSubmit={(e) => save(e, ["notify"])}
            >
              <div>
                <h2 className="card__title">Notification settings</h2>
                <p className="card__sub">Choose which alerts you receive.</p>
              </div>
              {[
                [
                  "claims",
                  "Claim notifications",
                  "When a claim is created, confirmed or cancelled.",
                ],
                [
                  "surplus",
                  "Surplus alerts",
                  "New listings and predicted surplus.",
                ],
                [
                  "pickup",
                  "Pickup reminders",
                  "Pickup started, completed and upcoming deadlines.",
                ],
                [
                  "expiry",
                  "Expiry warnings",
                  "Listings approaching or past their deadline.",
                ],
                [
                  "digest",
                  "Weekly email digest",
                  "A summary of your impact (mock setting).",
                ],
              ].map((r) => (
                <div className="setting-row" key={r[0]}>
                  <div>
                    <div className="setting-row__title">{r[1]}</div>
                    <div className="setting-row__desc">{r[2]}</div>
                  </div>
                  <Switch
                    checked={!!d.notify[r[0]]}
                    onChange={(v) => setN(r[0], v)}
                    label={r[1]}
                  />
                </div>
              ))}
              {saveBtn}
            </form>
          )}
          {tab === "data" && (
            <>
              <div className="card card--pad stack">
                <div>
                  <h2 className="card__title">Your data</h2>
                  <p className="card__sub">
                    Everything lives in this browser’s localStorage. Nothing is
                    sent to a server.
                  </p>
                </div>
                <div className="row row--wrap">
                  <button
                    className="btn btn--secondary"
                    onClick={() => {
                      downloadFile(
                        "mealmitra-data.json",
                        JSON.stringify(
                          {
                            settings: s,
                            logs: app.logs,
                            listings: app.listings,
                            claims: app.claims,
                            notifications: app.notifs,
                            events: app.events,
                          },
                          null,
                          2,
                        ),
                        "application/json",
                      );
                      toast("Data exported", { msg: "mealmitra-data.json" });
                    }}
                  >
                    <Icon name="download" size="sm" />
                    Export all data (JSON)
                  </button>
                  <button
                    className="btn btn--secondary"
                    onClick={() => app.signOut()}
                  >
                    <Icon name="logout" size="sm" />
                    Sign out
                  </button>
                </div>
              </div>
              <div className="card card--pad stack danger-zone">
                <div>
                  <h2 className="card__title">Danger zone</h2>
                  <p className="card__sub">
                    Restore the original sample data. Your logs, listings,
                    claims and events will be replaced.
                  </p>
                </div>
                <div>
                  <button
                    className="btn btn--danger"
                    onClick={() => setReset(true)}
                  >
                    <Icon name="refresh" size="sm" />
                    Reset to sample data
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {reset && (
        <ConfirmModal
          danger
          title="Reset to sample data?"
          text="This replaces everything you’ve added with fresh sample data. This can’t be undone."
          confirmLabel="Reset data"
          onConfirm={() => {
            app.resetAll();
            toast("Sample data restored", { type: "info" });
          }}
          onClose={() => setReset(false)}
          icon="refresh"
        />
      )}
    </>
  );
}

const PAGES = {
  kitchen: {
    overview: KitchenOverview,
    log: MealLogPage,
    forecast: ForecastPage,
    surplus: SurplusPage,
    claims: ClaimsPage,
    impact: ImpactPage,
    notifications: NotificationsPage,
    settings: SettingsPage,
  },
  ngo: {
    overview: NgoOverview,
    available: AvailablePage,
    pickups: PickupsPage,
    claims: ClaimsPage,
    impact: ImpactPage,
    notifications: NotificationsPage,
    settings: SettingsPage,
  },
};

/* ---------- 11. EXTRA ICON ---------- */
ICONS.layers = (
  <g>
    <path d="m12 3 9 5-9 5-9-5z" />
    <path d="m3 13 9 5 9-5" />
  </g>
);

/* ---------- 12. ERROR BOUNDARY ---------- */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error: error };
  }
  componentDidCatch(error, info) {
    console.error("MealMitra error:", error, info);
  }
  render() {
    if (!this.state.error) return this.props.children;
    const wipe = () => {
      try {
        Object.keys(localStorage)
          .filter((k) => k.indexOf(PREFIX) === 0)
          .forEach((k) => localStorage.removeItem(k));
      } catch (e) {}
      window.location.hash = "#/";
      window.location.reload();
    };
    return (
      <div
        className="page"
        style={{ maxWidth: 560, margin: "15vh auto", padding: "0 16px" }}
      >
        <div className="card card--pad stack">
          <div className="modal__icon modal__icon--danger">
            <Icon name="alert" size="lg" />
          </div>
          <h1 className="page__title" style={{ fontSize: 32 }}>
            Something went <em>wrong.</em>
          </h1>
          <p className="muted">
            The app hit an unexpected error. Reloading usually fixes it. If it
            keeps happening, reset the saved demo data stored in this browser.
          </p>
          <div className="row row--wrap">
            <button
              className="btn btn--primary"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
            <button className="btn btn--danger" onClick={wipe}>
              Reset saved data
            </button>
          </div>
        </div>
      </div>
    );
  }
}

/* ---------- 13. APP (state, actions, routing) ---------- */
function App() {
  const toast = useToast();
  const now = useTicker(20000);
  const [route, go] = useRoute();
  const [session, setSession] = useStored("session", null);
  const [settingsRaw, setSettings] = useStored("settings", DEFAULT_SETTINGS);
  const [logs, setLogs] = useStored("logs", seedLogs);
  const [listings, setListings] = useStored("listings", seedListings);
  const [claims, setClaims] = useStored("claims", seedClaims);
  const [notifs, setNotifs] = useStored("notifs", seedNotifs);
  const [events, setEvents] = useStored("events", seedEvents);
  const [seedDay, setSeedDay] = useStored("seedDay", todayKey());
  const [intent, setIntent] = useState(null);
  const [claimTarget, setClaimTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [resetAsk, setResetAsk] = useState(false);

  const settings = useMemo(
    () => ({
      ...DEFAULT_SETTINGS,
      ...settingsRaw,
      notify: {
        ...DEFAULT_SETTINGS.notify,
        ...((settingsRaw && settingsRaw.notify) || {}),
      },
    }),
    [settingsRaw],
  );
  const role = session && session.role ? session.role : "kitchen";
  const totals = useMemo(() => dailyTotals(logs), [logs]);

  /* Keep sample meal logs relative to today when a new day starts */
  useEffect(() => {
    if (seedDay !== todayKey()) {
      setLogs((a) => a.filter((l) => !l.sample).concat(seedLogs()));
      setEvents((a) => a.filter((e) => e.date >= todayKey()));
      setSeedDay(todayKey());
    }
  }, []);

  /* ---- helpers ---- */
  function kitchenName(id) {
    return id === "k1"
      ? settings.kitchenName
      : KITCHENS[id]
        ? KITCHENS[id].name
        : "Kitchen";
  }
  function ngoName(id) {
    return id === "n1" ? settings.ngoName : NGOS[id] ? NGOS[id].name : "NGO";
  }
  function listingById(id) {
    return listings.find((l) => l.id === id);
  }
  function getForecast(date) {
    return computeForecast(
      totals,
      date,
      events,
      settings.applyEvents,
      settings.bufferPct,
    );
  }
  function pageFor(ref) {
    const ids = NAV[role].map((n) => n.id);
    const map =
      role === "ngo"
        ? {
            claims: "pickups",
            surplus: "available",
            forecast: "overview",
            log: "overview",
          }
        : { pickups: "claims", available: "surplus" };
    const p = map[ref] || ref;
    return ids.indexOf(p) >= 0 ? p : "overview";
  }
  function collectedFor(r) {
    return claims
      .filter((c) => c.status === "collected")
      .map((c) => {
        const l = listings.find((x) => x.id === c.listingId);
        if (!l) return null;
        const last = c.history[c.history.length - 1];
        return { c: c, l: l, at: last ? last.at : c.createdAt };
      })
      .filter(Boolean)
      .filter((x) =>
        r === "kitchen" ? x.l.kitchenId === "k1" : x.c.ngoId === "n1",
      );
  }

  /* ---- navigation & session ---- */
  function goIntent(page, it) {
    setIntent(it);
    go("/app/" + page);
  }
  function signIn(p) {
    setSession({ name: p.name, email: p.email, role: p.role });
    setSettings((s) => ({
      ...s,
      name: p.name,
      email: p.email,
      ...(p.org
        ? p.role === "kitchen"
          ? { kitchenName: p.org }
          : { ngoName: p.org }
        : {}),
    }));
    toast("Welcome, " + p.name.split(" ")[0], {
      msg:
        "Signed in to the " +
        (p.role === "kitchen" ? "kitchen" : "NGO") +
        " workspace.",
    });
    go("/app/overview");
  }
  function demoLogin(r) {
    const name = r === "kitchen" ? "Meera Iyer" : "Imran Sheikh";
    const email = r === "kitchen" ? "meera@annapurna.demo" : "imran@asha.demo";
    setSession({ name: name, email: email, role: r });
    setSettings((s) => ({ ...s, name: name, email: email }));
    toast("Demo workspace ready", {
      msg: "Sample data · changes are saved only in this browser.",
    });
    go("/app/overview");
  }
  function signOut() {
    setSession(null);
    go("/");
    toast("Signed out", { type: "info" });
  }
  function switchRole(r) {
    if (r === role) return;
    setSession((s) => ({ ...s, role: r }));
    go("/app/overview");
    toast("Switched to " + (r === "kitchen" ? "Kitchen" : "NGO") + " view", {
      type: "info",
    });
  }

  /* ---- notifications ---- */
  function addNotif(type, audience, title, text, ref) {
    const key = {
      claim: "claims",
      surplus: "surplus",
      pickup: "pickup",
      expiry: "expiry",
    }[type];
    if (key && settings.notify && settings.notify[key] === false) return;
    setNotifs((a) =>
      [
        {
          id: uid(),
          type: type,
          audience: audience,
          title: title,
          text: text,
          at: Date.now(),
          read: false,
          ref: ref,
        },
      ]
        .concat(a)
        .slice(0, 80),
    );
  }
  function markRead(id) {
    setNotifs((a) => a.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }
  function markAllRead() {
    setNotifs((a) =>
      a.map((n) => (n.audience === role ? { ...n, read: true } : n)),
    );
  }
  function clearRead() {
    setNotifs((a) => a.filter((n) => !(n.audience === role && n.read)));
  }
  function deleteNotif(id) {
    setNotifs((a) => a.filter((n) => n.id !== id));
  }

  /* ---- meal logs ---- */
  function saveLog(rec) {
    if (rec.id)
      setLogs((a) =>
        a.map((l) => (l.id === rec.id ? { ...l, ...rec, sample: false } : l)),
      );
    else
      setLogs((a) =>
        a.concat([{ id: uid(), sample: false, createdAt: Date.now(), ...rec }]),
      );
  }
  function deleteLog(id) {
    setLogs((a) => a.filter((l) => l.id !== id));
  }
  function restoreLog(l) {
    setLogs((a) => (a.some((x) => x.id === l.id) ? a : a.concat([l])));
  }

  /* ---- forecast events ---- */
  function addEvent(ev) {
    setEvents((a) => a.concat([{ id: uid(), sample: false, ...ev }]));
  }
  function deleteEvent(id) {
    setEvents((a) => a.filter((e) => e.id !== id));
  }

  /* ---- listings ---- */
  function saveListing(rec) {
    const prev = rec.id ? listings.find((l) => l.id === rec.id) : null;
    let saved;
    if (prev) {
      saved = { ...prev, ...rec };
      if (
        rec.status === "available" &&
        (prev.status !== "available" ||
          (rec.deadline && rec.deadline !== prev.deadline))
      )
        saved.expiryNotified = false;
    } else {
      saved = {
        id: "L" + uid(),
        kitchenId: "k1",
        claimId: null,
        createdAt: Date.now(),
        sample: false,
        expiryNotified: false,
        ...rec,
      };
    }
    setListings((a) =>
      prev ? a.map((l) => (l.id === saved.id ? saved : l)) : [saved].concat(a),
    );
    const wasLive = prev && prev.status === "available";
    if (saved.status === "available" && !wasLive) {
      addNotif(
        "surplus",
        "ngo",
        "New listing: " + saved.name,
        kitchenName("k1") +
          " published " +
          saved.servings +
          " servings. Pickup before " +
          fmtDT(saved.deadline) +
          ".",
        "available",
      );
    }
    return saved;
  }
  function deleteListing(id) {
    setListings((a) => a.filter((l) => l.id !== id));
  }
  function restoreListing(l) {
    setListings((a) => (a.some((x) => x.id === l.id) ? a : a.concat([l])));
  }

  /* ---- claims & pickups ---- */
  function createClaim(listingId, opts) {
    const l = listings.find((x) => x.id === listingId);
    if (!l || effStatus(l, Date.now()) !== "available")
      return {
        ok: false,
        error: "This listing was just claimed or has expired.",
      };
    const t = Date.now();
    let code;
    do {
      code = "MM-" + (1000 + Math.floor(Math.random() * 9000));
    } while (claims.some((c) => c.code === code));
    const claim = {
      id: "C" + uid(),
      listingId: listingId,
      ngoId: "n1",
      status: "claimed",
      code: code,
      createdAt: t,
      window: opts.window,
      contact: opts.contact,
      phone: opts.phone,
      vehicle: opts.vehicle,
      history: [{ status: "claimed", at: t }],
      sample: false,
      reminded: false,
    };
    setClaims((a) => [claim].concat(a));
    setListings((a) =>
      a.map((x) =>
        x.id === listingId ? { ...x, status: "claimed", claimId: claim.id } : x,
      ),
    );
    if (l.kitchenId === "k1")
      addNotif(
        "claim",
        "kitchen",
        ngoName("n1") + " claimed " + l.name,
        l.servings + " servings reserved. Pickup code " + code + ".",
        "claims",
      );
    addNotif(
      "claim",
      "ngo",
      "Claim confirmed: " + l.name,
      "Collect from " +
        kitchenName(l.kitchenId) +
        " before " +
        fmtDT(l.deadline) +
        ". Code " +
        code +
        ".",
      "pickups",
    );
    return { ok: true, claim: claim };
  }
  function finishClaim(c, l) {
    const t = Date.now();
    setClaims((a) =>
      a.map((x) =>
        x.id === c.id
          ? {
              ...x,
              status: "collected",
              history: x.history.concat([{ status: "collected", at: t }]),
            }
          : x,
      ),
    );
    setListings((a) =>
      a.map((x) =>
        x.id === l.id ? { ...x, status: "collected", collectedAt: t } : x,
      ),
    );
    if (l.kitchenId === "k1")
      addNotif(
        "pickup",
        "kitchen",
        l.name + " collected",
        ngoName(c.ngoId) + " collected " + l.servings + " servings.",
        "impact",
      );
    if (c.ngoId === "n1")
      addNotif(
        "pickup",
        "ngo",
        "Collected: " + l.name,
        l.servings + " meals added to your impact.",
        "impact",
      );
  }
  function advanceClaim(id) {
    const c = claims.find((x) => x.id === id);
    const l = c ? listings.find((x) => x.id === c.listingId) : null;
    if (!c || !l) return;
    if (c.status === "claimed") {
      const t = Date.now();
      setClaims((a) =>
        a.map((x) =>
          x.id === id
            ? {
                ...x,
                status: "on_the_way",
                history: x.history.concat([{ status: "on_the_way", at: t }]),
              }
            : x,
        ),
      );
      if (l.kitchenId === "k1")
        addNotif(
          "pickup",
          "kitchen",
          ngoName(c.ngoId) + " is on the way",
          "Pickup for " + l.name + " has started.",
          "claims",
        );
    } else if (c.status === "on_the_way") {
      finishClaim(c, l);
    }
  }
  function completeClaim(id) {
    const c = claims.find((x) => x.id === id);
    const l = c ? listings.find((x) => x.id === c.listingId) : null;
    if (c && l && ["claimed", "on_the_way"].indexOf(c.status) >= 0)
      finishClaim(c, l);
  }
  function cancelClaim(id) {
    const c = claims.find((x) => x.id === id);
    const l = c ? listings.find((x) => x.id === c.listingId) : null;
    if (!c || !l) return;
    const t = Date.now();
    setClaims((a) =>
      a.map((x) =>
        x.id === id
          ? {
              ...x,
              status: "cancelled",
              history: x.history.concat([{ status: "cancelled", at: t }]),
            }
          : x,
      ),
    );
    setListings((a) =>
      a.map((x) =>
        x.id === l.id
          ? { ...x, status: "available", claimId: null, expiryNotified: false }
          : x,
      ),
    );
    if (l.kitchenId === "k1")
      addNotif(
        "claim",
        "kitchen",
        ngoName(c.ngoId) + " cancelled their claim",
        l.name + " is available to other NGOs again.",
        "surplus",
      );
  }
  function openClaim(l) {
    const cur = listings.find((x) => x.id === l.id);
    if (!cur || effStatus(cur, Date.now()) !== "available") {
      toast("No longer available", {
        type: "error",
        msg: "Someone else claimed this listing, or it expired.",
      });
      return;
    }
    setClaimTarget(cur);
  }
  function openDetail(l) {
    setDetailTarget(l);
  }

  /* ---- reset ---- */
  function resetAll() {
    setLogs(seedLogs());
    setListings(seedListings());
    setClaims(seedClaims());
    setNotifs(seedNotifs());
    setEvents(seedEvents());
    setSeedDay(todayKey());
  }
  function requestReset() {
    setResetAsk(true);
  }

  /* ---- automatic expiry warnings and pickup reminders ---- */
  useEffect(() => {
    if (!session) return;
    const soon = listings.filter(
      (l) =>
        l.kitchenId === "k1" &&
        l.status === "available" &&
        !l.expiryNotified &&
        l.deadline - now < HOUR,
    );
    const due = claims.filter((c) => {
      if (
        ["claimed", "on_the_way"].indexOf(c.status) < 0 ||
        c.ngoId !== "n1" ||
        c.reminded
      )
        return false;
      const l = listings.find((x) => x.id === c.listingId);
      return l && l.deadline - now < 30 * MIN;
    });
    if (!soon.length && !due.length) return;
    if (soon.length) {
      setListings((a) =>
        a.map((l) =>
          soon.some((s) => s.id === l.id) ? { ...l, expiryNotified: true } : l,
        ),
      );
      soon.forEach((l) => {
        const gone = l.deadline < now;
        addNotif(
          "expiry",
          "kitchen",
          gone ? l.name + " has expired" : l.name + " expires soon",
          gone
            ? "The pickup deadline passed without a claim. You can relist it from the Surplus page."
            : "No NGO has claimed it yet. The pickup deadline is under an hour away.",
          "surplus",
        );
      });
    }
    if (due.length) {
      setClaims((a) =>
        a.map((c) =>
          due.some((d) => d.id === c.id) ? { ...c, reminded: true } : c,
        ),
      );
      due.forEach((c) => {
        const l = listings.find((x) => x.id === c.listingId);
        addNotif(
          "pickup",
          "ngo",
          "Pickup reminder: " + l.name,
          "The deadline is within 30 minutes. Code " + c.code + ".",
          "pickups",
        );
      });
    }
  }, [now, listings, claims, session]);

  /* ---- route guard ---- */
  const isApp = route.indexOf("/app") === 0;
  const page = route.split("/")[2] || "overview";
  useEffect(() => {
    if (isApp && !session) go("/login");
    else if (route === "/login" && session) go("/app/overview");
  }, [route, session]);

  /* ---- derived values exposed to pages ---- */
  const myNotifs = useMemo(
    () => notifs.filter((n) => n.audience === role).sort((a, b) => b.at - a.at),
    [notifs, role],
  );
  const unread = myNotifs.filter((n) => !n.read).length;
  const activeClaims = claims.filter((c) => {
    if (["claimed", "on_the_way"].indexOf(c.status) < 0) return false;
    if (role === "ngo") return c.ngoId === "n1";
    const l = listings.find((x) => x.id === c.listingId);
    return l && l.kitchenId === "k1";
  }).length;

  const app = {
    session: session,
    setSession: setSession,
    role: role,
    settings: settings,
    setSettings: setSettings,
    orgName: role === "kitchen" ? settings.kitchenName : settings.ngoName,
    go: go,
    goIntent: goIntent,
    intent: intent,
    setIntent: setIntent,
    toast: toast,
    pageFor: pageFor,
    signIn: signIn,
    demoLogin: demoLogin,
    signOut: signOut,
    switchRole: switchRole,
    logs: logs,
    totals: totals,
    saveLog: saveLog,
    deleteLog: deleteLog,
    restoreLog: restoreLog,
    events: events,
    addEvent: addEvent,
    deleteEvent: deleteEvent,
    getForecast: getForecast,
    listings: listings,
    listingById: listingById,
    saveListing: saveListing,
    deleteListing: deleteListing,
    restoreListing: restoreListing,
    claims: claims,
    createClaim: createClaim,
    advanceClaim: advanceClaim,
    completeClaim: completeClaim,
    cancelClaim: cancelClaim,
    openClaim: openClaim,
    openDetail: openDetail,
    activeClaims: activeClaims,
    collectedFor: collectedFor,
    kitchenName: kitchenName,
    ngoName: ngoName,
    notifs: notifs,
    myNotifs: myNotifs,
    unread: unread,
    markRead: markRead,
    markAllRead: markAllRead,
    clearRead: clearRead,
    deleteNotif: deleteNotif,
    requestReset: requestReset,
    resetAll: resetAll,
  };

  let view;
  if (isApp) view = session ? <AppShell page={page} /> : <LoginPage />;
  else if (route === "/login")
    view = session ? <AppShell page="overview" /> : <LoginPage />;
  else view = <Landing />;

  const detailListing = detailTarget
    ? listingById(detailTarget.id) || detailTarget
    : null;
  const canClaimDetail =
    detailListing &&
    role === "ngo" &&
    effStatus(detailListing, now) === "available";

  return (
    <AppCtx.Provider value={app}>
      <NowCtx.Provider value={now}>
        {view}
        {claimTarget && (
          <ClaimModal
            listing={claimTarget}
            onClose={() => setClaimTarget(null)}
          />
        )}
        {detailListing && (
          <ListingDetails
            l={detailListing}
            onClose={() => setDetailTarget(null)}
            footer={
              <>
                <button
                  className="btn btn--secondary"
                  onClick={() => setDetailTarget(null)}
                >
                  Close
                </button>
                {canClaimDetail && (
                  <button
                    className="btn btn--primary"
                    onClick={() => {
                      setDetailTarget(null);
                      openClaim(detailListing);
                    }}
                  >
                    Claim this food
                  </button>
                )}
              </>
            }
          />
        )}
        {resetAsk && (
          <ConfirmModal
            danger
            title="Reset to sample data?"
            icon="refresh"
            confirmLabel="Reset data"
            text="This replaces your meal logs, listings, claims, notifications and events with fresh sample data. Your profile and settings are kept."
            onConfirm={() => {
              resetAll();
              toast("Sample data restored", { type: "info" });
            }}
            onClose={() => setResetAsk(false)}
          />
        )}
      </NowCtx.Provider>
    </AppCtx.Provider>
  );
}

/* ---------- 14. MOUNT ---------- */
function Root() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
