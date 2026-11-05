import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Bell, X, CarFront, MessageSquare, Menu, Inbox, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { getOrders } from "../../api/orderApi";
import { orderRef } from "../../constants/stockOptions";
import { useAdmin, ROLE_LABELS } from "../../context/AdminAuthContext";

export default function AdminHeader({ onMenuClick }) {
  const navigate = useNavigate();
  const { admin } = useAdmin();
  const displayName = admin?.name || admin?.email || "Admin";

  // SEARCH
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);

  // NOTIFICATIONS (new orders / inquiries + unread messages)
  const [showNotifs, setShowNotifs] = useState(false);
  const [items, setItems] = useState([]);
  const [badge, setBadge] = useState(0);
  const notifRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    const [msgRes, orderRes] = await Promise.allSettled([
      axiosClient.get("/messages", { params: { limit: 5 } }),
      getOrders({ status: "new", limit: 5 }),
    ]);

    const msgs = msgRes.status === "fulfilled" ? msgRes.value.data?.data || [] : [];
    const unreadMsgs = msgRes.status === "fulfilled" ? msgRes.value.data?.unreadCount ?? 0 : 0;

    const orders = orderRes.status === "fulfilled" ? orderRes.value.data || [] : [];
    const newOrders = orderRes.status === "fulfilled" ? orderRes.value.counts?.new ?? orders.length : 0;

    const merged = [
      ...msgs.map((m) => ({ kind: "message", key: m._id, raw: m, createdAt: m.createdAt, unread: !m.isRead })),
      ...orders.map((o) => ({ kind: "order", key: o._id, raw: o, createdAt: o.createdAt, unread: true })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);

    setItems(merged);
    setBadge(unreadMsgs + newOrders);
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    window.addEventListener("messages-updated", fetchNotifications);
    window.addEventListener("orders-updated", fetchNotifications);
    return () => {
      clearInterval(interval);
      window.removeEventListener("messages-updated", fetchNotifications);
      window.removeEventListener("orders-updated", fetchNotifications);
    };
  }, [fetchNotifications]);

  const handleNotificationClick = async (item) => {
    if (item.kind === "message") {
      try {
        if (!item.raw.isRead) {
          await axiosClient.patch(`/messages/${item.raw._id}/read`);
          fetchNotifications();
        }
      } catch (err) {
        console.log(err);
      }
      setShowNotifs(false);
      navigate("/admin/messages");
    } else {
      setShowNotifs(false);
      navigate("/admin/orders");
    }
  };

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await axiosClient.get("/cars", {
          params: { search: query.trim(), limit: 5 },
        });
        setSearchResults(res.data?.data?.slice(0, 5) || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [query]);

  // touchstart is added so dropdowns also close on touch screens
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchResults([]);
        setQuery("");
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await axiosClient.post("/admin/logout");
    } catch (err) {
      console.log(err);
    } finally {
      navigate("/login");
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200/70 flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 lg:px-8 z-30 relative shrink-0">

      {/* HAMBURGER (mobile only) */}
      <button
        onClick={onMenuClick}
        className="md:hidden w-10 h-10 -ml-1 rounded-lg text-gray-600 hover:bg-gray-100 flex items-center justify-center shrink-0"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* SEARCH */}
      <div ref={searchRef} className="relative flex-1 min-w-0 max-w-sm md:max-w-md">
        <div className="flex items-center h-10 bg-gray-50 border border-gray-200 px-3 rounded-lg gap-2 transition focus-within:bg-white focus-within:border-[#29ABE2] focus-within:ring-2 focus-within:ring-[#29ABE2]/20">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cars, chassis or stock no..."
            aria-label="Quick search"
            className="bg-transparent w-full min-w-0 outline-none text-base sm:text-sm text-gray-700 placeholder-gray-400"
          />
          {query && (
            <button onClick={() => { setQuery(""); setSearchResults([]); }} aria-label="Clear search">
              <X size={14} className="text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {(searchResults.length > 0 || searching) && (
          <div className="absolute top-full mt-2 w-full min-w-[220px] bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-50">
            {searching ? (
              <div className="px-4 py-3 text-sm text-gray-400">Searching...</div>
            ) : (
              searchResults.map((car) => (
                <button
                  key={car._id}
                  onClick={() => {
                    navigate(`/admin/cars/edit/${car._id}`);
                    setQuery("");
                    setSearchResults([]);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left border-b last:border-0"
                >
                  <div className="w-7 h-7 bg-[#29ABE2]/10 rounded-lg flex items-center justify-center shrink-0">
                    <CarFront size={13} className="text-[#29ABE2]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {car.make} {car.model}
                    </p>
                    <p className="text-xs text-gray-400">
                      {car.stockNo ? `#${car.stockNo} · ` : ""}{car.year} · ${car.price?.toLocaleString()}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-1 sm:gap-3 shrink-0">

        {/* NOTIFICATION BELL */}
        <div ref={notifRef} className="sm:relative">
          <button
            onClick={() => setShowNotifs((p) => !p)}
            className="relative w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 hover:text-[#1B7DB3] hover:bg-[#F0FAFF] transition"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {badge > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </button>

          {/* Phones: pinned under the header, full width. sm and up: under the bell */}
          {showNotifs && (
            <div className="fixed left-3 right-3 top-[68px] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-80 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-50">

              <div className="px-4 py-3 border-b flex items-center justify-between">
                <p className="text-sm font-bold text-gray-800">Notifications</p>
                <span className="text-xs bg-[#29ABE2]/10 text-[#29ABE2] px-2 py-0.5 rounded-full font-medium">
                  {badge} new
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                {items.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-center text-gray-400">No notifications</p>
                ) : (
                  items.map((item) => {
                    const isOrder = item.kind === "order";
                    const o = item.raw;
                    return (
                      <div
                        key={`${item.kind}-${item.key}`}
                        className={`px-4 py-3 hover:bg-gray-50 transition cursor-pointer ${
                          item.unread ? "bg-[#29ABE2]/5" : ""
                        }`}
                        onClick={() => handleNotificationClick(item)}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                              isOrder ? "bg-[#29ABE2]/10" : "bg-green-50"
                            }`}
                          >
                            {isOrder ? (
                              <Inbox size={13} className="text-[#29ABE2]" />
                            ) : (
                              <MessageSquare size={13} className="text-green-500" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm text-gray-800 truncate ${item.unread ? "font-bold" : "font-medium"}`}>
                              {isOrder
                                ? `${o.customer?.name || "Customer"} · ${o.carInfo?.title || "Vehicle"}`
                                : o.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                              {isOrder
                                ? `${orderRef(o.orderNo)} · New ${o.type === "order" ? "order" : "inquiry"} from ${o.customer?.country || "customer"}`
                                : o.message}
                            </p>
                          </div>
                          {item.unread && (
                            <span className="w-2 h-2 bg-[#29ABE2] rounded-full mt-2 shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="px-4 py-2.5 border-t flex items-center justify-between gap-3">
                <button
                  onClick={() => { navigate("/admin/orders"); setShowNotifs(false); }}
                  className="text-xs text-[#29ABE2] font-semibold hover:underline"
                >
                  View all orders →
                </button>
                <button
                  onClick={() => { navigate("/admin/messages"); setShowNotifs(false); }}
                  className="text-xs text-[#29ABE2] font-semibold hover:underline"
                >
                  View messages →
                </button>
              </div>
            </div>
          )}
        </div>

        <span className="hidden sm:block w-px h-6 bg-gray-200" aria-hidden="true" />

        {/* SIGNED-IN USER (static) + LOG OUT */}
        <button
          type="button"
          onClick={() => navigate("/admin/account")}
          title="My Account"
          aria-label="My Account"
          className="flex items-center gap-2.5 h-10 px-1 sm:px-2 rounded-lg hover:bg-gray-50 transition text-left"
        >
          <span className="w-8 h-8 bg-[#29ABE2] text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </span>
          <span className="hidden lg:block max-w-[160px] leading-tight">
            <span className="block text-sm font-semibold text-gray-800 truncate">{displayName}</span>
            <span className="block text-xs text-gray-500">{ROLE_LABELS[admin?.role] || "Admin"}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={handleLogout}
          title="Log out"
          aria-label="Log out"
          className="h-10 px-2.5 sm:px-3 rounded-lg text-sm font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 inline-flex items-center gap-1.5 transition"
        >
          <LogOut size={16} /> <span className="hidden sm:inline">Log out</span>
        </button>
      </div>
    </header>
  );
}