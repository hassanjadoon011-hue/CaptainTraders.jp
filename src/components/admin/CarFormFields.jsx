import { useEffect, useState } from "react";
import {
  CarFront as Car, DollarSign, Zap, Gauge, FileText, Upload, X,
  CheckCircle, ListChecks, CalendarDays, MapPin, Ruler,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";
import { VEHICLE_TYPES, FEATURE_OPTIONS, MONTHS } from "../../constants/carOptions";
import { inputClass } from "./ui";

/* ───────────── shared helpers ───────────── */

export const EMPTY_CAR = {
  make: "", model: "", year: "",
  price: "", originalPrice: "", mileage: "", condition: "",
  engine: "", engineCode: "", power: "", fuelType: "",
  transmission: "", drivetrain: "", bodyType: "", vehicleType: "", steering: "", color: "",
  vin: "", modelCode: "", location: "",
  regYear: "", regMonth: "", mfgYear: "", mfgMonth: "",
  seats: "", doors: "", m3: "",
  features: [], description: "",
  status: "available", isFeatured: false, isRecommended: false, isBestDeal: false,
  images: [],
};

const NUMBER_FIELDS = [
  "year", "price", "originalPrice", "mileage",
  "regYear", "regMonth", "mfgYear", "mfgMonth", "seats", "doors", "m3",
];

// Turns a car from the database into form values
export const carToForm = (car) => {
  const form = { ...EMPTY_CAR };
  for (const key of Object.keys(EMPTY_CAR)) {
    const v = car[key];
    if (v === undefined || v === null) continue;
    form[key] = v;
  }
  form.status = car.status === "sold" ? "sold" : "available";
  form.features = Array.isArray(car.features) ? car.features : [];
  form.images = Array.isArray(car.images) ? car.images : [];
  return form;
};

// Turns form values into what the API expects
export const formToPayload = (form) => {
  const out = { ...form };
  for (const key of NUMBER_FIELDS) {
    out[key] = form[key] === "" || form[key] == null ? "" : Number(form[key]);
  }
  return out;
};

export const validateCarForm = (form) => {
  if (!String(form.make).trim()) return "Make is required.";
  if (!String(form.model).trim()) return "Model is required.";

  const year = Number(form.year);
  if (!year || year < 1950 || year > 2100) return "Please enter a valid year, e.g. 2024.";

  const price = Number(form.price);
  if (!price || price <= 0) return "Please enter a valid price.";

  for (const key of NUMBER_FIELDS) {
    if (form[key] === "" || form[key] == null) continue;
    const n = Number(form[key]);
    if (!Number.isFinite(n) || n < 0) return `Please check the value of "${key}".`;
  }

  if (form.originalPrice !== "" && Number(form.originalPrice) > 0 &&
      Number(form.originalPrice) < price) {
    return "Original price should be equal to or higher than the current price.";
  }

  if (form.images.length === 0) return "Please upload at least one image.";
  return "";
};

// The admin page scrolls inside <main>, not the window
export const scrollAdminToTop = () => {
  const main = document.querySelector("main");
  if (main) main.scrollTo({ top: 0, behavior: "smooth" });
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const uploadImages = async (files) => {
  const urls = [];
  for (const file of files) {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "unsigned_upload");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dyrwl0jrp/image/upload",
      { method: "POST", body: data }
    );
    const json = await res.json();
    if (json.secure_url) urls.push(json.secure_url);
  }
  return urls;
};

export function useImageUploader(setForm, setError) {
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setError("");

    try {
      const urls = await uploadImages(files);
      if (urls.length === 0) setError("Image upload failed. Please try again.");
      setForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch (err) {
      console.log("Upload error:", err);
      setError("Image upload failed. Please check your connection and try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return { uploading, handleImageUpload };
}

/* ───────────── UI pieces ───────────── */

const input = inputClass;
const select = inputClass;
const card = "bg-white rounded-xl border border-gray-200/70 shadow-sm p-4 sm:p-6";
const grid3 = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4";

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100 -mx-4 sm:-mx-6 px-4 sm:px-6">
      <div className="w-9 h-9 bg-[#E0F5FF] rounded-lg flex items-center justify-center shrink-0">
        <Icon size={18} className="text-[#1B7DB3]" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-[#0A1628]">{title}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="min-w-0">
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function Check({ checked, onChange, children }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="w-4 h-4" />
      {children}
    </label>
  );
}

/* ───────────── the form sections ───────────── */

export default function CarFormFields({ form, setForm, uploading, onUpload }) {
  const [meta, setMeta] = useState({ makes: [], locations: [], models: [] });

  // Existing makes and yards, offered as suggestions so names stay consistent
  useEffect(() => {
    axiosClient
      .get("/cars/meta")
      .then((res) => {
        const d = res.data?.data || {};
        setMeta((p) => ({ ...p, makes: d.makes || [], locations: d.locations || [] }));
      })
      .catch(() => {});
  }, []);

  // Existing models of the typed make
  useEffect(() => {
    const make = String(form.make || "").trim();
    if (!make) {
      setMeta((p) => ({ ...p, models: [] }));
      return;
    }
    const t = setTimeout(() => {
      axiosClient
        .get("/cars/meta", { params: { make } })
        .then((res) => setMeta((p) => ({ ...p, models: res.data?.data?.models || [] })))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [form.make]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const toggle = (name) => (e) =>
    setForm((prev) => ({ ...prev, [name]: e.target.checked }));

  const toggleFeature = (name) =>
    setForm((prev) => ({
      ...prev,
      features: prev.features.includes(name)
        ? prev.features.filter((f) => f !== name)
        : [...prev.features, name],
    }));

  const removeImage = (index) =>
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));

  const makeCover = (index) =>
    setForm((prev) => {
      const imgs = [...prev.images];
      const [picked] = imgs.splice(index, 1);
      imgs.unshift(picked);
      return { ...prev, images: imgs };
    });

  return (
    <div className="space-y-4 sm:space-y-5">

      {/* BASIC */}
      <div className={card}>
        <SectionTitle icon={Car} title="Basic Information" subtitle="Make, model and year of the vehicle" />
        <div className={grid3}>
          <Field label="Make *">
            <input className={input} name="make" list="make-list" placeholder="e.g. Toyota" value={form.make} onChange={handleChange} />
            <datalist id="make-list">{meta.makes.map((m) => <option key={m} value={m} />)}</datalist>
          </Field>
          <Field label="Model *">
            <input className={input} name="model" list="model-list" placeholder="e.g. Corolla" value={form.model} onChange={handleChange} />
            <datalist id="model-list">{meta.models.map((m) => <option key={m} value={m} />)}</datalist>
          </Field>
          <Field label="Year *">
            <input className={input} name="year" inputMode="numeric" placeholder="e.g. 2024" value={form.year} onChange={handleChange} />
          </Field>
        </div>
      </div>

      {/* PRICING */}
      <div className={card}>
        <SectionTitle icon={DollarSign} title="Pricing & Condition" subtitle="FOB price, mileage and vehicle condition" />
        <div className={grid3}>
          <Field label="FOB Price ($) *">
            <input className={input} name="price" inputMode="numeric" placeholder="e.g. 15000" value={form.price} onChange={handleChange} />
          </Field>
          <Field label="Original FOB Price ($)" hint="Optional. Fill in only if the price was reduced, to show 'You Save'.">
            <input className={input} name="originalPrice" inputMode="numeric" placeholder="e.g. 16500" value={form.originalPrice} onChange={handleChange} />
          </Field>
          <Field label="Mileage (km)">
            <input className={input} name="mileage" inputMode="numeric" placeholder="e.g. 45000" value={form.mileage} onChange={handleChange} />
          </Field>
          <Field label="Condition">
            <select className={select} name="condition" value={form.condition} onChange={handleChange}>
              <option value="">Select condition</option>
              <option>New</option>
              <option>Used</option>
              <option>Reconditioned</option>
            </select>
          </Field>
        </div>
      </div>

      {/* IDENTITY */}
      <div className={card}>
        <SectionTitle icon={MapPin} title="Identity & Location" subtitle="Chassis number, codes and where the car is" />
        <div className={grid3}>
          <Field label="Chassis No.">
            <input className={input} name="vin" placeholder="e.g. FF21S-103657" value={form.vin} onChange={handleChange} />
          </Field>
          <Field label="Model Code">
            <input className={input} name="modelCode" placeholder="e.g. DAA-FF21S" value={form.modelCode} onChange={handleChange} />
          </Field>
          <Field label="Engine Code">
            <input className={input} name="engineCode" placeholder="e.g. K12C" value={form.engineCode} onChange={handleChange} />
          </Field>
          <Field label="Location / Yard">
            <input className={input} name="location" list="location-list" placeholder="e.g. Nagoya" value={form.location} onChange={handleChange} />
            <datalist id="location-list">{meta.locations.map((l) => <option key={l} value={l} />)}</datalist>
          </Field>
        </div>
      </div>

      {/* REGISTRATION */}
      <div className={card}>
        <SectionTitle icon={CalendarDays} title="Registration & Manufacture" subtitle="Year and month, if known" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Registration Year">
            <input className={input} name="regYear" inputMode="numeric" placeholder="e.g. 2016" value={form.regYear} onChange={handleChange} />
          </Field>
          <Field label="Registration Month">
            <select className={select} name="regMonth" value={form.regMonth} onChange={handleChange}>
              <option value="">Month</option>
              {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Manufacture Year">
            <input className={input} name="mfgYear" inputMode="numeric" placeholder="e.g. 2016" value={form.mfgYear} onChange={handleChange} />
          </Field>
          <Field label="Manufacture Month">
            <select className={select} name="mfgMonth" value={form.mfgMonth} onChange={handleChange}>
              <option value="">Month</option>
              {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* ENGINE */}
      <div className={card}>
        <SectionTitle icon={Zap} title="Engine & Performance" subtitle="Technical specifications of the vehicle" />
        <div className={grid3}>
          <Field label="Engine (cc)">
            <input className={input} name="engine" placeholder="e.g. 1800" value={form.engine} onChange={handleChange} />
          </Field>
          <Field label="Power (HP)">
            <input className={input} name="power" placeholder="e.g. 140" value={form.power} onChange={handleChange} />
          </Field>
          <Field label="Fuel Type">
            <select className={select} name="fuelType" value={form.fuelType} onChange={handleChange}>
              <option value="">Select fuel type</option>
              <option>Petrol</option>
              <option>Diesel</option>
              <option>Hybrid</option>
              <option>Electric</option>
            </select>
          </Field>
        </div>
      </div>

      {/* BODY */}
      <div className={card}>
        <SectionTitle icon={Gauge} title="Transmission & Body" subtitle="Drive, transmission, body and vehicle type" />
        <div className={grid3}>
          <Field label="Transmission">
            <select className={select} name="transmission" value={form.transmission} onChange={handleChange}>
              <option value="">Select transmission</option>
              <option>Automatic</option>
              <option>Manual</option>
            </select>
          </Field>
          <Field label="Drivetrain">
            <select className={select} name="drivetrain" value={form.drivetrain} onChange={handleChange}>
              <option value="">Select drivetrain</option>
              <option>FWD</option>
              <option>RWD</option>
              <option>AWD</option>
              <option>4WD</option>
            </select>
          </Field>
          <Field label="Body Type">
            <select className={select} name="bodyType" value={form.bodyType} onChange={handleChange}>
              <option value="">Select body type</option>
              <option>Sedan</option>
              <option>SUV</option>
              <option>Hatchback</option>
              <option>Coupe</option>
              <option>Wagon</option>
              <option>Minivan</option>
              <option>Pickup</option>
              <option>Truck</option>
              <option>Van</option>
              <option>Bus</option>
            </select>
          </Field>
          <Field label="Vehicle Type">
            <select className={select} name="vehicleType" value={form.vehicleType} onChange={handleChange}>
              <option value="">Select vehicle type</option>
              {VEHICLE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Steering">
            <select className={select} name="steering" value={form.steering} onChange={handleChange}>
              <option value="">Select steering</option>
              <option>Right</option>
              <option>Left</option>
            </select>
          </Field>
          <Field label="Exterior Color">
            <input className={input} name="color" placeholder="e.g. Pearl White" value={form.color} onChange={handleChange} />
          </Field>
        </div>
      </div>

      {/* SIZE */}
      <div className={card}>
        <SectionTitle icon={Ruler} title="Size" subtitle="Seats, doors and volume (volume is used to work out shipping cost)" />
        <div className={grid3}>
          <Field label="Seats">
            <input className={input} name="seats" inputMode="numeric" placeholder="e.g. 5" value={form.seats} onChange={handleChange} />
          </Field>
          <Field label="Doors">
            <input className={input} name="doors" inputMode="numeric" placeholder="e.g. 5" value={form.doors} onChange={handleChange} />
          </Field>
          <Field label="Volume (M³)">
            <input className={input} name="m3" inputMode="decimal" placeholder="e.g. 9.942" value={form.m3} onChange={handleChange} />
          </Field>
        </div>
      </div>

      {/* FEATURES */}
      <div className={card}>
        <SectionTitle icon={ListChecks} title="Standard Features" subtitle="Tick everything the car has" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {FEATURE_OPTIONS.map((f) => (
            <Check key={f} checked={form.features.includes(f)} onChange={() => toggleFeature(f)}>
              {f}
            </Check>
          ))}
        </div>
      </div>

      {/* LISTING OPTIONS */}
      <div className={card}>
        <SectionTitle icon={CheckCircle} title="Listing Options" subtitle="Status and where the car is highlighted" />
        <div className={grid3}>
          <Field label="Status">
            <select className={select} name="status" value={form.status} onChange={handleChange}>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
            </select>
          </Field>
          <div className="flex flex-col justify-end gap-3 sm:pb-2">
            <Check checked={form.isFeatured} onChange={toggle("isFeatured")}>Featured car</Check>
            <Check checked={form.isRecommended} onChange={toggle("isRecommended")}>Recommended</Check>
            <Check checked={form.isBestDeal} onChange={toggle("isBestDeal")}>Best Deal</Check>
          </div>
        </div>
      </div>

      {/* DESCRIPTION */}
      <div className={card}>
        <SectionTitle icon={FileText} title="Description" subtitle="Write a detailed description of the vehicle" />
        <textarea
          className={input + " h-32 resize-none"}
          name="description"
          placeholder="Describe the vehicle condition, features, history, and any additional details..."
          value={form.description}
          onChange={handleChange}
        />
      </div>

      {/* IMAGES */}
      <div className={card}>
        <SectionTitle icon={Upload} title="Vehicle Images *" subtitle="The first image is the cover photo. Use 'Set cover' to change it." />

        <label className="block cursor-pointer">
          <div className="border-2 border-dashed border-gray-200 hover:border-[#29ABE2] rounded-xl p-6 sm:p-8 text-center transition group">
            <div className="w-12 h-12 bg-[#29ABE2]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Upload size={20} className="text-[#29ABE2]" />
            </div>
            <p className="text-sm font-semibold text-gray-700 group-hover:text-[#29ABE2] transition">
              Tap to upload images
            </p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP supported — multiple files allowed</p>
            {uploading && (
              <p className="text-[#29ABE2] text-sm mt-3 font-medium animate-pulse">Uploading images...</p>
            )}
          </div>
          <input type="file" multiple accept="image/*" onChange={onUpload} className="hidden" />
        </label>

        {form.images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
            {form.images.map((img, i) => (
              <div key={`${img}-${i}`} className="relative group">
                <img src={img} alt={`Car ${i + 1}`} className="h-24 w-full object-cover rounded-lg border border-gray-200" />
                {i === 0 ? (
                  <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded">Cover</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => makeCover(i)}
                    className="absolute bottom-1 left-1 text-[9px] bg-white/90 text-gray-700 px-1.5 py-0.5 rounded hover:bg-white"
                  >
                    Set cover
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  aria-label="Remove image"
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}