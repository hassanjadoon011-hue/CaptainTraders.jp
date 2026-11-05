import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import useShippingSettings from '../../hooks/useShippingSettings'

export default function CountryLinks() {
  const { settings, loading } = useShippingSettings()

  const countries = useMemo(
    () => [...new Set((settings?.rates || []).map((r) => r.country))].sort((a, b) => a.localeCompare(b)),
    [settings]
  )

  if (loading || countries.length === 0) return null

  return (
    <section className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900">We Ship Worldwide</h2>
      <p className="text-sm text-gray-500 mt-1 mb-5">
        Select your country and ask us about shipping and import for your destination.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {countries.map((c) => (
          <Link
            key={c}
            to={`/contact?country=${encodeURIComponent(c)}`}
            className="flex items-center gap-2 bg-gray-50 hover:bg-[#E0F5FF] border border-transparent hover:border-[#29ABE2]/30 rounded-lg px-3 py-3 transition min-w-0"
          >
            <MapPin size={15} className="text-[#29ABE2] shrink-0" />
            <span className="text-sm font-medium text-gray-700 truncate">{c}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}