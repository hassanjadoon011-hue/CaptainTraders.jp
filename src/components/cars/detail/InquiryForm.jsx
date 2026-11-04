import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { createOrder } from "../../../api/orderApi";
import { ORDER_TERMS, orderRef, usd } from "../../../constants/stockOptions";

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TEL_RX = /^[+\d][\d\s\-()]{5,19}$/;

const EMPTY = {
  name: "", email: "", country: "", tel: "",
  city: "", deliveryPlace: "", address: "", message: "",
};

const FIELDS = [
  { name: "name", label: "Your Name", autoComplete: "name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "country", label: "Your Country", autoComplete: "country-name" },
  { name: "tel", label: "Phone / WhatsApp", type: "tel", placeholder: "+92 300 1234567", autoComplete: "tel" },
  { name: "city", label: "City", autoComplete: "address-level2" },
  { name: "deliveryPlace", label: "Delivery Place (port)" },
  { name: "address", label: "Address", full: true, autoComplete: "street-address" },
];

const input =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white outline-none focus:ring-2 focus:ring-[#29ABE2] focus:border-transparent transition placeholder-gray-400";

const validate = (f) => {
  if (f.name.trim().length < 2) return "Please enter your name.";
  if (!EMAIL_RX.test(f.email.trim())) return "Please enter a valid email address.";
  if (f.country.trim().length < 2) return "Please enter your country.";
  if (!TEL_RX.test(f.tel.trim())) return "Please enter a valid phone number, e.g. +92 300 1234567.";
  if (!f.city.trim()) return "Please enter your city.";
  if (!f.deliveryPlace.trim()) return "Please enter the delivery place.";
  if (!f.address.trim()) return "Please enter your address.";
  return "";
};

export default function InquiryForm({ car, calc, quote }) {
  const [mode, setMode] = useState("inquiry");
  const [form, setForm] = useState(EMPTY);
  const [agreed, setAgreed] = useState(false);
  const [bot, setBot] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  // Use the calculator's country as a starting point
  useEffect(() => {
    if (calc.country) setForm((f) => (f.country ? f : { ...f, country: calc.country }));
  }, [calc.country]);

  const change = (e) => {
    setError("");
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const problem = validate(form);
    if (problem) return setError(problem);
    if (mode === "order" && !agreed) {
      return setError("Please read and accept the vehicle purchase agreement.");
    }

    setSending(true);
    try {
      const result = await createOrder({
        carId: car._id,
        type: mode,
        ...form,
        agreed: mode === "order" ? agreed : undefined,
        destination:
          calc.country && calc.port
            ? { country: calc.country, port: calc.port, insurance: calc.insurance, inspection: calc.inspection }
            : undefined,
        website: bot,
      });
      setDone(result);
    } catch (err) {
      setError(
        err.response?.data?.message || "We could not send your request. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  /* ───────── success ───────── */
  if (done) {
    return (
      <div id="inquiry" className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sm:p-10 text-center scroll-mt-24">
        <div className="w-14 h-14 mx-auto rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle size={28} className="text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mt-4">
          {done.type === "order" ? "Your order has been received" : "Your inquiry has been sent"}
        </h3>
        {done.orderNo > 0 && (
          <p className="text-sm text-gray-500 mt-2">
            Reference number: <span className="font-bold text-gray-800">{orderRef(done.orderNo)}</span>
          </p>
        )}
        <p className="text-sm text-gray-500 mt-3 max-w-md mx-auto">
          Our sales team will contact you at <b>{form.email}</b> soon
          {done.type === "order" ? " with your proforma invoice" : " with a quotation"}. Please keep your reference number.
        </p>
        <button
          type="button"
          onClick={() => { setDone(null); setForm(EMPTY); setAgreed(false); }}
          className="mt-6 px-6 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          Send another request
        </button>
      </div>
    );
  }

  return (
    <form
      id="inquiry"
      onSubmit={submit}
      noValidate
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6 scroll-mt-24"
    >
      <h3 className="text-lg font-bold text-gray-900">Inquiry / Your Details / Order</h3>
      <p className="text-sm text-gray-500 mt-1">Please fill in all the fields.</p>

      {/* MODE */}
      <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-xl mt-5">
        {[
          { v: "inquiry", label: "Send Inquiry" },
          { v: "order", label: "Place Order" },
        ].map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => { setMode(o.v); setError(""); }}
            className={`py-2.5 rounded-lg text-sm font-semibold transition ${
              mode === o.v ? "bg-white text-[#1B7DB3] shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* SUMMARY */}
      <div className="flex items-center gap-3 mt-5 p-3 rounded-xl bg-[#F5F9FF] border border-[#29ABE2]/15">
        {car.images?.[0] && (
          <img src={car.images[0]} alt="" className="w-16 h-12 rounded-lg object-cover shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {car.year} {car.make} {car.model}
          </p>
          <p className="text-xs text-gray-500">Stock No. {car.stockNo ?? "N/A"}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[11px] text-gray-400">{quote?.available ? "Total (CIF)" : "FOB price"}</p>
          <p className="text-sm font-bold text-gray-900">{usd(quote?.available ? quote.total : car.price)}</p>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mt-5">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* FIELDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
        {FIELDS.map((f) => (
          <div key={f.name} className={f.full ? "sm:col-span-2" : ""}>
            <label htmlFor={`f-${f.name}`} className="block text-xs font-medium text-gray-500 mb-1.5">
              {f.label} *
            </label>
            <input
              id={`f-${f.name}`}
              name={f.name}
              type={f.type || "text"}
              autoComplete={f.autoComplete}
              placeholder={f.placeholder}
              value={form[f.name]}
              onChange={change}
              className={input}
            />
          </div>
        ))}

        <div className="sm:col-span-2">
          <label htmlFor="f-message" className="block text-xs font-medium text-gray-500 mb-1.5">Message</label>
          <textarea
            id="f-message"
            name="message"
            rows={3}
            maxLength={2000}
            value={form.message}
            onChange={change}
            placeholder="Anything else you want to tell us?"
            className={input + " resize-none"}
          />
        </div>

        {/* Hidden field: real visitors never see it, bots fill it */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={bot}
          onChange={(e) => setBot(e.target.value)}
          className="hidden"
        />
      </div>

      {/* TERMS (orders only) */}
      {mode === "order" && (
        <div className="mt-5">
          <p className="text-sm font-semibold text-gray-800 mb-2">Vehicle Purchase Agreement</p>
          <div className="max-h-44 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50">
            {ORDER_TERMS.map((t, i) => (
              <p key={t.title} className="text-xs text-gray-600 leading-relaxed">
                <b className="text-gray-800">{String.fromCharCode(65 + i)}. {t.title}.</b> {t.body}
              </p>
            ))}
          </div>
          <label className="flex items-start gap-2 text-sm text-gray-700 mt-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => { setAgreed(e.target.checked); setError(""); }}
              className="w-4 h-4 mt-0.5"
            />
            Yes, I have read and agree to the Vehicle Purchase Agreement above.
          </label>
        </div>
      )}

      <button
        type="submit"
        disabled={sending}
        className="mt-6 w-full sm:w-auto sm:min-w-[220px] bg-[#29ABE2] hover:bg-[#1B7DB3] disabled:opacity-60 text-white font-bold px-8 py-3 rounded-lg transition shadow flex items-center justify-center gap-2"
      >
        {sending && <Loader2 size={16} className="animate-spin" />}
        {sending ? "Sending..." : mode === "order" ? "ORDER NOW" : "SEND INQUIRY"}
      </button>
      {mode === "order" && (
        <p className="text-xs text-gray-400 mt-3">
          When you press the button, we receive your order and send you an email with the quotation.
        </p>
      )}
    </form>
  );
}