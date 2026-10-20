import AdminSidebar from "../components/admin/AdminSidebar";
import AdminHeader from "../components/admin/AdminHeader";
import { Outlet } from "react-router-dom";

export default function AdminDashboard() {
  return (
    <div className="flex h-screen bg-gray-100">

      {/* SIDEBAR */}
      <AdminSidebar />

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* HEADER */}
        <AdminHeader />

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>

      </div>
    </div>
  );
}