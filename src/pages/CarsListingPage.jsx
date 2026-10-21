import { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axiosClient from '../api/axiosClient'

const MAKES       = ['Toyota', 'Honda', 'Nissan', 'Mazda', 'Mitsubishi', 'Subaru', 'Suzuki', 'Lexus', 'Daihatsu', 'Isuzu']
const FUEL_TYPES  = ['Petrol', 'Diesel', 'Hybrid', 'Electric']
const BODY_TYPES  = ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Van', 'Truck']
const YEARS       = Array.from({ length: 15 }, (_, i) => 2026 - i)
const LIMIT       = 10

const formatEngine = (engine) => {
  if (!engine) return null
  const value = String(engine).trim()
  return /^\d+$/.test(value) ? `${value} cc` : value
}

const buildSpecs = (car) =>
  [
    car.mileage ? `${Number(car.mileage).toLocaleString()} km` : null,
    car.fuelType || null,
    formatEngine(car.engine),
    car.transmission || null,
  ].filter(Boolean)

export default function CarsListingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [cars,       setCars]       = useState([])
  const [total,      setTotal]      = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading,    setLoading]    = useState(true)
  const [view,       setView]       = useState('list')
  const [page,       setPage]       = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false) // mobile filter drawer

  const filters = {
    make:     searchParams.get('make')     || '',
    year:     searchParams.get('year')     || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    fuelType: searchParams.get('fuelType') || '',
    bodyType: searchParams.get('bodyType') || '',
    sort:     searchParams.get('sort')     || 'newest',
  }

  const activeFilterCount = ['make', 'year', 'minPrice', 'maxPrice', 'fuelType', 'bodyType']
    .filter((k) => filters[k]).length

  const fetchCars = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: LIMIT, sort: filters.sort, status: 'available' }
      if (filters.make)     params.make     = filters.make
      if (filters.year) {
        params.yearFrom = filters.year
        params.yearTo   = filters.year
      }
      if (filters.fuelType) params.fuelType = filters.fuelType
      if (filters.bodyType) params.bodyType = filters.bodyType
      if (filters.minPrice) params.minPrice = filters.minPrice
      if (filters.maxPrice) params.maxPrice = filters.maxPrice

      const res        = await axiosClient.get('/cars', { params })
      const data       = res?.data?.data || []
      const pagination = res?.data?.pagination || {}

      setCars(data)
      setTotal(pagination.totalCars ?? 0)
      setTotalPages(pagination.totalPages ?? 1)
    } catch (err) {
      console.error('Failed to fetch cars:', err)
      setCars([])
      setTotal(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [filters.make, filters.year, filters.fuelType, filters.bodyType, filters.minPrice, filters.maxPrice, filters.sort, page])

  useEffect(() => { fetchCars() }, [fetchCars])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [filters.make, filters.year, filters.fuelType, filters.bodyType, filters.minPrice, filters.maxPrice, filters.sort, page])

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = filtersOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [filtersOpen])

  const handleFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
    setPage(1)
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetFilters = () => { setSearchParams({}); setPage(1) }

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages = new Set(
      [1, totalPages, page, page - 1, page + 1].filter(p => p >= 1 && p <= totalPages)
    )
    const sorted = [...pages].sort((a, b) => a - b)
    const result = []
    sorted.forEach((p, i) => {
      if (i > 0 && p - sorted[i - 1] > 1) result.push('...')
      result.push(p)
    })
    return result
  }

  return (
    <div className="bg-[#F5F9FF] min-h-screen">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Car Inventory</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {loading ? 'Loading...' : `${total.toLocaleString()} verified Japanese vehicles`}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Filters button (mobile only) */}
            <button
              onClick={() => setFiltersOpen(true)}
              className="md:hidden flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M6 12h12M10 20h4" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button onClick={() => setView('list')} title="List view"
                className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button onClick={() => setView('grid')} title="Grid view"
                className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h6v6H4zM14 5h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
                </svg>
              </button>
            </div>
            <select value={filters.sort} onChange={e => handleFilter('sort', e.target.value)}
              className="border border-gray-200 rounded-lg px-2 sm:px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5 sm:py-8 flex gap-6">

        {/* ── Desktop sidebar ── */}
        <aside className="w-56 flex-shrink-0 hidden md:block">
          <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24">
            <FiltersPanel filters={filters} handleFilter={handleFilter} resetFilters={resetFilters} />
          </div>
        </aside>

        {/* ── Mobile filter drawer ── */}
        {filtersOpen && (
          <div className="fixed inset-0 z-[60] md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setFiltersOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-[85%] max-w-xs bg-white flex flex-col shadow-xl">
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <h2 className="font-semibold text-gray-800">Filters</h2>
                <button onClick={() => setFiltersOpen(false)} className="text-gray-400 text-2xl leading-none px-1" aria-label="Close filters">×</button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <FiltersPanel filters={filters} handleFilter={handleFilter} resetFilters={resetFilters} />
              </div>
              <div className="p-4 border-t">
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="w-full bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-lg"
                >
                  Show {total.toLocaleString()} cars
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Main ── */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4' : 'flex flex-col gap-3'}>
              {Array(LIMIT).fill(0).map((_, i) => (
                <div key={i} className={`bg-white rounded-xl animate-pulse border border-gray-100 ${view === 'grid' ? 'h-72' : 'h-40 sm:h-32'}`} />
              ))}
            </div>
          ) : cars.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-10 sm:p-16 text-center">
              <p className="text-5xl mb-4">🔍</p>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">No cars found</h3>
              <p className="text-gray-400 text-sm mb-5">Try adjusting your filters.</p>
              <button onClick={resetFilters} className="text-sm text-blue-500 hover:underline">Clear filters</button>
            </div>
          ) : view === 'list' ? (
            <div className="flex flex-col gap-3">
              {cars.map(car => <CarListRow key={car._id} car={car} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {cars.map(car => <CarGridCard key={car._id} car={car} />)}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center flex-wrap gap-1 mt-8 sm:mt-10">
              <PageBtn onClick={() => handlePageChange(Math.max(1, page - 1))} disabled={page === 1} label="Prev" />
              {getPageNumbers().map((p, i) =>
                p === '...'
                  ? <span key={`e${i}`} className="w-6 sm:w-9 text-center text-gray-400 text-sm">…</span>
                  : <PageBtn key={p} onClick={() => handlePageChange(p)} active={p === page} label={p} />
              )}
              <PageBtn onClick={() => handlePageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} label="Next" />
            </div>
          )}
          {totalPages > 1 && (
            <p className="text-center text-xs text-gray-400 mt-3">
              Page {page} of {totalPages} · {total.toLocaleString()} vehicles
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Filters (shared by desktop sidebar + mobile drawer) ─── */
function FiltersPanel({ filters, handleFilter, resetFilters }) {
  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-gray-800 text-sm">Filters</h2>
        <button onClick={resetFilters} className="text-xs text-blue-500 hover:underline">Reset</button>
      </div>
      <FilterSection label="Brand">
        {MAKES.map(m => (
          <FilterChip key={m} label={m}
            active={filters.make.toLowerCase() === m.toLowerCase()}
            onClick={() => handleFilter('make', filters.make.toLowerCase() === m.toLowerCase() ? '' : m)}
          />
        ))}
      </FilterSection>
      <FilterSection label="Price (USD)">
        <div className="flex gap-2">
          <input type="number" placeholder="Min" value={filters.minPrice}
            onChange={e => handleFilter('minPrice', e.target.value)}
            className="w-full min-w-0 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <input type="number" placeholder="Max" value={filters.maxPrice}
            onChange={e => handleFilter('maxPrice', e.target.value)}
            className="w-full min-w-0 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
      </FilterSection>
      <FilterSection label="Year">
        <select value={filters.year} onChange={e => handleFilter('year', e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="">Any Year</option>
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </FilterSection>
      <FilterSection label="Body Type">
        {BODY_TYPES.map(b => (
          <FilterChip key={b} label={b}
            active={filters.bodyType.toLowerCase() === b.toLowerCase()}
            onClick={() => handleFilter('bodyType', filters.bodyType.toLowerCase() === b.toLowerCase() ? '' : b)}
          />
        ))}
      </FilterSection>
      <FilterSection label="Fuel Type" last>
        {FUEL_TYPES.map(f => (
          <FilterChip key={f} label={f}
            active={filters.fuelType.toLowerCase() === f.toLowerCase()}
            onClick={() => handleFilter('fuelType', filters.fuelType.toLowerCase() === f.toLowerCase() ? '' : f)}
          />
        ))}
      </FilterSection>
    </>
  )
}

/* ─── List Row (stacks vertically on phones) ─── */
function CarListRow({ car }) {
  const specs = buildSpecs(car)

  return (
    <div className="bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 sm:items-center">
      <div className="w-full h-48 sm:w-40 sm:h-28 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
        <img src={car.images?.[0] || 'https://via.placeholder.com/160x112?text=No+Image'}
          alt={`${car.make} ${car.model}`} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="font-bold text-gray-800 text-base">{car.make} {car.model} {car.year}</h2>
          {car.isFeatured && <Badge color="amber">Featured</Badge>}
          {car.isNew      && <Badge color="green">New</Badge>}
        </div>
        {car.description && <p className="text-gray-400 text-xs mt-1 line-clamp-1">{car.description}</p>}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2">
          {specs.map((s, i) => (
            <span key={i} className="text-xs text-gray-500">
              {i > 0 && <span className="text-gray-300 mr-2">·</span>}{s}
            </span>
          ))}
        </div>
        {car.location && <p className="text-xs text-gray-400 mt-2">📍 {car.location}</p>}
      </div>
      <div className="flex-shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:ml-2 sm:text-right">
        <div>
          <p className="text-blue-600 font-bold text-xl">${Number(car.price)?.toLocaleString()}</p>
          <p className="text-gray-400 text-xs">All inclusive</p>
        </div>
        <Link to={`/cars/${car._id}`} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
          View Car
        </Link>
      </div>
    </div>
  )
}

/* ─── Grid Card ─── */
function CarGridCard({ car }) {
  const specs = buildSpecs(car)

  return (
    <div className="bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all flex flex-col overflow-hidden">
      <div className="relative h-48 sm:h-44 bg-gray-100 flex-shrink-0">
        <img src={car.images?.[0] || 'https://via.placeholder.com/400x176?text=No+Image'}
          alt={`${car.make} ${car.model}`} className="w-full h-full object-cover" />
        <div className="absolute top-2 left-2 flex gap-1">
          {car.isFeatured && <Badge color="amber">Featured</Badge>}
          {car.isNew      && <Badge color="green">New</Badge>}
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h2 className="font-bold text-gray-800 text-sm">{car.make} {car.model} {car.year}</h2>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1.5">
          {specs.map((s, i) => (
            <span key={i} className="text-xs text-gray-400">
              {i > 0 && <span className="text-gray-300 mr-2">·</span>}{s}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
          <p className="text-blue-600 font-bold text-base">${Number(car.price)?.toLocaleString()}</p>
          <Link to={`/cars/${car._id}`} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
            View
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ─── Shared Components ─── */
function FilterSection({ label, children, last }) {
  return (
    <div className={last ? '' : 'mb-5 pb-5 border-b border-gray-50'}>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">{label}</p>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  )
}

function FilterChip({ label, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
        active ? 'bg-blue-500 text-white font-medium' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
      }`}>
      {label}
    </button>
  )
}

function Badge({ color, children }) {
  const colors = { amber: 'bg-amber-100 text-amber-700', green: 'bg-green-100 text-green-700' }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${colors[color]}`}>
      {children}
    </span>
  )
}

function PageBtn({ onClick, disabled, active, label }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium border transition-colors
        ${active ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}
        disabled:opacity-30 disabled:cursor-not-allowed`}>
      {label}
    </button>
  )
}