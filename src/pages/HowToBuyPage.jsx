import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search, FileText, CreditCard, Ship, CheckCircle, ShieldAlert } from 'lucide-react'
import ExchangeRate from '../components/home/ExchangeRate'

const BLUE = '#29ABE2'

const STEPS = [
  {
    id: 'step1',
    num: '01',
    icon: <Search size={22} className="text-[#29ABE2]" />,
    title: 'Choose your vehicle',
    desc: 'Browse our stock and use the filters to find the vehicle you want. Open the car page to see all photos and the full specifications.',
    tips: [
      'Filter by make, model, year and price',
      'Check the photos, mileage and features carefully',
      'Ask us for the total price delivered to your port',
    ],
  },
  {
    id: 'step2',
    num: '02',
    icon: <FileText size={22} className="text-[#29ABE2]" />,
    title: 'Free invoice / order',
    desc: 'Send an inquiry, or place an order if you are ready. After you accept the vehicle purchase agreement we send you a proforma invoice by email.',
    tips: [
      'Inquiries are free and carry no obligation',
      'We hold your order for 48 hours after your confirmation',
      'Use the same email address every time you contact us',
    ],
  },
  {
    id: 'step3',
    num: '03',
    icon: <CreditCard size={22} className="text-[#29ABE2]" />,
    title: 'Complete the payment',
    desc: 'Pay the full amount shown on the invoice by telegraphic transfer (T/T), in US dollars, to the bank account on the invoice.',
    tips: [
      'Always check the bank details on your invoice',
      'Send us the transfer slip with your invoice number',
      'If we do not receive the payment in time, the order is cancelled automatically',
    ],
  },
  {
    id: 'step4',
    num: '04',
    icon: <Ship size={22} className="text-[#29ABE2]" />,
    title: 'Delivery of your vehicle / shipping',
    desc: 'Once our bank confirms your full payment, we arrange the shipping of your vehicle to your nearest port.',
    tips: [
      'Shipping starts only after the full payment is received',
      'We tell you the expected shipping dates',
      'We prepare the shipping documents for you',
    ],
  },
  {
    id: 'step5',
    num: '05',
    icon: <CheckCircle size={22} className="text-[#29ABE2]" />,
    title: 'Receive your vehicle',
    desc: 'When the ship arrives at your port, you clear customs, pay any duties and register the vehicle.',
    tips: [
      'Customs clearance, duties and registration are your responsibility',
      'Check the import rules of your country before you buy',
      'Collect your vehicle from the port',
    ],
  },
]

const GOOD_TO_KNOW = [
  { title: 'Sold as-is', text: 'Check the photos and specifications carefully. Vehicles are sold in their current condition.' },
  { title: '48-hour hold', text: 'We hold your order for 48 hours after your confirmation while you arrange the payment.' },
  { title: 'Bank transfer only', text: 'Payment is by telegraphic transfer (T/T) in US dollars, as shown on your invoice.' },
]

export default function HowToBuyPage() {
  const { hash } = useLocation()

  // Links like /how-to-buy#step3 jump to that step
  useEffect(() => {
    if (!hash) return
    const el = document.getElementById(hash.slice(1))
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }, [hash])

  return (
    <div className="w-full min-h-screen bg-[#F5FBFF] overflow-x-hidden">

      {/* HERO */}
      <section
        className="w-full text-center px-4 sm:px-6 py-12 sm:py-16 relative overflow-hidden"
        style={{ background: BLUE }}
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
            How to Buy
          </h1>

          <p className="text-white/80 text-[15px] leading-relaxed max-w-xl mx-auto mb-8">
            Five simple steps from choosing your vehicle to receiving it at your port.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/cars"
              className="inline-flex items-center gap-2 bg-white font-bold text-sm px-6 sm:px-7 py-3 rounded-lg hover:bg-[#F0FAFF] transition"
              style={{ color: BLUE }}
            >
              Browse Stock
            </Link>

            <Link
              to="/contact"
              className="inline-flex items-center gap-2 border border-white/40 text-white font-semibold text-sm px-6 sm:px-7 py-3 rounded-lg hover:bg-white/10 transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* STEP LINKS */}
      <nav aria-label="Steps" className="bg-white border-b border-gray-100">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-3 flex gap-2 overflow-x-auto">
          {STEPS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="shrink-0 text-xs sm:text-sm font-medium text-gray-600 hover:text-[#29ABE2] bg-gray-50 hover:bg-[#E0F5FF] px-3 py-1.5 rounded-full transition"
            >
              {s.num} {s.title.split(' / ')[0]}
            </a>
          ))}
        </div>
      </nav>

      {/* SECURITY NOTICE */}
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-3 flex items-start sm:items-center gap-3 text-amber-900">
          <ShieldAlert size={18} className="shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-xs sm:text-sm">
            <b>Security notice:</b> payment must be made by telegraphic transfer to the Captain
            Traders bank account shown on your invoice.
          </p>
        </div>
      </div>

      {/* STEPS (timeline) */}
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <ol className="relative border-l-2 border-[#29ABE2]/25 ml-5 space-y-8">
          {STEPS.map((step) => (
            <li id={step.id} key={step.id} className="relative pl-8 sm:pl-10 scroll-mt-24">
              <span className="absolute -left-[21px] top-0 w-10 h-10 rounded-full bg-[#29ABE2] text-white flex items-center justify-center text-sm font-bold ring-4 ring-[#F5FBFF]">
                {step.num}
              </span>

              <div className="bg-white rounded-2xl border border-[#29ABE2]/20 p-5 sm:p-7 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-[#F0FAFF] flex items-center justify-center shrink-0">
                    {step.icon}
                  </div>
                  <h2 className="text-[17px] sm:text-[18px] font-bold text-[#0A1628]">{step.title}</h2>
                </div>

                <p className="text-sm text-gray-600 mb-4 leading-relaxed">{step.desc}</p>

                <ul className="space-y-1.5">
                  {step.tips.map((t) => (
                    <li key={t} className="flex items-start gap-2 text-sm text-gray-500">
                      <CheckCircle size={14} className="text-[#29ABE2] shrink-0 mt-[3px]" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* GOOD TO KNOW */}
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {GOOD_TO_KNOW.map((g) => (
            <div key={g.title} className="bg-white border border-[#29ABE2]/20 rounded-2xl p-5">
              <p className="text-sm font-bold text-[#0A1628]">{g.title}</p>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{g.text}</p>
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-500 text-center mt-6">
          More details:{' '}
          <Link to="/purchasing" className="text-[#1B7DB3] font-semibold hover:underline">Payment & Shipping</Link>
          {' · '}
          <Link to="/faq" className="text-[#1B7DB3] font-semibold hover:underline">FAQ</Link>
        </p>
      </div>

      {/* EXCHANGE RATE */}
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 pt-8">
        <ExchangeRate />
      </div>

      {/* CTA */}
      <div className="py-10 sm:py-14">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0A1628] mb-3">Ready to find your car?</h2>
          <p className="text-sm text-gray-500 mb-8">Browse our live stock or send us a message.</p>

          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            <Link
              to="/cars"
              className="px-7 sm:px-8 py-3.5 text-white font-bold text-sm rounded-xl hover:opacity-90 transition"
              style={{ background: BLUE }}
            >
              Browse Stock
            </Link>
            <Link
              to="/contact"
              className="px-7 sm:px-8 py-3.5 border border-[#29ABE2]/20 text-[#0A1628] font-semibold text-sm rounded-xl hover:bg-[#F0FAFF] transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}