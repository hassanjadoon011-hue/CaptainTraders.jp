import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Plus, Receipt, ShoppingCart, Trash2, AlertTriangle } from "lucide-react";
import { getCarCosts, savePurchase, createExpense, deleteExpense } from "../../api/financeApi";
import { useAdmin } from "../../context/AdminAuthContext";
import { formatDate } from "../../constants/stockOptions";
import { Button, Card, CardHeader, EmptyState, Field, IconButton, PageHeader, Stat, StatusMessage, btnClass, dateInput, inputClass, money } from "./ui";

const CATEGORY_LABELS = {
  purchase: "Purchase", auction_fee: "Auction fee", transport: "Inland transport", inspection: "Inspection",
  repair: "Repair", storage: "Storage", documents: "Documents", shipping: "Ocean freight", customs: "Customs",
  commission: "Commission", marketing: "Marketing", office: "Office", other: "Other",
};
const CAR_CATEGORIES = Object.keys(CATEGORY_LABELS).filter((k) => !["purchase", "office", "marketing"].includes(k));

const emptyExpense = () => ({ category: "auction_fee", amount: "", currency: "JPY", amountUSD: "", date: dateInput(new Date()), vendor: "", reference: "", note: "" });
const toPurchaseForm = (p = {}) => ({
  price: p.price ?? "", currency: p.currency || "JPY", priceUSD: p.priceUSD ?? "", date: dateInput(p.date),
  source: p.source || "", auctionHouse: p.auctionHouse || "", lotNo: p.lotNo || "", supplier: p.supplier || "", note: p.note || "",
});

export default function CarCostsPanel() {
  const { id } = useParams();
  const { can } = useAdmin();
  const canEdit = can("finance.edit");
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [purchase, setPurchase] = useState(toPurchaseForm());
  const [expense, setExpense] = useState(emptyExpense());
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    getCarCosts(id)
      .then((d) => { setData(d); setPurchase(toPurchaseForm(d.purchase || {})); })
      .catch((e) => setLoadError(e.response?.data?.message || "Could not load costs."));
  }, [id]);
  useEffect(load, [load]);

  const run = async (fn, ok) => {
    setBusy(true);
    setStatus(null);
    try {
      await fn();
      setStatus({ type: "ok", text: ok });
      load();
      return true;
    } catch (e) {
      setStatus({ type: "error", text: e.response?.data?.message || "Could not save. Please try again." });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const savePurchaseForm = (e) => {
    e.preventDefault();
    run(() => savePurchase(id, { ...purchase, date: purchase.date || null }), "Purchase details saved.");
  };

  const addExpense = async (e) => {
    e.preventDefault();
    if (!(Number(expense.amount) > 0)) return setStatus({ type: "error", text: "Enter an amount greater than 0." });
    const ok = await run(() => createExpense({ ...expense, car: id, amountUSD: expense.amountUSD === "" ? null : expense.amountUSD }), "Expense added.");
    if (ok) setExpense(emptyExpense());
  };

  if (loadError) return <Card className="p-6 text-sm text-gray-600">{loadError}</Card>;
  if (!data) return <Card className="p-6 text-sm text-gray-500">Loading…</Card>;

  const { car, expenses, totals } = data;
  const title = [car.year, car.make, car.model].filter(Boolean).join(" ");
  const setP = (k) => (e) => setPurchase((p) => ({ ...p, [k]: e.target.value }));
  const setE = (k) => (e) => setExpense((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Costs & profit"
        subtitle={`${title}${car.stockNo ? ` · Stock #${car.stockNo}` : ""}${car.status === "sold" ? " · Sold" : ""}`}
        actions={<>
          <Link to="/admin/cars" className={btnClass("secondary")}><ArrowLeft size={16} /> Cars</Link>
          {can("cars.edit") && <Link to={`/admin/cars/edit/${car._id}`} className={btnClass("secondary")}><Pencil size={15} /> Edit car</Link>}
        </>}
      />

      <Card className="p-4 sm:p-5 grid grid-cols-2 md:grid-cols-5 gap-4">
        <Stat label="FOB price" value={money(totals.priceUSD)} />
        <Stat label="Purchase (USD)" value={money(totals.purchaseUSD)} />
        <Stat label="Expenses (USD)" value={money(totals.expensesUSD)} />
        <Stat label="Total cost" value={money(totals.totalCostUSD)} />
        <Stat label="Estimated profit" value={money(totals.estimatedProfitUSD)} tone={totals.estimatedProfitUSD >= 0 ? "green" : "red"} />
      </Card>
      {totals.missingUSD > 0 && (
        <p className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          {totals.missingUSD} cost item{totals.missingUSD > 1 ? "s have" : " has"} no USD value and {totals.missingUSD > 1 ? "are" : "is"} not counted. Set the exchange rate in Shipping & Rates, or enter the USD value.
        </p>
      )}
      <StatusMessage status={status} />

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-5 items-start">
        {/* PURCHASE */}
        <Card>
          <CardHeader icon={ShoppingCart} title="Purchase" subtitle="What you paid for this car. Never shown on the website." />
          <form onSubmit={savePurchaseForm} className="p-4 sm:p-5 grid grid-cols-2 gap-3">
            <Field label="Price paid"><input className={inputClass} inputMode="decimal" value={purchase.price} onChange={setP("price")} disabled={!canEdit} /></Field>
            <Field label="Currency">
              <select className={inputClass} value={purchase.currency} onChange={setP("currency")} disabled={!canEdit}><option>JPY</option><option>USD</option></select>
            </Field>
            {purchase.currency === "JPY" && (
              <Field label="USD value" hint="Empty = use exchange rate" className="col-span-2"><input className={inputClass} inputMode="decimal" value={purchase.priceUSD} onChange={setP("priceUSD")} disabled={!canEdit} /></Field>
            )}
            <Field label="Date"><input type="date" className={inputClass} value={purchase.date} onChange={setP("date")} disabled={!canEdit} /></Field>
            <Field label="Bought from">
              <select className={inputClass} value={purchase.source} onChange={setP("source")} disabled={!canEdit}>
                <option value="">—</option><option value="auction">Auction</option><option value="dealer">Dealer</option><option value="private">Private</option><option value="other">Other</option>
              </select>
            </Field>
            <Field label="Auction house"><input className={inputClass} value={purchase.auctionHouse} onChange={setP("auctionHouse")} placeholder="e.g. USS Tokyo" disabled={!canEdit} /></Field>
            <Field label="Lot no."><input className={inputClass} value={purchase.lotNo} onChange={setP("lotNo")} disabled={!canEdit} /></Field>
            <Field label="Supplier" className="col-span-2"><input className={inputClass} value={purchase.supplier} onChange={setP("supplier")} disabled={!canEdit} /></Field>
            <Field label="Note" className="col-span-2"><input className={inputClass} value={purchase.note} onChange={setP("note")} disabled={!canEdit} /></Field>
            {canEdit && <div className="col-span-2"><Button type="submit" disabled={busy} className="w-full sm:w-auto">Save purchase</Button></div>}
          </form>
        </Card>

        {/* EXPENSES */}
        <Card className="overflow-hidden min-w-0">
          <CardHeader icon={Receipt} title={`Expenses (${expenses.length})`} subtitle="Auction fees, transport, repairs, freight and other costs for this car" />
          {canEdit && (
            <form onSubmit={addExpense} className="p-4 sm:p-5 grid grid-cols-2 md:grid-cols-6 gap-3 border-b border-gray-100 bg-gray-50/50 items-end">
              <Field label="Category" className="col-span-2">
                <select className={inputClass} value={expense.category} onChange={setE("category")}>
                  {CAR_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                </select>
              </Field>
              <Field label="Amount"><input className={inputClass} inputMode="decimal" value={expense.amount} onChange={setE("amount")} /></Field>
              <Field label="Currency">
                <select className={inputClass} value={expense.currency} onChange={setE("currency")}><option>JPY</option><option>USD</option></select>
              </Field>
              <Field label="Date" className="col-span-2"><input type="date" className={inputClass} value={expense.date} onChange={setE("date")} /></Field>
              <Field label="Vendor" className="col-span-2"><input className={inputClass} value={expense.vendor} onChange={setE("vendor")} /></Field>
              <Field label="Receipt / ref."><input className={inputClass} value={expense.reference} onChange={setE("reference")} /></Field>
              {expense.currency === "JPY" ? (
                <Field label="USD value"><input className={inputClass} inputMode="decimal" value={expense.amountUSD} onChange={setE("amountUSD")} placeholder="Auto" /></Field>
              ) : <div className="hidden md:block" />}
              <div className="col-span-2"><Button type="submit" disabled={busy} className="w-full"><Plus size={16} /> Add expense</Button></div>
            </form>
          )}
          {expenses.length === 0 ? (
            <EmptyState icon={Receipt} title="No expenses yet" text="Add the costs you paid for this car to see its real profit." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider whitespace-nowrap">
                    <th className="px-5 py-2.5 text-left font-semibold">Date</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Category</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Vendor / ref.</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Amount</th>
                    <th className="px-4 py-2.5 text-right font-semibold">USD</th>
                    {canEdit && <th className="px-5 py-2.5" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenses.map((x) => (
                    <tr key={x._id}>
                      <td className="px-5 py-2.5 text-gray-500 whitespace-nowrap">{formatDate(x.date)}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-900">{CATEGORY_LABELS[x.category] || x.category}</td>
                      <td className="px-4 py-2.5 text-gray-600">{[x.vendor, x.reference].filter(Boolean).join(" · ") || "—"}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">{money(x.amount, x.currency)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">{x.amountUSD == null ? <span className="text-amber-600">missing</span> : money(x.amountUSD)}</td>
                      {canEdit && (
                        <td className="px-5 py-2.5 text-right">
                          <IconButton label="Delete expense" tone="danger" onClick={() => run(() => deleteExpense(x._id), "Expense deleted.")}><Trash2 size={15} /></IconButton>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 font-semibold">
                    <td className="px-5 py-2.5" colSpan={4}>Total expenses</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{money(totals.expensesUSD)}</td>
                    {canEdit && <td />}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
