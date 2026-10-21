import { useState } from "react";
import axiosClient from "../../api/axiosClient";
import {
  Car,
  DollarSign,
  Gauge,
  Zap,
  Palette,
  FileText,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const EMPTY = {
  make: "",
  model: "",
  year: "",
  price: "",
  mileage: "",
  engine: "",
  power: "",
  transmission: "",
  fuelType: "",
  drivetrain: "",
  bodyType: "",
  color: "",
  condition: "",
  vin: "",
  description: "",
  location: "",
  status: "available",
  isFeatured: false,
  images: [],
};

const input =
  "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 focus:ring-2 focus:ring-[#29ABE2] focus:border-transparent outline-none transition placeholder-gray-400 bg-white";

const select =
  "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 focus:ring-2 focus:ring-[#29ABE2] focus:border-transparent outline-none transition bg-white";

const card = "bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6";

// 1 column on phones, 2 on tablets, 3 on laptops
const grid3 = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4";

// The admin page scrolls inside <main>, not the window
const scrollToTop = () => {
  const main = document.querySelector("main");
  if (main) main.scrollTo({ top: 0, behavior: "smooth" });
  window.scrollTo({ top: 0, behavior: "smooth" });
};

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 bg-[#29ABE2]/10 rounded-lg flex items-center justify-center shrink-0">
        <Icon size={18} className="text-[#29ABE2]" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-gray-800">{title}</p>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="min-w-0">
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export default function AddCarForm() {
  const [form, setForm] = useState(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  /* ================= CLOUDINARY UPLOAD ================= */
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setError("");

    try {
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

      if (urls.length === 0) {
        setError("Image upload failed. Please try again.");
      }

      setForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch (err) {
      console.log("Upload error:", err);
      setError("Image upload failed. Please check your connection and try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  /* ================= REMOVE IMAGE ================= */
  const removeImage = (index) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  /* ================= VALIDATION ================= */
  const validate = () => {
    if (!form.make.trim()) return "Make is required.";
    if (!form.model.trim()) return "Model is required.";

    const year = Number(form.year);
    if (!year || year < 1980 || year > 2100) return "Please enter a valid year, e.g. 2024.";

    const price = Number(form.price);
    if (!price || price <= 0) return "Please enter a valid price.";

    if (form.mileage !== "" && (Number.isNaN(Number(form.mileage)) || Number(form.mileage) < 0)) {
      return "Mileage must be a positive number.";
    }

    if (form.images.length === 0) return "Please upload at least one image.";

    return "";
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const problem = validate();
    if (problem) {
      setError(problem);
      scrollToTop();
      return;
    }

    setLoading(true);

    try {
      await axiosClient.post("/cars", {
        make: form.make,
        model: form.model,
        year: Number(form.year),
        price: Number(form.price),
        mileage: form.mileage === "" ? 0 : Number(form.mileage),
        engine: form.engine,
        power: form.power,
        transmission: form.transmission,
        fuelType: form.fuelType,
        drivetrain: form.drivetrain,
        bodyType: form.bodyType,
        color: form.color,
        condition: form.condition,
        vin: form.vin,
        description: form.description,
        location: form.location,
        status: form.status,
        isFeatured: form.isFeatured,
        images: form.images,
      });

      setSuccess(true);
      setForm(EMPTY);
      window.dispatchEvent(new Event("cars-updated"));
      scrollToTop();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || "Error adding car. Please try again.");
      scrollToTop();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">

      {/* PAGE HEADER */}
      <div className="mb-5 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Add New Car</h1>
        <p className="text-sm text-gray-500 mt-1">
          Fill in the details below to add a new vehicle to your inventory
        </p>
      </div>

      {/* SUCCESS BANNER */}
      {success && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 px-4 sm:px-5 py-3 rounded-xl mb-5 sm:mb-6">
          <CheckCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm font-medium">Car added to inventory successfully!</p>
        </div>
      )}

      {/* ERROR BANNER */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 sm:px-5 py-3 rounded-xl mb-5 sm:mb-6">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

        {/* ── BASIC INFORMATION ── */}
        <div className={card}>
          <SectionTitle
            icon={Car}
            title="Basic Information"
            subtitle="Make, model and year of the vehicle"
          />
          <div className={grid3}>
            <Field label="Make *">
              <input className={input} name="make" placeholder="e.g. Toyota" value={form.make} onChange={handleChange} />
            </Field>
            <Field label="Model *">
              <input className={input} name="model" placeholder="e.g. Corolla" value={form.model} onChange={handleChange} />
            </Field>
            <Field label="Year *">
              <input className={input} name="year" inputMode="numeric" placeholder="e.g. 2024" value={form.year} onChange={handleChange} />
            </Field>
          </div>
        </div>

        {/* ── PRICING & CONDITION ── */}
        <div className={card}>
          <SectionTitle
            icon={DollarSign}
            title="Pricing & Condition"
            subtitle="Set the price, mileage and vehicle condition"
          />
          <div className={grid3}>
            <Field label="Price ($) *">
              <input className={input} name="price" inputMode="numeric" placeholder="e.g. 15000" value={form.price} onChange={handleChange} />
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

        {/* ── ENGINE & PERFORMANCE ── */}
        <div className={card}>
          <SectionTitle
            icon={Zap}
            title="Engine & Performance"
            subtitle="Technical specifications of the vehicle"
          />
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

        {/* ── TRANSMISSION & BODY ── */}
        <div className={card}>
          <SectionTitle
            icon={Gauge}
            title="Transmission & Body"
            subtitle="Drivetrain, transmission and body style"
          />
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
              </select>
            </Field>
            <Field label="Body Type">
              <select className={select} name="bodyType" value={form.bodyType} onChange={handleChange}>
                <option value="">Select body type</option>
                <option>Sedan</option>
                <option>SUV</option>
                <option>Hatchback</option>
                <option>Coupe</option>
                <option>Truck</option>
                <option>Van</option>
              </select>
            </Field>
          </div>
        </div>

        {/* ── APPEARANCE ── */}
        <div className={card}>
          <SectionTitle
            icon={Palette}
            title="Appearance, Identity & Location"
            subtitle="Color, VIN number and where the car is located"
          />
          <div className={grid3}>
            <Field label="Color">
              <input className={input} name="color" placeholder="e.g. Pearl White" value={form.color} onChange={handleChange} />
            </Field>
            <Field label="VIN Number">
              <input className={input} name="vin" placeholder="e.g. JT2BF22K1W0066078" value={form.vin} onChange={handleChange} />
            </Field>
            <Field label="Location">
              <input className={input} name="location" placeholder="e.g. Tokyo, Japan" value={form.location} onChange={handleChange} />
            </Field>
          </div>
        </div>

        {/* ── LISTING OPTIONS ── */}
        <div className={card}>
          <SectionTitle
            icon={CheckCircle}
            title="Listing Options"
            subtitle="Choose whether the car is for sale and if it should be highlighted"
          />
          <div className={grid3}>
            <Field label="Status">
              <select className={select} name="status" value={form.status} onChange={handleChange}>
                <option value="available">Available</option>
                <option value="sold">Sold</option>
              </select>
            </Field>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer sm:pb-2.5">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, isFeatured: e.target.checked }))
                  }
                  className="w-4 h-4"
                />
                Featured car
              </label>
            </div>
          </div>
        </div>

        {/* ── DESCRIPTION ── */}
        <div className={card}>
          <SectionTitle
            icon={FileText}
            title="Description"
            subtitle="Write a detailed description of the vehicle"
          />
          <textarea
            className={input + " h-32 resize-none"}
            name="description"
            placeholder="Describe the vehicle condition, features, history, and any additional details..."
            value={form.description}
            onChange={handleChange}
          />
        </div>

        {/* ── IMAGE UPLOAD ── */}
        <div className={card}>
          <SectionTitle
            icon={Upload}
            title="Vehicle Images *"
            subtitle="Upload high quality photos. The first image is the cover photo."
          />

          <label className="block cursor-pointer">
            <div className="border-2 border-dashed border-gray-200 hover:border-[#29ABE2] rounded-xl p-6 sm:p-8 text-center transition group">
              <div className="w-12 h-12 bg-[#29ABE2]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Upload size={20} className="text-[#29ABE2]" />
              </div>
              <p className="text-sm font-semibold text-gray-700 group-hover:text-[#29ABE2] transition">
                Tap to upload images
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PNG, JPG, WEBP supported — multiple files allowed
              </p>
              {uploading && (
                <p className="text-[#29ABE2] text-sm mt-3 font-medium animate-pulse">
                  Uploading images...
                </p>
              )}
            </div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>

          {form.images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
              {form.images.map((img, i) => (
                <div key={`${img}-${i}`} className="relative group">
                  <img
                    src={img}
                    alt={`Car ${i + 1}`}
                    className="h-24 w-full object-cover rounded-lg border border-gray-200"
                  />
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                      Cover
                    </span>
                  )}
                  {/* Always visible on touch screens, hover-only on laptops */}
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

        {/* ── SUBMIT ── */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pb-6">
          <button
            type="button"
            onClick={() => {
              setForm(EMPTY);
              setError("");
            }}
            className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            Reset Form
          </button>
          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full sm:w-auto px-8 py-2.5 text-sm font-semibold text-white bg-[#29ABE2] hover:bg-[#1a9fd4] disabled:opacity-50 rounded-lg transition shadow-sm"
          >
            {loading ? "Saving..." : "Add Car to Inventory"}
          </button>
        </div>

      </form>
    </div>
  );
}