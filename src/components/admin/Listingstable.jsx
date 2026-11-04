import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Star, Tag, Pencil, Trash2, ImageOff, Plus, CarFront as CarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import axiosClient from "../../api/axiosClient";
import { getFilterOptions } from "../../api/carApi";
import { useAdmin } from "../../context/AdminAuthContext";
import { usd } from "../../constants/stockOptions";
import { Badge, Button, Card, CardHeader, EmptyState, IconButton, PageHeader, Tabs, btnClass, inputClass, cx } from "./ui";

const notifyStats = () => window.dispatchEvent(new Event("cars-updated"));

const TABS = [
  { value: "", label: "All" },
  { value: "available", label: "Available" },
  { value: "sold", label: "Sold" },
];

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "year_desc", label: "Year: newest" },
  { value: "mileage_asc", label: "Mileage: lowest" },
  { value: "popular", label: "Most viewed" },
];

const km = (n) => (n != null && n !== "" ? `${Number(n).toLocaleString()} km` : "—");

function Thumb({ src, size = "md" }) {
  const box = size === "lg" ? "w-20 h-14" : "w-16 h-11";
  return src ? (
    <img src={src} alt="" loading="lazy" className={`${box} rounded-lg object-cover bg-gray-100 ring-1 ring-gray-200/70 shrink-0`} />
  ) : (
    <div className={`${box} rounded-lg bg-gray-100 ring-1 ring-gray-200/70 flex items-center justify-center text-gray-300 shrink-0`}>
      <ImageOff size={16} />
    </div>
  );
}

function StatusBadge({ sold }) {
  return <Badge tone={sold ? "red" : "green"}>{sold ? "Sold" : "Available"}</Badge>;
}

function Flags({ car }) {
  if (!car.isRecommended && !car.isBestDeal) return null;
  return (
    <span className="inline-flex gap-1">
      {car.isRecommended && <Badge tone="blue"><Star size={11} /> Recommended</Badge>}
      {car.isBestDeal && <Badge tone="amber"><Tag size={11} /> Best deal</Badge>}
    </span>
  );
}

const title = (car) => [car.year, car.make, car.model].filter(Boolean).join(" ");

export default function Listingstable({ compact = false }) {
  const { can } = useAdmin();
  const limit = compact ? 6 : 10;

  const [cars, setCars] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("");
  const [make, setMake] = useState("");
  const [sort, setSort] = useState("newest");
  const [makes, setMakes] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const navigate = useNavigate();

  const fetchCars = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit, sort };
      if (search.trim()) params.search = search.trim();
      if (tab) params.status = tab;
      if (make) params.make = make;

      const res = await axiosClient.get("/cars", { params });
      setCars(res?.data?.data || []);
      setTotal(res?.data?.pagination?.totalCars ?? 0);
      setTotalPages(res?.data?.pagination?.totalPages ?? 1);
    } catch {
      setCars([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, tab, make, sort]);

  useEffect(() => {
    const t = setTimeout(fetchCars, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchCars, search]);

  // Refresh when a car is added or edited somewhere else
  useEffect(() => {
    window.addEventListener("cars-updated", fetchCars);
    return () => window.removeEventListener("cars-updated", fetchCars);
  }, [fetchCars]);

  // Makes for the filter dropdown
  useEffect(() => {
    if (compact) return;
    getFilterOptions()
      .then((d) => setMakes(d?.makes || []))
      .catch(() => setMakes([]));
  }, [compact]);

  const update = async (car, data) => {
    setBusyId(car._id);
    try {
      await axiosClient.put(`/cars/${car._id}`, data);
      await fetchCars();
      notifyStats();
    } catch {
      alert("Could not update the car. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (car) => {
    if (!window.confirm(`Delete ${car.make} ${car.model}? This cannot be undone.`)) return;
    try {
      await axiosClient.delete(`/cars/${car._id}`);
      if (cars.length === 1 && page > 1) setPage(page - 1);
      else fetchCars();
      notifyStats();
    } catch {
      alert("Could not delete the car. Please try again.");
    }
  };

  const resetPage = (fn) => (v) => { fn(v); setPage(1); };
  const hasFilters = search || tab || make;
  const canEdit = can("cars.edit");
  const canDelete = can("cars.delete");
  const showActions = canEdit || canDelete;

  // Icon actions shared by table rows and phone cards
  const iconActions = (car) => {
    const busy = busyId === car._id;
    return (
      <>
        {canEdit && (
          <>
            <IconButton
              label={car.isRecommended ? "Remove from Recommended" : "Mark as Recommended"}
              aria-pressed={!!car.isRecommended}
              active={car.isRecommended}
              disabled={busy}
              onClick={() => update(car, { isRecommended: !car.isRecommended })}
            >
              <Star size={15} className={car.isRecommended ? "fill-current" : ""} />
            </IconButton>
            <IconButton
              label={car.isBestDeal ? "Remove from Best Deals" : "Mark as Best Deal"}
              aria-pressed={!!car.isBestDeal}
              active={car.isBestDeal}
              disabled={busy}
              onClick={() => update(car, { isBestDeal: !car.isBestDeal })}
            >
              <Tag size={15} />
            </IconButton>
            <IconButton label="Edit" onClick={() => navigate(`/admin/cars/edit/${car._id}`)}>
              <Pencil size={15} />
            </IconButton>
          </>
        )}
        {canDelete && (
          <IconButton label="Delete" tone="danger" onClick={() => handleDelete(car)}>
            <Trash2 size={15} />
          </IconButton>
        )}
      </>
    );
  };

  const soldToggle = (car, className = "") => {
    if (!canEdit) return null;
    const sold = car.status === "sold";
    const busy = busyId === car._id;
    return (
      <Button
        variant="secondary"
        size="sm"
        disabled={busy}
        className={cx("min-w-[104px]", className)}
        onClick={() => update(car, { status: sold ? "available" : "sold" })}
      >
        {busy ? "Saving…" : sold ? "Mark available" : "Mark sold"}
      </Button>
    );
  };

  const empty = (
    <EmptyState
      icon={CarIcon}
      title={hasFilters ? "No cars match your filters" : "No cars yet"}
      text={hasFilters ? "Try a different search or filter." : "Add your first vehicle to start selling."}
      action={
        !hasFilters && can("cars.create") && !compact ? (
          <Link to="/admin/cars/new" className={btnClass("primary")}><Plus size={16} /> Add car</Link>
        ) : null
      }
    />
  );

  const colCount = compact ? 4 + (showActions ? 1 : 0) : 6 + (showActions ? 1 : 0);

  const list = (
    <Card className="overflow-hidden">
      {compact ? (
        <CardHeader
          title="Latest cars"
          subtitle={`${total} vehicles in total`}
          actions={<Link to="/admin/cars" className="text-xs font-semibold text-[#1B7DB3] hover:underline">Manage all cars →</Link>}
        />
      ) : (
        <>
          {/* TOOLBAR */}
          <div className="px-4 sm:px-5 border-b border-gray-100 flex items-center justify-between gap-3">
            <Tabs tabs={TABS} value={tab} onChange={resetPage(setTab)} />
            <span className="text-xs text-gray-500 whitespace-nowrap">{loading ? "Loading…" : `${total} result${total === 1 ? "" : "s"}`}</span>
          </div>
          <div className="p-4 sm:px-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_200px_200px] gap-3 border-b border-gray-100 bg-gray-50/50">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search make, model, chassis or stock no."
                aria-label="Search cars"
                className={cx(inputClass, "pl-9")}
              />
            </div>
            <select aria-label="Filter by make" value={make} onChange={(e) => resetPage(setMake)(e.target.value)} className={inputClass}>
              <option value="">All makes</option>
              {makes.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select aria-label="Sort cars" value={sort} onChange={(e) => resetPage(setSort)(e.target.value)} className={inputClass}>
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </>
      )}

      {/* CARDS (phones and tablets) */}
      <div className="lg:hidden divide-y divide-gray-100">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="p-4 animate-pulse flex gap-3">
              <div className="w-20 h-14 bg-gray-100 rounded-lg" />
              <div className="flex-1 space-y-2"><div className="h-4 bg-gray-100 rounded w-2/3" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div>
            </div>
          ))
        ) : cars.length === 0 ? (
          empty
        ) : (
          cars.map((car) => (
            <div key={car._id} className="p-4">
              <div className="flex gap-3">
                <Thumb src={car.images?.[0]} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-900 leading-snug line-clamp-2">{title(car)}</p>
                    <StatusBadge sold={car.status === "sold"} />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Stock #{car.stockNo ?? "—"} · {km(car.mileage)}</p>
                  <p className="text-sm font-bold text-[#0A1628] mt-1">{usd(car.price)}</p>
                </div>
              </div>
              {(car.isRecommended || car.isBestDeal) && <div className="mt-2"><Flags car={car} /></div>}
              {!compact && showActions && (
                <div className="mt-3 flex items-center gap-2">
                  {soldToggle(car, "flex-1")}
                  {iconActions(car)}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* TABLE (laptops and larger) */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
              <th className="px-5 py-3 text-left font-semibold">Vehicle</th>
              <th className="px-4 py-3 text-right font-semibold">FOB price</th>
              {!compact && <th className="px-4 py-3 text-right font-semibold">Mileage</th>}
              {!compact && <th className="px-4 py-3 text-right font-semibold hidden 2xl:table-cell">Views</th>}
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              {!compact && <th className="px-4 py-3 text-left font-semibold hidden xl:table-cell">Listing</th>}
              {showActions && <th className="px-5 py-3 text-right font-semibold">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array(compact ? 4 : 6).fill(0).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={colCount} className="px-5 py-3"><div className="h-11 bg-gray-100 rounded-lg" /></td>
                </tr>
              ))
            ) : cars.length === 0 ? (
              <tr><td colSpan={colCount}>{empty}</td></tr>
            ) : (
              cars.map((car) => (
                <tr key={car._id} className="hover:bg-[#F5F9FF] transition">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Thumb src={car.images?.[0]} />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate max-w-[280px]">{title(car)}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[280px]">
                          Stock #{car.stockNo ?? "—"}
                          {car.vin ? ` · ${car.vin}` : ""}
                          {car.location ? ` · ${car.location}` : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <span className="font-semibold text-[#0A1628]">{usd(car.price)}</span>
                    {car.originalPrice > car.price && (
                      <span className="block text-xs text-gray-400 line-through">{usd(car.originalPrice)}</span>
                    )}
                  </td>
                  {!compact && <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap tabular-nums">{km(car.mileage)}</td>}
                  {!compact && <td className="px-4 py-3 text-right text-gray-600 tabular-nums hidden 2xl:table-cell">{car.views || 0}</td>}
                  <td className="px-4 py-3"><StatusBadge sold={car.status === "sold"} /></td>
                  {!compact && <td className="px-4 py-3 hidden xl:table-cell"><Flags car={car} /></td>}
                  {showActions && (
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {!compact && soldToggle(car)}
                        {compact ? (
                          canEdit && (
                            <IconButton label="Edit" onClick={() => navigate(`/admin/cars/edit/${car._id}`)}>
                              <Pencil size={15} />
                            </IconButton>
                          )
                        ) : (
                          iconActions(car)
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {!compact && totalPages > 1 && (
        <div className="px-4 sm:px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500">Page {page} of {totalPages} · {total} vehicles</p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft size={14} /> Prev
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );

  if (compact) return list;

  return (
    <div>
      <PageHeader
        title="Cars"
        subtitle="Manage stock, prices and how vehicles appear on the website."
        actions={
          can("cars.create") && (
            <Link to="/admin/cars/new" className={btnClass("primary")}>
              <Plus size={16} /> Add car
            </Link>
          )
        }
      />
      {list}
    </div>
  );
}
