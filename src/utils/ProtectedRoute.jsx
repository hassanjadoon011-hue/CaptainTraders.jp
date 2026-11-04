import { useState, useEffect, useCallback } from "react";
import { Navigate, Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import axiosClient from "../api/axiosClient";
import { AdminAuthContext, useAdmin } from "../context/AdminAuthContext";

export default function ProtectedRoute({ children }) {
  const [admin, setAdmin] = useState(undefined); // undefined = checking, null = not logged in

  const refresh = useCallback(
    () =>
      axiosClient
        .get("/admin/me")
        .then((res) => setAdmin(res.data?.data || null))
        .catch(() => setAdmin(null)),
    []
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Still checking
  if (admin === undefined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F9FF] gap-3">
        <div className="w-8 h-8 border-4 border-[#29ABE2]/30 border-t-[#29ABE2] rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Checking authentication...</p>
      </div>
    );
  }

  // Not authed → go to login
  if (!admin) {
    return <Navigate to="/login" replace />;
  }

  // Authed → show dashboard
  return <AdminAuthContext.Provider value={{ admin, refresh }}>{children}</AdminAuthContext.Provider>;
}

// Wrap an admin page that needs a permission. The server checks it too.
export function RequirePermission({ perm, children }) {
  const { can } = useAdmin();
  if (can(perm)) return children;
  return (
    <div className="max-w-md mx-auto mt-10 bg-white border border-gray-100 rounded-2xl p-6 text-center">
      <ShieldAlert className="mx-auto text-amber-500" size={32} />
      <h2 className="mt-3 text-base font-bold text-gray-900">No access</h2>
      <p className="mt-1 text-sm text-gray-500">Your role does not allow this page. Ask an owner for access.</p>
      <Link to="/admin" className="inline-block mt-4 text-sm font-semibold text-[#1B7DB3] hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
