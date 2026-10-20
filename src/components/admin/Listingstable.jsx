import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

const LIMIT = 10;

const notifyStats = () => window.dispatchEvent(new Event("cars-updated"));

export default function Listingstable() {
  const [cars,       setCars]       = useState([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [busyId,     setBusyId]     = useState(null);
  const navigate = useNavigate();

  const fetchCars = useCallback(async (currentPage, searchText) => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: LIMIT };
      if (searchText.trim()) params.search = searchText.trim();

      const res        = await axiosClient.get("/cars", { params });
      const data       = res?.data?.data || [];
      const pagination = res?.data?.pagination || {};

      setCars(Array.isArray(data) ? data : []);
      setTotal(pagination.totalCars ?? data.length);
      setTotalPages(pagination.totalPages ?? 1);
    } catch (err) {
      console.log("FETCH ERROR:", err);
      setCars([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on page change, and (debounced) when the search text changes
  useEffect(() => {
    const timeout = setTimeout(() => fetchCars(page, search), search ? 400 : 0);
    return () => clearTimeout(timeout);
  }, [page, search, fetchCars]);

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this car? This cannot be undone.")) return;
    try {
      await axiosClient.delete(`/cars/${id}`);

      // If that was the last car on this page, go back one page
      if (cars.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchCars(page, search);
      }
      notifyStats();
    } catch (err) {
      console.log("DELETE ERROR:", err);
      alert("Could not delete the car. Please try again.");
    }
  };

  const handleToggleStatus = async (car) => {
    const nextStatus = car.status === "sold" ? "available" : "sold";
    setBusyId(car._id);
    try {
      await axiosClient.put(`/cars/${car._id}`, { status: nextStatus });
      await fetchCars(page, search);
      notifyStats();
    } catch (err) {
      console.log("STATUS ERROR:", err);
      alert("Could not update the car status. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = new Set(
      [1, totalPages, page, page - 1, page + 1].filter((p) => p >= 1 && p <= totalPages)
    );
    const sorted = [...pages].sort((a, b) => a - b);
    const result = [];
    sorted.forEach((p, i) => {
      if (i > 0 && p - sorted[i - 1] > 1) result.push("...");
      result.push(p);
    });
    return result;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">

      {/* ── Header ── */}
      <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-gray-800">Cars Listing</h2>
          <span className="text-xs bg-[#29ABE2]/10 text-[#29ABE2] font-semibold px-2 py-1 rounded-full">
            {total} total
          </span>
        </div>
        <input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Filter by make or model..."
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#29ABE2] w-56"
        />
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-5 py-3 text-left">Car</th>
              <th className="px-5 py-3 text-left">Price</th>
              <th className="px-5 py-3 text-left">Year</th>
              <th className="px-5 py-3 text-left">Condition</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array(LIMIT).fill(0).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-5 py-3"><div className="h-4 bg-gray-100 rounded w-32" /></td>
                  <td className="px-5 py-3"><div className="h-4 bg-gray-100 rounded w-16" /></td>
                  <td className="px-5 py-3"><div className="h-4 bg-gray-100 rounded w-12" /></td>
                  <td className="px-5 py-3"><div className="h-4 bg-gray-100 rounded w-16" /></td>
                  <td className="px-5 py-3"><div className="h-4 bg-gray-100 rounded w-16" /></td>
                  <td className="px-5 py-3"><div className="h-4 bg-gray-100 rounded w-24" /></td>
                </tr>
              ))
            ) : cars.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                  No cars found
                </td>
              </tr>
            ) : (
              cars.map((car) => {
                const isSold = car.status === "sold";
                return (
                  <tr key={car._id} className={`hover:bg-gray-50 transition ${isSold ? "bg-gray-50/60" : ""}`}>
                    <td className="px-5 py-3 font-medium text-gray-800 whitespace-nowrap">
                      {car.make} {car.model}
                    </td>
                    <td className="px-5 py-3 text-gray-600">${car.price?.toLocaleString()}</td>
                    <td className="px-5 py-3 text-gray-600">{car.year}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        car.condition === "New"
                          ? "bg-green-100 text-green-600"
                          : car.condition === "Used"
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-blue-100 text-blue-600"
                      }`}>
                        {car.condition || "N/A"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        isSold ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                      }`}>
                        {isSold ? "Sold" : "Available"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2 whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/admin/cars/edit/${car._id}`)}
                          className="bg-[#29ABE2] hover:bg-[#1a9fd4] text-white text-xs px-3 py-1.5 rounded-lg transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(car)}
                          disabled={busyId === car._id}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                        >
                          {busyId === car._id ? "..." : isSold ? "Mark available" : "Mark sold"}
                        </button>
                        <button
                          onClick={() => handleDelete(car._id)}
                          className="bg-red-50 hover:bg-red-100 text-red-500 text-xs px-3 py-1.5 rounded-lg transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-gray-400">
            Page {page} of {totalPages} · {total} vehicles
          </p>
          <div className="flex items-center gap-1">
            <PageBtn
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              label="Prev"
            />
            {getPageNumbers().map((p, i) =>
              p === "..."
                ? <span key={`e${i}`} className="w-8 text-center text-gray-400 text-sm">…</span>
                : <PageBtn key={p} onClick={() => setPage(p)} active={p === page} label={p} />
            )}
            <PageBtn
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              label="Next"
            />
          </div>
        </div>
      )}

    </div>
  );
}

function PageBtn({ onClick, disabled, active, label }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`min-w-[36px] h-8 px-2 rounded-lg text-xs font-medium border transition-colors
        ${active ? "bg-[#29ABE2] text-white border-[#29ABE2]" : "border-gray-200 text-gray-600 hover:bg-gray-50"}
        disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {label}
    </button>
  );
}