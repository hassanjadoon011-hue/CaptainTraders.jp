import { useEffect, useState, useCallback } from "react";
import {
  Car,
  CheckCircle,
  Tag,
  DollarSign,
  TrendingUp,
  Warehouse,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";

const money = (n) => `$${Number(n || 0).toLocaleString()}`;

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

const EMPTY = {
  cars: { total: 0, available: 0, sold: 0 },
  revenue: { total: 0, thisMonth: 0, soldThisMonth: 0, inventoryValue: 0 },
  monthly: [],
  recentSales: [],
  messages: { total: 0, unread: 0 },
};

function StatCard({ label, value, hint, icon: Icon, bg, color, className = "" }) {
  return (
    <div
      className={`bg-white rounded-xl p-3 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md transition min-w-0 ${className}`}
    >
      <div
        className={`w-9 h-9 sm:w-10 sm:h-10 ${bg} rounded-lg flex items-center justify-center mb-2 sm:mb-3`}
      >
        <Icon size={18} className={color} />
      </div>
      <p className="text-gray-500 text-xs sm:text-sm">{label}</p>
      <p className="text-lg sm:text-2xl font-bold text-gray-800 mt-1 break-words">{value}</p>
      <p className="text-[11px] sm:text-xs text-gray-400 mt-1">{hint}</p>
    </div>
  );
}

function SalesChart({ monthly }) {
  const max = Math.max(...monthly.map((m) => m.revenue), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-gray-800">Revenue — last 6 months</h3>
          <p className="text-xs text-gray-400 mt-0.5">Based on cars marked as sold</p>
        </div>
      </div>

      <div className="flex items-end gap-1.5 sm:gap-3 h-44">
        {monthly.map((m) => {
          const height = m.revenue > 0 ? Math.max(6, (m.revenue / max) * 100) : 2;
          return (
            <div key={m.label} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
              <p className="text-[9px] sm:text-[10px] text-gray-500 mb-1 truncate max-w-full">
                {m.revenue > 0 ? money(m.revenue) : ""}
              </p>
              <div
                title={`${m.label}: ${money(m.revenue)} · ${m.count} sold`}
                className={`w-full rounded-t-md transition-all ${
                  m.revenue > 0 ? "bg-[#29ABE2]" : "bg-gray-100"
                }`}
                style={{ height: `${height}%` }}
              />
              <p className="text-[11px] sm:text-xs text-gray-500 mt-2">{m.label}</p>
              <p className="text-[10px] text-gray-400">{m.count} sold</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecentSales({ sales }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
      <h3 className="font-bold text-gray-800 mb-4">Recent sales</h3>

      {sales.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">
          No cars sold yet. Mark a car as sold in the Cars list and it will show here.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {sales.map((s) => (
            <li key={s._id} className="flex items-center gap-3 py-3">
              <div className="w-12 h-10 rounded-md bg-gray-100 overflow-hidden shrink-0">
                {s.image && (
                  <img src={s.image} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {s.make} {s.model} {s.year}
                </p>
                <p className="text-xs text-gray-400">{formatDate(s.soldDate)}</p>
              </div>
              <p className="text-sm font-bold text-green-600 shrink-0">{money(s.price)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DashboardStats() {
  const [stats, setStats] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axiosClient.get("/stats");
      setStats({ ...EMPTY, ...(res.data?.data || {}) });
      setError(false);
    } catch (err) {
      console.log(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    window.addEventListener("cars-updated", fetchStats);
    window.addEventListener("messages-updated", fetchStats);
    const interval = setInterval(fetchStats, 60000);

    return () => {
      window.removeEventListener("cars-updated", fetchStats);
      window.removeEventListener("messages-updated", fetchStats);
      clearInterval(interval);
    };
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 animate-pulse">
              <div className="w-10 h-10 bg-gray-100 rounded-lg mb-3" />
              <div className="h-3 bg-gray-100 rounded w-24 mb-2" />
              <div className="h-7 bg-gray-100 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-700 px-4 sm:px-5 py-4 rounded-xl">
        <div className="flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0" />
          <p className="text-sm font-medium">Could not load dashboard statistics.</p>
        </div>
        <button
          onClick={fetchStats}
          className="text-sm font-semibold underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const { cars, revenue, monthly, recentSales, messages } = stats;

  const topCards = [
    {
      label: "Total Cars",
      value: cars.total,
      hint: "vehicles in inventory",
      icon: Car,
      bg: "bg-blue-50",
      color: "text-[#29ABE2]",
    },
    {
      label: "Available",
      value: cars.available,
      hint: "for sale right now",
      icon: CheckCircle,
      bg: "bg-green-50",
      color: "text-green-500",
    },
    {
      label: "Sold",
      value: cars.sold,
      hint: `${revenue.soldThisMonth} sold this month`,
      icon: Tag,
      bg: "bg-red-50",
      color: "text-red-500",
    },
    {
      label: "Total Revenue",
      value: money(revenue.total),
      hint: "from all sold cars",
      icon: DollarSign,
      bg: "bg-emerald-50",
      color: "text-emerald-600",
    },
  ];

  const bottomCards = [
    {
      label: "Revenue This Month",
      value: money(revenue.thisMonth),
      hint: `${revenue.soldThisMonth} ${revenue.soldThisMonth === 1 ? "car" : "cars"} sold`,
      icon: TrendingUp,
      bg: "bg-indigo-50",
      color: "text-indigo-500",
    },
    {
      label: "Inventory Value",
      value: money(revenue.inventoryValue),
      hint: "total price of available cars",
      icon: Warehouse,
      bg: "bg-amber-50",
      color: "text-amber-500",
    },
    {
      label: "Messages",
      value: messages.total,
      hint: `${messages.unread} unread`,
      icon: MessageSquare,
      bg: "bg-purple-50",
      color: "text-purple-500",
    },
  ];

  return (
    <div className="space-y-3 sm:space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {topCards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      {/* 3 cards: on phones/tablets the last one stretches full width so there is no empty gap */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
        {bottomCards.map((c, i) => (
          <StatCard
            key={c.label}
            {...c}
            className={i === 2 ? "col-span-2 lg:col-span-1" : ""}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-5">
        <div className="xl:col-span-2 min-w-0">
          <SalesChart monthly={monthly} />
        </div>
        <div className="min-w-0">
          <RecentSales sales={recentSales} />
        </div>
      </div>
    </div>
  );
}