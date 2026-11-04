import { useEffect, useState } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import { COUNTRIES } from '../../constants/countries'
import { getShippingSettings, saveShippingSettings } from '../../api/shippingApi'

let keyCounter = 0
const newRow = (r = {}) => ({
  key: ++keyCounter,
  country: r.country || '',
  port: r.port || '',
  price: r.price ?? '',
})

const inputClass =
  'h-11 md:h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-base md:text-sm outline-none ' +
  'focus:border-[#29ABE2] focus:ring-2 focus:ring-[#29ABE2]/20'

const GRID = 'md:grid-cols-[1.4fr_1.2fr_0.8fr_40px]'

export default function ShippingRatesPanel() {
  const [insuranceRate, setInsuranceRate] = useState('')
  const [inspectionFee, setInspectionFee] = useState('')
  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null) // { type: 'ok' | 'error', text }

  useEffect(() => {
    getShippingSettings()
      .then((d) => {
        setInsuranceRate(d.insuranceRate ?? 0)
        setInspectionFee(d.inspectionFee ?? 0)
        setRows((d.rates || []).map(newRow))
      })
      .catch(() => setStatus({ type: 'error', text: 'Could not load shipping settings.' }))
      .finally(() => setLoading(false))
  }, [])

  const update = (key, field, value) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, [field]: value } : r)))

  const remove = (key) => setRows((rs) => rs.filter((r) => r.key !== key))

  const save = async () => {
    setStatus(null)

    const seen = new Set()
    for (const r of rows) {
      if (!r.country || r.price === '' || Number.isNaN(Number(r.price)) || Number(r.price) < 0) {
        return setStatus({ type: 'error', text: 'Every row needs a country and a valid price.' })
      }
      const k = `${r.country}|${r.port.trim()}`.toLowerCase()
      if (seen.has(k)) {
        return setStatus({
          type: 'error',
          text: `Duplicate row: ${r.country}${r.port ? ' / ' + r.port : ''}`,
        })
      }
      seen.add(k)
    }

    setSaving(true)
    try {
      await saveShippingSettings({
        insuranceRate: Number(insuranceRate) || 0,
        inspectionFee: Number(inspectionFee) || 0,
        rates: rows.map((r) => ({ country: r.country, port: r.port.trim(), price: Number(r.price) })),
      })
      setStatus({ type: 'ok', text: 'Shipping settings saved.' })
    } catch (e) {
      setStatus({ type: 'error', text: e.response?.data?.message || 'Could not save. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const visible = rows.filter((r) =>
    `${r.country} ${r.port}`.toLowerCase().includes(filter.toLowerCase())
  )

  if (loading) return <p className="p-6 text-sm text-gray-500">Loading…</p>

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 sm:space-y-6">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Shipping Rates</h2>
        <p className="text-sm text-gray-500 mt-1">
          These values power the Total Price Calculator on every car page. Only countries added here appear
          in the calculator.
        </p>
      </div>

      {/* Options */}
      <section className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-xs font-semibold text-gray-600 mb-1.5">
            Insurance (% of vehicle price)
          </span>
          <input
            type="number" inputMode="decimal" min="0" max="100" step="0.1"
            value={insuranceRate}
            onChange={(e) => setInsuranceRate(e.target.value)}
            className={inputClass}
          />
          <span className="block text-xs text-gray-400 mt-1">Set 0 to hide the insurance option.</span>
        </label>
        <label className="block">
          <span className="block text-xs font-semibold text-gray-600 mb-1.5">Inspection fee (USD)</span>
          <input
            type="number" inputMode="decimal" min="0" step="1"
            value={inspectionFee}
            onChange={(e) => setInspectionFee(e.target.value)}
            className={inputClass}
          />
          <span className="block text-xs text-gray-400 mt-1">Set 0 to hide the inspection option.</span>
        </label>
      </section>

      {/* Rates */}
      <section className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-sm font-bold text-gray-900">Rates ({rows.length})</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="search"
              placeholder="Filter by country or port"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={`${inputClass} sm:w-52`}
            />
            <button
              type="button"
              onClick={() => setRows((rs) => [newRow(), ...rs])}
              className="inline-flex items-center justify-center gap-2 h-11 md:h-10 px-4 rounded-lg bg-[#29ABE2] text-white text-sm font-semibold hover:opacity-90 transition"
            >
              <Plus size={16} /> Add rate
            </button>
          </div>
        </div>

        {/* Column titles (tablet and up) */}
        <div className={`hidden md:grid ${GRID} gap-3 text-xs font-semibold text-gray-500 mb-2 px-1`}>
          <span>Country</span>
          <span>Port (optional)</span>
          <span>Price (USD)</span>
          <span />
        </div>

        <div className="space-y-3 md:space-y-2">
          {visible.length === 0 && (
            <p className="text-sm text-gray-400 py-6 text-center">
              {rows.length === 0 ? 'No rates yet. Click "Add rate" to start.' : 'No rows match your filter.'}
            </p>
          )}

          {visible.map((r) => (
            <div
              key={r.key}
              className={`grid grid-cols-1 ${GRID} gap-3 md:items-center rounded-xl border border-gray-100 bg-gray-50/60 p-3 md:border-0 md:bg-transparent md:p-0`}
            >
              <label className="block min-w-0">
                <span className="md:hidden block text-xs font-semibold text-gray-500 mb-1">Country</span>
                <select
                  value={r.country}
                  onChange={(e) => update(r.key, 'country', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>

              <label className="block min-w-0">
                <span className="md:hidden block text-xs font-semibold text-gray-500 mb-1">
                  Port (optional)
                </span>
                <input
                  type="text"
                  placeholder="Empty = whole country"
                  value={r.port}
                  onChange={(e) => update(r.key, 'port', e.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="block min-w-0">
                <span className="md:hidden block text-xs font-semibold text-gray-500 mb-1">Price (USD)</span>
                <input
                  type="number" inputMode="decimal" min="0" step="1" placeholder="0"
                  value={r.price}
                  onChange={(e) => update(r.key, 'price', e.target.value)}
                  className={inputClass}
                />
              </label>

              <button
                type="button"
                onClick={() => remove(r.key)}
                aria-label="Delete rate"
                className="h-11 md:h-10 md:w-10 rounded-lg text-red-600 md:text-gray-400 md:hover:text-red-600 hover:bg-red-50 flex items-center justify-center gap-2 text-sm font-semibold transition"
              >
                <Trash2 size={16} />
                <span className="md:hidden">Remove</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {status && (
        <p
          role="status"
          className={`text-sm rounded-lg px-3 py-2 border ${
            status.type === 'ok'
              ? 'text-green-700 bg-green-50 border-green-100'
              : 'text-red-600 bg-red-50 border-red-100'
          }`}
        >
          {status.text}
        </p>
      )}

      {/* Stays visible at the bottom on phones */}
      <div className="sticky bottom-0 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 bg-white/90 backdrop-blur border-t border-gray-100 sm:border-0 sm:bg-transparent sm:backdrop-blur-none">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 sm:h-11 px-6 rounded-lg bg-[#0A1628] text-white text-sm font-bold hover:opacity-90 disabled:opacity-60 transition"
        >
          <Save size={16} /> {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}