import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Bell, X, Car, MessageSquare, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

export default function AdminHeader({ onMenuClick }) {
  const navigate = useNavigate();

  // SEARCH
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);

  // NOTIFICATIONS
  const [showNotifs, setShowNotifs] = useState(false);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await axiosClient.get("/messages", { params: { limit: 5 } });
      setMessages(res.data?.data || []);
      setUnreadCount(res.data?.unreadCount ?? 0);
    } catch {
      setMessages([]);
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    window.addEventListener("messages-updated", fetchNotifications);
    return () => {
      clearInterval(interval);
      window.removeEventListener("messages-updated", fetchNotifications);
    };
  }, [fetchNotifications]);

  const handleNotificationClick = async (message) => {
    try {
      if (!message.isRead) {
        await axiosClient.patch(`/messages/${message._id}/read`);
        fetchNotifications();
      }
    } catch (err) {
      console.log(err);
    }
    setShowNotifs(false);
    navigate("/admin/messages");
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
    <header className="h-16 bg-white border-b flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 shadow-sm z-50 relative shrink-0">

      {/* HAMBURGER (mobile only) */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 -ml-1 rounded-lg text-gray-600 hover:bg-gray-100 shrink-0"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* SEARCH */}
      <div ref={searchRef} className="relative flex-1 min-w-0 max-w-sm md:max-w-md">
        <div className="flex items-center bg-gray-100 px-3 sm:px-4 py-2 rounded-lg gap-2">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cars..."
            className="bg-transparent w-full min-w-0 outline-none text-sm text-gray-600 placeholder-gray-400"
          />
          {query && (
            <button onClick={() => { setQuery(""); setSearchResults([]); }}>
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
                    <Car size={13} className="text-[#29ABE2]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {car.make} {car.model}
                    </p>
                    <p className="text-xs text-gray-400">
                      {car.year} · ${car.price?.toLocaleString()}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3 sm:gap-5 shrink-0">

        {/* NOTIFICATION BELL */}
        <div ref={notifRef} className="sm:relative">
          <button
            onClick={() => setShowNotifs((p) => !p)}
            className="relative p-1 text-gray-500 hover:text-[#29ABE2] transition"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Phones: pinned under the header, full width. sm and up: under the bell */}
          {showNotifs && (
            <div className="fixed left-3 right-3 top-[68px] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-80 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-50">

              <div className="px-4 py-3 border-b flex items-center justify-between">
                <p className="text-sm font-bold text-gray-800">Notifications</p>
                <span className="text-xs bg-[#29ABE2]/10 text-[#29ABE2] px-2 py-0.5 rounded-full font-medium">
                  {unreadCount} unread
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                {messages.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-center text-gray-400">No notifications</p>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m._id}
                      className={`px-4 py-3 hover:bg-gray-50 transition cursor-pointer ${
                        m.isRead ? "" : "bg-[#29ABE2]/5"
                      }`}
                      onClick={() => handleNotificationClick(m)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 bg-green-50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                          <MessageSquare size={13} className="text-green-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm text-gray-800 truncate ${m.isRead ? "font-medium" : "font-bold"}`}>
                            {m.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{m.message}</p>
                        </div>
                        {!m.isRead && (
                          <span className="w-2 h-2 bg-[#29ABE2] rounded-full mt-2 shrink-0" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 py-2.5 border-t">
                <button
                  onClick={() => { navigate("/admin/messages"); setShowNotifs(false); }}
                  className="text-xs text-[#29ABE2] font-semibold hover:underline"
                >
                  View all messages →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          className="text-sm text-red-500 font-semibold hover:text-red-600 transition"
        >
          Logout
        </button>

        {/* ADMIN INFO */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="text-right hidden lg:block">
            <p className="text-sm font-bold text-gray-800">Admin</p>
            <p className="text-xs text-gray-400">Super Admin</p>
          </div>
          <div className="w-9 h-9 bg-[#29ABE2] text-white rounded-full flex items-center justify-center font-bold text-sm shadow">
            A
          </div>
        </div>
      </div>
    </header>
  );
}