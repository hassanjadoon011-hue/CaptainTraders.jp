import { Link } from 'react-router-dom'

// "1000" -> "1000 cc", "2.0L" stays as is
const formatEngine = (engine) => {
  if (!engine) return null
  const value = String(engine).trim()
  return /^\d+$/.test(value) ? `${value} cc` : value
}

export default function CarCard({ car }) {
  if (!car) return null

  const image =
    car.images?.[0] ||
    'https://via.placeholder.com/400x260?text=No+Image'

  const specs = [
    car.mileage ? `${Number(car.mileage).toLocaleString()} km` : null,
    car.fuelType || null,
    formatEngine(car.engine),
    car.transmission || null,
  ].filter(Boolean)

  return (
    <Link
      to={`/cars/${car._id}`}
      className="bg-white rounded-xl border border-gray-100 hover:border-blue-300 hover:shadow-lg transition-all overflow-hidden group block"
    >

      {/* Image */}
      <div className="relative overflow-hidden h-44 bg-gray-100">
        <img
          src={image}
          alt={`${car.make} ${car.model}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {car.isFeatured && (
          <span className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide bg-amber-100 text-amber-700">
            Featured
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">

        <h3 className="font-semibold text-gray-800 truncate">
          {car.make} {car.model}
        </h3>

        <p className="text-gray-400 text-xs mt-0.5">
          {car.year}
        </p>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-2 min-h-[2.25rem] content-start">
          {specs.map((s, i) => (
            <span key={i} className="text-xs text-gray-500">
              {i > 0 && <span className="text-gray-300 mr-2">·</span>}
              {s}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">

          <p className="text-blue-600 font-bold text-lg">
            ${Number(car.price || 0).toLocaleString()}
          </p>

          <span className="text-xs text-blue-500 font-medium group-hover:underline">
            View →
          </span>

        </div>

      </div>

    </Link>
  )
}