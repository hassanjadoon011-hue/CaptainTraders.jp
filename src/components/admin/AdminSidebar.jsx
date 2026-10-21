import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Car, PlusCircle, MessageSquare, X } from "lucide-react";

export default function AdminSidebar({ isOpen, onClose }) {
  const { pathname } = useLocation();

  const linkClass = (path) => {
    const isActive = pathname === path;

    return `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
      isActive
        ? "bg-white text-[#29ABE2] shadow-sm"
        : "text-white/80 hover:bg-white/20 hover:text-white"
    }`;
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#29ABE2] text-white
        flex flex-col shadow-lg
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:static md:translate-x-0 md:h-full md:shrink-0
      `}
    >
      {/* LOGO */}
      <div className="p-5 border-b border-white/20 flex items-start justify-between">
        <div>
          <h1 className="font-bold text-lg tracking-tight">Captain Traders.JP</h1>
          <p className="text-xs text-white/70 mt-0.5">Admin Panel</p>
        </div>

        <button
          onClick={onClose}
          className="md:hidden p-1 rounded hover:bg-white/20"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* NAV */}
      <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
        <NavLink to="/admin" onClick={onClose} className={linkClass("/admin")}>
          <LayoutDashboard size={17} />
          Dashboard
        </NavLink>

        <NavLink to="/admin/cars" onClick={onClose} className={linkClass("/admin/cars")}>
          <Car size={17} />
          Cars
        </NavLink>

        <NavLink to="/admin/cars/new" onClick={onClose} className={linkClass("/admin/cars/new")}>
          <PlusCircle size={17} />
          Add Car
        </NavLink>

        <NavLink to="/admin/messages" onClick={onClose} className={linkClass("/admin/messages")}>
          <MessageSquare size={17} />
          Messages
        </NavLink>
      </nav>

      {/* FOOTER */}
      <div className="p-4 border-t border-white/20">
        <p className="text-xs text-white/50 text-center">© 2026 Captain Traders</p>
      </div>
    </aside>
  );
}