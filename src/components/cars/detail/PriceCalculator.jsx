import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calculator, ShieldCheck, ClipboardCheck, Info, Send, ShoppingCart, Landmark, AlertTriangle } from 'lucide-react'
import useShippingSettings from '../../../hooks/useShippingSettings'
import { getQuote } from '../../../api/shippingApi'

const OTHER = '__other'
// "$14,500" or "$217.50": cents only when there are any, so every line adds up to the total
const usd = (n) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(Number(n) || 0) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Number(n) || 0)

// text-base on mobile stops iOS from zooming into the field; 48px height is a comfortable touch target
const fieldClass =
  'w-full h-12 sm:h-11 rounded-lg border border-gray-200 bg-white px-3 text-base sm:text-sm text-gray-800 ' +
  'outline-none transition focus:border-[#29ABE2] focus:ring-2 focus:ring-[#29ABE2]/20 ' +
  'disabled:bg-gray-50 disabled:text-gray-400'

function Field({ id, label, children }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

function YesNo({ icon: Icon, label, hint, value, onChange }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
        <Icon size={13} className="text-[#29ABE2]" /> {label}
        {hint && <span className="ml-auto font-normal text-gray-400">{hint}</span>}
      </p>
      <div
        role="radiogroup"
        aria-label={label}
        className="grid grid-cols-2 rounded-lg bg-gray-100 p-1 gap-1"
      >
        {[
          { v: true, t: 'Yes' },
          { v: false, t: 'No' },
        ].map((o) => (
          <button
            key={o.t}
            type="button"
            role="radio"
            aria-checked={value === o.v}
            onClick={() => onChange(o.v)}
            className={`h-11 rounded-md text-sm font-semibold transition ${
              value === o.v ? 'bg-white text-[#1B7DB3] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {o.t}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function PriceCalculator({
  car,
  setCalc,                  // optional: shares the chosen destination with the inquiry form
  setQuote,                 // optional: shares the server quote with the inquiry form
  inquiryTo = '/contact',
  onOrder,                  // optional: shows an "Order Now" button
  onInquiry,                // optional: open the inquiry form on this page instead of /contact
}) {
  const { settings, loading, error: loadError } = useShippingSettings()

  const [country, setCountry] = useState('')
  const [port, setPort] = useState('')
  const [insurance, setInsurance] = useState(true)
  const [inspection, setInspection] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const rates = settings?.rates || []
  const insuranceRate = Number(settings?.insuranceRate) || 0 // percent
  const inspectionFee = Number(settings?.inspectionFee) || 0

  const vehiclePrice = Number(car?.price) > 0 ? Number(car.price) : 0
  const title = car ? [car.year, car.make, car.model].filter(Boolean).join(' ') : ''
  const inquiryLink = title ? `${inquiryTo}?car=${encodeURIComponent(title)}` : inquiryTo

  const countries = useMemo(
    () => [...new Set(rates.map((r) => r.country))].sort((a, b) => a.localeCompare(b)),
    [rates]
  )

  const countryRows = useMemo(() => rates.filter((r) => r.country === country), [rates, country])
  const specificPorts = countryRows.filter((r) => r.port).map((r) => r.port)
  const hasCountryWide = countryRows.some((r) => !r.port)
  const portOptions =
    specificPorts.length > 0 ? (hasCountryWide ? [...specificPorts, OTHER] : specificPorts) : []

  const reset = () => {
    setResult(null)
    setError('')
    setQuote?.(null)
  }

  const handleCountry = (e) => {
    const c = e.target.value
    setCountry(c)
    const first = rates.find((r) => r.country === c && r.port)
    setPort(first ? first.port : '')
    reset()
  }

  const calculate = async () => {
    if (!country) return setError('Please select your country.')
    if (portOptions.length > 0 && !port) return setError('Please select your nearest port.')
    if (!vehiclePrice) return setError('This vehicle has no price yet. Please send us an inquiry.')
    if (!car?._id) return setError('Please send us an inquiry for a quotation.')

    // "Other" and typed ports fall back to the country-wide rate on the server
    const dest = {
      country,
      port: port === OTHER ? '' : port.trim(),
      insurance: insuranceRate > 0 && insurance,
      inspection: inspectionFee > 0 && inspection,
    }

    setBusy(true)
    setError('')
    try {
      const q = await getQuote({ carId: car._id, ...dest })
      setCalc?.(dest)
      if (!q?.available) {
        setResult(null)
        setQuote?.(null)
        return setError(q?.reason || 'No shipping rate for this selection. Please send us an inquiry.')
      }
      setQuote?.(q)
      setResult({ ...q, portLabel: dest.port || country })
    } catch {
      setError('Could not calculate right now. Please try again or send us an inquiry.')
    } finally {
      setBusy(false)
    }
  }

  const noRates = !loading && !loadError && countries.length === 0

  // One "Send Inquiry" action: the form on this page if available, else the contact page
  const InquiryButton = ({ className, children }) =>
    onInquiry ? (
      <button type="button" onClick={onInquiry} className={className}>{children}</button>
    ) : (
      <Link to={inquiryLink} className={className}>{children}</Link>
    )

  // No shipping rates (or they failed to load): no calculator, just a quote request
  if (loadError || noRates) {
    return (
      <section className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E0F5FF] text-[#29ABE2] flex items-center justify-center shrink-0">
            <Send size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="text-[15px] font-bold text-[#0A1628] leading-tight">Get a delivered price quote</h2>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              Tell us your country and port, and we will send you the total price including shipping.
            </p>
          </div>
        </div>
        <InquiryButton className="mt-4 w-full h-12 rounded-lg bg-[#29ABE2] hover:bg-[#1B7DB3] text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition">
          <Send size={16} /> Send Inquiry
        </InquiryButton>
      </section>
    )
  }

  return (
    <section className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#E0F5FF] text-[#29ABE2] flex items-center justify-center shrink-0">
          <Calculator size={20} />
        </div>
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-[#0A1628] leading-tight">Total Price Calculator</h2>
          <p className="text-xs text-gray-500">Vehicle price + shipping + options to your port</p>
        </div>
      </div>

      {loading && (
        <div className="space-y-3 animate-pulse" aria-label="Loading shipping rates">
          <div className="h-12 rounded-lg bg-gray-100" />
          <div className="h-12 rounded-lg bg-gray-100" />
        </div>
      )}

      {!loading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="calc-country" label="Final country">
              <select id="calc-country" value={country} onChange={handleCountry} className={fieldClass}>
                <option value="">Select country</option>
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>

            <Field id="calc-port" label="Nearest port / city">
              {portOptions.length > 0 ? (
                <select
                  id="calc-port"
                  value={port}
                  onChange={(e) => { setPort(e.target.value); reset() }}
                  className={fieldClass}
                >
                  {portOptions.map((p) => (
                    <option key={p} value={p}>{p === OTHER ? 'Other port / city' : p}</option>
                  ))}
                </select>
              ) : (
                <input
                  id="calc-port"
                  type="text"
                  value={port}
                  onChange={(e) => { setPort(e.target.value); reset() }}
                  disabled={!country}
                  placeholder={country ? 'Type your nearest port or city' : 'Select country first'}
                  className={fieldClass}
                />
              )}
            </Field>

            {insuranceRate > 0 && (
              <YesNo icon={ShieldCheck} label="Insurance" hint={`${insuranceRate}% of price`} value={insurance}
                onChange={(v) => { setInsurance(v); reset() }} />
            )}
            {inspectionFee > 0 && (
              <YesNo icon={ClipboardCheck} label="Inspection" hint={usd(inspectionFee)} value={inspection}
                onChange={(v) => { setInspection(v); reset() }} />
            )}
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={calculate}
              disabled={busy}
              className="w-full sm:flex-1 h-12 sm:h-11 rounded-lg bg-[#29ABE2] hover:opacity-90 disabled:opacity-60 text-white text-sm font-bold transition"
            >
              {busy ? 'Calculating…' : 'Calculate'}
            </button>
            {onOrder && (
              <button
                type="button"
                onClick={onOrder}
                className="w-full sm:flex-1 h-12 sm:h-11 rounded-lg bg-[#0A1628] hover:opacity-90 text-white text-sm font-bold transition inline-flex items-center justify-center gap-2"
              >
                <ShoppingCart size={16} /> Order Now
              </button>
            )}
          </div>

          <div aria-live="polite">
            {result && (
              <div className="mt-5 rounded-xl bg-[#F0FAFF] border border-[#29ABE2]/20 overflow-hidden">
                <p className="px-4 sm:px-5 pt-4 text-xs font-semibold uppercase tracking-wider text-[#1B7DB3]">
                  Price breakdown · {result.portLabel}
                </p>
                <dl className="px-4 sm:px-5 py-3 text-sm divide-y divide-[#29ABE2]/10">
                  <div className="flex justify-between gap-4 py-2">
                    <dt className="text-gray-600">Vehicle price</dt>
                    <dd className="font-semibold text-gray-900 tabular-nums">{usd(vehiclePrice)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 py-2">
                    <dt className="text-gray-600 min-w-0 break-words">
                      Shipping
                      <span className="block text-[11px] text-gray-400">
                        {result.freightMethod === 'm3' ? `${result.m3} M³ × ${usd(result.ratePerM3)} per M³` : 'Flat rate to this destination'}
                      </span>
                    </dt>
                    <dd className="font-semibold text-gray-900 tabular-nums shrink-0">{usd(result.freight)}</dd>
                  </div>
                  {result.insurance > 0 && (
                    <div className="flex justify-between gap-4 py-2">
                      <dt className="text-gray-600">Insurance <span className="text-[11px] text-gray-400">({insuranceRate}% of vehicle price)</span></dt>
                      <dd className="font-semibold text-gray-900 tabular-nums">{usd(result.insurance)}</dd>
                    </div>
                  )}
                  {result.inspection > 0 && (
                    <div className="flex justify-between gap-4 py-2">
                      <dt className="text-gray-600">Inspection</dt>
                      <dd className="font-semibold text-gray-900 tabular-nums">{usd(result.inspection)}</dd>
                    </div>
                  )}
                </dl>

                <div className="px-4 sm:px-5 py-4 bg-white/70 border-t border-[#29ABE2]/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500">
                      Estimated total {result.insurance > 0 ? '(CIF)' : '(C&F)'}
                    </p>
                    <p className="text-2xl sm:text-3xl font-extrabold text-[#1B7DB3] leading-tight tabular-nums">
                      {usd(result.total)}
                    </p>
                  </div>
                  <InquiryButton className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-lg border border-[#29ABE2] text-[#1B7DB3] text-sm font-semibold hover:bg-white transition">
                    <Send size={15} /> Send Inquiry
                  </InquiryButton>
                </div>
              </div>
            )}
          </div>

          {/* IMPORT COSTS (only for countries the admin has configured) */}
          {result?.import && (
            <div className="mt-4 rounded-xl border border-gray-200 overflow-hidden" aria-live="polite">
              <p className="px-4 sm:px-5 pt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#1B7DB3]">
                <Landmark size={14} /> Import costs in {result.import.country} (estimate)
              </p>
              {!result.import.available ? (
                <p className="m-4 sm:mx-5 flex gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" /> {result.import.reason}
                </p>
              ) : (
                <>
                  <dl className="px-4 sm:px-5 py-3 text-sm divide-y divide-gray-100">
                    <div className="flex justify-between gap-4 py-2">
                      <dt className="text-gray-600">Customs value (CIF)</dt>
                      <dd className="font-semibold text-gray-900 tabular-nums">{usd(result.import.customsValue)}</dd>
                    </div>
                    {result.import.lines.map((l) => (
                      <div key={l.name} className="flex justify-between gap-4 py-2">
                        <dt className="text-gray-600 min-w-0">{l.name}<span className="block text-[11px] text-gray-400">{l.detail}</span></dt>
                        <dd className="font-semibold text-gray-900 tabular-nums shrink-0">{usd(l.amount)}</dd>
                      </div>
                    ))}
                    <div className="flex justify-between gap-4 py-2 font-semibold">
                      <dt className="text-gray-700">Total import costs</dt>
                      <dd className="text-gray-900 tabular-nums">{usd(result.import.totalImport)}</dd>
                    </div>
                  </dl>
                  <div className="px-4 sm:px-5 py-4 bg-[#0A1628] text-white flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-white/70">Estimated landed cost</p>
                      <p className="text-2xl font-extrabold tabular-nums">{usd(result.import.landed)}</p>
                    </div>
                    {result.import.landedLocal != null && (
                      <p className="text-sm text-white/80 tabular-nums">
                        ≈ {result.import.currency} {result.import.landedLocal.toLocaleString('en-US')}
                      </p>
                    )}
                  </div>
                </>
              )}
              {(result.import.notes || result.import.skipped?.length > 0) && (
                <p className="px-4 sm:px-5 py-3 text-[11px] text-gray-500 border-t border-gray-100">
                  {result.import.notes}
                  {result.import.skipped?.length > 0 && ` Not included (vehicle details missing): ${result.import.skipped.join(', ')}.`}
                </p>
              )}
            </div>
          )}

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs leading-relaxed">
            <p className="flex gap-2 bg-gray-50 rounded-lg p-3 text-gray-600">
              <Info size={14} className="text-[#29ABE2] shrink-0 mt-0.5" />
              This is an estimate. The final amount is shown on your invoice.
            </p>
            <p className="flex gap-2 bg-gray-50 rounded-lg p-3 text-gray-600">
              <Info size={14} className="text-[#29ABE2] shrink-0 mt-0.5" />
              Check the import rules of your country for this vehicle before you buy.
            </p>
          </div>
        </>
      )}
    </section>
  )
}