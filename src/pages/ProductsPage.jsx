import { useEffect, useState, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  ChevronDown, Search, SlidersHorizontal, ChevronRight, Check,
  Tractor, Sparkles, Sprout, ArrowDown,
} from "lucide-react";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../hooks/useProducts";
import api from "../utils/api";

const FALLBACK_AGRI_CAT = {
  name: "Agriculture",
  slug: "agriculture",
  subCategories: [
    { name: "Tractors & Tillers", slug: "tractors-tillers", isActive: true },
    { name: "Harvesters", slug: "harvesters", isActive: true },
    { name: "Irrigation & Sprayers", slug: "irrigation-sprayers", isActive: true },
    { name: "Farm Implements", slug: "farm-implements", isActive: true },
    { name: "Spares & Consumables", slug: "spares-consumables", isActive: true },
  ],
};

const AGRI_CATEGORIES_DATA = [
  {
    name: "Tractors & Tillers",
    slug: "tractors-tillers",
    desc: "Two-wheel tillers, 4WD utility & orchard tractors",
    img: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=700&auto=format&fit=crop",
  },
  {
    name: "Harvesters",
    slug: "harvesters",
    desc: "Grain combines, forage cutters & threshing units",
    img: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?q=80&w=700&auto=format&fit=crop",
  },
  {
    name: "Irrigation & Sprayers",
    slug: "irrigation-sprayers",
    desc: "Motorized boom sprayers, dripline pumps & nozzles",
    img: "https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?q=80&w=700&auto=format&fit=crop",
  },
  {
    name: "Farm Implements",
    slug: "farm-implements",
    desc: "Rotavators, disc harrows, seeders & subsoilers",
    img: "https://images.unsplash.com/photo-1589923188900-85dae523342b?q=80&w=700&auto=format&fit=crop",
  },
  {
    name: "Spares & Consumables",
    slug: "spares-consumables",
    desc: "Belts, hydraulic seals, filters, tines & hardware",
    img: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=700&auto=format&fit=crop",
  },
];

const AGRI_IMG_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%2314532d'/%3E%3Ccircle cx='300' cy='180' r='50' fill='%23166534' stroke='%2386efac' stroke-width='4'/%3E%3Cpath d='M280 180 L320 180 M300 160 L300 200' stroke='%2386efac' stroke-width='4' stroke-linecap='round'/%3E%3Ctext x='300' y='270' text-anchor='middle' font-family='sans-serif' font-size='18' font-weight='bold' fill='%23ecfdf5'%3EAgriHarvest Category%3C/text%3E%3C/svg%3E";

const SORT_OPTIONS = [
  { label: "Newest First",      value: "-createdAt" },
  { label: "Price: Low → High", value: "price"      },
  { label: "Price: High → Low", value: "-price"     },
  { label: "Top Rated",         value: "-rating"    },
];

/* ── Shared portal hook ──────────────────────────────────────────────── */
function useDropdownPortal(open, setOpen, triggerRef, listRef) {
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const updateCoords = useCallback(() => {
    if (!triggerRef.current) return;
    const rect       = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const listHeight = 256; // max-h-64
    const openUp     = spaceBelow < listHeight && rect.top > listHeight;
    setCoords({
      top:   openUp ? rect.top - listHeight - 4 : rect.bottom + 4,
      left:  rect.left,
      width: rect.width,
    });
  }, [triggerRef]);

  // Compute coords when opening + close on page scroll, recompute on resize
  useEffect(() => {
    if (!open) return;
    updateCoords();
    const onScroll = (e) => {
      if (listRef.current && (listRef.current === e.target || listRef.current.contains(e.target))) return;
      setOpen(false);
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", updateCoords);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [open, setOpen, updateCoords, listRef]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        listRef.current    && !listRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, setOpen, triggerRef, listRef]);

  return coords;
}

/* ── Custom Dropdown ─────────────────────────────────────────────────── */
function CustomDropdown({ value, onChange, options, placeholder = "Select…", className = "", isAgri = false }) {
  const [open, setOpen] = useState(false);
  const triggerRef      = useRef(null);
  const listRef         = useRef(null);
  const coords          = useDropdownPortal(open, setOpen, triggerRef, listRef);

  const selected = options.find(o => (o.value ?? o) === value);
  const label    = selected ? (selected.label ?? selected) : placeholder;

  const dropdown = open && ReactDOM.createPortal(
    <ul
      ref={listRef}
      role="listbox"
      style={{
        position: "fixed",
        top:      coords.top,
        left:     coords.left,
        width:    coords.width,
        minWidth: coords.width,
        zIndex:   99999,
      }}
      className="bg-white border border-gray-200 rounded-xl shadow-lg py-1 max-h-64 overflow-y-auto"
    >
      {options.map(o => {
        const val    = o.value ?? o;
        const lbl    = o.label ?? o;
        const active = val === value;
        return (
          <li
            key={val}
            role="option"
            aria-selected={active}
            onMouseDown={(e) => { e.preventDefault(); onChange(val); setOpen(false); }}
            className={`
              flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors
              ${active
                ? (isAgri ? "bg-[#15803d] text-white" : "bg-[#0a1f44] text-white")
                : (isAgri ? "text-gray-700 hover:bg-emerald-50 hover:text-[#15803d]" : "text-gray-700 hover:bg-[#e8edf5] hover:text-[#0a1f44]")}
            `}
          >
            <span className="flex-1">{lbl}</span>
            {active && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
          </li>
        );
      })}
    </ul>,
    document.body
  );

  return (
    <div className={className}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`
          flex items-center justify-between gap-2 w-full
          px-3 py-2 text-sm font-medium
          bg-white border border-gray-200 rounded-xl
          transition-colors focus:outline-none focus:ring-2
          ${isAgri
            ? `text-gray-700 hover:border-[#15803d] hover:text-[#15803d] focus:ring-[#15803d]/20 ${open ? "border-[#15803d] text-[#15803d]" : ""}`
            : `text-gray-700 hover:border-[#0a1f44] hover:text-[#0a1f44] focus:ring-[#0a1f44]/20 ${open ? "border-[#0a1f44] text-[#0a1f44]" : ""}`}
        `}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{label}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {dropdown}
    </div>
  );
}

/* ── Sub-category dropdown (mobile) ─────────────────────────────────── */
function SubCategoryDropdown({ activeCat, activeSubs, subSlug, navigate, isAgri = false }) {
  const [open, setOpen] = useState(false);
  const triggerRef      = useRef(null);
  const listRef         = useRef(null);
  const coords          = useDropdownPortal(open, setOpen, triggerRef, listRef);

  const activeLabel = subSlug
    ? (activeSubs.find(s => s.slug === subSlug)?.name || subSlug)
    : `All ${activeCat.name}`;

  const select = (slug) => {
    setOpen(false);
    if (!slug) navigate(`/products/category/${activeCat.slug}`);
    else       navigate(`/products/category/${activeCat.slug}?sub=${slug}`);
  };

  const dropdown = open && ReactDOM.createPortal(
    <ul
      ref={listRef}
      role="listbox"
      style={{
        position: "fixed",
        top:      coords.top,
        left:     coords.left,
       width: coords.width,
minWidth: coords.width,
        zIndex:   99999,
      }}
      className="bg-white border border-gray-200 rounded-xl shadow-lg py-1 max-h-64 overflow-y-auto"
    >
      <li
        role="option"
        aria-selected={!subSlug}
        onMouseDown={(e) => { e.preventDefault(); select(""); }}
        className={`
          flex items-center gap-2 px-4 py-2.5 text-sm font-semibold cursor-pointer transition-colors
          ${!subSlug
            ? (isAgri ? "bg-[#15803d] text-white" : "bg-[#0a1f44] text-white")
            : (isAgri ? "text-gray-700 hover:bg-emerald-50 hover:text-[#15803d]" : "text-gray-700 hover:bg-[#e8edf5] hover:text-[#0a1f44]")}
        `}
      >
        <span className="flex-1">All {activeCat.name}</span>
        {!subSlug && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
      </li>
      {activeSubs.map(sub => (
        <li
          key={sub.slug}
          role="option"
          aria-selected={subSlug === sub.slug}
          onMouseDown={(e) => { e.preventDefault(); select(sub.slug); }}
          className={`
            flex items-center gap-2 px-4 py-2.5 text-sm font-semibold cursor-pointer transition-colors
            ${subSlug === sub.slug
              ? (isAgri ? "bg-[#15803d] text-white" : "bg-[#0a1f44] text-white")
              : (isAgri ? "text-gray-700 hover:bg-emerald-50 hover:text-[#15803d]" : "text-gray-700 hover:bg-[#e8edf5] hover:text-[#0a1f44]")}
          `}
        >
          <span className="flex-1">{sub.name}</span>
          {subSlug === sub.slug && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
        </li>
      ))}
    </ul>,
    document.body
  );

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`
          flex items-center justify-between gap-2 w-full
          px-4 py-2.5 text-sm font-semibold
          bg-white border-2 rounded-xl transition-colors
          focus:outline-none focus:ring-2 ${isAgri ? "focus:ring-[#15803d]/20" : "focus:ring-[#0a1f44]/20"}
          ${open
            ? (isAgri ? "border-[#15803d] text-[#15803d]" : "border-[#0a1f44] text-[#0a1f44]")
            : (isAgri ? "border-gray-200 text-gray-700 hover:border-[#15803d] hover:text-[#15803d]" : "border-gray-200 text-gray-700 hover:border-[#0a1f44] hover:text-[#0a1f44]")}
        `}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{activeLabel}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {dropdown}
    </div>
  );
}

/* ── Skeleton ────────────────────────────────────────────────────────── */
const Skeleton = () => (
  <div className="card animate-pulse">
    <div className="bg-gray-200 h-44 rounded-t-2xl" />
    <div className="p-3 space-y-2">
      <div className="h-3 bg-gray-200 rounded w-1/3" />
      <div className="h-3 bg-gray-200 rounded" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
      <div className="h-8 bg-gray-200 rounded-xl" />
    </div>
  </div>
);

/* ── Page ────────────────────────────────────────────────────────────── */
export default function ProductsPage({ auth, cartHook, wishlistHook, onSubPillsVisibilityChange }) {
  const { cat }  = useParams();
  const [sp]     = useSearchParams();
  const navigate = useNavigate();

  const isAgri = cat?.toLowerCase() === "agriculture";

  const searchQuery = sp.get("search") || "";
  const subSlug     = sp.get("sub")    || "";

  const [sort,       setSort]       = useState("-createdAt");
  const [page,       setPage]       = useState(1);
  const [categories, setCategories] = useState([]);
  const [catsReady,  setCatsReady]  = useState(false);

  const { products, loading, pagination, fetchProducts } = useProducts();
  const observerRef = useRef(null);
  const catalogRef = useRef(null);
  const shouldScrollToCatalogRef = useRef(false);

  const scrollToCatalog = useCallback(() => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    });
  }, []);

  useEffect(() => {
    if (shouldScrollToCatalogRef.current) {
      shouldScrollToCatalogRef.current = false;
      scrollToCatalog();
    }
  }, [subSlug, scrollToCatalog]);

  const handleSectorCardClick = (targetSlug) => {
    if (subSlug === targetSlug) {
      navigate("/products/category/agriculture");
    } else {
      shouldScrollToCatalogRef.current = true;
      navigate(`/products/category/agriculture?sub=${targetSlug}`);
    }
  };

  useEffect(() => {
    setCatsReady(false);
    api.get("/categories?nav=true")
      .then(({ data }) => {
        if (Array.isArray(data))
          setCategories([...data].sort((a, b) => (a.navOrder ?? 99) - (b.navOrder ?? 99)));
      })
      .catch(() => {})
      .finally(() => setCatsReady(true));
  }, []);

  const matchedCat = catsReady && cat
    ? categories.find(c => c.slug === cat.toLowerCase()) || null
    : null;
  const activeCat  = matchedCat || (isAgri ? FALLBACK_AGRI_CAT : null);
  const activeSubs = (activeCat?.subCategories || []).filter(s => s.isActive !== false);

  useEffect(() => {
    if (!cat && onSubPillsVisibilityChange) onSubPillsVisibilityChange(true);
  }, [cat, onSubPillsVisibilityChange]);

  const subPillsRef = useCallback((el) => {
    if (observerRef.current) { observerRef.current.disconnect(); observerRef.current = null; }
    if (!el) { onSubPillsVisibilityChange?.(true); return; }
    const observer = new IntersectionObserver(
      ([entry]) => onSubPillsVisibilityChange?.(entry.isIntersecting),
      { threshold: 0, rootMargin: "-150px 0px 0px 0px" }
    );
    observer.observe(el);
    observerRef.current = observer;
  }, [onSubPillsVisibilityChange]);

  useEffect(() => { setPage(1); }, [cat, subSlug, searchQuery, sort]);

  useEffect(() => {
    if (!catsReady) return;
    const params = { sort, page, limit: 20 };
    if (cat) {
      if (activeCat) { params.category = activeCat.name; params.categorySlug = activeCat.slug; }
      else           { params.category = cat;            params.categorySlug = cat; }
    }
    if (subSlug && activeSubs.length > 0) {
      const subObj = activeSubs.find(s => s.slug === subSlug);
      if (subObj) params.sub = subObj.name;
    }
    if (searchQuery) params.search = searchQuery;
    fetchProducts(params);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, subSlug, searchQuery, sort, page, catsReady, activeCat?.slug]);

  const pages = pagination?.pages || 1;

  const activeSubName = subSlug
    ? (activeSubs.find(s => s.slug === subSlug)?.name || subSlug)
    : "";

  const title = searchQuery
    ? `Results for "${searchQuery}"`
    : activeCat
      ? activeSubName
        ? `${activeCat.name} — ${activeSubName}`
        : (isAgri ? "Agriculture Machinery & Spares" : activeCat.name)
      : "All Parts";

  const Breadcrumb = () => {
    if (!activeCat && !searchQuery) return null;
    return (
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 flex-wrap">
        <button
          onClick={() => navigate("/products")}
          className={`transition-colors ${isAgri ? "hover:text-[#15803d]" : "hover:text-[#0a1f44]"}`}
        >
          All Parts
        </button>
        {activeCat && (
          <>
            <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
            <button
              onClick={() => navigate(`/products/category/${activeCat.slug}`)}
              className={`transition-colors ${
                !activeSubName
                  ? (isAgri ? "text-[#15803d] font-semibold" : "text-[#0a1f44] font-semibold")
                  : (isAgri ? "hover:text-[#15803d]" : "hover:text-[#0a1f44]")
              }`}
            >
              {activeCat.name}
            </button>
          </>
        )}
        {activeSubName && (
          <>
            <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
            <span className={isAgri ? "text-[#15803d] font-semibold" : "text-[#0a1f44] font-semibold"}>
              {activeSubName}
            </span>
          </>
        )}
      </nav>
    );
  };

  // ── Agriculture Category Experience ──
  if (isAgri) {
    return (
      <div className="page-wrapper min-h-screen">
        <Breadcrumb />

        {/* 1. Photography-Led Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-[#071f11] text-white shadow-xl mb-10 border border-emerald-950/20">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1800&auto=format&fit=crop"
              alt="Agricultural farmland"
              className="w-full h-full object-cover object-center"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#071f11]/95 via-[#0b2b18]/85 to-[#0b2b18]/45" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071f11] via-transparent to-black/25" />
          </div>

          <div className="relative z-10 p-6 sm:p-10 md:p-12 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-bold uppercase tracking-wider mb-4 border border-white/15">
              <Tractor className="w-4 h-4 text-amber-400" />
              <span>AgriHarvest Marketplace</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-[1.15] mb-4">
              Heavy-Duty Farm Machinery & Precision Spares
            </h1>

            <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed mb-8 max-w-2xl font-normal">
              Explore tractors, harvesters, modern spray systems, and critical replacement parts cataloged to keep your commercial farming operations running at peak seasonal performance.
            </p>

            <div className="flex items-center gap-3.5 flex-wrap">
              <a
                href="#agri-catalog"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToCatalog();
                }}
                className="inline-flex items-center gap-2 bg-[#d97706] hover:bg-[#b45309] text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-amber-950/30 active:scale-95 text-sm cursor-pointer"
              >
                <span>Browse Inventory</span>
                <ArrowDown className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* 2. Image-Based Agriculture Category Discovery */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-800 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Explore by Sector</span>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                Featured Agricultural Sectors
              </h2>
            </div>
            <button
              onClick={() => {
                if (subSlug) {
                  navigate("/products/category/agriculture");
                }
              }}
              disabled={!subSlug}
              className={`text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-lg transition-all ${
                subSlug
                  ? "text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer shadow-xs"
                  : "text-gray-400 bg-gray-50/80 border border-gray-200/60 cursor-default opacity-60"
              }`}
              aria-disabled={!subSlug}
            >
              <span>Reset to All Categories</span>
              {subSlug && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {AGRI_CATEGORIES_DATA.map((catItem) => {
              const isSelected = subSlug === catItem.slug;
              return (
                <button
                  key={catItem.slug}
                  onClick={() => handleSectorCardClick(catItem.slug)}
                  className={`group relative overflow-hidden rounded-2xl text-left transition-all duration-300 flex flex-col justify-end h-44 sm:h-52 border p-3.5 sm:p-4 cursor-pointer ${
                    isSelected
                      ? "ring-2 ring-[#15803d] border-[#15803d] shadow-lg scale-[1.02]"
                      : "border-gray-200/80 hover:border-emerald-600/50 hover:shadow-md hover:-translate-y-0.5"
                  }`}
                >
                  {/* Card background photo with graceful fallback */}
                  <div className="absolute inset-0 z-0 bg-[#14532d]">
                    <img
                      src={catItem.img}
                      alt={catItem.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.src = AGRI_IMG_FALLBACK;
                      }}
                    />
                    {/* Scrim gradient for contrast */}
                    <div
                      className={`absolute inset-0 transition-opacity duration-300 ${
                        isSelected
                          ? "bg-gradient-to-t from-[#071f11] via-[#071f11]/75 to-emerald-950/30"
                          : "bg-gradient-to-t from-black/85 via-black/45 to-black/15 group-hover:from-emerald-950/90 group-hover:via-emerald-950/50"
                      }`}
                    />
                  </div>

                  {/* Selected badge */}
                  {isSelected && (
                    <span className="absolute top-2.5 right-2.5 z-10 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                      <Check className="w-3 h-3" /> Selected
                    </span>
                  )}

                  {/* Content */}
                  <div className="relative z-10">
                    <h3 className="text-sm sm:text-base font-bold text-white leading-snug group-hover:text-emerald-200 transition-colors">
                      {catItem.name}
                    </h3>
                    <p className="text-[11px] text-gray-200/90 line-clamp-2 mt-1 leading-tight font-normal">
                      {catItem.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Product Browsing Area */}
        <div
          id="agri-catalog"
          ref={catalogRef}
          className="scroll-mt-36 md:scroll-mt-44"
          style={{ scrollMarginTop: "165px" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pt-4 border-t border-gray-200/60">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  {activeSubName ? activeSubName : "All Equipment & Spares"}
                </h2>
                {subSlug && (
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Filtered
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {pagination?.total ?? 0} {pagination?.total === 1 ? "item" : "items"} available
              </p>
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-800" />
              <CustomDropdown
                value={sort}
                onChange={setSort}
                options={SORT_OPTIONS}
                className="w-48"
                isAgri={true}
              />
            </div>
          </div>

          {/* Quick sub-pill bar for fast horizontal toggling */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => navigate("/products/category/agriculture")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                !subSlug
                  ? "bg-[#15803d] text-white border-[#15803d] shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#15803d] hover:text-[#15803d]"
              }`}
            >
              All Categories
            </button>
            {activeSubs.map((sub) => (
              <button
                key={sub.slug}
                onClick={() => navigate(`/products/category/agriculture?sub=${sub.slug}`)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                  subSlug === sub.slug
                    ? "bg-[#15803d] text-white border-[#15803d] shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#15803d] hover:text-[#15803d]"
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 20 }).map((_, i) => <Skeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 px-6 border border-[#e2ded2] bg-[#faf8f4] rounded-3xl max-w-2xl mx-auto my-8 shadow-sm">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-emerald-200">
                <Sprout className="w-8 h-8 text-emerald-700" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {subSlug ? `No inventory listed under "${activeSubName}" yet` : "Agricultural Inventory Being Cataloged"}
              </h2>
              <p className="text-gray-600 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                {subSlug
                  ? "Equipment models and replacement components for this sector are currently being cataloged. Explore our other agricultural sections or view all available inventory."
                  : "Commercial farm machinery, implements, and replacement spares are currently being cataloged into our database. Check back soon or browse our full parts inventory."}
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {subSlug ? (
                  <button
                    onClick={() => navigate("/products/category/agriculture")}
                    className="px-5 py-2.5 rounded-xl bg-[#15803d] hover:bg-[#166534] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                  >
                    View All Agricultural Sectors
                  </button>
                ) : (
                  <button
                    onClick={() => navigate("/products/category/agriculture")}
                    className="px-5 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs uppercase tracking-wider cursor-default"
                  >
                    All Agricultural Sectors
                  </button>
                )}
                <button
                  onClick={() => navigate("/products")}
                  className="px-5 py-2.5 rounded-xl bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Browse All Inventory
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                {products.map((p) => (
                  <ProductCard
                    key={p._id}
                    product={p}
                    auth={auth}
                    cartHook={cartHook}
                    wishlistHook={wishlistHook}
                    isAgriculture={true}
                  />
                ))}
              </div>
              {pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="btn-ghost px-4 py-2 text-sm disabled:opacity-40 border border-gray-200 cursor-pointer"
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                        page === p
                          ? "bg-[#15803d] text-white shadow-sm"
                          : "bg-white border border-gray-200 text-gray-600 hover:border-[#15803d]"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, pages))}
                    disabled={page === pages}
                    className="btn-ghost px-4 py-2 text-sm disabled:opacity-40 border border-gray-200 cursor-pointer"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Existing Automotive Category Page (Preserved 100% for Engine Parts, Braking, etc.) ──
  return (
    <div className="page-wrapper min-h-screen">
      <Breadcrumb />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pagination?.total ?? 0} parts found</p>
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gray-400" />
          <CustomDropdown
            value={sort}
            onChange={setSort}
            options={SORT_OPTIONS}
            className="w-44"
          />
        </div>
      </div>

      {/* Sub-category filter */}
      {catsReady && activeSubs.length > 0 && (
        <div ref={subPillsRef} className="mb-6">
          {/* Mobile & Tablet — custom dropdown */}
          <div className="md:hidden">
            <SubCategoryDropdown
              activeCat={activeCat}
              activeSubs={activeSubs}
              subSlug={subSlug}
              navigate={navigate}
            />
          </div>

          {/* Desktop — pills */}
          <div className="hidden md:flex flex-wrap gap-2">
            <button
              onClick={() => navigate(`/products/category/${activeCat.slug}`)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border
                ${!subSlug
                  ? "bg-[#0a1f44] text-white border-[#0a1f44]"
                  : "bg-white text-gray-500 border-gray-200 hover:border-[#0a1f44] hover:text-[#0a1f44]"}`}
            >
              All {activeCat.name}
            </button>
            {activeSubs.map(sub => (
              <button
                key={sub.slug}
                onClick={() => navigate(`/products/category/${activeCat.slug}?sub=${sub.slug}`)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border
                  ${subSlug === sub.slug
                    ? "bg-[#0a1f44] text-white border-[#0a1f44]"
                    : "bg-white text-gray-500 border-gray-200 hover:border-[#0a1f44] hover:text-[#0a1f44]"}`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 20 }).map((_, i) => <Skeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-gray-200 rounded-2xl">
          <Search className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-700 mb-2">No parts found</h2>
          <p className="text-gray-400 text-sm mb-5">
            {cat ? `No products listed under "${activeCat?.name || cat}" yet` : "Try a different search term"}
          </p>
          <button onClick={() => navigate("/products")} className="btn-primary">View All Parts</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map(p => (
              <ProductCard
                key={p._id}
                product={p}
                auth={auth}
                cartHook={cartHook}
                wishlistHook={wishlistHook}
              />
            ))}
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="btn-ghost px-4 py-2 text-sm disabled:opacity-40 border border-gray-200"
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors
                    ${page === p ? "bg-[#0a1f44] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-[#de1c0e]"}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(p + 1, pages))}
                disabled={page === pages}
                className="btn-ghost px-4 py-2 text-sm disabled:opacity-40 border border-gray-200"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}