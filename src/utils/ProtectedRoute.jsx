import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";

export default function ProtectedRoute({ children }) {
  const [isAuthed, setIsAuthed] = useState(null);

  useEffect(() => {
    let cancelled = false;

    axiosClient
      .get("/admin/me")
      .then(() => !cancelled && setIsAuthed(true))
      .catch(() => !cancelled && setIsAuthed(false));

    return () => {
      cancelled = true;
    };
  }, []);

  // Still checking
  if (isAuthed === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F9FF] gap-3">
        <div className="w-8 h-8 border-4 border-[#29ABE2]/30 border-t-[#29ABE2] rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Checking authentication...</p>
      </div>
    );
  }

  // Not authed → go to login
  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }

  // Authed → show dashboard
  return children;
}