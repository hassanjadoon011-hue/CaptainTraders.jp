import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Building2, Landmark, ShoppingCart, Handshake, Ship, Mail, Phone, MapPin, Clock } from 'lucide-react'
import axiosClient from '../api/axiosClient'
import { CONTACT, BANK_DETAILS, hasBankDetails } from '../constants/siteConfig'

const BLUE = '#29ABE2'

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'company-profile', label: 'Head Office' },
  { id: 'bank-details', label: 'Bank Details' },
  { id: 'purchase-section', label: 'Purchase' },
  { id: 'sales-section', label: 'Sales' },
  { id: 'shipping-section', label: 'Shipping' },
]

const TEAMS = [
  {
    id: 'purchase-section',
    icon: ShoppingCart,
    title: 'Purchase Section',
    text: 'Our purchase team finds vehicles in Japan and adds them to our stock. Each vehicle is listed with photos and its specifications, so you can check it before you order.',
  },
  {
    id: 'sales-section',
    icon: Handshake,
    title: 'Sales Section',
    text: 'Our sales team answers your inquiries, prepares your proforma invoice and confirms your payment. Send us your questions at any time and we reply during business hours.',
  },
  {
    id: 'shipping-section',
    icon: Ship,
    title: 'Shipping Section',
    text: 'Once your full payment is confirmed, our shipping team arranges the shipping of your vehicle to your nearest port and tells you the expected shipping dates.',
  },
]

function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-10 h-10 rounded-xl bg-[#E0F5FF] flex items-center justify-center shrink-0">
        <Icon size={19} style={{ color: BLUE }} />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{children}</h2>
    </div>
  )
}

export default function AboutPage() {
  const { hash } = useLocation()
  const [stockCount, setStockCount] = useState(null)

  // Links like /about#shipping-section jump to that section
  useEffect(() => {
    if (!hash) return
    const el = document.getElementById(hash.slice(1))
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }, [hash])

  // Real number of cars for sale right now
  useEffect(() => {
    axiosClient
      .get('/cars', { params: { limit: 1, status: 'available' } })
      .then((res) => setStockCount(res.data?.pagination?.totalCars ?? null))
      .catch(() => setStockCount(null))
  }, [])

  const contactRows = [
    { icon: MapPin, label: 'Address', value: CONTACT.address },
    { icon: Phone, label: 'Phone', value: CONTACT.phone, href: `tel:${CONTACT.phone.replace(/[^+\d]/g, '')}` },
    { icon: Mail, label: 'Email', value: CONTACT.email, href: `mailto:${CONTACT.email}` },
    { icon: Clock, label: 'Business hours', value: CONTACT.hours },
  ]

  return (
    <div
      className="w-full min-h-screen bg-[#F5F9FF] overflow-x-hidden"
      style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}
    >

      {/* HERO */}
      <section
        className="w-full text-center px-4 sm:px-6 py-12 sm:py-16 relative overflow-hidden"
        style={{ background: BLUE }}
      >
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative max-w-3xl mx-auto">
          <span className="text-white/80 text-[11px] font-bold tracking-[0.18em] uppercase">
            About CaptainTraders.jp
          </span>

          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4 mt-3">
            Japanese Used Vehicles, Exported Worldwide
          </h1>

          <p className="text-white/80 text-[15px] leading-relaxed max-w-xl mx-auto">
            Captain Traders exports Japanese used cars, vans, trucks, buses and machinery
            from Japan to buyers around the world.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <Link
              to="/cars"
              className="bg-white font-bold text-sm px-7 py-3 rounded-lg hover:bg-blue-50 transition"
              style={{ color: BLUE }}
            >
              Browse Stock
            </Link>
            <Link
              to="/contact"
              className="border border-white/40 text-white font-semibold text-sm px-7 py-3 rounded-lg hover:bg-white/10 transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION LINKS */}
      <nav aria-label="About sections" className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex gap-2 overflow-x-auto">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="shrink-0 text-xs sm:text-sm font-medium text-gray-600 hover:text-[#29ABE2] bg-gray-50 hover:bg-[#E0F5FF] px-3 py-1.5 rounded-full transition"
            >
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10 sm:space-y-14">

        {/* OVERVIEW */}
        <section id="overview" className="scroll-mt-28">
          <span className="text-[11px] font-bold tracking-[0.16em] uppercase" style={{ color: BLUE }}>
            Overview
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2 mb-4">
            Who we are
          </h2>
          <p className="text-slate-500 text-sm sm:text-[15px] leading-relaxed max-w-3xl">
            Captain Traders is a Japanese used vehicle exporter based in Chiba, Japan. You can
            choose a vehicle from our stock, check the total price to your port, send an
            inquiry or place an order online, and we take care of the shipping once your
            payment is confirmed.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            {[
              { value: stockCount !== null ? stockCount.toLocaleString() : '—', label: 'Vehicles in stock now' },
              { value: '5', label: 'Simple steps to buy' },
              { value: 'USD', label: 'Prices and invoices' },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-blue-100 rounded-2xl p-5 text-center shadow-sm">
                <p className="text-3xl font-extrabold" style={{ color: BLUE }}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-500 mt-6">
            New to buying from Japan? Read{' '}
            <Link to="/how-to-buy" className="text-[#1B7DB3] font-semibold hover:underline">How to Buy</Link>
            {' '}or the{' '}
            <Link to="/faq" className="text-[#1B7DB3] font-semibold hover:underline">FAQ</Link>.
          </p>
        </section>

        {/* HEAD OFFICE */}
        <section id="company-profile" className="scroll-mt-28 bg-white border border-blue-100 rounded-2xl shadow-sm p-5 sm:p-8">
          <SectionTitle icon={Building2}>Head Office</SectionTitle>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {contactRows.map((r) => (
              <div key={r.label} className="flex items-start gap-3 min-w-0">
                <r.icon size={17} className="text-gray-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">{r.label}</p>
                  {r.href ? (
                    <a href={r.href} className="text-sm font-semibold text-slate-800 hover:text-[#29ABE2] break-all">
                      {r.value}
                    </a>
                  ) : (
                    <p className="text-sm font-semibold text-slate-800">{r.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* BANK DETAILS */}
        <section id="bank-details" className="scroll-mt-28 bg-white border border-blue-100 rounded-2xl shadow-sm p-5 sm:p-8">
          <SectionTitle icon={Landmark}>Bank Details</SectionTitle>

          {hasBankDetails ? (
            <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
              {BANK_DETAILS.map((d) => (
                <div key={d.label} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-4 py-3">
                  <p className="text-xs uppercase tracking-wider text-gray-400 font-medium">{d.label}</p>
                  <p className="text-sm font-semibold text-slate-800 break-words">{d.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 leading-relaxed">
              Our bank details are written on your proforma invoice, which we send you after
              you place an order.
            </p>
          )}

          <p className="text-xs text-gray-400 mt-4">
            Payment is by telegraphic transfer (T/T). Please confirm the bank details with us
            before you send money.{' '}
            <Link to="/purchasing" className="text-[#1B7DB3] font-semibold hover:underline">Payment details</Link>
          </p>
        </section>

        {/* TEAMS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TEAMS.map((t) => (
            <div
              id={t.id}
              key={t.id}
              className="scroll-mt-28 p-6 rounded-2xl border border-blue-100 bg-[#F0FAFF]"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: '#C8ECFC' }}
              >
                <t.icon size={18} style={{ color: BLUE }} />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{t.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{t.text}</p>
            </div>
          ))}
        </section>

        {/* CTA */}
        <section className="text-center bg-white border border-blue-100 rounded-2xl shadow-sm p-6 sm:p-10">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Looking for a vehicle?</h2>
          <p className="text-sm text-gray-500 mt-2">Browse our live stock or send us a message.</p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Link
              to="/cars"
              className="px-8 py-3 text-white font-bold text-sm rounded-xl hover:opacity-90 transition"
              style={{ background: BLUE }}
            >
              Browse Stock
            </Link>
            <Link
              to="/contact"
              className="px-8 py-3 border border-blue-200 text-slate-900 font-semibold text-sm rounded-xl hover:bg-blue-50 transition"
            >
              Contact Us
            </Link>
          </div>
        </section>

      </div>
    </div>
  )
}