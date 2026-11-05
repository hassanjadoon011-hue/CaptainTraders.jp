import { useEffect, useState } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import { COUNTRIES } from '../../constants/countries'
import { getShippingSettings, saveShippingSettings } from '../../api/shippingApi'
import { useAdmin } from '../../context/AdminAuthContext'
import { Card, CardHeader, IconButton, PageHeader, StatusMessage, btnClass, inputClass as baseInput, labelClass } from './ui'
import { Ship, Settings2 } from 'lucide-react'

let keyCounter = 0
const newRow = (r = {}) => ({
  key: ++keyCounter,
  country: r.country || '',
  port: r.port || '',
  ratePerM3: r.ratePerM3 ?? '',
  price: r.price ?? '',
})

const blank = (v) => v === '' || v === null || v === undefined
const badNum = (v) => !blank(v) && (Number.isNaN(Number(v)) || Number(v) < 0)
const optNum = (v) => (blank(v) ? null : Number(v))

const inputClass = baseInput

const GRID = 'md:grid-cols-[1.4fr_1.2fr_0.8fr_0.8fr_40px]'

export default function ShippingRatesPanel() {
  const { can } = useAdmin()
  const canEdit = can('shipping.edit')
  const [insuranceRate, setInsuranceRate] = useState('')
  const [inspectionFee, setInspectionFee] = useState('')
  const [usdToJpy, setUsdToJpy] = useState('')
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
        setUsdToJpy(d.usdToJpy ?? '')
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
      if (!r.country || (blank(r.ratePerM3) && blank(r.price)) || badNum(r.ratePerM3) || badNum(r.price)) {
        return setStatus({
          type: 'error',
          text: 'Every row needs a country and a valid rate per M³, flat price, or both.',
        })
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
        usdToJpy: optNum(usdToJpy),
        rates: rows.map((r) => ({
          country: r.country,
          port: r.port.trim(),
          ratePerM3: optNum(r.ratePerM3),
          price: optNum(r.price),
        })),
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

  if (loading) return <Card className="p-6 text-sm text-gray-500">Loading…</Card>

  return (
    <div className="space-y-5">
      <PageHeader
        title="Shipping & Rates"
        subtitle="Powers the Total Price Calculator on every car page and the quote saved on each order."
      />

      {/* Options */}
      <Card>
      <CardHeader icon={Settings2} title="Price options" subtitle="Insurance, inspection and the exchange rate shown on the website" />
      <section className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="block">
          <span className={labelClass}>
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
          <span className={labelClass}>Inspection fee (USD)</span>
          <input
            type="number" inputMode="decimal" min="0" step="1"
            value={inspectionFee}
            onChange={(e) => setInspectionFee(e.target.value)}
            className={inputClass}
          />
          <span className="block text-xs text-gray-400 mt-1">Set 0 to hide the inspection option.</span>
        </label>
        <label className="block">
          <span className={labelClass}>Exchange rate (¥ per $1)</span>
          <input
            type="number" inputMode="decimal" min="1" step="0.01"
            value={usdToJpy}
            onChange={(e) => setUsdToJpy(e.target.value)}
            className={inputClass}
          />
          <span className="block text-xs text-gray-400 mt-1">Shown on the website. Leave empty to hide.</span>
        </label>
      </section>
      </Card>

      {/* Rates */}
      <Card>
      <CardHeader
        icon={Ship}
        title={`Freight rates (${rows.length})`}
        subtitle="Freight = car volume (M³) × rate per M³. Cars without a volume use the flat price."
      />
      <section className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 mb-4">
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
              className={btnClass('primary')}
            >
              <Plus size={16} /> Add rate
            </button>
          </div>
        </div>

        {/* Column titles (tablet and up) */}
        <div className={`hidden md:grid ${GRID} gap-3 text-xs font-semibold text-gray-500 mb-2 px-1`}>
          <span>Country</span>
          <span>Port (optional)</span>
          <span>Rate per M³ (USD)</span>
          <span>Flat price (USD)</span>
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
              className={`grid grid-cols-1 ${GRID} gap-3 md:items-center rounded-xl border border-gray-200/70 bg-gray-50/60 p-3 md:border-0 md:bg-transparent md:p-0`}
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
                <span className="md:hidden block text-xs font-semibold text-gray-500 mb-1">Rate per M³ (USD)</span>
                <input
                  type="number" inputMode="decimal" min="0" step="0.01" placeholder="—"
                  value={r.ratePerM3}
                  onChange={(e) => update(r.key, 'ratePerM3', e.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="block min-w-0">
                <span className="md:hidden block text-xs font-semibold text-gray-500 mb-1">Flat price (USD)</span>
                <input
                  type="number" inputMode="decimal" min="0" step="1" placeholder="—"
                  value={r.price}
                  onChange={(e) => update(r.key, 'price', e.target.value)}
                  className={inputClass}
                />
              </label>

              <button
                type="button"
                onClick={() => remove(r.key)}
                aria-label="Delete rate"
                className="md:hidden h-10 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center gap-2 text-sm font-semibold transition"
              >
                <Trash2 size={16} /> Remove
              </button>
              <IconButton label="Delete rate" tone="danger" className="hidden md:flex md:w-10 md:h-10" onClick={() => remove(r.key)}>
                <Trash2 size={16} />
              </IconButton>
            </div>
          ))}
        </div>
      </section>
      </Card>

      <StatusMessage status={status} />

      {!canEdit && (
        <p className="text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
          View only. Your role cannot change shipping rates.
        </p>
      )}

      {/* Stays visible at the bottom on phones */}
      {canEdit && <div className="sticky bottom-0 z-10 -mx-4 sm:mx-0 px-4 sm:px-5 py-3 bg-white/95 backdrop-blur border-t sm:border border-gray-200/70 sm:rounded-xl sm:shadow-sm flex sm:justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className={`${btnClass('primary')} w-full sm:w-auto`}
        >
          <Save size={16} /> {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>}
    </div>
  )
}