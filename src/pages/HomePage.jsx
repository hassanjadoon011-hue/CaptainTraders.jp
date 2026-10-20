import Hero from '../components/home/Hero/Hero'
import LeftSidebar from '../components/sidebar/LeftSidebar'
import CarCard from '../components/cars/CarCard'
import SearchPanel from '../components/home/SearchPanel'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosClient from '../api/axiosClient'

export default function HomePage() {
  const navigate = useNavigate()
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchCars = async () => {
    setLoading(true)
    try {
      const res = await axiosClient.get('/cars', {
        params: { limit: 24, sort: 'newest', status: 'available' },
      })
      setCars(res?.data?.data || [])
    } catch (err) {
      console.error('Failed to fetch cars:', err)
      setCars([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCars()
  }, [])

  const handleMakeSelect = (make) => {
    navigate(`/cars?make=${encodeURIComponent(make)}`)
  }

  // Featured: prefer flagged cars, fall back to the newest 6
  const flagged = cars.filter(c => c.isFeatured).slice(0, 6)
  const displayFeatured = flagged.length > 0 ? flagged : cars.slice(0, 6)
  const featuredIds = new Set(displayFeatured.map(c => c._id))

  // Recently added photos mosaic
  const carsWithImages = cars.filter(c => c.images?.length > 0)
  const recentlyAddedImages = carsWithImages.slice(0, 7)

  // Latest inventory — everything not already shown as featured
  const latestInventory = cars.filter(c => !featuredIds.has(c._id)).slice(0, 9)

  const SkeletonCard = () => (
    <div className="bg-white rounded-xl animate-pulse border border-gray-100 overflow-hidden">
      <div className="h-48 bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mt-2" />
      </div>
    </div>
  )

  const SkeletonImage = ({ className }) => (
    <div className={`bg-gray-200 animate-pulse rounded-xl ${className}`} />
  )

  return (
    <div className="bg-[#F5F9FF] min-h-screen">

      <Hero />
      <SearchPanel />

      <div className="max-w-[1400px] mx-auto px-6 flex gap-6 mt-10">
        <LeftSidebar onMakeSelect={handleMakeSelect} />

        <div className="flex-1 space-y-12 min-w-0">

          {/* ── Featured Cars ── */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Featured Cars</h2>
                <p className="text-sm text-gray-400 mt-0.5">Hand-picked top listings</p>
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
                Top Picks
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {loading
                ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
                : displayFeatured.length > 0
                  ? displayFeatured.map(car => <CarCard key={car._id} car={car} />)
                  : (
                    <div className="col-span-3 text-center py-16 text-gray-400">
                      <p className="text-sm">No cars available right now.</p>
                    </div>
                  )
              }
            </div>
          </section>

          {/* ── Recently Added Photos ── */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Recently Added</h2>
                <p className="text-sm text-gray-400 mt-0.5">Latest photos from our inventory</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  Live Updates
                </span>
                <button
                  onClick={() => navigate('/cars')}
                  className="text-sm text-blue-500 hover:underline font-medium"
                >
                  Browse All →
                </button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[420px]">
                <SkeletonImage className="col-span-2 row-span-2 h-full" />
                <SkeletonImage className="col-span-1 row-span-1 h-full" />
                <SkeletonImage className="col-span-1 row-span-1 h-full" />
                <SkeletonImage className="col-span-1 row-span-1 h-full" />
                <SkeletonImage className="col-span-1 row-span-1 h-full" />
              </div>
            ) : recentlyAddedImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 bg-white rounded-xl border border-dashed border-gray-200 text-gray-400">
                <svg className="w-10 h-10 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-medium">No photos uploaded yet</p>
                <p className="text-xs text-gray-300 mt-1">Photos will appear here once listings are added</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[420px]">

                {/* Hero tile */}
                {recentlyAddedImages[0] && (
                  <div
                    className="col-span-2 row-span-2 relative group cursor-pointer overflow-hidden rounded-2xl"
                    onClick={() => navigate(`/cars/${recentlyAddedImages[0]._id}`)}
                  >
                    <img
                      src={recentlyAddedImages[0].images[0]}
                      alt={`${recentlyAddedImages[0].make} ${recentlyAddedImages[0].model}`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="bg-blue-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg">
                        Newest
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-1">
                        {recentlyAddedImages[0].year}
                      </p>
                      <p className="text-white font-bold text-xl leading-tight">
                        {recentlyAddedImages[0].make} {recentlyAddedImages[0].model}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        {recentlyAddedImages[0].price ? (
                          <span className="text-white font-bold text-lg">
                            ${Number(recentlyAddedImages[0].price).toLocaleString()}
                          </span>
                        ) : <span />}
                        <span className="flex items-center gap-1.5 text-white/90 text-xs bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 group-hover:bg-white/30 transition-colors">
                          View Details →
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Small tiles */}
                {recentlyAddedImages.slice(1, 5).map((car, idx) => (
                  <div
                    key={car._id}
                    className="col-span-1 row-span-1 relative group cursor-pointer overflow-hidden rounded-xl"
                    onClick={() => navigate(`/cars/${car._id}`)}
                  >
                    <img
                      src={car.images[0]}
                      alt={`${car.make} ${car.model}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* +More overlay on last tile */}
                    {idx === 3 && carsWithImages.length > 5 && (
                      <div
                        className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate('/cars')
                        }}
                      >
                        <span className="text-white text-3xl font-bold">
                          +{carsWithImages.length - 5}
                        </span>
                        <span className="text-white/70 text-xs mt-1 font-medium">View all photos</span>
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      <p className="text-white font-semibold text-xs leading-tight truncate">
                        {car.make} {car.model}
                      </p>
                      <p className="text-white/60 text-[11px]">{car.year}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Latest Inventory ── */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Latest Inventory</h2>
                <p className="text-sm text-gray-400 mt-0.5">All available listings</p>
              </div>
              <button
                onClick={() => navigate('/cars')}
                className="text-sm text-blue-500 hover:underline font-medium"
              >
                View All →
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {loading
                ? Array(9).fill(0).map((_, i) => <SkeletonCard key={i} />)
                : latestInventory.length > 0
                  ? latestInventory.map(car => <CarCard key={car._id} car={car} />)
                  : (
                    <div className="col-span-3 text-center py-16 text-gray-400">
                      <p className="text-sm">No additional listings found.</p>
                    </div>
                  )
              }
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}