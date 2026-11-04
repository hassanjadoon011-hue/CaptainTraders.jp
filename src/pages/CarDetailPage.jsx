import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Printer, MessageSquare, Eye, ChevronRight, AlertTriangle, Check } from "lucide-react";
import axiosClient from "../api/axiosClient";
import CarCard from "../components/cars/CarCard";
import ImageGallery from "../components/cars/detail/ImageGallery";
import PriceCalculator from "../components/cars/detail/PriceCalculator";
import InquiryForm from "../components/cars/detail/InquiryForm";
import { usd } from "../constants/stockOptions";


const ym = (y, m) => (y ? (m ? `${y} / ${m}` : `${y}`) : null);

const buildSpecs = (c) => [
  ["Stock No", c.stockNo],
  ["Transmission", c.transmission],
  ["Location", c.location],
  ["Fuel", c.fuelType],
  ["Chassis No.", c.vin],
  ["Drive", c.drivetrain],
  ["Model Code", c.modelCode],
  ["Ext. Color", c.color],
  ["Registration Year / Month", ym(c.regYear, c.regMonth)],
  ["Steering", c.steering],
  ["Manufacture Year / Month", ym(c.mfgYear, c.mfgMonth)],
  ["Seats", c.seats],
  ["Mileage", c.mileage != null ? `${Number(c.mileage).toLocaleString()} km` : null],
  ["Doors", c.doors],
  ["Engine Size", c.engine ? `${c.engine}${/cc/i.test(c.engine) ? "" : " CC"}` : null],
  ["Body Type", c.bodyType],
  ["Engine Code", c.engineCode],
  ["Volume (M³)", c.m3],
];

function Skeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
      <div className="h-4 w-64 bg-gray-200 rounded mb-6" />
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 aspect-[4/3] bg-gray-200 rounded-xl" />
        <div className="lg:col-span-2 h-96 bg-gray-200 rounded-xl" />
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
      .then((res) => {
        if (!cancelled) setCar(res.data?.data || null);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

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

  if (loading) return <Skeleton />;

  if (notFound || !car) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <AlertTriangle size={40} className="mx-auto text-gray-300" />
        <h1 className="text-xl font-bold text-gray-800 mt-4">Vehicle not found</h1>
        <p className="text-sm text-gray-500 mt-2">It may have been sold or removed.</p>
        <Link to="/cars" className="inline-block mt-6 bg-[#29ABE2] hover:bg-[#1B7DB3] text-white font-semibold px-6 py-2.5 rounded-lg transition">
          Browse all stock
        </Link>
      </div>
    );
  }

  const sold = car.status === "sold";
  const title = [car.year, car.make, car.model].filter(Boolean).join(" ");
  const saving = car.originalPrice && car.originalPrice > car.price ? car.originalPrice - car.price : 0;
  const savingPct = saving ? ((saving / car.originalPrice) * 100).toFixed(1) : 0;
  const specs = buildSpecs(car);

  return (
    <div className="bg-[#F5F9FF] min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5">

        {/* BREADCRUMB */}
        <nav className="flex items-center flex-wrap gap-1 text-xs text-gray-500 mb-4" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-[#29ABE2]">Home</Link>
          <ChevronRight size={12} />
          <Link to="/cars" className="hover:text-[#29ABE2]">Stock</Link>
          {car.make && (
            <>
              <ChevronRight size={12} />
              <Link to={`/cars?make=${encodeURIComponent(car.make)}`} className="hover:text-[#29ABE2]">{car.make}</Link>
            </>
          )}
          <ChevronRight size={12} />
          <span className="text-gray-800 font-medium">{car.model}</span>
        </nav>

        {/* TITLE */}
        <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              {sold && <span className="text-xs font-bold bg-red-100 text-red-600 px-2.5 py-1 rounded-full">SOLD</span>}
              {car.isBestDeal && <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">Best Deal</span>}
              {car.isRecommended && <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">Recommended</span>}
              {car.condition && <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{car.condition}</span>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg transition print:hidden"
          >
            <Printer size={16} /> Print
          </button>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

          {/* PHOTOS (phones: first) */}
          <div className="lg:col-span-3 min-w-0">
            <ImageGallery images={car.images || []} alt={title} sold={sold} />
          </div>

          {/* PRICE + CALCULATOR (phones: right after photos; desktop: right column) */}
          <div className="lg:col-span-2 lg:col-start-4 lg:row-start-1 lg:row-span-2 space-y-6 min-w-0">
            <div className="lg:sticky lg:top-4 space-y-6">

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Current FOB price</p>
                <p className="text-3xl font-extrabold text-[#1B7DB3] mt-1">{usd(car.price)}</p>

                {saving > 0 && (
                  <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">You save</p>
                      <p className="font-bold text-green-700">{usd(saving)} ({savingPct}%)</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Original FOB price</p>
                      <p className="font-bold text-gray-500 line-through">{usd(car.originalPrice)}</p>
                    </div>
                  </div>
                )}

                <p className="flex items-center gap-1.5 text-xs text-gray-400 mt-4">
                  <Eye size={14} /> Page views: {Number(car.views || 0).toLocaleString()}
                </p>

                {!sold && (
                  <button
                    type="button"
                    onClick={() => document.getElementById("inquiry")?.scrollIntoView({ behavior: "smooth" })}
                    className="mt-4 w-full flex items-center justify-center gap-2 border border-[#29ABE2] text-[#1B7DB3] hover:bg-[#29ABE2]/5 font-semibold py-2.5 rounded-lg transition print:hidden"
                  >
                    <MessageSquare size={16} /> Send Inquiry
                  </button>
                )}
              </div>

              {sold ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
                  <p className="font-bold text-red-700">This vehicle has been sold</p>
                  <p className="text-sm text-red-600/80 mt-1">Browse our stock for similar vehicles.</p>
                  <Link to={`/cars?make=${encodeURIComponent(car.make || "")}`} className="inline-block mt-4 bg-[#29ABE2] hover:bg-[#1B7DB3] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition">
                    More {car.make} cars
                  </Link>
                </div>
              ) : (
                <div className="print:hidden">
                  <PriceCalculator key={car._id} car={car} setCalc={setCalc} setQuote={setQuote} />
                </div>
              )}
            </div>
          </div>

          {/* DETAILS (phones: after the price) */}
          <div className="lg:col-span-3 lg:col-start-1 space-y-6 min-w-0">

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">Car Details</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                {specs.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 py-2.5 border-b border-gray-100 text-sm">
                    <dt className="text-gray-500">{label}</dt>
                    <dd className="font-semibold text-gray-800 text-right">{value ?? "N/A"}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-xs text-gray-400 mt-4">
                For more information about the year and month of manufacture, please contact us.
              </p>
            </div>

            {car.features?.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <h2 className="text-base font-bold text-gray-900 mb-4">Standard Features</h2>
                <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {car.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check size={15} className="text-[#29ABE2] shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {car.description && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <h2 className="text-base font-bold text-gray-900 mb-3">Description</h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{car.description}</p>
              </div>
            )}
          </div>

        </div>

        {/* FORM */}
        {!sold && (
          <div className="mt-8 max-w-4xl print:hidden">
            <InquiryForm car={car} calc={calc} quote={quote} />
          </div>
        )}

        {/* MORE CARS */}
        {related.length > 0 && (
          <section className="mt-12 print:hidden">
            <h2 className="text-xl font-bold text-gray-900 mb-5">More Cars To Consider</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((c) => <CarCard key={c._id} car={c} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}