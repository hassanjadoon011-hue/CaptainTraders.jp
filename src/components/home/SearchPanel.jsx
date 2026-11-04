import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { yearOptions } from "../../constants/carOptions";

const FALLBACK_MAKES = [
  "Toyota", "Honda", "Nissan", "Mazda", "Mitsubishi",
  "Suzuki", "Subaru", "Isuzu", "Daihatsu", "Lexus",
];

const fieldClass =
  "w-full px-4 py-2.5 rounded-lg border-0 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-white shadow bg-white";

function Label({ children }) {
  return (
    <label className="text-white text-xs font-semibold uppercase tracking-wider">
      {children}
    </label>
  );
}

export default function SearchPanel() {
  const navigate = useNavigate();

  const [meta, setMeta] = useState({ makes: [], models: [], locations: [], colors: [] });
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [location, setLocation] = useState("");
  const [color, setColor] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");

  // Options come from the real stock; models follow the chosen make
  useEffect(() => {
    let cancelled = false;
    axiosClient
      .get("/cars/meta", { params: make ? { make } : {} })
      .then((res) => {
        if (cancelled) return;
        const d = res.data?.data || {};
        setMeta({
          makes: d.makes || [],
          models: d.models || [],
          locations: d.locations || [],
          colors: d.colors || [],
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [make]);

  const makes = meta.makes.length > 0 ? meta.makes : FALLBACK_MAKES;
  const years = yearOptions(40);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (make) params.set("make", make);
    if (model) params.set("model", model);
    if (location) params.set("location", location);
    if (color) params.set("color", color);
    if (yearFrom) params.set("yearFrom", yearFrom);
    if (yearTo) params.set("yearTo", yearTo);

    const qs = params.toString();
    navigate(qs ? `/cars?${qs}` : "/cars");
  };

  return (
    <div className="w-full bg-sky-400 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">

        <h2 className="text-white text-xl sm:text-2xl font-bold mb-6 text-center tracking-wide">
          🔍 Search For Your Perfect Car
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">

          <div className="flex flex-col gap-1">
            <Label>Make</Label>
            <select
              value={make}
              onChange={(e) => { setMake(e.target.value); setModel(""); }}
              className={fieldClass}
            >
              <option value="">All Makes</option>
              {makes.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <Label>Model</Label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={!make || meta.models.length === 0}
              className={fieldClass + " disabled:opacity-60"}
            >
              <option value="">{make ? "All Models" : "Select make first"}</option>
              {meta.models.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <Label>Location</Label>
            <select value={location} onChange={(e) => setLocation(e.target.value)} className={fieldClass}>
              <option value="">Any Location</option>
              {meta.locations.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <Label>Color</Label>
            <select value={color} onChange={(e) => setColor(e.target.value)} className={fieldClass}>
              <option value="">Any Color</option>
              {meta.colors.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <Label>Year From</Label>
            <select value={yearFrom} onChange={(e) => setYearFrom(e.target.value)} className={fieldClass}>
              <option value="">Any Year</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <Label>Year To</Label>
            <select value={yearTo} onChange={(e) => setYearTo(e.target.value)} className={fieldClass}>
              <option value="">Any Year</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

        </div>

        <div className="flex justify-center mt-4">
          <button
            onClick={handleSearch}
            className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white font-bold px-6 sm:px-16 py-3 rounded-lg text-base transition-all shadow-xl tracking-wide"
          >
            🔍 SEARCH CARS
          </button>
        </div>

      </div>
    </div>
  );
}