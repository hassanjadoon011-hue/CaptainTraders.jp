import { Link } from 'react-router-dom'
import { formatEngine, money, NO_IMAGE } from '../../constants/carOptions'

const BADGES = [
  { key: 'isBestDeal', label: 'Best Deal', className: 'bg-red-100 text-red-700' },
  { key: 'isRecommended', label: 'Recommended', className: 'bg-[#E0F5FF] text-[#1B7DB3]' },
  { key: 'isFeatured', label: 'Featured', className: 'bg-amber-100 text-amber-700' },
  { key: 'isNew', label: 'New', className: 'bg-green-100 text-green-700' },
]

export default function CarCard({ car }) {
  if (!car) return null

  const sold = car.status === 'sold'
  const hasDiscount = car.originalPrice && car.originalPrice > car.price

  const specs = [
    car.mileage ? `${Number(car.mileage).toLocaleString()} km` : null,
    car.fuelType || null,
    formatEngine(car.engine),
    car.transmission || null,
  ].filter(Boolean)

  const badges = BADGES.filter((b) => car[b.key])

  return (
    <Link
      to={`/cars/${car._id}`}
      className="bg-white rounded-xl border border-gray-100 hover:border-[#29ABE2]/60 hover:shadow-lg transition-all overflow-hidden group flex flex-col h-full"
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[4/3] bg-gray-100 shrink-0">
        <img
          src={car.images?.[0] || NO_IMAGE}
          alt={`${car.make} ${car.model}`}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.src = NO_IMAGE
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {badges.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {badges.slice(0, 2).map((b) => (
              <span
                key={b.key}
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${b.className}`}
              >
                {b.label}
              </span>
            ))}
          </div>
        )}

        {sold && (
          <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
            <span className="bg-red-600 text-white text-sm font-bold tracking-widest px-4 py-1.5 rounded-lg -rotate-6">
              SOLD
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 truncate">
          {car.make} {car.model}
        </h3>

        <p className="text-gray-500 text-xs mt-0.5 truncate">
          {car.year}
          {car.stockNo ? ` · Stock No. ${car.stockNo}` : ''}
        </p>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-2 min-h-[2.25rem] content-start">
          {specs.map((s, i) => (
            <span key={i} className="text-xs text-gray-500">
              {i > 0 && <span className="text-gray-300 mr-2">·</span>}
              {s}
            </span>
          ))}
        </div>

        {car.location && (
          <p className="text-xs text-gray-400 mt-1 truncate">📍 {car.location}</p>
        )}

        <div className="flex items-end justify-between gap-2 mt-auto pt-3 border-t border-gray-100">
          <div className="min-w-0">
            <p className="text-[#1B7DB3] font-extrabold text-xl leading-tight">{money(car.price)}</p>
            {hasDiscount && (
              <p className="text-xs text-gray-400">
                <span className="line-through">{money(car.originalPrice)}</span>{' '}
                <span className="text-green-600 font-medium">
                  Save {money(car.originalPrice - car.price)}
                </span>
              </p>
            )}
          </div>

          <span className="text-xs text-[#1B7DB3] font-semibold group-hover:underline shrink-0">
            View details
          </span>
        </div>
      </div>
    </Link>
  )
}