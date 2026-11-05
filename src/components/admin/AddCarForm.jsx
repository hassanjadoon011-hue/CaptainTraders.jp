import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { PageHeader, btnClass } from "./ui";
import axiosClient from "../../api/axiosClient";
import CarFormFields, {
  EMPTY_CAR,
  formToPayload,
  validateCarForm,
  scrollAdminToTop,
  useImageUploader,
} from "./CarFormFields";

export default function AddCarForm() {
  const [form, setForm] = useState(EMPTY_CAR);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const { uploading, handleImageUpload } = useImageUploader(setForm, setError);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const problem = validateCarForm(form);
    if (problem) {
      setError(problem);
      scrollAdminToTop();
      return;
    }

    setLoading(true);
    try {
      await axiosClient.post("/cars", formToPayload(form));

      setSuccess(true);
      setForm(EMPTY_CAR);
      window.dispatchEvent(new Event("cars-updated"));
      scrollAdminToTop();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || "Error adding car. Please try again.");
      scrollAdminToTop();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Add Car"
        subtitle="Fill in the details below to add a new vehicle to your inventory."
        actions={<Link to="/admin/cars" className={btnClass("secondary")}><ArrowLeft size={16} /> Back to cars</Link>}
      />

      {success && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 px-4 sm:px-5 py-3 rounded-xl mb-5 sm:mb-6">
          <CheckCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm font-medium">Car added to inventory successfully!</p>
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
          <button type="button" onClick={() => { setForm(EMPTY_CAR); setError(""); }} className={btnClass("secondary")}>
            Reset form
          </button>
          <button type="submit" disabled={loading || uploading} className={btnClass("primary")}>
            {loading ? "Saving..." : uploading ? "Uploading images..." : "Add car to inventory"}
          </button>
        </div>
      </form>
    </div>
  );
}