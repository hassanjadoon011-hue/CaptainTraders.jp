import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axiosClient from '../../api/axiosClient'
import CarCard from '../cars/CarCard'

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl animate-pulse border border-gray-100 overflow-hidden">
      <div className="h-44 bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mt-2" />
      </div>
    </div>
  )
}

/**
 * One row of cars on the homepage.
 * params   = filters sent to the API, e.g. { recommend: '1' }
 * to       = where "View All" goes
 */
export default function CarSection({
  title,
  subtitle,
  params = {},
  to = '/cars',
  limit = 6,
  showEmpty = false,
}) {
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const key = JSON.stringify(params)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    axiosClient
      .get('/cars', { params: { limit, status: 'available', ...params } })
      .then((res) => {
        if (!cancelled) setCars(res?.data?.data || [])
      })
      .catch(() => {
        if (!cancelled) setCars([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, limit])

  if (!loading && cars.length === 0 && !showEmpty) return null

  return (
    <section>
      <div className="flex items-end justify-between gap-3 flex-wrap mb-5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <Link to={to} className="text-sm text-[#29ABE2] hover:underline font-medium">
          See More →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {loading ? (
          Array(Math.min(limit, 6)).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : cars.length === 0 ? (
          <div className="col-span-full text-center py-14 text-gray-400 bg-white rounded-xl border border-gray-100">
            <p className="text-sm">No cars available right now.</p>
          </div>
        ) : (
          cars.map((car) => <CarCard key={car._id} car={car} />)
        )}
      </div>
    </section>
  )
}