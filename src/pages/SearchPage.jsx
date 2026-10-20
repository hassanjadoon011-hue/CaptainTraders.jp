import { useLocation, useNavigate } from 'react-router-dom'
import CarCard from '../components/cars/CarCard'

export default function SearchPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { results = [], query = "" } = location.state || {}

  const hasQuery = Boolean(String(query).trim())
  const cars = results.filter((car) => car.status !== 'sold')

  return (
    <div className="bg-[#F5F9FF] min-h-screen">

      {/* HEADER */}
      <div className="bg-sky-400 py-6 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-white text-2xl font-bold">Search Results</h1>
            <p className="text-white/80 text-sm mt-1">
              {!hasQuery
                ? "Start a search from the home page"
                : cars.length > 0
                  ? `Found ${cars.length} ${cars.length === 1 ? 'car' : 'cars'} for "${query}"`
                  : `No results found for "${query}"`}
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="bg-white text-sky-600 font-semibold px-5 py-2 rounded-lg text-sm hover:bg-sky-50 transition"
          >
            ← Back to Home
          </button>
        </div>
      </div>

      {/* RESULTS */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        {cars.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <h2 className="text-xl font-bold text-gray-700">
              {hasQuery ? "No cars found" : "No search yet"}
            </h2>
            <p className="text-gray-400 mt-2">
              {hasQuery
                ? "Try searching with different keywords"
                : "Use the search box on the home page, or browse the full inventory."}
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => navigate("/")}
                className="bg-sky-400 hover:bg-sky-500 text-white px-8 py-3 rounded-lg font-semibold transition"
              >
                Go Back
              </button>
              <button
                onClick={() => navigate("/cars")}
                className="bg-white border border-sky-400 text-sky-600 hover:bg-sky-50 px-8 py-3 rounded-lg font-semibold transition"
              >
                Browse Inventory
              </button>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {cars.map((car) => (
              <CarCard key={car._id} car={car} />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}