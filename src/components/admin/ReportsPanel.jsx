import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download, AlertTriangle, BarChart3 } from "lucide-react";
import { getProfitLoss, getVehicleReport, getCountryReport, getInventoryReport, getReceivables } from "../../api/reportApi";
import { downloadCsv } from "../../utils/csv";
import { formatDate, orderRef } from "../../constants/stockOptions";
import { Badge, Button, Card, CardHeader, EmptyState, Field, PageHeader, Stat, Tabs, cx, inputClass, money } from "./ui";
import { HBarList, Legend, RevenueCostChart, SERIES } from "./ReportCharts";

const TABS = [
  { value: "pl", label: "Profit & loss" },
  { value: "vehicles", label: "By vehicle & make" },
  { value: "countries", label: "Countries" },
  { value: "inventory", label: "Inventory aging" },
  { value: "receivables", label: "Receivables & arrivals" },
];
// Local calendar date (toISOString would shift to UTC and change the day east of UTC)
const iso = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; };
const pct = (n) => (n == null ? "—" : `${n}%`);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const periodLabel = (p) => (p.length === 7 ? `${MONTHS[Number(p.slice(5)) - 1]} ${p.slice(2, 4)}` : p.length === 10 ? p.slice(5) : p);
const CATEGORY = { auction_fee: "Auction fees", transport: "Inland transport", inspection: "Inspection", repair: "Repairs", storage: "Storage", documents: "Documents", shipping: "Ocean freight", customs: "Customs", commission: "Commission", marketing: "Marketing", office: "Office", other: "Other", purchase: "Purchases (other)" };

// Shared table: columns [{ key, label, align, render, csv }]
function Table({ rows, columns, empty = "No data for this period." }) {
  if (!rows.length) return <EmptyState icon={BarChart3} title={empty} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider whitespace-nowrap">
            {columns.map((c) => <th key={c.key} className={cx("px-4 py-2.5 font-semibold first:pl-5 last:pr-5", c.align === "right" ? "text-right" : "text-left")}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r, i) => (
            <tr key={r._id || r.period || r.country || r.make || r.label || i} className="hover:bg-[#F5F9FF]">
              {columns.map((c) => (
                <td key={c.key} className={cx("px-4 py-2.5 first:pl-5 last:pr-5 whitespace-nowrap", c.align === "right" && "text-right tabular-nums")}>
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const exportBtn = (name, rows, columns) => (
  <Button variant="secondary" size="sm" disabled={!rows?.length} onClick={() => downloadCsv(`${name}-${iso(new Date())}.csv`, rows, columns.map((c) => ({ label: c.label, value: c.csv || ((r) => r[c.key]) })))}>
    <Download size={14} /> Export CSV
  </Button>
);
const profitCell = (v) => <span className={cx("font-semibold", v < 0 ? "text-red-600" : "text-green-700")}>{money(v)}</span>;

function Loading() {
  return <div className="space-y-4">{[0, 1].map((i) => <div key={i} className="h-40 bg-white border border-gray-200/70 rounded-xl animate-pulse" />)}</div>;
}

/* ───────── Profit & loss ───────── */
function ProfitLoss() {
  const [group, setGroup] = useState("month");
  const [from, setFrom] = useState(iso(new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)));
  const [to, setTo] = useState(iso(new Date()));
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    setError("");
    getProfitLoss({ group, from, to }).then(setData).catch((e) => setError(e.response?.data?.message || "Could not load the report."));
  }, [group, from, to]);

  const columns = [
    { key: "period", label: "Period", render: (r) => <span className="font-medium text-gray-900">{periodLabel(r.period)}</span>, csv: (r) => r.period },
    { key: "revenue", label: "Revenue", align: "right", render: (r) => money(r.revenue) },
    { key: "refunds", label: "Refunds", align: "right", render: (r) => (r.refunds ? money(r.refunds) : "—") },
    { key: "purchases", label: "Car purchases", align: "right", render: (r) => money(r.purchases) },
    { key: "expenses", label: "Expenses", align: "right", render: (r) => money(r.expenses) },
    { key: "profit", label: "Profit", align: "right", render: (r) => profitCell(r.profit) },
  ];

  return (
    <div className="space-y-5">
      <Card className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Group by">
          <select className={inputClass} value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="day">Day</option><option value="month">Month</option><option value="year">Year</option>
          </select>
        </Field>
        <Field label="From"><input type="date" className={inputClass} value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="To"><input type="date" className={inputClass} value={to} min={from} onChange={(e) => setTo(e.target.value)} /></Field>
      </Card>
      {error ? <Card className="p-4 text-sm text-red-600">{error}</Card> : !data ? <Loading /> : <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 sm:p-5"><Stat label="Revenue received" value={money(data.totals.revenue)} /></Card>
          <Card className="p-4 sm:p-5"><Stat label="Costs (purchases + expenses)" value={money(data.totals.costs)} /></Card>
          <Card className="p-4 sm:p-5"><Stat label="Profit" value={money(data.totals.profit)} tone={data.totals.profit < 0 ? "red" : "green"} /></Card>
          <Card className="p-4 sm:p-5"><Stat label="Margin" value={pct(data.totals.margin)} /></Card>
        </div>
        {data.missingUSD > 0 && (
          <p className="flex gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" /> {data.missingUSD} cost item{data.missingUSD > 1 ? "s have" : " has"} no USD value and {data.missingUSD > 1 ? "are" : "is"} not counted. Add the USD value or set the exchange rate.
          </p>
        )}
        <Card>
          <CardHeader title="Revenue vs costs" subtitle="Revenue = payments received. Costs = car purchases + expenses." actions={<Legend items={[["Revenue", SERIES.revenue], ["Costs", SERIES.costs]]} />} />
          <div className="p-4 sm:p-5"><RevenueCostChart rows={data.series} label={(r) => periodLabel(r.period)} /></div>
        </Card>
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
          <Card className="overflow-hidden min-w-0">
            <CardHeader title="Breakdown" actions={exportBtn(`profit-loss-${group}`, data.series, columns)} />
            <Table rows={data.series} columns={columns} />
          </Card>
          <Card>
            <CardHeader title="Expenses by category" />
            <div className="p-4 sm:p-5">
              {data.byCategory.length ? <HBarList rows={data.byCategory.map((c) => ({ label: CATEGORY[c.category] || c.category, value: c.usd }))} color={SERIES.costs} /> : <p className="text-sm text-gray-500">No expenses in this period.</p>}
            </div>
          </Card>
        </div>
      </>}
    </div>
  );
}

/* ───────── Per vehicle / make ───────── */
function Vehicles() {
  const [status, setStatus] = useState("sold");
  const [data, setData] = useState(null);
  useEffect(() => { setData(null); getVehicleReport({ status }).then(setData).catch(() => setData({ vehicles: [], byMake: [], totals: {} })); }, [status]);
  const vCols = [
    { key: "title", label: "Vehicle", render: (r) => <Link to={`/admin/cars/${r._id}/costs`} className="font-medium text-[#1B7DB3] hover:underline">{r.title}</Link> },
    { key: "stockNo", label: "Stock" },
    { key: "revenue", label: "Received", align: "right", render: (r) => money(r.revenue) },
    { key: "purchase", label: "Purchase", align: "right", render: (r) => money(r.purchase) },
    { key: "expenses", label: "Expenses", align: "right", render: (r) => money(r.expenses) },
    { key: "profit", label: "Profit", align: "right", render: (r) => <>{profitCell(r.profit)}{r.costMissing && <Badge tone="amber" className="ml-1.5">no cost</Badge>}</> },
    { key: "margin", label: "Margin", align: "right", render: (r) => pct(r.margin) },
  ];
  const mCols = [
    { key: "make", label: "Make", render: (r) => <span className="font-medium text-gray-900">{r.make}</span> },
    { key: "cars", label: "Cars", align: "right" },
    { key: "revenue", label: "Received", align: "right", render: (r) => money(r.revenue) },
    { key: "cost", label: "Cost", align: "right", render: (r) => money(r.cost) },
    { key: "profit", label: "Profit", align: "right", render: (r) => profitCell(r.profit) },
    { key: "avgProfit", label: "Avg / car", align: "right", render: (r) => money(r.avgProfit) },
  ];
  return (
    <div className="space-y-5">
      <Card className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-end gap-3">
        <Field label="Vehicles" className="sm:w-60">
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="sold">Sold</option><option value="available">Unsold</option><option value="all">All</option>
          </select>
        </Field>
        <p className="text-xs text-gray-500 sm:pb-2.5">Received = payments on non-cancelled orders for the car. Cost = purchase + its expenses.</p>
      </Card>
      {!data ? <Loading /> : <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 sm:p-5"><Stat label="Vehicles" value={data.totals.cars ?? 0} /></Card>
          <Card className="p-4 sm:p-5"><Stat label="Received" value={money(data.totals.revenue)} /></Card>
          <Card className="p-4 sm:p-5"><Stat label="Cost" value={money(data.totals.cost)} /></Card>
          <Card className="p-4 sm:p-5"><Stat label="Profit" value={money(data.totals.profit)} tone={data.totals.profit < 0 ? "red" : "green"} /></Card>
        </div>
        {data.missingCost > 0 && <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">{data.missingCost} vehicle{data.missingCost > 1 ? "s have" : " has"} no purchase cost recorded, so profit is overstated. Add it on the car's Costs page.</p>}
        <Card className="overflow-hidden"><CardHeader title="By make" actions={exportBtn("profit-by-make", data.byMake, mCols)} /><Table rows={data.byMake} columns={mCols} empty="No vehicles." /></Card>
        <Card className="overflow-hidden"><CardHeader title={`By vehicle (${data.vehicles.length})`} actions={exportBtn("profit-by-vehicle", data.vehicles, vCols)} /><Table rows={data.vehicles} columns={vCols} empty="No vehicles." /></Card>
      </>}
    </div>
  );
}

/* ───────── Countries ───────── */
function Countries() {
  const [from, setFrom] = useState(iso(new Date(Date.now() - 365 * 86400000)));
  const [to, setTo] = useState(iso(new Date()));
  const [data, setData] = useState(null);
  useEffect(() => { getCountryReport({ from, to }).then(setData).catch(() => setData({ countries: [], totals: {} })); }, [from, to]);
  const cols = [
    { key: "country", label: "Country", render: (r) => <span className="font-medium text-gray-900">{r.country}</span> },
    { key: "requests", label: "Requests", align: "right" },
    { key: "inquiries", label: "Inquiries", align: "right" },
    { key: "orders", label: "Orders", align: "right" },
    { key: "won", label: "Sold", align: "right" },
    { key: "conversion", label: "Conversion", align: "right", render: (r) => pct(r.conversion) },
    { key: "revenue", label: "Received", align: "right", render: (r) => money(r.revenue) },
  ];
  return (
    <div className="space-y-5">
      <Card className="p-4 sm:p-5 grid grid-cols-2 gap-3 sm:max-w-md">
        <Field label="From"><input type="date" className={inputClass} value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="To"><input type="date" className={inputClass} value={to} min={from} onChange={(e) => setTo(e.target.value)} /></Field>
      </Card>
      {!data ? <Loading /> : <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 sm:p-5"><Stat label="Requests" value={data.totals.requests ?? 0} /></Card>
          <Card className="p-4 sm:p-5"><Stat label="Sold (paid / shipped / completed)" value={data.totals.won ?? 0} /></Card>
          <Card className="p-4 sm:p-5"><Stat label="Conversion" value={pct(data.totals.conversion)} /></Card>
          <Card className="p-4 sm:p-5"><Stat label="Received" value={money(data.totals.revenue)} /></Card>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5 items-start">
          <Card>
            <CardHeader title="Requests by country" subtitle="Top 10" />
            <div className="p-4 sm:p-5">
              {data.countries.length ? <HBarList rows={data.countries.slice(0, 10).map((c) => ({ label: c.country, value: c.requests, display: `${c.requests} · ${c.conversion}%` }))} format={(v) => v} /> : <p className="text-sm text-gray-500">No requests in this period.</p>}
            </div>
          </Card>
          <Card className="overflow-hidden min-w-0"><CardHeader title="All countries" actions={exportBtn("countries", data.countries, cols)} /><Table rows={data.countries} columns={cols} /></Card>
        </div>
      </>}
    </div>
  );
}

/* ───────── Inventory aging ───────── */
function Inventory() {
  const [data, setData] = useState(null);
  useEffect(() => { getInventoryReport().then(setData).catch(() => setData({ vehicles: [], buckets: [], totals: {} })); }, []);
  const cols = [
    { key: "title", label: "Vehicle", render: (r) => <Link to={`/admin/cars/edit/${r._id}`} className="font-medium text-[#1B7DB3] hover:underline">{r.title}</Link> },
    { key: "stockNo", label: "Stock" },
    { key: "days", label: "Days in stock", align: "right", render: (r) => <span className={cx("font-semibold", r.days > 90 ? "text-red-600" : r.days > 60 ? "text-amber-700" : "text-gray-900")}>{r.days}</span> },
    { key: "since", label: "Since", render: (r) => formatDate(r.since), csv: (r) => iso(r.since) },
    { key: "views", label: "Views", align: "right" },
    { key: "listPrice", label: "List price", align: "right", render: (r) => money(r.listPrice) },
    { key: "cost", label: "Cost", align: "right", render: (r) => money(r.cost) },
    { key: "expectedProfit", label: "Expected profit", align: "right", render: (r) => profitCell(r.expectedProfit) },
  ];
  if (!data) return <Loading />;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5"><Stat label="Unsold cars" value={data.totals.cars} /></Card>
        <Card className="p-4 sm:p-5"><Stat label="Average days in stock" value={data.totals.avgDays} /></Card>
        <Card className="p-4 sm:p-5"><Stat label="Stock at list price" value={money(data.totals.listValue)} /></Card>
        <Card className="p-4 sm:p-5"><Stat label="Money tied up (cost)" value={money(data.totals.cost)} /></Card>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5 items-start">
        <Card>
          <CardHeader title="Cars by age" subtitle="Days since purchase (or since added)" />
          <div className="p-4 sm:p-5"><HBarList rows={data.buckets.map((b) => ({ label: b.label, value: b.cars, display: `${b.cars} · ${money(b.listValue)}` }))} format={(v) => v} /></div>
        </Card>
        <Card className="overflow-hidden min-w-0"><CardHeader title="Oldest first" actions={exportBtn("inventory-aging", data.vehicles, cols)} /><Table rows={data.vehicles} columns={cols} empty="No unsold cars." /></Card>
      </div>
    </div>
  );
}

/* ───────── Receivables & arrivals ───────── */
function Receivables() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  useEffect(() => { getReceivables({ days }).then(setData).catch(() => setData({ outstanding: [], arrivals: [] })); }, [days]);
  const oCols = [
    { key: "orderNo", label: "Order", render: (r) => <Link to={`/admin/payments?order=${r._id}`} className="font-medium text-[#1B7DB3] hover:underline">{orderRef(r.orderNo)}</Link>, csv: (r) => orderRef(r.orderNo) },
    { key: "invoiceNo", label: "Invoice" },
    { key: "customer", label: "Customer" },
    { key: "country", label: "Country" },
    { key: "due", label: "Due", align: "right", render: (r) => money(r.due) },
    { key: "paid", label: "Paid", align: "right", render: (r) => money(r.paid) },
    { key: "balance", label: "Balance", align: "right", render: (r) => <span className="font-semibold text-red-600">{money(r.balance)}</span> },
    { key: "dueAt", label: "Due date", render: (r) => (r.dueAt ? formatDate(r.dueAt) : "—"), csv: (r) => (r.dueAt ? iso(r.dueAt) : "") },
    { key: "daysOverdue", label: "Overdue", align: "right", render: (r) => (r.daysOverdue ? <Badge tone="red">{r.daysOverdue} days</Badge> : "—") },
  ];
  const aCols = [
    { key: "eta", label: "ETA", render: (r) => formatDate(r.eta), csv: (r) => iso(r.eta) },
    { key: "daysToArrival", label: "In", align: "right", render: (r) => (r.daysToArrival < 0 ? <Badge tone="amber">{-r.daysToArrival} days late</Badge> : `${r.daysToArrival} days`) },
    { key: "orderNo", label: "Order", render: (r) => (r.orderNo ? orderRef(r.orderNo) : "—"), csv: (r) => (r.orderNo ? orderRef(r.orderNo) : "") },
    { key: "customer", label: "Customer" },
    { key: "vehicle", label: "Vehicle" },
    { key: "vessel", label: "Vessel" },
    { key: "portOfDischarge", label: "Port" },
    { key: "blNo", label: "B/L" },
  ];
  if (!data) return <Loading />;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4 sm:p-5"><Stat label="Outstanding" value={money(data.outstandingTotal)} tone={data.outstandingTotal > 0 ? "red" : undefined} /></Card>
        <Card className="p-4 sm:p-5"><Stat label="Overdue" value={money(data.overdueTotal)} tone={data.overdueTotal > 0 ? "red" : undefined} /></Card>
        <Card className="p-4 sm:p-5 col-span-2 lg:col-span-1"><Stat label={`Arriving in ${days} days`} value={data.arrivals.length} /></Card>
      </div>
      <Card className="overflow-hidden"><CardHeader title={`Outstanding payments (${data.outstanding.length})`} subtitle="Invoiced orders with a balance, most overdue first" actions={exportBtn("outstanding-payments", data.outstanding, oCols)} /><Table rows={data.outstanding} columns={oCols} empty="Nothing outstanding." /></Card>
      <Card className="overflow-hidden">
        <CardHeader title={`Upcoming arrivals (${data.arrivals.length})`} subtitle="Ships not yet arrived, including late ones" actions={<>
          <select aria-label="Arrival window" className={cx(inputClass, "h-8 w-auto text-xs")} value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {[7, 14, 30, 60, 90].map((d) => <option key={d} value={d}>Next {d} days</option>)}
          </select>
          {exportBtn("upcoming-arrivals", data.arrivals, aCols)}
        </>} />
        <Table rows={data.arrivals} columns={aCols} empty="No arrivals in this window." />
      </Card>
    </div>
  );
}

export default function ReportsPanel() {
  const [tab, setTab] = useState("pl");
  const View = useMemo(() => ({ pl: ProfitLoss, vehicles: Vehicles, countries: Countries, inventory: Inventory, receivables: Receivables })[tab], [tab]);
  return (
    <div className="space-y-5">
      <PageHeader title="Reports" subtitle="Calculated from your payments, purchase costs and expenses. All amounts in USD." />
      <Card className="px-4 sm:px-5"><Tabs tabs={TABS} value={tab} onChange={setTab} /></Card>
      <View />
    </div>
  );
}
