import { Link } from 'react-router-dom'
import { ShieldCheck, FileCheck2, Ship, Headset, ArrowRight } from 'lucide-react'

const TRUST = [
  { icon: ShieldCheck, title: 'Inspected Vehicles', text: 'Checked before export' },
  { icon: FileCheck2, title: 'Clear Documents', text: 'Invoice and export papers' },
  { icon: Ship, title: 'Worldwide Shipping', text: 'To your nearest port' },
  { icon: Headset, title: 'Dedicated Support', text: 'Mon–Fri, 09:00–18:00 JST' },
]

export default function TrustStrip() {
  return (
    <section className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {TRUST.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-lg bg-[#29ABE2]/10 text-[#29ABE2] flex items-center justify-center shrink-0">
              <Icon size={19} />
            </span>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">{title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-gray-600">New to importing a car from Japan?</p>
        <Link
          to="/how-to-buy"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1B7DB3] hover:underline"
        >
          See how to buy <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  )
}