import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Inbox, CarFront as Car, DollarSign, TrendingUp, Eye, CheckCircle2, Star, Mail,
  AlertTriangle, Globe2,
} from "lucide-react";
import { getDashboardSummary } from "../../api/orderApi";
import { usd, formatDate, orderRef, statusMeta } from "../../constants/stockOptions";

// Brand blue for every metric; green only for money that came in
const BRAND = "bg-[#E0F5FF] text-[#1B7DB3]";
const TONES = {
  sky: BRAND,
  indigo: BRAND,
  amber: BRAND,
  violet: BRAND,
  rose: BRAND,
  green: "bg-green-50 text-green-700",
};

function Kpi({ icon: Icon, label, value, hint, tone = "sky", to }) {
  const body = (
    <div className={`bg-white rounded-xl border border-gray-200/70 shadow-sm p-4 sm:p-5 h-full transition ${to ? "hover:border-[#29ABE2]/40 hover:shadow-md" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-gray-500 leading-snug">{label}</p>
        <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${TONES[tone]}`}>
          <Icon size={17} />
        </span>
      </div>
      <p className="text-2xl font-bold text-[#0A1628] tracking-tight mt-1 tabular-nums">{value}</p>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
  return to ? <Link to={to} className="block min-w-0">{body}</Link> : <div className="min-w-0">{body}</div>;
}

function Panel({ title, action, children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200/70 shadow-sm p-4 sm:p-5 min-w-0 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#0A1628]">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function DashboardStats() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await getDashboardSummary());
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    load();
    window.addEventListener("cars-updated", load);
    window.addEventListener("orders-updated", load);
    return () => {
      window.removeEventListener("cars-updated", load);
      window.removeEventListener("orders-updated", load);
    };
  }, [load]);

  if (error && !data) {
    return (
      <div className="bg-white rounded-xl border border-gray-200/70 shadow-sm p-8 text-center">
        <p className="text-sm text-gray-500">Could not load the dashboard.</p>
        <button onClick={load} className="mt-3 text-sm font-semibold text-[#29ABE2] hover:underline">Try again</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-36 bg-gray-200 rounded-xl" />)}
        </div>
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  const { cars, orders, months, topCountries, recentOrders, topViewed } = data;
  const maxMonth = Math.max(1, ...months.map((m) => m.total));
  const maxCountry = Math.max(1, ...topCountries.map((c) => c.n));

  return (
    <div className="space-y-5">

      {/* DATA WARNING */}
      {cars.missingVolume > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm">
            <b>{cars.missingVolume}</b> available {cars.missingVolume === 1 ? "car has" : "cars have"} no Volume (M³).
            The price calculator cannot work for {cars.missingVolume === 1 ? "it" : "them"}.{" "}
            <Link to="/admin/cars" className="font-semibold underline">Fix in Cars</Link>
          </p>
        </div>
      )}

      {/* MAIN KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi icon={Inbox} tone="sky" label="New orders & inquiries" value={orders.byStatus.new || 0}
          hint={`${orders.total} in total`} to="/admin/orders" />
        <Kpi icon={Car} tone="indigo" label="Cars in stock" value={cars.available}
          hint={`${cars.sold} sold`} to="/admin/cars" />
        <Kpi icon={DollarSign} tone="amber" label="Stock value (FOB)" value={usd(cars.stockValue)}
          hint="Price of available cars" />
        <Kpi icon={TrendingUp} tone="green" label="Confirmed sales" value={usd(orders.confirmedValue)}
          hint={`${orders.confirmedCount} paid or shipped`} />
      </div>

      {/* SMALL KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi icon={Eye} tone="violet" label="Total car views" value={cars.views.toLocaleString()} />
        <Kpi icon={Star} tone="amber" label="Recommended / Best deals" value={`${cars.recommended} / ${cars.bestDeals}`} />
        <Kpi icon={CheckCircle2} tone="green" label="Completed orders" value={orders.byStatus.completed || 0} />
        <Kpi icon={Mail} tone="rose" label="Unread messages" value={data.unreadMessages} to="/admin/messages" />
      </div>

      {/* CHART + COUNTRIES */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Panel title="Requests — last 6 months" className="xl:col-span-2"
          action={
            <div className="flex items-center gap-3 text-[11px] text-gray-500">
              <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm bg-[#29ABE2]/30" /> Inquiries</span>
              <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm bg-[#29ABE2]" /> Orders</span>
            </div>
          }>
          <div className="flex items-end gap-3 h-44">
            {months.map((m) => {
              const h = (m.total / maxMonth) * 100;
              const orderH = m.total ? (m.orders / m.total) * 100 : 0;
              return (
                <div key={m.key} className="flex-1 flex flex-col items-center justify-end h-full gap-2 min-w-0">
                  <span className="text-xs font-semibold text-gray-600">{m.total}</span>
                  <div className="w-full max-w-[56px] rounded-t-lg bg-[#29ABE2]/30 overflow-hidden flex flex-col justify-end"
                    style={{ height: `${Math.max(h, m.total ? 4 : 1.5)}%` }}>
                    <div className="bg-[#29ABE2]" style={{ height: `${orderH}%` }} />
                  </div>
                  <span className="text-xs text-gray-400">{m.label}</span>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Top customer countries" action={<Globe2 size={16} className="text-gray-400" />}>
          {topCountries.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No requests yet</p>
          ) : (
            <ul className="space-y-3">
              {topCountries.map((c) => (
                <li key={c.country}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 truncate">{c.country}</span>
                    <span className="font-semibold text-gray-800">{c.n}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#29ABE2] rounded-full" style={{ width: `${(c.n / maxCountry) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* RECENT + MOST VIEWED */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Panel title="Recent orders & inquiries" className="xl:col-span-2"
          action={<Link to="/admin/orders" className="text-xs font-semibold text-[#29ABE2] hover:underline">View all →</Link>}>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Nothing yet. New requests will appear here.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentOrders.map((o) => {
                const m = statusMeta(o.status);
                return (
                  <li key={o._id}>
                    <Link to="/admin/orders" className="flex items-center gap-3 py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition">
                      {o.carInfo?.image ? (
                        <img src={o.carInfo.image} alt="" className="w-14 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-14 h-10 rounded-lg bg-gray-100 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {!o.isRead && <span className="inline-block w-2 h-2 rounded-full bg-[#29ABE2] mr-2" />}
                          {o.carInfo?.title}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {orderRef(o.orderNo)} · {o.customer?.name}, {o.customer?.country} · {formatDate(o.createdAt)}
                        </p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${m.className}`}>{m.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Most viewed cars">
          {topViewed.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No cars yet</p>
          ) : (
            <ul className="space-y-3">
              {topViewed.map((c, i) => (
                <li key={c._id} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-gray-300">{i + 1}</span>
                  {c.images?.[0] ? (
                    <img src={c.images[0]} alt="" className="w-12 h-9 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-9 rounded-lg bg-gray-100 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.year} {c.make} {c.model}</p>
                    <p className="text-xs text-gray-400">{usd(c.price)}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-gray-500 shrink-0"><Eye size={12} /> {c.views || 0}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}