import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Printer, MessageSquare, ChevronRight, SearchX, Check } from "lucide-react";
import axiosClient from "../api/axiosClient";
import CarCard from "../components/cars/CarCard";
import ImageGallery from "../components/cars/detail/ImageGallery";
import PriceCalculator from "../components/cars/detail/PriceCalculator";
import InquiryForm from "../components/cars/detail/InquiryForm";
import { usd } from "../constants/stockOptions";

// Same number as the floating WhatsApp button
const WHATSAPP = "923164765002";

const ym = (y, m) => (y ? (m ? `${y} / ${String(m).padStart(2, "0")}` : `${y}`) : null);
const has = (v) => v !== null && v !== undefined && String(v).trim() !== "";
// "1800" -> "1,800 cc"; anything else ("2.8L") is shown as typed
const engineLabel = (e) => {
  if (!has(e)) return null;
  const n = Number(String(e).replace(/,/g, "").replace(/\s*cc$/i, ""));
  return Number.isFinite(n) && n > 0 ? `${n.toLocaleString()} cc` : String(e);
};

// Spec rows; rows without data are hidden
const buildSpecs = (c) =>
  [
    ["Stock No.", c.stockNo],
    ["Year", c.mfgYear ? ym(c.mfgYear, c.mfgMonth) : c.year],
    ["Mileage", c.mileage != null ? `${Number(c.mileage).toLocaleString()} km` : null],
    ["Engine", engineLabel(c.engine)],
    ["Fuel", c.fuelType],
    ["Transmission", c.transmission],
    ["Drive", c.drivetrain],
    ["Color", c.color],
    ["Location", c.location],
    ["Chassis No.", c.vin],
    ["Model Code", c.modelCode],
    ["Steering", c.steering],
    ["Body Type", c.bodyType],
    ["Seats", c.seats],
    ["Doors", c.doors],
    ["Registration", ym(c.regYear, c.regMonth)],
    ["Engine Code", c.engineCode],
    ["Volume", c.m3 ? `${c.m3} m³` : null],
  ].filter(([, v]) => has(v));

// Page title + meta description from the car
function useCarMeta(car) {
  useEffect(() => {
    if (!car) return;
    const title = [car.year, car.make, car.model].filter(Boolean).join(" ");
    const prevTitle = document.title;
    document.title = `${title} for sale | Captain Traders JP`;
    let meta = document.querySelector('meta[name="description"]');
    const created = !meta;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    const prevDesc = meta.content;
    meta.content = [
      `${title} from Japan`,
      car.mileage != null && `${Number(car.mileage).toLocaleString()} km`,
      car.engine && `${car.engine} cc`,
      car.fuelType,
      car.transmission,
      car.price && `Price ${usd(car.price)}`,
      "Worldwide export to your nearest port.",
    ].filter(Boolean).join(", ");
    return () => {
      document.title = prevTitle;
      if (created) meta.remove();
      else meta.content = prevDesc;
    };
  }, [car]);
}

const card = "bg-white rounded-xl border border-gray-100 shadow-sm";

function Skeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-pulse" aria-label="Loading vehicle">
      <div className="h-3 w-48 bg-gray-200 rounded mb-4" />
      <div className="h-8 w-2/3 max-w-md bg-gray-200 rounded mb-6" />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="aspect-[4/3] lg:aspect-[16/10] bg-gray-200 rounded-xl" />
          <div className="flex gap-2 mt-3">{[0, 1, 2, 3].map((i) => <div key={i} className="w-20 h-14 bg-gray-200 rounded-lg" />)}</div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="h-56 bg-gray-200 rounded-xl" />
          <div className="h-72 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function CarDetailPage() {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [calc, setCalc] = useState({ country: "", port: "", insurance: false, inspection: false });
  const [quote, setQuote] = useState(null);
  const countedFor = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setQuote(null);
    setCalc({ country: "", port: "", insurance: false, inspection: false });

    // Count the page view only once per visit to this car
    const countView = countedFor.current !== id;
    countedFor.current = id;

    axiosClient
      .get(`/cars/${id}`, { params: countView ? { view: 1 } : {} })
      .then((res) => { if (!cancelled) setCar(res.data?.data || null); })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [id]);

  // More cars of the same make
  useEffect(() => {
    if (!car?.make) return;
    axiosClient
      .get("/cars", { params: { make: car.make, status: "available", limit: 5 } })
      .then((res) => setRelated((res.data?.data || []).filter((c) => c._id !== car._id).slice(0, 4)))
      .catch(() => setRelated([]));
  }, [car?._id, car?.make]);

  useCarMeta(car);

  if (loading) return <Skeleton />;

  if (notFound || !car) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <span className="mx-auto w-16 h-16 rounded-full bg-[#E0F5FF] text-[#1B7DB3] flex items-center justify-center">
          <SearchX size={30} aria-hidden="true" />
        </span>
        <h1 className="text-xl font-bold text-gray-900 mt-5">We couldn't find this vehicle</h1>
        <p className="text-sm text-gray-500 mt-2">It may have been sold or removed. Plenty of similar cars are in stock.</p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/cars" className="inline-flex items-center justify-center h-12 px-6 rounded-lg bg-[#29ABE2] hover:bg-[#1B7DB3] text-white font-semibold transition">
            Browse all stock
          </Link>
          <Link to="/contact" className="inline-flex items-center justify-center h-12 px-6 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition">
            Contact us
          </Link>
        </div>
      </div>
    );
  }

  const sold = car.status === "sold";
  const title = [car.year, car.make, car.model].filter(Boolean).join(" ");
  const saving = car.originalPrice && car.originalPrice > car.price ? car.originalPrice - car.price : 0;
  const specs = buildSpecs(car);
  const toInquiry = () => document.getElementById("inquiry")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const waText = `Hello, I'm interested in ${title}${car.stockNo ? ` (Stock No. ${car.stockNo})` : ""}: ${window.location.href}`;
  const btn = "w-full h-12 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 transition";

  return (
    <div className="bg-[#F5F9FF] min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5">

        {/* BREADCRUMB */}
        <nav className="flex items-center flex-wrap gap-1 text-xs text-gray-500 mb-3 print:hidden" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-[#29ABE2] py-1">Home</Link>
          <ChevronRight size={12} aria-hidden="true" />
          <Link to="/cars" className="hover:text-[#29ABE2] py-1">Stock</Link>
          {car.make && (
            <>
              <ChevronRight size={12} aria-hidden="true" />
              <Link to={`/cars?make=${encodeURIComponent(car.make)}`} className="hover:text-[#29ABE2] py-1">{car.make}</Link>
            </>
          )}
          <ChevronRight size={12} aria-hidden="true" />
          <span className="text-gray-800 font-medium py-1" aria-current="page">{car.model}</span>
        </nav>

        {/* TITLE */}
        <div className="mb-5">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">{title}</h1>
          {(sold || car.isBestDeal || car.isRecommended || car.condition) && (
            <div className="flex items-center gap-2 flex-wrap mt-2">
              {sold && <span className="text-xs font-bold bg-red-100 text-red-600 px-2.5 py-1 rounded-full">SOLD</span>}
              {car.isBestDeal && <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">Best Deal</span>}
              {car.isRecommended && <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">Recommended</span>}
              {car.condition && <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{car.condition}</span>}
            </div>
          )}
        </div>

        {/* Phones/tablets: gallery → price → calculator → details. Desktop: 60% left column + sticky right column. */}
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-5 lg:items-start">
          <div className="contents lg:block lg:col-span-3 lg:space-y-6 min-w-0">
            <div className="order-1 min-w-0">
              <ImageGallery images={car.images || []} alt={title} sold={sold} />
            </div>

            <div className="order-3 space-y-6 min-w-0">
              {/* SPECIFICATIONS */}
              <section className={`${card} p-4 sm:p-6`} aria-labelledby="specs-title">
                <h2 id="specs-title" className="text-base font-bold text-gray-900 mb-3">Vehicle specifications</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-8">
                  {specs.map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-4 py-2.5 border-b border-gray-100 text-sm min-w-0">
                      <dt className="text-gray-500 shrink-0">{label}</dt>
                      <dd className="font-semibold text-gray-800 text-right break-all">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              {/* FEATURES */}
              {car.features?.length > 0 && (
                <section className={`${card} p-4 sm:p-6`} aria-labelledby="features-title">
                  <h2 id="features-title" className="text-base font-bold text-gray-900 mb-3">Features</h2>
                  <ul className="flex flex-wrap gap-2">
                    {car.features.map((f) => (
                      <li key={f} className="inline-flex items-center gap-1.5 text-sm text-gray-700 bg-[#F5F9FF] border border-[#29ABE2]/15 rounded-full px-3 py-1.5">
                        <Check size={14} className="text-[#29ABE2] shrink-0" aria-hidden="true" /> {f}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* DESCRIPTION */}
              {has(car.description) && (
                <section className={`${card} p-4 sm:p-6`} aria-labelledby="desc-title">
                  <h2 id="desc-title" className="text-base font-bold text-gray-900 mb-3">Description</h2>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line break-words">{car.description}</p>
                </section>
              )}
            </div>
          </div>

          {/* RIGHT: price card + calculator (sticky on desktop) */}
          <div className="order-2 lg:col-span-2 min-w-0 lg:sticky lg:top-4 space-y-6">
            <section className={`${card} p-5`} aria-label="Price">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</p>
                  <p className="text-3xl sm:text-4xl font-extrabold text-[#1B7DB3] mt-1 tabular-nums">{usd(car.price)}</p>
                  {saving > 0 && (
                    <p className="text-sm mt-1">
                      <span className="text-gray-400 line-through mr-2">{usd(car.originalPrice)}</span>
                      <span className="font-semibold text-green-700">Save {usd(saving)}</span>
                    </p>
                  )}
                </div>
                {car.stockNo != null && (
                  <p className="text-right text-xs text-gray-500 shrink-0">
                    Stock No.<span className="block text-sm font-bold text-gray-900">{car.stockNo}</span>
                  </p>
                )}
              </div>

              <div className="mt-5 space-y-2.5 print:hidden">
                {!sold && (
                  <button type="button" onClick={toInquiry} className={`${btn} bg-[#29ABE2] hover:bg-[#1B7DB3] text-white`}>
                    <MessageSquare size={16} /> Send Inquiry
                  </button>
                )}
                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(waText)}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`${btn} border border-gray-200 bg-white text-gray-700 hover:bg-gray-50`}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="#25D366" aria-hidden="true">
                      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88a9.83 9.83 0 0 1 7 2.9 9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.9 9.88M20.47 3.49A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.48-8.41" />
                    </svg>
                    WhatsApp
                  </a>
                  <button type="button" onClick={() => window.print()} className={`${btn} border border-gray-200 bg-white text-gray-700 hover:bg-gray-50`}>
                    <Printer size={16} /> Print
                  </button>
                </div>
              </div>
            </section>

            {sold ? (
              <section className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
                <p className="font-bold text-red-700">This vehicle has been sold</p>
                <p className="text-sm text-red-600/80 mt-1">Browse our stock for similar vehicles.</p>
                <Link to={`/cars?make=${encodeURIComponent(car.make || "")}`} className="inline-flex items-center justify-center h-12 mt-4 bg-[#29ABE2] hover:bg-[#1B7DB3] text-white text-sm font-semibold px-5 rounded-lg transition">
                  More {car.make} cars
                </Link>
              </section>
            ) : (
              <div className="print:hidden">
                <PriceCalculator key={car._id} car={car} setCalc={setCalc} setQuote={setQuote} onInquiry={toInquiry} />
              </div>
            )}
          </div>
        </div>

        {/* THE inquiry form (one, at the bottom) */}
        {!sold && (
          <div className="mt-8 lg:w-3/5 lg:pr-3 print:hidden">
            <InquiryForm car={car} calc={calc} quote={quote} />
          </div>
        )}

        {/* MORE CARS */}
        {related.length > 0 && (
          <section className="mt-12 print:hidden">
            <h2 className="text-xl font-bold text-gray-900 mb-5">More cars to consider</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((c) => <CarCard key={c._id} car={c} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
