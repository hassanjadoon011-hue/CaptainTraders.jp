import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import {
  VEHICLE_TYPES,
  vehicleTypeLabel,
  formatEngine,
  money,
  NO_IMAGE,
  yearOptions,
} from "../constants/carOptions";

const LIMIT = 10;

const FILTER_KEYS = [
  "search", "make", "model", "vehicleType", "location", "color",
  "fuelType", "transmission", "steering", "drivetrain", "bodyType",
  "yearFrom", "yearTo", "minPrice", "maxPrice", "maxMileage",
  "recommend", "bestDeals",
];

const LABELS = {
  search: "Search", make: "Make", model: "Model", vehicleType: "Type",
  location: "Location", color: "Color", fuelType: "Fuel",
  transmission: "Transmission", steering: "Steering", drivetrain: "Drive",
  bodyType: "Body", yearFrom: "From", yearTo: "To", minPrice: "Min $",
  maxPrice: "Max $", maxMileage: "Max km", recommend: "Recommended",
  bestDeals: "Best Deals",
};

const FALLBACK = {
  makes: ["Toyota", "Honda", "Nissan", "Mazda", "Mitsubishi", "Subaru", "Suzuki", "Lexus", "Daihatsu", "Isuzu"],
  fuelTypes: ["Petrol", "Diesel", "Hybrid", "Electric"],
  transmissions: ["Automatic", "Manual"],
  bodyTypes: ["Sedan", "SUV", "Hatchback", "Coupe", "Van", "Truck"],
};

const MILEAGE_OPTIONS = [50000, 100000, 150000, 200000];

const PRICE_PRESETS = [
  { label: "Under $1,000", min: "", max: "1000" },
  { label: "$1,000 – $2,000", min: "1000", max: "2000" },
  { label: "$2,000 – $3,000", min: "2000", max: "3000" },
  { label: "Over $3,000", min: "3000", max: "" },
];

const buildSpecs = (car) =>
  [
    car.mileage ? `${Number(car.mileage).toLocaleString()} km` : null,
    car.fuelType || null,
    formatEngine(car.engine),
    car.transmission || null,
  ].filter(Boolean);

const pick = (list, fallback) => (list && list.length > 0 ? list : fallback);

export default function CarsListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cars, setCars] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [meta, setMeta] = useState({});

  const qs = searchParams.toString();

  // Everything (filters, sort and page) lives in the URL, so links and the back button work
  const { filters, page } = useMemo(() => {
    const p = new URLSearchParams(qs);
    const f = {};
    for (const k of FILTER_KEYS) f[k] = p.get(k) || "";
    f.sort = p.get("sort") || "newest";

    // Older links used a single ?year=2018
    const legacyYear = p.get("year");
    if (legacyYear && !f.yearFrom && !f.yearTo) {
      f.yearFrom = legacyYear;
      f.yearTo = legacyYear;
    }
    return { filters: f, page: Math.max(1, Number(p.get("page")) || 1) };
  }, [qs]);

  const activeKeys = FILTER_KEYS.filter((k) => filters[k]);

  const fetchCars = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT, sort: filters.sort, status: "available" };
      for (const k of FILTER_KEYS) {
        if (filters[k]) params[k] = filters[k];
      }

      const res = await axiosClient.get("/cars", { params });
      const data = res?.data?.data || [];
      const pagination = res?.data?.pagination || {};

      setCars(data);
      setTotal(pagination.totalCars ?? 0);
      setTotalPages(pagination.totalPages ?? 1);
    } catch (err) {
      console.error("Failed to fetch cars:", err);
      setCars([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchCars(); }, [fetchCars]);

  // Dropdown options come from the real stock (models follow the chosen make)
  useEffect(() => {
    let cancelled = false;
    axiosClient
      .get("/cars/meta", { params: filters.make ? { make: filters.make } : {} })
      .then((res) => { if (!cancelled) setMeta(res.data?.data || {}); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [filters.make]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [qs]);

  // Lock page scroll while the phone filter panel is open
  useEffect(() => {
    document.body.style.overflow = filtersOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [filtersOpen]);

  const handleFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);

    next.delete("page");
    if (key === "make") next.delete("model");
    if (key === "yearFrom" || key === "yearTo") next.delete("year");

    setSearchParams(next);
  };

  // Sets min and max price together (used by the quick price buttons)
  const setPrice = (min, max) => {
    const next = new URLSearchParams(searchParams);
    const same = filters.minPrice === min && filters.maxPrice === max;
    next.delete("minPrice");
    next.delete("maxPrice");
    next.delete("page");
    if (!same) {
      if (min) next.set("minPrice", min);
      if (max) next.set("maxPrice", max);
    }
    setSearchParams(next);
  };

  const handlePageChange = (newPage) => {
    const next = new URLSearchParams(searchParams);
    if (newPage > 1) next.set("page", String(newPage));
    else next.delete("page");
    setSearchParams(next);
  };

  const resetFilters = () => setSearchParams({});

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = new Set(
      [1, totalPages, page, page - 1, page + 1].filter((p) => p >= 1 && p <= totalPages)
    );
    const sorted = [...pages].sort((a, b) => a - b);
    const result = [];
    sorted.forEach((p, i) => {
      if (i > 0 && p - sorted[i - 1] > 1) result.push("...");
      result.push(p);
    });
    return result;
  };

  const chipText = (key) => {
    const v = filters[key];
    if (key === "recommend" || key === "bestDeals") return LABELS[key];
    if (key === "vehicleType") return `${LABELS[key]}: ${vehicleTypeLabel(v) || v}`;
    if (key === "maxMileage") return `${LABELS[key]}: ${Number(v).toLocaleString()}`;
    return `${LABELS[key]}: ${v}`;
  };

  const panelProps = { filters, meta, handleFilter, setPrice, resetFilters };

  return (
    <div className="bg-[#F5F9FF] min-h-screen">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Car Inventory</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {loading ? "Loading..." : `${total.toLocaleString()} verified Japanese vehicles`}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">

            <button
              onClick={() => setFiltersOpen(true)}
              className="md:hidden flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M6 12h12M10 20h4" />
              </svg>
              Filters
              {activeKeys.length > 0 && (
                <span className="bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {activeKeys.length}
                </span>
              )}
            </button>

            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button onClick={() => setView("list")} title="List view" aria-label="List view"
                className={`p-1.5 rounded-md transition-colors ${view === "list" ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button onClick={() => setView("grid")} title="Grid view" aria-label="Grid view"
                className={`p-1.5 rounded-md transition-colors ${view === "grid" ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h6v6H4zM14 5h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
                </svg>
              </button>
            </div>

            <select value={filters.sort} onChange={(e) => handleFilter("sort", e.target.value)}
              aria-label="Sort cars"
              className="border border-gray-200 rounded-lg px-2 sm:px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="year_desc">Year: Newest</option>
              <option value="year_asc">Year: Oldest</option>
              <option value="mileage_asc">Mileage: Lowest</option>
              <option value="popular">Most Viewed</option>
            </select>
          </div>
        </div>

        {/* Vehicle type tabs */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-3 flex gap-2 overflow-x-auto">
          <TypeTab active={!filters.vehicleType} onClick={() => handleFilter("vehicleType", "")}>
            All Types
          </TypeTab>
          {VEHICLE_TYPES.map((t) => (
            <TypeTab
              key={t.value}
              active={filters.vehicleType === t.value}
              onClick={() => handleFilter("vehicleType", filters.vehicleType === t.value ? "" : t.value)}
            >
              {t.label}
            </TypeTab>
          ))}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5 sm:py-8 flex gap-6">

        {/* ── Desktop sidebar ── */}
        <aside className="w-60 flex-shrink-0 hidden md:block">
          <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
            <FiltersPanel {...panelProps} />
          </div>
        </aside>

        {/* ── Phone filter panel ── */}
        {filtersOpen && (
          <div className="fixed inset-0 z-[60] md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setFiltersOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-[88%] max-w-xs bg-white flex flex-col shadow-xl">
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <h2 className="font-semibold text-gray-800">Filters</h2>
                <button onClick={() => setFiltersOpen(false)} className="text-gray-400 text-2xl leading-none px-1" aria-label="Close filters">×</button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <FiltersPanel {...panelProps} />
              </div>
              <div className="p-4 border-t">
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="w-full bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-lg"
                >
                  Show {total.toLocaleString()} cars
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Main ── */}
        <div className="flex-1 min-w-0">

          {/* Active filters */}
          {activeKeys.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {activeKeys.map((k) => (
                <button
                  key={k}
                  onClick={() => handleFilter(k, "")}
                  className="flex items-center gap-1.5 bg-white border border-blue-200 text-blue-700 text-xs font-medium px-3 py-1 rounded-full hover:bg-blue-50"
                >
                  {chipText(k)}
                  <span className="text-blue-400">×</span>
                </button>
              ))}
              <button onClick={resetFilters} className="text-xs text-gray-500 hover:underline ml-1">
                Clear all
              </button>
            </div>
          )}

          {loading ? (
            <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
              {Array(LIMIT).fill(0).map((_, i) => (
                <div key={i} className={`bg-white rounded-xl animate-pulse border border-gray-100 ${view === "grid" ? "h-72" : "h-40 sm:h-32"}`} />
              ))}
            </div>
          ) : cars.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-10 sm:p-16 text-center">
              <p className="text-5xl mb-4">🔍</p>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">No cars found</h3>
              <p className="text-gray-400 text-sm mb-5">Try adjusting your filters, or send us an inquiry and we will find it for you.</p>
              <div className="flex items-center justify-center gap-4">
                <button onClick={resetFilters} className="text-sm text-blue-500 hover:underline">Clear filters</button>
                <Link to="/contact" className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
                  Contact us
                </Link>
              </div>
            </div>
          ) : view === "list" ? (
            <div className="flex flex-col gap-3">
              {cars.map((car) => <CarListRow key={car._id} car={car} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {cars.map((car) => <CarGridCard key={car._id} car={car} />)}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center flex-wrap gap-1 mt-8 sm:mt-10">
              <PageBtn onClick={() => handlePageChange(Math.max(1, page - 1))} disabled={page === 1} label="Prev" />
              {getPageNumbers().map((p, i) =>
                p === "..."
                  ? <span key={`e${i}`} className="w-6 sm:w-9 text-center text-gray-400 text-sm">…</span>
                  : <PageBtn key={p} onClick={() => handlePageChange(p)} active={p === page} label={p} />
              )}
              <PageBtn onClick={() => handlePageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} label="Next" />
            </div>
          )}
          {totalPages > 1 && (
            <p className="text-center text-xs text-gray-400 mt-3">
              Page {page} of {totalPages} · {total.toLocaleString()} vehicles
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Filters (shared by desktop sidebar + phone panel) ─── */
function FiltersPanel({ filters, meta, handleFilter, setPrice, resetFilters }) {
  const years = yearOptions(45);

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-gray-800 text-sm">Filters</h2>
        <button onClick={resetFilters} className="text-xs text-blue-500 hover:underline">Reset</button>
      </div>

      <FilterSection label="Quick">
        <div className="flex flex-wrap gap-2">
          <Toggle active={Boolean(filters.recommend)} onClick={() => handleFilter("recommend", filters.recommend ? "" : "1")}>
            Recommended
          </Toggle>
          <Toggle active={Boolean(filters.bestDeals)} onClick={() => handleFilter("bestDeals", filters.bestDeals ? "" : "1")}>
            Best Deals
          </Toggle>
        </div>
      </FilterSection>

      <FilterSection label="Search">
        <DebouncedInput
          value={filters.search}
          onCommit={(v) => handleFilter("search", v.trim())}
          placeholder="Make, model, chassis, stock no..."
          className={fieldClass}
        />
      </FilterSection>

      <FilterSection label="Make & Model">
        <SelectField
          value={filters.make}
          onChange={(v) => handleFilter("make", v)}
          placeholder="All Makes"
          options={pick(meta.makes, FALLBACK.makes)}
        />
        <SelectField
          value={filters.model}
          onChange={(v) => handleFilter("model", v)}
          placeholder={filters.make ? "All Models" : "Select make first"}
          options={filters.make ? meta.models || [] : []}
          disabled={!filters.make}
        />
      </FilterSection>

      <FilterSection label="Vehicle Type">
        <SelectField
          value={filters.vehicleType}
          onChange={(v) => handleFilter("vehicleType", v)}
          placeholder="All Types"
          options={VEHICLE_TYPES}
        />
      </FilterSection>

      <FilterSection label="Price (USD)">
        <div className="flex flex-wrap gap-2">
          {PRICE_PRESETS.map((p) => (
            <Toggle
              key={p.label}
              active={filters.minPrice === p.min && filters.maxPrice === p.max}
              onClick={() => setPrice(p.min, p.max)}
            >
              {p.label}
            </Toggle>
          ))}
        </div>
        <div className="flex gap-2">
          <DebouncedInput type="number" min="0" placeholder="Min" value={filters.minPrice}
            onCommit={(v) => handleFilter("minPrice", v)} className={fieldClass} />
          <DebouncedInput type="number" min="0" placeholder="Max" value={filters.maxPrice}
            onCommit={(v) => handleFilter("maxPrice", v)} className={fieldClass} />
        </div>
      </FilterSection>

      <FilterSection label="Year">
        <div className="flex gap-2">
          <SelectField value={filters.yearFrom} onChange={(v) => handleFilter("yearFrom", v)}
            placeholder="From" options={years.map(String)} />
          <SelectField value={filters.yearTo} onChange={(v) => handleFilter("yearTo", v)}
            placeholder="To" options={years.map(String)} />
        </div>
      </FilterSection>

      <FilterSection label="Max Mileage">
        <SelectField
          value={filters.maxMileage}
          onChange={(v) => handleFilter("maxMileage", v)}
          placeholder="Any mileage"
          options={MILEAGE_OPTIONS.map((m) => ({ value: String(m), label: `Up to ${m.toLocaleString()} km` }))}
        />
      </FilterSection>

      <FilterSection label="Location">
        <SelectField value={filters.location} onChange={(v) => handleFilter("location", v)}
          placeholder="Any location" options={meta.locations || []} />
      </FilterSection>

      <FilterSection label="Color">
        <SelectField value={filters.color} onChange={(v) => handleFilter("color", v)}
          placeholder="Any color" options={meta.colors || []} />
      </FilterSection>

      <FilterSection label="Fuel">
        <SelectField value={filters.fuelType} onChange={(v) => handleFilter("fuelType", v)}
          placeholder="Any fuel" options={pick(meta.fuelTypes, FALLBACK.fuelTypes)} />
      </FilterSection>

      <FilterSection label="Transmission">
        <SelectField value={filters.transmission} onChange={(v) => handleFilter("transmission", v)}
          placeholder="Any transmission" options={pick(meta.transmissions, FALLBACK.transmissions)} />
      </FilterSection>

      <FilterSection label="Steering">
        <SelectField value={filters.steering} onChange={(v) => handleFilter("steering", v)}
          placeholder="Any steering" options={["Right", "Left"]} />
      </FilterSection>

      <FilterSection label="Drive">
        <SelectField value={filters.drivetrain} onChange={(v) => handleFilter("drivetrain", v)}
          placeholder="Any drive" options={["FWD", "RWD", "AWD", "4WD"]} />
      </FilterSection>

      <FilterSection label="Body Type" last>
        <SelectField value={filters.bodyType} onChange={(v) => handleFilter("bodyType", v)}
          placeholder="Any body type" options={pick(meta.bodyTypes, FALLBACK.bodyTypes)} />
      </FilterSection>
    </>
  );
}

const fieldClass =
  "w-full min-w-0 border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400";

function SelectField({ value, onChange, options, placeholder, disabled }) {
  const items = (options || []).map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={fieldClass + " disabled:opacity-60"}
    >
      <option value="">{placeholder}</option>
      {items.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// Waits until typing stops before applying the filter
function DebouncedInput({ value, onCommit, ...props }) {
  const [local, setLocal] = useState(value);
  const commitRef = useRef(onCommit);
  commitRef.current = onCommit;

  useEffect(() => { setLocal(value); }, [value]);

  useEffect(() => {
    if (local === value) return;
    const t = setTimeout(() => commitRef.current(local), 500);
    return () => clearTimeout(t);
  }, [local, value]);

  return <input value={local} onChange={(e) => setLocal(e.target.value)} {...props} />;
}

function Toggle({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
        active ? "bg-blue-500 text-white border-blue-500 font-medium" : "border-gray-200 text-gray-600 hover:bg-blue-50"
      }`}
    >
      {children}
    </button>
  );
}

function TypeTab({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 text-sm px-4 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
        active
          ? "bg-blue-600 text-white border-blue-600 font-medium"
          : "bg-white border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-200"
      }`}
    >
      {children}
    </button>
  );
}

/* ─── Price block ─── */
function Price({ car, size = "text-xl" }) {
  const hasDiscount = car.originalPrice && car.originalPrice > car.price;
  return (
    <div>
      <p className={`text-blue-600 font-bold ${size}`}>{money(car.price)}</p>
      {hasDiscount ? (
        <p className="text-gray-400 text-xs">
          <span className="line-through">{money(car.originalPrice)}</span>{" "}
          <span className="text-green-600 font-medium">
            Save {money(car.originalPrice - car.price)}
          </span>
        </p>
      ) : (
        <p className="text-gray-400 text-xs">FOB Price</p>
      )}
    </div>
  );
}

function Badges({ car }) {
  return (
    <>
      {car.isFeatured && <Badge color="amber">Featured</Badge>}
      {car.isRecommended && <Badge color="blue">Recommended</Badge>}
      {car.isBestDeal && <Badge color="red">Best Deal</Badge>}
      {car.isNew && <Badge color="green">New</Badge>}
    </>
  );
}

/* ─── List Row (stacks on phones) ─── */
function CarListRow({ car }) {
  const specs = buildSpecs(car);

  return (
    <div className="bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 sm:items-center">
      <Link to={`/cars/${car._id}`} className="w-full h-48 sm:w-40 sm:h-28 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 block">
        <img
          src={car.images?.[0] || NO_IMAGE}
          alt={`${car.make} ${car.model}`}
          loading="lazy"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = NO_IMAGE; }}
          className="w-full h-full object-cover"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="font-bold text-gray-800 text-base">{car.make} {car.model} {car.year}</h2>
          <Badges car={car} />
        </div>
        {car.stockNo && <p className="text-[11px] text-gray-400 mt-0.5">Stock No. {car.stockNo}</p>}
        {car.description && <p className="text-gray-400 text-xs mt-1 line-clamp-1">{car.description}</p>}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2">
          {specs.map((s, i) => (
            <span key={i} className="text-xs text-gray-500">
              {i > 0 && <span className="text-gray-300 mr-2">·</span>}{s}
            </span>
          ))}
        </div>
        {car.location && <p className="text-xs text-gray-400 mt-2">📍 {car.location}</p>}
      </div>
      <div className="flex-shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:ml-2 sm:text-right">
        <Price car={car} />
        <Link to={`/cars/${car._id}`} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
          View Car
        </Link>
      </div>
    </div>
  );
}

/* ─── Grid Card ─── */
function CarGridCard({ car }) {
  const specs = buildSpecs(car);

  return (
    <div className="bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all flex flex-col overflow-hidden">
      <Link to={`/cars/${car._id}`} className="relative h-48 sm:h-44 bg-gray-100 flex-shrink-0 block">
        <img
          src={car.images?.[0] || NO_IMAGE}
          alt={`${car.make} ${car.model}`}
          loading="lazy"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = NO_IMAGE; }}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 left-2 flex flex-wrap gap-1"><Badges car={car} /></div>
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <h2 className="font-bold text-gray-800 text-sm">{car.make} {car.model} {car.year}</h2>
        {car.stockNo && <p className="text-[11px] text-gray-400">Stock No. {car.stockNo}</p>}
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1.5">
          {specs.map((s, i) => (
            <span key={i} className="text-xs text-gray-400">
              {i > 0 && <span className="text-gray-300 mr-2">·</span>}{s}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
          <Price car={car} size="text-base" />
          <Link to={`/cars/${car._id}`} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
            View
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Shared pieces ─── */
function FilterSection({ label, children, last }) {
  return (
    <div className={last ? "" : "mb-4 pb-4 border-b border-gray-50"}>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">{label}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function Badge({ color, children }) {
  const colors = {
    amber: "bg-amber-100 text-amber-700",
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${colors[color]}`}>
      {children}
    </span>
  );
}

function PageBtn({ onClick, disabled, active, label }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium border transition-colors
        ${active ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}
        disabled:opacity-30 disabled:cursor-not-allowed`}>
      {label}
    </button>
  );
}