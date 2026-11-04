import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, Clock, Tag, Gauge } from 'lucide-react'
import ExchangeRate from './ExchangeRate'

const PROMOS = [
  { icon: Tag, title: 'Cars under $2,000', text: 'Budget-friendly picks', to: '/cars?priceTo=2000' },
  { icon: Gauge, title: 'Low mileage', text: 'Under 150,000 km', to: '/cars?maxMileage=150000' },
]

export default function HomeSidebar() {
  return (
    <aside className="w-full lg:w-[300px] shrink-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-5 lg:sticky lg:top-24">
      <div className="md:col-span-2 lg:col-span-1">
        <ExchangeRate />
      </div>

      <div className="space-y-3">
        {PROMOS.map(({ icon: Icon, title, text, to }) => (
          <Link
            key={title}
            to={to}
            className="group flex items-center gap-3 bg-white border border-gray-100 hover:border-[#29ABE2] hover:shadow-md rounded-xl p-4 transition-all"
          >
            <span className="w-10 h-10 rounded-lg bg-[#29ABE2]/10 text-[#29ABE2] flex items-center justify-center shrink-0 group-hover:bg-[#29ABE2] group-hover:text-white transition-colors">
              <Icon size={19} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-gray-900">{title}</span>
              <span className="block text-xs text-gray-500">{text}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Contact Us</h3>
        <ul className="space-y-2.5 text-sm text-gray-600">
          <li className="flex items-center gap-2.5 min-w-0">
            <Mail size={15} className="text-[#29ABE2] shrink-0" />
            <a href="mailto:info@captaintraders.jp" className="hover:text-[#1B7DB3] break-all">
              info@captaintraders.jp
            </a>
          </li>
          <li className="flex items-center gap-2.5">
            <Phone size={15} className="text-[#29ABE2] shrink-0" />
            <a href="tel:+81600000000" className="hover:text-[#1B7DB3]">+81-6-0000-0000</a>
          </li>
          <li className="flex items-center gap-2.5">
            <MapPin size={15} className="text-[#29ABE2] shrink-0" />
            Osaka, Japan
          </li>
          <li className="flex items-center gap-2.5">
            <Clock size={15} className="text-[#29ABE2] shrink-0" />
            Mon–Fri 09:00–18:00 JST
          </li>
        </ul>
        <Link
          to="/contact"
          className="mt-4 flex items-center justify-center h-11 text-sm font-semibold text-white bg-[#29ABE2] hover:opacity-90 rounded-lg transition"
        >
          Send an Inquiry
        </Link>
      </div>
    </aside>
  )
}