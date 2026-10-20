import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Bell, X, Car, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

export default function AdminHeader() {
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

  /* ── FETCH LATEST MESSAGES + UNREAD COUNT ── */
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

    // refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    // refresh instantly when the Messages page changes something
    window.addEventListener("messages-updated", fetchNotifications);

    return () => {
      clearInterval(interval);
      window.removeEventListener("messages-updated", fetchNotifications);
    };
  }, [fetchNotifications]);

  /* ── OPEN A NOTIFICATION (mark as read, then go to messages) ── */
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

  /* ── SEARCH CARS ── */
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

  /* ── CLOSE DROPDOWNS ON OUTSIDE CLICK ── */
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
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── LOGOUT ── */
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
    <header className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm z-50 relative">

      {/* SEARCH */}
      <div ref={searchRef} className="relative w-96">
        <div className="flex items-center bg-gray-100 px-4 py-2 rounded-lg gap-2">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cars..."
            className="bg-transparent w-full outline-none text-sm text-gray-600 placeholder-gray-400"
          />
          {query && (
            <button onClick={() => { setQuery(""); setSearchResults([]); }}>
              <X size={14} className="text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* SEARCH DROPDOWN */}
        {(searchResults.length > 0 || searching) && (
          <div className="absolute top-full mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-50">
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
                  <div>
                    <p className="text-sm font-medium text-gray-800">
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
      <div className="flex items-center gap-5">

        {/* NOTIFICATION BELL */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifs((p) => !p)}
            className="relative text-gray-500 hover:text-[#29ABE2] transition"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* NOTIFICATION DROPDOWN */}
          {showNotifs && (
            <div className="absolute right-0 top-full mt-3 w-80 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-50">

              <div className="px-4 py-3 border-b flex items-center justify-between">
                <p className="text-sm font-bold text-gray-800">Notifications</p>
                <span className="text-xs bg-[#29ABE2]/10 text-[#29ABE2] px-2 py-0.5 rounded-full font-medium">
                  {unreadCount} unread
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                {messages.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-center text-gray-400">
                    No notifications
                  </p>
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
                          <p className={`text-sm text-gray-800 ${m.isRead ? "font-medium" : "font-bold"}`}>
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
        <div className="flex items-center gap-3">
          <div className="text-right">
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