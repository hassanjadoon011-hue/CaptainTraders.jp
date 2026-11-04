import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Wallet, Plus, Trash2, FileText } from "lucide-react";
import { getBalances, getOrderFinance, createPayment, deletePayment } from "../../api/financeApi";
import { updateOrder } from "../../api/orderApi";
import { useAdmin } from "../../context/AdminAuthContext";
import { formatDate, orderRef } from "../../constants/stockOptions";
import {
  Badge, Button, Card, CardHeader, Drawer, EmptyState, Field, IconButton, OrderStatusBadge, PAYMENT_LABELS, PAYMENT_TONES,
  PageHeader, Stat, StatusMessage, Tabs, cx, dateInput, inputClass, money,
} from "./ui";

const METHODS = [
  ["tt", "Telegraphic transfer (T/T)"], ["bank_transfer", "Bank transfer"], ["cash", "Cash"],
  ["card", "Card"], ["paypal", "PayPal"], ["other", "Other"],
];
const emptyPayment = () => ({ amount: "", currency: "USD", amountUSD: "", method: "tt", receivedAt: dateInput(new Date()), reference: "", note: "" });

function OrderFinanceDrawer({ orderId, onClose, onChanged }) {
  const { can } = useAdmin();
  const canPay = can("finance.edit");
  const canInvoice = canPay && can("orders.edit");
  const [data, setData] = useState(null);
  const [pay, setPay] = useState(emptyPayment());
  const [invoice, setInvoice] = useState(null);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    getOrderFinance(orderId).then((d) => {
      setData(d);
      const inv = d.order.invoice || {};
      setInvoice({ number: inv.number || "", amount: inv.amount ?? "", terms: inv.terms || "CIF", dueAt: dateInput(inv.dueAt) });
    }).catch(() => setStatus({ type: "error", text: "Could not load this order." }));
  }, [orderId]);
  useEffect(load, [load]);

  const run = async (fn, ok) => {
    setBusy(true); setStatus(null);
    try { await fn(); setStatus({ type: "ok", text: ok }); load(); onChanged(); return true; }
    catch (e) { setStatus({ type: "error", text: e.response?.data?.message || "Could not save." }); return false; }
    finally { setBusy(false); }
  };

  const record = async (e) => {
    e.preventDefault();
    if (!(Number(pay.amount) > 0)) return setStatus({ type: "error", text: "Enter an amount greater than 0." });
    const ok = await run(() => createPayment({ ...pay, order: orderId, amountUSD: pay.amountUSD === "" ? null : pay.amountUSD }), "Payment recorded.");
    if (ok) setPay(emptyPayment());
  };

  const saveInvoice = (e) => {
    e.preventDefault();
    run(() => updateOrder(orderId, { invoice: { ...invoice, amount: invoice.amount === "" ? null : invoice.amount, dueAt: invoice.dueAt || null } }), "Invoice saved.");
  };

  const o = data?.order;
  const f = data?.finance;
  const setP = (k) => (e) => setPay((p) => ({ ...p, [k]: e.target.value }));
  const setI = (k) => (e) => setInvoice((p) => ({ ...p, [k]: e.target.value }));

  return (
    <Drawer open title={o ? `${orderRef(o.orderNo)} · Payments` : "Payments"} subtitle={o ? `${o.customer?.name || ""} · ${o.carInfo?.title || ""}` : ""} onClose={onClose}>
      {!data ? <p className="text-sm text-gray-500">Loading…</p> : (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3 rounded-xl bg-[#F5F9FF] border border-[#29ABE2]/15 p-4">
            <Stat label="Total due" value={money(f.due)} />
            <Stat label="Received" value={money(f.paid)} tone="green" />
            <Stat label="Balance" value={money(f.balance)} tone={f.balance > 0.009 ? "red" : "green"} />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Badge tone={PAYMENT_TONES[f.status]}>{PAYMENT_LABELS[f.status]}</Badge>
            <OrderStatusBadge status={o.status} />
            <span className="text-xs text-gray-500">{o.invoice?.amount > 0 ? "Total from invoice" : o.quote?.available ? "Total from price quote (no invoice yet)" : "Total = FOB price (no invoice yet)"}</span>
          </div>
          <StatusMessage status={status} />

          {/* INVOICE */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-bold text-[#0A1628] mb-3"><FileText size={15} className="text-[#1B7DB3]" /> Invoice</h3>
            <form onSubmit={saveInvoice} className="grid grid-cols-2 gap-3">
              <Field label="Invoice no."><input className={inputClass} value={invoice.number} onChange={setI("number")} disabled={!canInvoice} placeholder="e.g. CT-2026-001" /></Field>
              <Field label="Amount (USD)"><input className={inputClass} inputMode="decimal" value={invoice.amount} onChange={setI("amount")} disabled={!canInvoice} placeholder={String(f.due || "")} /></Field>
              <Field label="Terms">
                <select className={inputClass} value={invoice.terms} onChange={setI("terms")} disabled={!canInvoice}><option>CIF</option><option>CFR</option><option>FOB</option></select>
              </Field>
              <Field label="Payment due"><input type="date" className={inputClass} value={invoice.dueAt} onChange={setI("dueAt")} disabled={!canInvoice} /></Field>
              {canInvoice && <div className="col-span-2"><Button type="submit" variant="secondary" disabled={busy}>Save invoice</Button></div>}
            </form>
          </section>

          {/* RECORD PAYMENT */}
          {canPay && o.status !== "cancelled" && (
            <section className="border-t border-gray-100 pt-5">
              <h3 className="text-sm font-bold text-[#0A1628] mb-3">Record a payment</h3>
              <form onSubmit={record} className="grid grid-cols-2 gap-3">
                <Field label="Amount"><input className={inputClass} inputMode="decimal" value={pay.amount} onChange={setP("amount")} placeholder={f.balance > 0 ? String(f.balance) : ""} /></Field>
                <Field label="Currency">
                  <select className={inputClass} value={pay.currency} onChange={setP("currency")}><option>USD</option><option>JPY</option></select>
                </Field>
                {pay.currency === "JPY" && <Field label="USD value" hint="Empty = use exchange rate" className="col-span-2"><input className={inputClass} inputMode="decimal" value={pay.amountUSD} onChange={setP("amountUSD")} /></Field>}
                <Field label="Method">
                  <select className={inputClass} value={pay.method} onChange={setP("method")}>{METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                </Field>
                <Field label="Received on"><input type="date" className={inputClass} value={pay.receivedAt} onChange={setP("receivedAt")} /></Field>
                <Field label="Bank / SWIFT reference" className="col-span-2"><input className={inputClass} value={pay.reference} onChange={setP("reference")} /></Field>
                <div className="col-span-2"><Button type="submit" disabled={busy}><Plus size={16} /> Record payment</Button></div>
              </form>
            </section>
          )}

          {/* HISTORY */}
          <section className="border-t border-gray-100 pt-5">
            <h3 className="text-sm font-bold text-[#0A1628] mb-3">Payment history ({data.payments.length})</h3>
            {data.payments.length === 0 ? <p className="text-sm text-gray-500">No payments yet.</p> : (
              <ul className="divide-y divide-gray-100 border border-gray-100 rounded-xl">
                {data.payments.map((p) => (
                  <li key={p._id} className="px-4 py-3 flex items-center gap-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 tabular-nums">
                        {money(p.amount, p.currency)}
                        {p.currency !== "USD" && <span className="text-xs font-normal text-gray-500"> ≈ {money(p.amountUSD)}</span>}
                        {p.status !== "received" && <Badge tone="amber" className="ml-2">{p.status}</Badge>}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{formatDate(p.receivedAt)} · {METHODS.find(([v]) => v === p.method)?.[1] || p.method}{p.reference ? ` · ${p.reference}` : ""}</p>
                    </div>
                    {canPay && <IconButton label="Delete payment" tone="danger" onClick={() => run(() => deletePayment(p._id), "Payment deleted.")}><Trash2 size={15} /></IconButton>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Drawer>
  );
}

export default function PaymentsPanel() {
  const [params, setParams] = useSearchParams();
  const openId = params.get("order");
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState(null);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBalances({ status: status || undefined, search: search.trim() || undefined, page, limit: 20 });
      setRows(res.data || []);
      setTotals(res.totals);
      setPagination(res.pagination);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [status, search, page]);

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const open = (id) => setParams(id ? { order: id } : {});
  const c = totals?.count || {};
  const tabs = [
    { value: "", label: "All", count: c.all || 0 },
    { value: "unpaid", label: "Unpaid", count: c.unpaid || 0 },
    { value: "partial", label: "Partly paid", count: c.partial || 0 },
    { value: "paid", label: "Paid", count: c.paid || 0 },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Payments" subtitle="What each customer owes, what they paid and the balance. Invoiced orders appear here." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 sm:p-5"><Stat label="Total invoiced" value={money(totals?.due)} /></Card>
        <Card className="p-4 sm:p-5"><Stat label="Received" value={money(totals?.paid)} tone="green" /></Card>
        <Card className="p-4 sm:p-5"><Stat label="Outstanding" value={money(totals?.outstanding)} tone={totals?.outstanding > 0 ? "red" : undefined} /></Card>
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 sm:px-5 border-b border-gray-100"><Tabs tabs={tabs} value={status} onChange={(v) => { setStatus(v); setPage(1); }} /></div>
        <div className="p-4 sm:px-5 border-b border-gray-100 bg-gray-50/50">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input type="search" aria-label="Search payments" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search order no, customer, car or invoice no" className={cx(inputClass, "pl-9")} />
          </div>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">{Array(4).fill(0).map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon={Wallet} title="Nothing here yet" text="When you mark an order as Invoiced (or set an invoice amount), it appears here." action={<Link to="/admin/orders" className="text-sm font-semibold text-[#1B7DB3] hover:underline">Go to orders →</Link>} />
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider whitespace-nowrap">
                    <th className="px-5 py-3 text-left font-semibold">Order</th>
                    <th className="px-4 py-3 text-left font-semibold">Customer</th>
                    <th className="px-4 py-3 text-right font-semibold">Due</th>
                    <th className="px-4 py-3 text-right font-semibold">Paid</th>
                    <th className="px-4 py-3 text-right font-semibold">Balance</th>
                    <th className="px-5 py-3 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((o) => (
                    <tr key={o._id} onClick={() => open(o._id)} className="cursor-pointer hover:bg-[#F5F9FF] transition">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-[#0A1628]">{orderRef(o.orderNo)}{o.invoice?.number ? <span className="text-xs font-normal text-gray-500"> · {o.invoice.number}</span> : null}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[240px]">{o.carInfo?.title}</p>
                      </td>
                      <td className="px-4 py-3"><p className="text-gray-900">{o.customer?.name}</p><p className="text-xs text-gray-500">{o.customer?.country}</p></td>
                      <td className="px-4 py-3 text-right tabular-nums">{money(o.finance.due)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-green-700">{money(o.finance.paid)}</td>
                      <td className={cx("px-4 py-3 text-right tabular-nums font-semibold", o.finance.balance > 0.009 ? "text-red-600" : "text-gray-500")}>{money(o.finance.balance)}</td>
                      <td className="px-5 py-3"><Badge tone={PAYMENT_TONES[o.finance.status]}>{PAYMENT_LABELS[o.finance.status]}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-gray-100">
              {rows.map((o) => (
                <button key={o._id} type="button" onClick={() => open(o._id)} className="w-full text-left p-4 hover:bg-[#F5F9FF]">
                  <div className="flex justify-between gap-2"><span className="font-semibold text-[#0A1628]">{orderRef(o.orderNo)}</span><Badge tone={PAYMENT_TONES[o.finance.status]}>{PAYMENT_LABELS[o.finance.status]}</Badge></div>
                  <p className="text-sm text-gray-900 mt-1">{o.customer?.name}</p>
                  <p className="text-xs text-gray-500 mt-1 tabular-nums">Due {money(o.finance.due)} · Paid {money(o.finance.paid)} · <span className={o.finance.balance > 0.009 ? "text-red-600 font-semibold" : ""}>Balance {money(o.finance.balance)}</span></p>
                </button>
              ))}
            </div>
          </>
        )}
        {pagination.totalPages > 1 && (
          <div className="px-4 sm:px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-3">
            <p className="text-xs text-gray-500">Page {page} of {pagination.totalPages}</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
              <Button variant="secondary" size="sm" disabled={page === pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      {openId && <OrderFinanceDrawer key={openId} orderId={openId} onClose={() => open(null)} onChanged={load} />}
    </div>
  );
}
