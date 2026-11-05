import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Ship, Plus, Trash2, FileText, ExternalLink } from "lucide-react";
import {
  getShipments, getOrderShipment, createShipment, updateShipment, deleteShipment, addShipmentDocument, removeShipmentDocument,
} from "../../api/shipmentApi";
import { getOrders } from "../../api/orderApi";
import { useAdmin } from "../../context/AdminAuthContext";
import Modal from "../common/Modal";
import { formatDate, orderRef } from "../../constants/stockOptions";
import { Badge, Button, Card, Drawer, EmptyState, Field, IconButton, PageHeader, StatusMessage, Tabs, cx, dateInput, inputClass } from "./ui";

export const SHIPMENT_STATUSES = [
  { value: "booked", label: "Booked", tone: "gray" },
  { value: "at_port", label: "At port", tone: "blue" },
  { value: "loaded", label: "Loaded", tone: "blue" },
  { value: "departed", label: "Departed", tone: "blue" },
  { value: "arrived", label: "Arrived", tone: "amber" },
  { value: "cleared", label: "Cleared", tone: "amber" },
  { value: "delivered", label: "Delivered", tone: "green" },
  { value: "cancelled", label: "Cancelled", tone: "red" },
];
const statusOf = (v) => SHIPMENT_STATUSES.find((s) => s.value === v) || SHIPMENT_STATUSES[0];
const DOC_TYPES = [["bill_of_lading", "Bill of lading"], ["export_certificate", "Export certificate"], ["invoice", "Invoice"], ["inspection", "Inspection"], ["insurance", "Insurance"], ["other", "Other"]];

const FIELDS = ["status", "method", "shippingLine", "vessel", "voyage", "bookingNo", "blNo", "containerNo", "portOfLoading", "portOfDischarge", "destinationCountry", "note"];
const DATES = ["etd", "eta"];
const toForm = (s = {}) => ({
  ...Object.fromEntries(FIELDS.map((f) => [f, s[f] ?? ""])),
  status: s.status || "booked", method: s.method || "roro",
  ...Object.fromEntries(DATES.map((d) => [d, dateInput(s[d])])),
  freightCost: s.freightCost ?? "",
});
const fromForm = (f) => ({ ...f, etd: f.etd || null, eta: f.eta || null, freightCost: f.freightCost === "" ? null : f.freightCost });

function ShipmentDrawer({ shipment, presetOrder, onClose, onSaved }) {
  const { can } = useAdmin();
  const canEdit = can("shipments.edit");
  const [current, setCurrent] = useState(shipment);
  const [form, setForm] = useState(toForm(shipment || {}));
  const [orderId, setOrderId] = useState(presetOrder || "");
  const [orders, setOrders] = useState([]);
  const [doc, setDoc] = useState({ type: "bill_of_lading", name: "", url: "" });
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const isNew = !current;

  // Orders that can be shipped (for a new shipment)
  useEffect(() => {
    if (!isNew) return;
    Promise.all(["paid", "invoiced", "shipped"].map((s) => getOrders({ status: s, limit: 50 }).then((r) => r.data || []).catch(() => [])))
      .then((lists) => setOrders(lists.flat()));
  }, [isNew]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const run = async (fn, ok) => {
    setBusy(true); setStatus(null);
    try { const r = await fn(); setStatus({ type: "ok", text: ok }); onSaved(); return r; }
    catch (e) { setStatus({ type: "error", text: e.response?.data?.message || "Could not save." }); return null; }
    finally { setBusy(false); }
  };

  const save = async () => {
    if (isNew && !orderId) return setStatus({ type: "error", text: "Choose the order to ship." });
    const r = await run(() => (isNew ? createShipment({ ...fromForm(form), order: orderId }) : updateShipment(current._id, fromForm(form))), isNew ? "Shipment created." : "Shipment saved.");
    if (r) { setCurrent(r); setForm(toForm(r)); }
  };

  const addDoc = async (e) => {
    e.preventDefault();
    const r = await run(() => addShipmentDocument(current._id, doc), "Document added.");
    if (r) { setCurrent(r); setDoc({ type: "bill_of_lading", name: "", url: "" }); }
  };

  const order = current?.order && typeof current.order === "object" ? current.order : null;
  return (
    <Drawer
      open
      title={isNew ? "New shipment" : `Shipment · ${order ? orderRef(order.orderNo) : ""}`}
      subtitle={order ? `${order.customer?.name || ""} · ${order.carInfo?.title || ""}` : "Ocean shipment from Japan to the buyer's port"}
      onClose={onClose}
      footer={canEdit && <>
        <Button variant="secondary" onClick={onClose}>Close</Button>
        <Button onClick={save} disabled={busy}>{busy ? "Saving…" : isNew ? "Create shipment" : "Save changes"}</Button>
      </>}
    >
      <div className="space-y-5">
        <StatusMessage status={status} />
        <fieldset disabled={!canEdit} className="grid grid-cols-2 gap-3">
          {isNew && (
            <Field label="Order *" className="col-span-2">
              <select className={inputClass} value={orderId} onChange={(e) => setOrderId(e.target.value)}>
                <option value="">Choose an order</option>
                {presetOrder && !orders.some((o) => o._id === presetOrder) && <option value={presetOrder}>Selected order</option>}
                {orders.map((o) => <option key={o._id} value={o._id}>{orderRef(o.orderNo)} · {o.customer?.name} · {o.carInfo?.title}</option>)}
              </select>
            </Field>
          )}
          <Field label="Status">
            <select className={inputClass} value={form.status} onChange={set("status")}>{SHIPMENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
          </Field>
          <Field label="Method">
            <select className={inputClass} value={form.method} onChange={set("method")}><option value="roro">RoRo</option><option value="container">Container</option></select>
          </Field>
          <Field label="Shipping line"><input className={inputClass} value={form.shippingLine} onChange={set("shippingLine")} /></Field>
          <Field label="Vessel"><input className={inputClass} value={form.vessel} onChange={set("vessel")} /></Field>
          <Field label="Voyage no."><input className={inputClass} value={form.voyage} onChange={set("voyage")} /></Field>
          <Field label="Booking no."><input className={inputClass} value={form.bookingNo} onChange={set("bookingNo")} /></Field>
          <Field label="B/L no."><input className={inputClass} value={form.blNo} onChange={set("blNo")} /></Field>
          <Field label="Container no."><input className={inputClass} value={form.containerNo} onChange={set("containerNo")} disabled={form.method !== "container"} /></Field>
          <Field label="Port of loading"><input className={inputClass} value={form.portOfLoading} onChange={set("portOfLoading")} placeholder="e.g. Nagoya" /></Field>
          <Field label="Port of discharge" hint={isNew ? "Empty = order's destination" : undefined}><input className={inputClass} value={form.portOfDischarge} onChange={set("portOfDischarge")} /></Field>
          <Field label="ETD (departure)"><input type="date" className={inputClass} value={form.etd} onChange={set("etd")} /></Field>
          <Field label="ETA (arrival)"><input type="date" className={inputClass} value={form.eta} onChange={set("eta")} /></Field>
          {can("finance.view") && <Field label="Freight cost (USD)" className="col-span-2"><input className={inputClass} inputMode="decimal" value={form.freightCost} onChange={set("freightCost")} /></Field>}
          <Field label="Note" className="col-span-2"><textarea rows={3} className={`${inputClass} h-auto py-2`} value={form.note} onChange={set("note")} /></Field>
        </fieldset>
        <p className="text-xs text-gray-500">Setting Departed marks a paid order as Shipped; Delivered marks it Completed.</p>

        {!isNew && (
          <section className="border-t border-gray-100 pt-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-[#0A1628] mb-3"><FileText size={15} className="text-[#1B7DB3]" /> Documents ({current.documents?.length || 0})</h3>
            {current.documents?.length > 0 && (
              <ul className="divide-y divide-gray-100 border border-gray-100 rounded-xl mb-3">
                {current.documents.map((d) => (
                  <li key={d._id} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                    <a href={d.url} target="_blank" rel="noreferrer" className="flex-1 min-w-0 text-[#1B7DB3] hover:underline truncate inline-flex items-center gap-1.5">
                      <ExternalLink size={14} className="shrink-0" />{d.name || DOC_TYPES.find(([v]) => v === d.type)?.[1]}
                    </a>
                    {canEdit && <IconButton label="Remove document" tone="danger" onClick={async () => { const r = await run(() => removeShipmentDocument(current._id, d._id), "Document removed."); if (r) setCurrent(r); }}><Trash2 size={15} /></IconButton>}
                  </li>
                ))}
              </ul>
            )}
            {canEdit && (
              <form onSubmit={addDoc} className="grid grid-cols-2 gap-3">
                <Field label="Type"><select className={inputClass} value={doc.type} onChange={(e) => setDoc({ ...doc, type: e.target.value })}>{DOC_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
                <Field label="Name"><input className={inputClass} value={doc.name} onChange={(e) => setDoc({ ...doc, name: e.target.value })} /></Field>
                <Field label="Link (https://)" className="col-span-2"><input className={inputClass} type="url" value={doc.url} onChange={(e) => setDoc({ ...doc, url: e.target.value })} placeholder="https://…" /></Field>
                <div className="col-span-2"><Button type="submit" variant="secondary" disabled={busy}><Plus size={16} /> Add document</Button></div>
              </form>
            )}
          </section>
        )}
      </div>
    </Drawer>
  );
}

export default function ShipmentsPanel() {
  const { can } = useAdmin();
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({});
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(null); // { shipment } or { presetOrder }
  const [confirmDel, setConfirmDel] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getShipments({ status: status || undefined, search: search.trim() || undefined, limit: 50 });
      setRows(res.data || []);
      setCounts(res.counts || {});
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [status, search]);
  useEffect(() => { const t = setTimeout(load, search ? 350 : 0); return () => clearTimeout(t); }, [load, search]);

  // ?order=<id> (from the Orders page): open its shipment, or start a new one for it
  const orderParam = params.get("order");
  useEffect(() => {
    if (!orderParam) return;
    getOrderShipment(orderParam)
      .then((s) => setDrawer(s ? { shipment: s } : { presetOrder: orderParam }))
      .catch(() => {});
  }, [orderParam]);
  const close = () => { setDrawer(null); if (orderParam) setParams({}); };

  const openRow = async (s) => setDrawer({ shipment: s });
  const tabs = [{ value: "", label: "All", count: counts.all || 0 }, ...SHIPMENT_STATUSES.map((s) => ({ value: s.value, label: s.label, count: counts[s.value] || 0 }))];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Shipments"
        subtitle="Vessels, bills of lading and arrival dates for every exported car."
        actions={can("shipments.edit") && <Button onClick={() => setDrawer({})}><Plus size={16} /> New shipment</Button>}
      />
      <Card className="overflow-hidden">
        <div className="px-4 sm:px-5 border-b border-gray-100"><Tabs tabs={tabs} value={status} onChange={setStatus} /></div>
        <div className="p-4 sm:px-5 border-b border-gray-100 bg-gray-50/50">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input type="search" aria-label="Search shipments" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vessel, B/L, booking, port, customer or order no" className={cx(inputClass, "pl-9")} />
          </div>
        </div>
        {loading ? (
          <div className="p-4 space-y-3">{Array(4).fill(0).map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon={Ship} title="No shipments" text="Create a shipment for a paid order to track its vessel and arrival." />
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider whitespace-nowrap">
                    <th className="px-5 py-3 text-left font-semibold">Order</th>
                    <th className="px-4 py-3 text-left font-semibold">Vessel</th>
                    <th className="px-4 py-3 text-left font-semibold">Route</th>
                    <th className="px-4 py-3 text-left font-semibold">ETD / ETA</th>
                    <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">B/L</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    {can("shipments.edit") && <th className="px-5 py-3" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((s) => (
                    <tr key={s._id} onClick={() => openRow(s)} className="cursor-pointer hover:bg-[#F5F9FF] transition">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-[#0A1628]">{s.order ? orderRef(s.order.orderNo) : "—"}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[220px]">{s.order?.customer?.name} · {s.order?.carInfo?.title}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{s.vessel || "—"}{s.voyage ? <span className="text-xs text-gray-500"> · {s.voyage}</span> : null}</td>
                      <td className="px-4 py-3 text-gray-700">{[s.portOfLoading, s.portOfDischarge].filter(Boolean).join(" → ") || "—"}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(s.etd) || "—"} / {formatDate(s.eta) || "—"}</td>
                      <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{s.blNo || "—"}</td>
                      <td className="px-4 py-3"><Badge tone={statusOf(s.status).tone}>{statusOf(s.status).label}</Badge></td>
                      {can("shipments.edit") && (
                        <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <IconButton label="Delete shipment" tone="danger" onClick={() => setConfirmDel(s)}><Trash2 size={15} /></IconButton>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-gray-100">
              {rows.map((s) => (
                <button key={s._id} type="button" onClick={() => openRow(s)} className="w-full text-left p-4 hover:bg-[#F5F9FF]">
                  <div className="flex justify-between gap-2"><span className="font-semibold text-[#0A1628]">{s.order ? orderRef(s.order.orderNo) : "—"} · {s.vessel || "Vessel TBC"}</span><Badge tone={statusOf(s.status).tone}>{statusOf(s.status).label}</Badge></div>
                  <p className="text-xs text-gray-500 mt-1">{[s.portOfLoading, s.portOfDischarge].filter(Boolean).join(" → ") || "Route TBC"} · ETA {formatDate(s.eta) || "—"}</p>
                </button>
              ))}
            </div>
          </>
        )}
      </Card>

      {drawer && <ShipmentDrawer key={drawer.shipment?._id || drawer.presetOrder || "new"} shipment={drawer.shipment} presetOrder={drawer.presetOrder} onClose={close} onSaved={load} />}

      <Modal
        isOpen={!!confirmDel}
        title="Delete shipment?"
        confirmText="Delete"
        onClose={() => setConfirmDel(null)}
        onConfirm={async () => { await deleteShipment(confirmDel._id).catch(() => {}); setConfirmDel(null); load(); }}
      >
        <p className="text-sm text-gray-600">The tracking details and document links for this shipment are removed. The order is kept.</p>
      </Modal>
    </div>
  );
}
