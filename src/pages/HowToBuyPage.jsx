import { Link } from 'react-router-dom'
import { Search, CreditCard, Ship, FileCheck, CheckCircle } from 'lucide-react'

const BLUE = '#29ABE2'

const STEPS = [
  {
    num: '01',
    icon: <Search size={24} className="text-[#29ABE2]" />,
    title: 'Find Your Vehicle',
    desc: 'Browse our inventory of 5,200+ Japanese used cars. Each listing includes auction grade and inspection report.',
    tips: ['Filter by budget', 'Check auction grade', 'View inspection sheet'],
  },
  {
    num: '02',
    icon: <CreditCard size={24} className="text-[#29ABE2]" />,
    title: 'Reserve & Pay',
    desc: 'Secure your car with a deposit. Balance is paid before shipment.',
    tips: ['30% deposit', 'Secure booking', 'Invoice provided'],
  },
  {
    num: '03',
    icon: <FileCheck size={24} className="text-[#29ABE2]" />,
    title: 'Export Processing',
    desc: 'We handle all export documents and certifications in Japan.',
    tips: ['Export certificate', 'Insurance', 'Full documentation'],
  },
  {
    num: '04',
    icon: <Ship size={24} className="text-[#29ABE2]" />,
    title: 'Shipping',
    desc: 'RORO or container shipping to your country with tracking.',
    tips: ['RORO/container', '2–8 weeks', 'Live tracking'],
  },
  {
    num: '05',
    icon: <CheckCircle size={24} className="text-[#29ABE2]" />,
    title: 'Delivery',
    desc: 'Clear customs and receive your vehicle at your port.',
    tips: ['Customs support', 'Port clearance', 'After-sales help'],
  },
]

export default function HowToBuyPage() {
  return (
    <div className="w-full min-h-screen bg-[#F5FBFF] overflow-x-hidden">

      {/* HERO */}
      <section
        className="w-full text-center px-4 sm:px-6 relative overflow-hidden"
        style={{
          background: BLUE,
          paddingTop: 'calc(68px + 2rem)',
          paddingBottom: '3rem',
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />

        <div className="relative max-w-3xl mx-auto">

          <p className="text-xs font-bold tracking-widest uppercase text-white/80 mb-3">
            Buying Guide
          </p>

          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4">
            How to Buy from Japan
          </h1>

          <p className="text-white/75 text-[15px] leading-relaxed max-w-xl mx-auto mb-8">
            Simple 5-step process from Japanese auctions to your doorstep with full support.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/cars"
              className="inline-flex items-center gap-2 bg-white font-bold text-sm px-6 sm:px-7 py-3 rounded-lg hover:bg-blue-50 transition"
              style={{ color: BLUE }}
            >
              Browse Inventory
            </Link>

            <Link
              to="/contact"
              className="inline-flex items-center gap-2 border border-white/40 text-white font-semibold text-sm px-6 sm:px-7 py-3 rounded-lg hover:bg-white/10 transition"
            >
              Contact Agent
            </Link>
          </div>

        </div>
      </section>

      {/* STEPS */}
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-5 sm:space-y-8">

        {STEPS.map((step) => (
          <div
            key={step.num}
            className="bg-white rounded-2xl border border-blue-100 p-5 sm:p-8 flex flex-col sm:flex-row gap-4 sm:gap-7 shadow-sm"
          >
            <div className="flex-shrink-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#E0F5FF] text-[#29ABE2] flex items-center justify-center text-[18px] font-bold">
                {step.num}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#F0FAFF] flex items-center justify-center shrink-0">
                  {step.icon}
                </div>
                <h2 className="text-[17px] sm:text-[18px] font-bold text-[#0A1628]">
                  {step.title}
                </h2>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                {step.desc}
              </p>

              <ul className="space-y-1.5">
                {step.tips.map((t) => (
                  <li key={t} className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#29ABE2] shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}

      </div>

      {/* CTA */}
      <div className="py-10 sm:py-14 bg-[#F5FBFF]">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 text-center">

          <h2 className="text-xl sm:text-2xl font-bold text-[#0A1628] mb-3">
            Ready to find your car?
          </h2>

          <p className="text-sm text-gray-500 mb-8">
            Browse live inventory or contact our team.
          </p>

          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">

            <Link
              to="/cars"
              className="px-7 sm:px-8 py-3.5 text-white font-bold text-sm rounded-xl hover:opacity-90 transition"
              style={{ background: BLUE }}
            >
              Browse Inventory
            </Link>

            <Link
              to="/contact"
              className="px-7 sm:px-8 py-3.5 border border-blue-200 text-[#0A1628] font-semibold text-sm rounded-xl hover:bg-blue-50 transition"
            >
              Contact Agent
            </Link>

          </div>

        </div>
      </div>

    </div>
  )
}