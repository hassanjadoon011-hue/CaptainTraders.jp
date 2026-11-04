import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { PageHeader, Card, btnClass } from "./ui";
import axiosClient from "../../api/axiosClient";
import CarFormFields, {
  EMPTY_CAR,
  carToForm,
  formToPayload,
  validateCarForm,
  scrollAdminToTop,
  useImageUploader,
} from "./CarFormFields";

export default function EditCarForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_CAR);
  const [stockNo, setStockNo] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { uploading, handleImageUpload } = useImageUploader(setForm, setError);

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const res = await axiosClient.get(`/cars/${id}`);
        const car = res.data?.data;

        if (!car) {
          setLoadError("Car not found.");
          return;
        }
        setForm(carToForm(car));
        setStockNo(car.stockNo ?? null);
      } catch (err) {
        console.log(err);
        setLoadError("Could not load this car. It may have been deleted.");
      } finally {
        setFetching(false);
      }
    };

    fetchCar();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const problem = validateCarForm(form);
    if (problem) {
      setError(problem);
      scrollAdminToTop();
      return;
    }

    setSaving(true);
    try {
      await axiosClient.put(`/cars/${id}`, formToPayload(form));

      setSuccess(true);
      window.dispatchEvent(new Event("cars-updated"));
      scrollAdminToTop();
      setTimeout(() => navigate("/admin/cars"), 1200);
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || "Failed to update car. Please try again.");
      scrollAdminToTop();
    } finally {
      setSaving(false);
    }
  };

  if (fetching) {
    return <Card className="p-6 text-sm text-gray-500">Loading car data...</Card>;
  }

  if (loadError) {
    return (
      <div className="max-w-xl bg-white rounded-xl border border-gray-200/70 shadow-sm p-6 sm:p-8 text-center">
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
    <div>
      <PageHeader
        title="Edit Car"
        subtitle={`${[form.year, form.make, form.model].filter(Boolean).join(" ")}${stockNo ? ` · Stock No. ${stockNo}` : ""}`}
        actions={<button type="button" onClick={() => navigate("/admin/cars")} className={btnClass("secondary")}><ArrowLeft size={16} /> Back to cars</button>}
      />

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
        <CarFormFields
          form={form}
          setForm={setForm}
          uploading={uploading}
          onUpload={handleImageUpload}
        />

        <div className="sticky bottom-0 z-10 -mx-4 sm:mx-0 px-4 sm:px-5 py-3 bg-white/95 backdrop-blur border-t sm:border border-gray-200/70 sm:rounded-xl sm:shadow-sm flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3">
          <button type="button" onClick={() => navigate("/admin/cars")} className={btnClass("secondary")}>
            Cancel
          </button>
          <button type="submit" disabled={saving || uploading || success} className={btnClass("primary")}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}