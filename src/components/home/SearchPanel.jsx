import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosClient from '../../api/axiosClient'

export default function SearchPanel() {
  const [query, setQuery] = useState("")
  const [make, setMake] = useState("")
  const [yearFrom, setYearFrom] = useState("")
  const [yearTo, setYearTo] = useState("")
  const navigate = useNavigate()

  const handleSearch = async () => {
    const search = make || query
    if (!search.trim() && !yearFrom && !yearTo) return
    try {
      const res = await axiosClient.get(`/cars?search=${search}`)
      const results = res?.data?.data || []
      navigate("/search", { state: { results, query: search } })
    } catch (err) {
      console.log(err)
      navigate(`/search?query=${search}`)
    }
  }

  return (
    <div className="w-full bg-sky-400 py-8 px-6">
      <div className="max-w-6xl mx-auto">

        {/* TITLE */}
        <h2 className="text-white text-2xl font-bold mb-6 text-center tracking-wide">
          🔍 Search For Your Perfect Car
        </h2>

        {/* FILTER ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">

          {/* MAKE */}
          <div className="flex flex-col gap-1">
            <label className="text-white text-xs font-semibold uppercase tracking-wider">Make</label>
            <select
              value={make}
              onChange={(e) => setMake(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border-0 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-white shadow"
            >
              <option value="">All Makes</option>
              <option value="toyota">Toyota</option>
              <option value="honda">Honda</option>
              <option value="nissan">Nissan</option>
              <option value="mazda">Mazda</option>
              <option value="mitsubishi">Mitsubishi</option>
              <option value="suzuki">Suzuki</option>
              <option value="subaru">Subaru</option>
              <option value="bmw">BMW</option>
              <option value="mercedes">Mercedes</option>
              <option value="lexus">Lexus</option>
            </select>
          </div>

          {/* MODEL KEYWORD */}
          <div className="flex flex-col gap-1">
            <label className="text-white text-xs font-semibold uppercase tracking-wider">Model / Keywords</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="e.g. Prado, Civic, SUV..."
              className="w-full px-4 py-2.5 rounded-lg border-0 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-white shadow"
            />
          </div>

          {/* YEAR FROM */}
          <div className="flex flex-col gap-1">
            <label className="text-white text-xs font-semibold uppercase tracking-wider">Year From</label>
            <select
              value={yearFrom}
              onChange={(e) => setYearFrom(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border-0 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-white shadow"
            >
              <option value="">Any Year</option>
              {Array.from({ length: 20 }, (_, i) => 2024 - i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* YEAR TO */}
          <div className="flex flex-col gap-1">
            <label className="text-white text-xs font-semibold uppercase tracking-wider">Year To</label>
            <select
              value={yearTo}
              onChange={(e) => setYearTo(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border-0 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-white shadow"
            >
              <option value="">Any Year</option>
              {Array.from({ length: 20 }, (_, i) => 2024 - i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

        </div>

        {/* SEARCH BUTTON */}
        <div className="flex justify-center mt-4">
          <button
            onClick={handleSearch}
            className="bg-red-500 hover:bg-red-600 text-white font-bold px-16 py-3 rounded-lg text-base transition-all shadow-xl tracking-wide"
          >
            🔍 SEARCH CARS
          </button>
        </div>

      </div>
    </div>
  )
}