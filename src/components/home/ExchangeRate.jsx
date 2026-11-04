import { useEffect, useState } from 'react'
import { getShippingSettings } from '../../api/shippingApi'

export default function ExchangeRate() {
  const [rate, setRate] = useState(null)

  useEffect(() => {
    getShippingSettings()
      .then((d) => setRate(d?.usdToJpy || null))
      .catch(() => setRate(null))
  }, [])

  if (!rate) return null

  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="text-xs font-semibold text-gray-500">Exchange rate (USD / JPY)</p>
      <p className="text-2xl sm:text-3xl font-extrabold text-[#1B7DB3] mt-1">$1 = ¥{rate}</p>
      <p className="text-xs text-gray-400 mt-2 leading-relaxed">
        Indicative rate, updated by our team on working days. Your invoice shows the final amount.
      </p>
    </section>
  )
}