import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import axiosClient from "../../api/axiosClient";

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

// 1 column on phones, 2 on tablets, 3 on laptops
const grid3 = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4";

// The admin page scrolls inside <main>, not the window
const scrollToTop = () => {
  const main = document.querySelector("main");
  if (main) main.scrollTo({ top: 0, behavior: "smooth" });
  window.scrollTo({ top: 0, behavior: "smooth" });
};

function Field({ label, children }) {
  return (
    <div className="min-w-0">
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
      <p className="text-sm font-bold text-gray-800 mb-4">{title}</p>
      {children}
    </div>
  );
}

export default function EditCarForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [fetching, setFetching] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  /* ================= FETCH SINGLE CAR ================= */
  useEffect(() => {
    const fetchCar = async () => {
      try {
        const res = await axiosClient.get(`/cars/${id}`);
        const car = res.data?.data;

        if (!car) {
          setLoadError("Car not found.");
          return;
        }

        setForm({
          make: car.make ?? "",
          model: car.model ?? "",
          year: car.year ?? "",
          price: car.price ?? "",
          mileage: car.mileage ?? "",
          engine: car.engine ?? "",
          power: car.power ?? "",
          transmission: car.transmission ?? "",
          fuelType: car.fuelType ?? "",
          drivetrain: car.drivetrain ?? "",
          bodyType: car.bodyType ?? "",
          color: car.color ?? "",
          condition: car.condition ?? "",
          vin: car.vin ?? "",
          description: car.description ?? "",
          location: car.location ?? "",
          status: car.status === "sold" ? "sold" : "available",
          isFeatured: Boolean(car.isFeatured),
          images: Array.isArray(car.images) ? car.images : [],
        });
      } catch (err) {
        console.log(err);
        setLoadError("Could not load this car. It may have been deleted.");
      } finally {
        setFetching(false);
      }
    };

    fetchCar();
  }, [id]);

  /* ================= HANDLERS ================= */
  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

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

      setForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch (err) {
      console.log("Upload error:", err);
      setError("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (index) =>
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));

  const validate = () => {
    if (!form.make.trim()) return "Make is required.";
    if (!form.model.trim()) return "Model is required.";

    const year = Number(form.year);
    if (!year || year < 1980 || year > 2100) return "Please enter a valid year.";

    const price = Number(form.price);
    if (!price || price <= 0) return "Please enter a valid price.";

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

    setSaving(true);

    try {
      await axiosClient.put(`/cars/${id}`, {
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
      scrollToTop();
      setTimeout(() => navigate("/admin/cars"), 1200);
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || "Failed to update car. Please try again.");
      scrollToTop();
    } finally {
      setSaving(false);
    }
  };

  /* ================= STATES ================= */
  if (fetching) {
    return <p className="p-4 sm:p-6 text-sm text-gray-500">Loading car data...</p>;
  }

  if (loadError) {
    return (
      <div className="max-w-5xl mx-auto bg-white rounded-xl border border-gray-100 p-6 sm:p-8 text-center">
        <p className="text-gray-700 font-medium">{loadError}</p>
        <button
          onClick={() => navigate("/admin/cars")}
          className="mt-4 text-sm text-[#29ABE2] font-semibold hover:underline"
        >
          Back to cars
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-5 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Edit Car</h1>
        <p className="text-sm text-gray-500 mt-1">
          Update the details of {form.make} {form.model}
        </p>
      </div>

      {success && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 px-4 sm:px-5 py-3 rounded-xl mb-5 sm:mb-6">
          <CheckCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm font-medium">Car updated successfully! Redirecting...</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 sm:px-5 py-3 rounded-xl mb-5 sm:mb-6">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* STATUS */}
        <Card title="Listing Status">
          <div className={grid3}>
            <Field label="Status">
              <select className={input} name="status" value={form.status} onChange={handleChange}>
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
        </Card>

        {/* BASIC */}
        <Card title="Basic Information">
          <div className={grid3}>
            <Field label="Make">
              <input className={input} name="make" value={form.make} onChange={handleChange} placeholder="e.g. Toyota" />
            </Field>
            <Field label="Model">
              <input className={input} name="model" value={form.model} onChange={handleChange} placeholder="e.g. Corolla" />
            </Field>
            <Field label="Year">
              <input className={input} name="year" inputMode="numeric" value={form.year} onChange={handleChange} placeholder="e.g. 2024" />
            </Field>
          </div>
        </Card>

        {/* PRICING */}
        <Card title="Pricing & Condition">
          <div className={grid3}>
            <Field label="Price ($)">
              <input className={input} name="price" inputMode="numeric" value={form.price} onChange={handleChange} placeholder="e.g. 15000" />
            </Field>
            <Field label="Mileage (km)">
              <input className={input} name="mileage" inputMode="numeric" value={form.mileage} onChange={handleChange} placeholder="e.g. 45000" />
            </Field>
            <Field label="Condition">
              <select className={input} name="condition" value={form.condition} onChange={handleChange}>
                <option value="">Select condition</option>
                <option>New</option>
                <option>Used</option>
                <option>Reconditioned</option>
              </select>
            </Field>
          </div>
        </Card>

        {/* ENGINE */}
        <Card title="Engine & Performance">
          <div className={grid3}>
            <Field label="Engine (cc)">
              <input className={input} name="engine" value={form.engine} onChange={handleChange} placeholder="e.g. 1800" />
            </Field>
            <Field label="Power (HP)">
              <input className={input} name="power" value={form.power} onChange={handleChange} placeholder="e.g. 140" />
            </Field>
            <Field label="Fuel Type">
              <select className={input} name="fuelType" value={form.fuelType} onChange={handleChange}>
                <option value="">Select fuel type</option>
                <option>Petrol</option>
                <option>Diesel</option>
                <option>Hybrid</option>
                <option>Electric</option>
              </select>
            </Field>
          </div>
        </Card>

        {/* TRANSMISSION & BODY */}
        <Card title="Transmission & Body">
          <div className={grid3}>
            <Field label="Transmission">
              <select className={input} name="transmission" value={form.transmission} onChange={handleChange}>
                <option value="">Select transmission</option>
                <option>Automatic</option>
                <option>Manual</option>
              </select>
            </Field>
            <Field label="Drivetrain">
              <select className={input} name="drivetrain" value={form.drivetrain} onChange={handleChange}>
                <option value="">Select drivetrain</option>
                <option>FWD</option>
                <option>RWD</option>
                <option>AWD</option>
              </select>
            </Field>
            <Field label="Body Type">
              <select className={input} name="bodyType" value={form.bodyType} onChange={handleChange}>
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
        </Card>

        {/* APPEARANCE */}
        <Card title="Appearance, Identity & Location">
          <div className={grid3}>
            <Field label="Color">
              <input className={input} name="color" value={form.color} onChange={handleChange} placeholder="e.g. Pearl White" />
            </Field>
            <Field label="VIN Number">
              <input className={input} name="vin" value={form.vin} onChange={handleChange} placeholder="e.g. JT2BF22K1W0066078" />
            </Field>
            <Field label="Location">
              <input className={input} name="location" value={form.location} onChange={handleChange} placeholder="e.g. Tokyo, Japan" />
            </Field>
          </div>
        </Card>

        {/* DESCRIPTION */}
        <Card title="Description">
          <textarea
            className={input + " h-32 resize-none"}
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the vehicle condition, features and history..."
          />
        </Card>

        {/* IMAGES */}
        <Card title="Vehicle Images">
          <label className="block cursor-pointer">
            <div className="border-2 border-dashed border-gray-200 hover:border-[#29ABE2] rounded-xl p-5 sm:p-6 text-center transition">
              <Upload size={20} className="text-[#29ABE2] mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700">Tap to add more images</p>
              {uploading && (
                <p className="text-[#29ABE2] text-sm mt-2 font-medium animate-pulse">
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
        </Card>

        {/* BUTTONS */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pb-6">
          <button
            type="button"
            onClick={() => navigate("/admin/cars")}
            className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || uploading || success}
            className="w-full sm:w-auto px-8 py-2.5 text-sm font-semibold text-white bg-[#29ABE2] hover:bg-[#1a9fd4] disabled:opacity-50 rounded-lg transition shadow-sm"
          >
            {saving ? "Saving..." : "Update Car"}
          </button>
        </div>
      </form>
    </div>
  );
}