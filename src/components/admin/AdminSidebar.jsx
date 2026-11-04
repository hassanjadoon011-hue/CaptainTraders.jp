import { useCallback, useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, CarFront as Car, PlusCircle, MessageSquare, Inbox, Ship, X, Users, UserCog, ChevronsUpDown, LogOut,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";
import { getOrders } from "../../api/orderApi";
import { useAdmin, ROLE_LABELS } from "../../context/AdminAuthContext";

export default function AdminSidebar({ isOpen, onClose }) {
  const { pathname } = useLocation();
  const { admin, can } = useAdmin();
  const [newOrders, setNewOrders] = useState(0);
  const [unread, setUnread] = useState(0);
  const [userMenu, setUserMenu] = useState(false);
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await axiosClient.post("/admin/logout");
    } catch {
      /* ignore: go to login anyway */
    }
    navigate("/login");
  };

  // Orders nobody has handled yet + unread messages
  const loadCounts = useCallback(async () => {
    const [orders, messages] = await Promise.allSettled([
      getOrders({ status: "new", limit: 1 }),
      axiosClient.get("/messages/unread-count"),
    ]);
    setNewOrders(orders.status === "fulfilled" ? orders.value?.counts?.new || 0 : 0);
    setUnread(messages.status === "fulfilled" ? messages.value?.data?.data?.unreadCount || 0 : 0);
  }, []);

  useEffect(() => {
    loadCounts();
    const timer = setInterval(loadCounts, 30000);
    window.addEventListener("orders-updated", loadCounts);
    window.addEventListener("messages-updated", loadCounts);
    return () => {
      clearInterval(timer);
      window.removeEventListener("orders-updated", loadCounts);
      window.removeEventListener("messages-updated", loadCounts);
    };
  }, [loadCounts]);

  // Close the drawer with Escape on phones
  useEffect(() => {
    if (!isOpen && !userMenu) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setUserMenu(false);
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, userMenu, onClose]);

  const sections = [
    {
      title: "Overview",
      items: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard, active: pathname === "/admin" }],
    },
    {
      title: "Sales",
      items: [
        { to: "/admin/orders", label: "Orders & Inquiries", icon: Inbox, active: pathname.startsWith("/admin/orders"), badge: newOrders },
        { to: "/admin/messages", label: "Messages", icon: MessageSquare, active: pathname.startsWith("/admin/messages"), badge: unread },
      ],
    },
    {
      title: "Inventory",
      items: [
        { to: "/admin/cars", label: "Cars", icon: Car, active: pathname === "/admin/cars" || pathname.startsWith("/admin/cars/edit") },
        { to: "/admin/cars/new", label: "Add Car", icon: PlusCircle, active: pathname === "/admin/cars/new", perm: "cars.create" },
        { to: "/admin/shipping", label: "Shipping & Rates", icon: Ship, active: pathname.startsWith("/admin/shipping") },
      ],
    },
    {
      title: "Settings",
      items: [
        { to: "/admin/users", label: "Admin Users", icon: Users, active: pathname.startsWith("/admin/users"), perm: "users.manage" },
        { to: "/admin/account", label: "My Account", icon: UserCog, active: pathname.startsWith("/admin/account") },
      ],
    },
  ]
    .map((s) => ({ ...s, items: s.items.filter((i) => !i.perm || can(i.perm)) }))
    .filter((s) => s.items.length > 0);

  const linkClass = (active) =>
    `group flex items-center gap-3 px-3 h-10 rounded-lg text-sm transition ${
      active
        ? "bg-white text-[#1B7DB3] font-semibold shadow-sm"
        : "text-white/90 font-medium hover:bg-white/15 hover:text-white"
    }`;

  const displayName = admin?.name || admin?.email || "Admin";

  return (
    <>
      {/* BACKDROP (phones/tablets) */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-[55] bg-[#0A1628]/50 backdrop-blur-[1px] md:hidden transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* SIDEBAR */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-[60] w-64 max-w-[85vw] bg-[#29ABE2] text-white
          flex flex-col shadow-2xl md:shadow-none
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:h-dvh md:shrink-0 md:max-w-none
        `}
        aria-label="Admin navigation"
      >
        {/* BRAND */}
        <div className="h-16 px-4 flex items-center justify-between gap-2 border-b border-white/20 shrink-0">
          <NavLink to="/admin" onClick={onClose} className="flex items-center gap-2.5 min-w-0" aria-label="Captain Traders.JP admin home">
            {/* Same "CT" monogram as the public website */}
            <span className="w-9 h-9 rounded-xl bg-white text-[#1B7DB3] flex items-center justify-center shrink-0 font-extrabold text-sm tracking-tight shadow-sm">
              CT
            </span>
            <div className="min-w-0 leading-tight">
              <p className="font-bold text-[15px] tracking-tight truncate">
                CaptainTraders<span className="font-semibold text-white/75">.JP</span>
              </p>
              <p className="text-[11px] font-medium text-white/80">Admin Panel</p>
            </div>
          </NavLink>
          <button
            onClick={onClose}
            className="md:hidden w-9 h-9 rounded-lg hover:bg-white/15 flex items-center justify-center transition"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* NAV */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/70">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map(({ to, label, icon: Icon, active, badge }) => (
                  <NavLink key={to} to={to} onClick={onClose} className={linkClass(active)} aria-current={active ? "page" : undefined}>
                    <Icon size={17} className="shrink-0" />
                    <span className="flex-1 truncate">{label}</span>
                    {badge > 0 && (
                      <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* SIGNED-IN USER */}
        <div className="relative p-3 border-t border-white/20 shrink-0">
          {userMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUserMenu(false)} aria-hidden="true" />
              <div
                role="menu"
                aria-label="Account"
                className="absolute left-3 right-3 bottom-full mb-2 z-20 bg-white text-gray-700 rounded-xl shadow-xl border border-gray-200/70 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                  <p className="text-xs text-gray-500 truncate">{admin?.email}</p>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setUserMenu(false); onClose(); navigate("/admin/account"); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 transition"
                >
                  <UserCog size={16} className="text-gray-400" /> My Account
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100 transition"
                >
                  <LogOut size={16} /> Log out
                </button>
              </div>
            </>
          )}
          <button
            type="button"
            onClick={() => setUserMenu((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={userMenu}
            aria-label="Account options"
            className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition ${userMenu ? "bg-white/20" : "hover:bg-white/15"}`}
          >
            <span className="w-8 h-8 rounded-full bg-white text-[#1B7DB3] flex items-center justify-center text-sm font-bold shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block text-sm font-semibold truncate">{displayName}</span>
              <span className="block text-[11px] text-white/80">{ROLE_LABELS[admin?.role] || "Admin"}</span>
            </span>
            <ChevronsUpDown size={16} className="text-white/80 shrink-0" />
          </button>
        </div>
      </aside>
    </>
  );
}
