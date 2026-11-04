import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, X, Trash2, ExternalLink, Mail, Phone, MapPin, Package, Inbox, Contact, Wallet, Anchor,
} from "lucide-react";
import { getOrders, updateOrder, deleteOrder } from "../../api/orderApi";
import { useAdmin } from "../../context/AdminAuthContext";
import { ORDER_STATUSES, statusMeta, usd, formatDate, orderRef } from "../../constants/stockOptions";
import { Button, Card, EmptyState, PageHeader, Tabs, btnClass, inputClass, cx } from "./ui";

const LIMIT = 10;

function StatusPill({ status }) {
  const m = statusMeta(status);
  return <span className={`inline-flex text-xs px-2 py-0.5 rounded-md font-semibold whitespace-nowrap ${m.className}`}>{m.label}</span>;
}

function TypePill({ type }) {
  return (
    <span className={`inline-flex text-[11px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide ${
      type === "order" ? "bg-[#0A1628] text-white" : "bg-gray-100 text-gray-600"
    }`}>
      {type === "order" ? "Order" : "Inquiry"}
    </span>
  );
}

function Line({ icon: Icon, children }) {
  return (
    <div className="flex items-start gap-2.5 text-sm text-gray-700">
      <Icon size={15} className="text-gray-400 mt-0.5 shrink-0" />
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

/* ───────── detail drawer ───────── */
function OrderDrawer({ order, onClose, onPatch, onDelete }) {
  const { can } = useAdmin();
  const canEdit = can("orders.edit");
  const [note, setNote] = useState(order.adminNote || "");
  const [saving, setSaving] = useState(false);
  const c = order.customer || {};
  const q = order.quote;
  const d = order.destination;

  const saveNote = async () => {
    setSaving(true);
    await onPatch(order, { adminNote: note });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-[#0A1628]/50" onClick={onClose} />
      <aside className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl">

        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900">{orderRef(order.orderNo)}</h2>
              <TypePill type={order.type} />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-6">

          {/* STATUS */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
            <select
              value={order.status}
              disabled={!canEdit}
              onChange={(e) => onPatch(order, { status: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#29ABE2]"
            >
              {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <p className="text-[11px] text-gray-400 mt-1.5">
              Setting Paid, Shipped or Completed marks the car as sold automatically.
            </p>
          </div>

          {/* RELATED RECORDS */}
          {(order.customerRef && can("customers.view")) || can("finance.view") || can("shipments.view") ? (
            <div className="flex flex-wrap gap-2">
              {order.customerRef && can("customers.view") && (
                <Link to={`/admin/customers/${order.customerRef}`} className={btnClass("secondary", "sm")}><Contact size={14} /> Customer</Link>
              )}
              {can("finance.view") && (
                <Link to={`/admin/payments?order=${order._id}`} className={btnClass("secondary", "sm")}><Wallet size={14} /> Invoice & payments</Link>
              )}
              {can("shipments.view") && order.type === "order" && (
                <Link to={`/admin/shipments?order=${order._id}`} className={btnClass("secondary", "sm")}><Anchor size={14} /> Shipment</Link>
              )}
            </div>
          ) : null}

          {/* CAR */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Vehicle</p>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
              {order.carInfo?.image ? (
                <img src={order.carInfo.image} alt="" className="w-20 h-14 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-20 h-14 rounded-lg bg-gray-100 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 truncate">{order.carInfo?.title || "Vehicle"}</p>
                <p className="text-xs text-gray-500">Stock No. {order.carInfo?.stockNo ?? "N/A"} · FOB {usd(order.carInfo?.fobPrice)}</p>
              </div>
              {order.car && (
                <Link to={`/cars/${order.car}`} target="_blank" aria-label="Open car page" className="text-[#29ABE2] hover:text-[#1B7DB3]">
                  <ExternalLink size={16} />
                </Link>
              )}
            </div>
          </div>

          {/* CUSTOMER */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Customer</p>
            <div className="space-y-2.5">
              <p className="text-sm font-semibold text-gray-900">{c.name}</p>
              <Line icon={Mail}><a href={`mailto:${c.email}`} className="text-[#1B7DB3] hover:underline">{c.email}</a></Line>
              <Line icon={Phone}><a href={`tel:${(c.tel || "").replace(/[^+\d]/g, "")}`} className="hover:underline">{c.tel}</a></Line>
              <Line icon={MapPin}>{[c.address, c.city, c.country].filter(Boolean).join(", ")}</Line>
              <Line icon={Package}>Delivery place: {c.deliveryPlace || "N/A"}</Line>
            </div>
          </div>

          {/* QUOTE */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Price estimate</p>
            {d?.country ? (
              <div className="rounded-xl bg-[#F5F9FF] border border-[#29ABE2]/15 p-4 space-y-1.5 text-sm">
                <p className="text-xs text-gray-500 mb-2">
                  To {[d.port, d.country].filter(Boolean).join(", ")} · Insurance {d.insurance ? "yes" : "no"} · Inspection {d.inspection ? "yes" : "no"}
                </p>
                {q?.available ? (
                  <>
                    <div className="flex justify-between text-gray-600"><span>FOB</span><span>{usd(q.fob)}</span></div>
                    <div className="flex justify-between text-gray-600"><span>Freight{q.freightMethod === "m3" ? ` (${q.m3} M³ × ${usd(q.ratePerM3)})` : q.freightMethod === "flat" ? " (flat rate)" : ""}</span><span>{usd(q.freight)}</span></div>
                    {d.insurance && <div className="flex justify-between text-gray-600"><span>Insurance</span><span>{usd(q.insurance)}</span></div>}
                    {d.inspection && <div className="flex justify-between text-gray-600"><span>Inspection</span><span>{usd(q.inspection)}</span></div>}
                    <div className="flex justify-between font-bold text-gray-900 border-t border-[#29ABE2]/20 pt-2 mt-1">
                      <span>Total (CIF)</span><span>{usd(q.total)}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500">No automatic estimate for this destination. Quote manually.</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">The customer did not choose a destination.</p>
            )}
          </div>

          {/* MESSAGE */}
          {order.message && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Customer message</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 whitespace-pre-line">{order.message}</p>
            </div>
          )}

          {/* NOTE */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Internal note</label>
            <textarea
              rows={3}
              maxLength={2000}
              value={note}
              readOnly={!canEdit}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Only you can see this. E.g. invoice sent on..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#29ABE2] resize-none"
            />
            {canEdit && (
            <button
              onClick={saveNote}
              disabled={saving || note === (order.adminNote || "")}
              className="mt-2 bg-[#29ABE2] hover:bg-[#1B7DB3] disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-lg transition"
            >
              {saving ? "Saving..." : "Save note"}
            </button>
            )}
          </div>

          {can("orders.delete") && (
          <button
            onClick={() => onDelete(order)}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 font-medium"
          >
            <Trash2 size={15} /> Delete this record
          </button>
          )}
        </div>
      </aside>
    </div>
  );
}

/* ───────── main panel ───────── */
export default function OrdersPanel() {
  const [orders, setOrders] = useState([]);
  const [counts, setCounts] = useState({});
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOrders({
        page,
        limit: LIMIT,
        status: status || undefined,
        type: type || undefined,
        search: search.trim() || undefined,
      });
      setOrders(res.data || []);
      setCounts(res.counts || {});
      setPagination(res.pagination || { total: 0, totalPages: 1 });
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, status, type, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const patch = async (order, data) => {
    try {
      const res = await updateOrder(order._id, data);
      setOrders((list) => list.map((o) => (o._id === order._id ? { ...o, ...res.data } : o)));
      setSelected((s) => (s && s._id === order._id ? { ...s, ...res.data } : s));
      window.dispatchEvent(new Event("orders-updated"));
      if (res.carMarkedSold) {
        setToast("Saved. The car was marked as sold.");
        window.dispatchEvent(new Event("cars-updated"));
      } else if ("status" in data) {
        setToast("Status updated.");
      }
      if ("status" in data) load();
    } catch {
      setToast("Could not save. Please try again.");
    }
  };

  const open = (order) => {
    setSelected(order);
    if (!order.isRead) patch(order, { isRead: true });
  };

  const remove = async (order) => {
    if (!window.confirm(`Delete ${orderRef(order.orderNo)}? This cannot be undone.`)) return;
    try {
      await deleteOrder(order._id);
      setSelected(null);
      window.dispatchEvent(new Event("orders-updated"));
      load();
    } catch {
      setToast("Could not delete. Please try again.");
    }
  };

  const tabs = [{ value: "", label: "All" }, ...ORDER_STATUSES].map((t) => ({
    ...t,
    count: t.value ? counts[t.value] || 0 : counts.all || 0,
  }));

  return (
    <div className="space-y-5">
      <PageHeader title="Orders & Inquiries" subtitle="Requests from customers on your car pages. Click a row to see details." />

      <Card className="overflow-hidden">

        {/* STATUS TABS */}
        <div className="px-4 sm:px-5 border-b border-gray-100">
          <Tabs tabs={tabs} value={status} onChange={(v) => { setStatus(v); setPage(1); }} />
        </div>

        {/* FILTERS */}
        <div className="p-4 sm:px-5 flex flex-col sm:flex-row gap-3 border-b border-gray-100 bg-gray-50/50">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="search"
              aria-label="Search orders"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by order no, name, email, country or car..."
              className={cx(inputClass, "pl-9")}
            />
          </div>
          <select
            value={type}
            onChange={(e) => { setType(e.target.value); setPage(1); }}
            aria-label="Filter by type"
            className={cx(inputClass, "sm:w-56")}
          >
            <option value="">Orders and inquiries</option>
            <option value="order">Orders only</option>
            <option value="inquiry">Inquiries only</option>
          </select>
        </div>

        {/* LIST */}
        {loading ? (
          <div className="p-4 space-y-3">
            {Array(5).fill(0).map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={search || status || type ? "No matching orders or inquiries" : "No orders or inquiries yet"}
            text={search || status || type ? "Try a different search or filter." : "Requests from customers will appear here."}
          />
        ) : (
          <>
            {/* table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="px-5 py-3 text-left font-semibold">Ref</th>
                    <th className="px-5 py-3 text-left font-semibold">Customer</th>
                    <th className="px-5 py-3 text-left font-semibold">Vehicle</th>
                    <th className="px-5 py-3 text-right font-semibold">Total / FOB</th>
                    <th className="px-5 py-3 text-left font-semibold">Status</th>
                    <th className="px-5 py-3 text-left font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((o) => (
                    <tr key={o._id} onClick={() => open(o)} className={cx("cursor-pointer transition hover:bg-[#F5F9FF]", !o.isRead && "bg-[#F0FAFF]/60")}>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {!o.isRead && <span className="w-2 h-2 rounded-full bg-[#29ABE2]" title="Unread" />}
                          <span className="font-semibold text-[#0A1628]">{orderRef(o.orderNo)}</span>
                        </div>
                        <div className="mt-1"><TypePill type={o.type} /></div>
                      </td>
                      <td className="px-5 py-3">
                        <p className={cx("text-gray-900", o.isRead ? "font-medium" : "font-semibold")}>{o.customer?.name}</p>
                        <p className="text-xs text-gray-500">{o.customer?.country}</p>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {o.carInfo?.image ? (
                            <img src={o.carInfo.image} alt="" className="w-14 h-10 rounded-lg object-cover bg-gray-100 ring-1 ring-gray-200/70 shrink-0" />
                          ) : (
                            <span className="w-14 h-10 rounded-lg bg-gray-100 ring-1 ring-gray-200/70 shrink-0" />
                          )}
                          <span className="text-gray-700 line-clamp-2">{o.carInfo?.title}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-[#0A1628] whitespace-nowrap tabular-nums">
                        {usd(o.quote?.available ? o.quote.total : o.carInfo?.fobPrice)}
                      </td>
                      <td className="px-5 py-3"><StatusPill status={o.status} /></td>
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatDate(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* cards */}
            <div className="lg:hidden divide-y divide-gray-100">
              {orders.map((o) => (
                <button key={o._id} onClick={() => open(o)} className={cx("w-full text-left p-4 transition hover:bg-[#F5F9FF]", !o.isRead && "bg-[#F0FAFF]/60")}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {!o.isRead && <span className="w-2 h-2 rounded-full bg-[#29ABE2]" />}
                      <span className="font-semibold text-[#0A1628]">{orderRef(o.orderNo)}</span>
                      <TypePill type={o.type} />
                    </div>
                    <StatusPill status={o.status} />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-2">{o.customer?.name}{o.customer?.country ? ` · ${o.customer.country}` : ""}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{o.carInfo?.title}</p>
                  <div className="mt-1.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#0A1628]">{usd(o.quote?.available ? o.quote.total : o.carInfo?.fobPrice)}</span>
                    <span className="text-gray-500">{formatDate(o.createdAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* PAGINATION */}
        {pagination.totalPages > 1 && (
          <div className="px-4 sm:px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-gray-500">
              Page {page} of {pagination.totalPages} · {pagination.total} records
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                Prev
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {selected && (
        <OrderDrawer
          key={selected._id}
          order={selected}
          onClose={() => setSelected(null)}
          onPatch={patch}
          onDelete={remove}
        />
      )}

      {toast && (
        <div role="status" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[70] bg-[#0A1628] text-white text-sm px-5 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}