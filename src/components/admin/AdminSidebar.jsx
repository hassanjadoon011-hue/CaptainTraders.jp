import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Car, PlusCircle, MessageSquare } from "lucide-react";

export default function AdminSidebar() {
  const { pathname } = useLocation();

  const linkClass = (path) => {
    const isActive = path === "/admin"
      ? pathname === "/admin"
      : pathname === path;

    return `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
      isActive
        ? "bg-white text-[#29ABE2] shadow-sm"
        : "text-white/80 hover:bg-white/20 hover:text-white"
    }`;
  };

  return (
    <aside className="w-64 bg-[#29ABE2] text-white h-screen flex flex-col shadow-lg">

      {/* LOGO */}
      <div className="p-5 border-b border-white/20">
        <h1 className="font-bold text-lg tracking-tight">Captain Traders.JP</h1>
        <p className="text-xs text-white/70 mt-0.5">Admin Panel</p>
      </div>

      {/* NAV */}
      <nav className="p-4 space-y-1 flex-1">

        <NavLink to="/admin" className={linkClass("/admin")}>
          <LayoutDashboard size={17} />
          Dashboard
        </NavLink>

        <NavLink to="/admin/cars" className={linkClass("/admin/cars")}>
          <Car size={17} />
          Cars
        </NavLink>

        <NavLink to="/admin/cars/new" className={linkClass("/admin/cars/new")}>
          <PlusCircle size={17} />
          Add Car
        </NavLink>

        <NavLink to="/admin/messages" className={linkClass("/admin/messages")}>
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