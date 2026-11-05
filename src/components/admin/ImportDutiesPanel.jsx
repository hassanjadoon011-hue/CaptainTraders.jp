import { useEffect, useState } from "react";
import { Landmark, Plus, Trash2, ArrowUp, ArrowDown, Pencil } from "lucide-react";
import { COUNTRIES } from "../../constants/countries";
import { getImportRules, createImportRule, updateImportRule, deleteImportRule } from "../../api/shippingApi";
import { useAdmin } from "../../context/AdminAuthContext";
import Modal from "../common/Modal";
import { Badge, Button, Card, Drawer, EmptyState, Field, IconButton, PageHeader, StatusMessage, inputClass, money } from "./ui";

const BASES = [
  ["cif", "CIF value"],
  ["cumulative", "CIF + earlier taxes"],
  ["fob", "FOB price"],
];
const emptyCharge = () => ({ name: "", kind: "percent", rate: "", amount: "", base: "cif", minAge: "", maxAge: "", minCc: "", maxCc: "" });
const toForm = (r = {}) => ({
  country: r.country || "",
  active: r.active !== false,
  maxAgeYears: r.maxAgeYears ?? "",
  code: r.currency?.code || "",
  perUSD: r.currency?.perUSD ?? "",
  notes: r.notes || "",
  components: (r.components || []).map((c) => ({ ...emptyCharge(), ...Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v ?? ""])) })),
});
const blankToNull = (v) => (v === "" ? null : v);
const fromForm = (f) => ({
  country: f.country,
  active: f.active,
  maxAgeYears: blankToNull(f.maxAgeYears),
  currency: { code: f.code, perUSD: blankToNull(f.perUSD) },
  notes: f.notes,
  components: f.components.map((c) => ({
    name: c.name, kind: c.kind, base: c.base,
    rate: c.kind === "percent" ? c.rate : null,
    amount: c.kind === "fixed" ? c.amount : null,
    minAge: blankToNull(c.minAge), maxAge: blankToNull(c.maxAge), minCc: blankToNull(c.minCc), maxCc: blankToNull(c.maxCc),
  })),
});

const describe = (c) => {
  const what = c.kind === "percent" ? `${c.rate}% of ${BASES.find(([v]) => v === c.base)?.[1]}` : `${money(c.amount)} fixed`;
  const cond = [
    (c.minAge != null || c.maxAge != null) && `age ${c.minAge ?? 0}–${c.maxAge ?? "∞"} yrs`,
    (c.minCc != null || c.maxCc != null) && `${c.minCc ?? 0}–${c.maxCc ?? "∞"} cc`,
  ].filter(Boolean).join(", ");
  return cond ? `${what} · only ${cond}` : what;
};

function RuleDrawer({ rule, onClose, onSaved, taken }) {
  const [form, setForm] = useState(toForm(rule || {}));
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setC = (i, k) => (e) => setForm((f) => ({ ...f, components: f.components.map((c, j) => (j === i ? { ...c, [k]: e.target.value } : c)) }));
  const move = (i, d) => setForm((f) => {
    const list = [...f.components];
    [list[i], list[i + d]] = [list[i + d], list[i]];
    return { ...f, components: list };
  });

  const save = async () => {
    setBusy(true);
    setStatus(null);
    try {
      await (rule ? updateImportRule(rule._id, fromForm(form)) : createImportRule(fromForm(form)));
      onSaved();
      onClose();
    } catch (e) {
      setStatus({ type: "error", text: e.response?.data?.message || "Could not save." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      open
      width="max-w-3xl"
      title={rule ? `Import costs · ${rule.country}` : "Add country"}
      subtitle="Charges are applied in order. Percent charges on “CIF + earlier taxes” stack on the ones above them."
      onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</Button></>}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="Country *" className="col-span-2">
            <select className={inputClass} value={form.country} onChange={set("country")}>
              <option value="">Choose country</option>
              {COUNTRIES.filter((c) => c === form.country || !taken.includes(c.toLowerCase())).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Age limit (years)" hint="Empty = no limit"><input className={inputClass} inputMode="numeric" value={form.maxAgeYears} onChange={set("maxAgeYears")} /></Field>
          <Field label="Status">
            <select className={inputClass} value={form.active ? "1" : "0"} onChange={(e) => setForm((f) => ({ ...f, active: e.target.value === "1" }))}>
              <option value="1">Shown to buyers</option><option value="0">Hidden</option>
            </select>
          </Field>
          <Field label="Local currency" hint="e.g. KES"><input className={inputClass} maxLength={3} value={form.code} onChange={set("code")} /></Field>
          <Field label="1 USD =" hint="Local units, optional"><input className={inputClass} inputMode="decimal" value={form.perUSD} onChange={set("perUSD")} /></Field>
          <Field label="Note shown to buyers" className="col-span-2"><input className={inputClass} value={form.notes} onChange={set("notes")} placeholder="e.g. Rates from KRA, Jan 2026" /></Field>
        </div>

        <section>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-sm font-bold text-[#0A1628]">Charges ({form.components.length})</h3>
            <Button variant="secondary" size="sm" onClick={() => setForm((f) => ({ ...f, components: [...f.components, emptyCharge()] }))}><Plus size={14} /> Add charge</Button>
          </div>
          {form.components.length === 0 && <p className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-xl p-4 text-center">Add the duties, taxes and port charges for this country.</p>}
          <ol className="space-y-3">
            {form.components.map((c, i) => (
              <li key={i} className="rounded-xl border border-gray-200/70 bg-gray-50/60 p-3">
                <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-end">
                  <Field label={`${i + 1}. Name`} className="col-span-2 sm:col-span-4"><input className={inputClass} value={c.name} onChange={setC(i, "name")} placeholder="e.g. Import duty" /></Field>
                  <Field label="Type" className="sm:col-span-2">
                    <select className={inputClass} value={c.kind} onChange={setC(i, "kind")}><option value="percent">Percent</option><option value="fixed">Fixed USD</option></select>
                  </Field>
                  {c.kind === "percent" ? <>
                    <Field label="Rate %" className="sm:col-span-2"><input className={inputClass} inputMode="decimal" value={c.rate} onChange={setC(i, "rate")} /></Field>
                    <Field label="Of" className="col-span-2 sm:col-span-3">
                      <select className={inputClass} value={c.base} onChange={setC(i, "base")}>{BASES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                    </Field>
                  </> : (
                    <Field label="Amount (USD)" className="col-span-2 sm:col-span-5"><input className={inputClass} inputMode="decimal" value={c.amount} onChange={setC(i, "amount")} /></Field>
                  )}
                  <div className="col-span-2 sm:col-span-1 flex sm:flex-col gap-1 justify-end">
                    <IconButton label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={14} /></IconButton>
                    <IconButton label="Move down" disabled={i === form.components.length - 1} onClick={() => move(i, 1)}><ArrowDown size={14} /></IconButton>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
                  <Field label="Min age"><input className={inputClass} inputMode="numeric" value={c.minAge} onChange={setC(i, "minAge")} placeholder="any" /></Field>
                  <Field label="Max age"><input className={inputClass} inputMode="numeric" value={c.maxAge} onChange={setC(i, "maxAge")} placeholder="any" /></Field>
                  <Field label="Min cc"><input className={inputClass} inputMode="numeric" value={c.minCc} onChange={setC(i, "minCc")} placeholder="any" /></Field>
                  <Field label="Max cc"><input className={inputClass} inputMode="numeric" value={c.maxCc} onChange={setC(i, "maxCc")} placeholder="any" /></Field>
                  <div className="col-span-2 sm:col-span-1 flex justify-end">
                    <Button variant="danger" size="sm" onClick={() => setForm((f) => ({ ...f, components: f.components.filter((_, j) => j !== i) }))}><Trash2 size={14} /> Remove</Button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <StatusMessage status={status} />
      </div>
    </Drawer>
  );
}

export default function ImportDutiesPanel() {
  const { can } = useAdmin();
  const canEdit = can("shipping.edit");
  const [rules, setRules] = useState(null);
  const [editing, setEditing] = useState(null); // rule or {} for new
  const [confirmDel, setConfirmDel] = useState(null);

  const load = () => getImportRules().then(setRules).catch(() => setRules([]));
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Import Duties"
        subtitle="Duties, taxes and port charges per country. Buyers see the estimated landed cost in the price calculator."
        actions={canEdit && <Button onClick={() => setEditing({})}><Plus size={16} /> Add country</Button>}
      />
      {!rules ? <Card className="p-6 text-sm text-gray-500">Loading…</Card> : rules.length === 0 ? (
        <Card><EmptyState icon={Landmark} title="No countries yet" text="Add a country with its import duty, taxes and port charges." /></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {rules.map((r) => (
            <Card key={r._id} className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-[#0A1628]">{r.country}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {r.components.length} charge{r.components.length === 1 ? "" : "s"}
                    {r.maxAgeYears != null ? ` · max ${r.maxAgeYears} years old` : ""}
                    {r.currency?.code ? ` · ${r.currency.code}${r.currency.perUSD ? ` (1 USD = ${r.currency.perUSD})` : ""}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge tone={r.active ? "green" : "gray"}>{r.active ? "Shown" : "Hidden"}</Badge>
                  {canEdit && <IconButton label={`Edit ${r.country}`} onClick={() => setEditing(r)}><Pencil size={15} /></IconButton>}
                  {canEdit && <IconButton label={`Delete ${r.country}`} tone="danger" onClick={() => setConfirmDel(r)}><Trash2 size={15} /></IconButton>}
                </div>
              </div>
              {r.components.length > 0 && (
                <ol className="mt-3 divide-y divide-gray-100 text-sm">
                  {r.components.map((c, i) => (
                    <li key={i} className="py-1.5 flex justify-between gap-3">
                      <span className="font-medium text-gray-900">{i + 1}. {c.name}</span>
                      <span className="text-gray-500 text-right">{describe(c)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          ))}
        </div>
      )}

      {editing && <RuleDrawer rule={editing._id ? editing : null} taken={(rules || []).map((r) => r.countryKey)} onClose={() => setEditing(null)} onSaved={load} />}
      <Modal isOpen={!!confirmDel} title={`Delete ${confirmDel?.country}?`} confirmText="Delete" onClose={() => setConfirmDel(null)}
        onConfirm={async () => { await deleteImportRule(confirmDel._id).catch(() => {}); setConfirmDel(null); load(); }}>
        <p className="text-sm text-gray-600">Buyers will no longer see import cost estimates for this country.</p>
      </Modal>
    </div>
  );
}
