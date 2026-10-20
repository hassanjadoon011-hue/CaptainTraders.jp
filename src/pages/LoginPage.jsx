import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useNotification } from "../context/NotificationContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setError("");
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axiosClient.post("/admin/login", {
        email: formData.email.trim(),
        password: formData.password,
      });

      if (res.data.success) {
        addNotification("Login successful", "success");
        setTimeout(() => navigate("/admin"), 600);
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Could not sign in. Please check your details and try again.";
      setError(message);
      addNotification(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#29ABE2] focus:border-transparent";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F9FF] px-4 py-10">
      <div className="w-full max-w-md">

        {/* BRAND */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#29ABE2] text-white flex items-center justify-center text-xl font-bold shadow">
            CT
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mt-4">Captain Traders.JP</h1>
          <p className="text-sm text-gray-500 mt-1">Admin Panel Login</p>
        </div>

        {/* CARD */}
        <div className="bg-white border border-gray-100 shadow-lg rounded-2xl p-8">

          {error && (
            <div
              role="alert"
              className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                autoComplete="username"
                placeholder="Enter your admin email"
                value={formData.email}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className={inputClass + " pr-16"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-3 text-xs font-semibold text-[#29ABE2] hover:text-[#1B7DB3]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#29ABE2] hover:bg-[#1B7DB3] disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition duration-200"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}