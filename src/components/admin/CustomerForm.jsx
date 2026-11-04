import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { matchCustomer } from "../../api/customerApi";
import { Field, inputClass } from "./ui";

export const CUSTOMER_STATUSES = [
  { value: "lead", label: "Lead", tone: "blue" },
  { value: "active", label: "Active", tone: "green" },
  { value: "inactive", label: "Inactive", tone: "gray" },
  { value: "blocked", label: "Blocked", tone: "red" },
];
export const customerStatus = (v) => CUSTOMER_STATUSES.find((s) => s.value === v) || CUSTOMER_STATUSES[0];

const FIELDS = ["name", "email", "phone", "whatsapp", "company", "country", "city", "address", "deliveryPort", "status", "notes"];
export const toCustomerForm = (c = {}) => ({
  ...Object.fromEntries(FIELDS.map((f) => [f, c[f] ?? ""])),
  status: c.status || "lead",
  tags: (c.tags || []).join(", "),
});
export const fromCustomerForm = (f) => ({
  ...f,
  email: f.email.trim() || null,
  tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean),
});

// Shared add/edit form. Warns when the email already belongs to another customer.
export default function CustomerForm({ form, setForm, currentId }) {
  const [match, setMatch] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    const email = form.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return setMatch(null);
    const t = setTimeout(() => {
      matchCustomer(email)
        .then((c) => setMatch(c && c._id !== currentId ? c : null))
        .catch(() => setMatch(null));
    }, 400);
    return () => clearTimeout(t);
  }, [form.email, currentId]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Name *" className="sm:col-span-2">
        <input className={inputClass} value={form.name} onChange={set("name")} required maxLength={80} />
      </Field>
      <Field label="Email" className="sm:col-span-2">
        <input className={inputClass} type="email" value={form.email} onChange={set("email")} />
        {match && (
          <span role="alert" className="block text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1 mt-1.5">
            This email belongs to{" "}
            <Link to={`/admin/customers/${match._id}`} className="font-semibold underline">{match.name}</Link>.
          </span>
        )}
      </Field>
      <Field label="Phone"><input className={inputClass} value={form.phone} onChange={set("phone")} /></Field>
      <Field label="WhatsApp"><input className={inputClass} value={form.whatsapp} onChange={set("whatsapp")} /></Field>
      <Field label="Company"><input className={inputClass} value={form.company} onChange={set("company")} /></Field>
      <Field label="Status">
        <select className={inputClass} value={form.status} onChange={set("status")}>
          {CUSTOMER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </Field>
      <Field label="Country"><input className={inputClass} value={form.country} onChange={set("country")} /></Field>
      <Field label="City"><input className={inputClass} value={form.city} onChange={set("city")} /></Field>
      <Field label="Address" className="sm:col-span-2"><input className={inputClass} value={form.address} onChange={set("address")} /></Field>
      <Field label="Usual delivery port"><input className={inputClass} value={form.deliveryPort} onChange={set("deliveryPort")} /></Field>
      <Field label="Tags" hint="Comma separated, e.g. dealer, repeat buyer"><input className={inputClass} value={form.tags} onChange={set("tags")} /></Field>
      <Field label="Notes" className="sm:col-span-2">
        <textarea rows={4} className={`${inputClass} h-auto py-2`} value={form.notes} onChange={set("notes")} maxLength={4000} />
      </Field>
    </div>
  );
}
