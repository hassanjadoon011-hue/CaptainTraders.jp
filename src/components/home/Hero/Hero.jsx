import { Link } from 'react-router-dom'
import heroImage from './captain-traders.jpg'

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-[#0A1628]">
      <img
        src={heroImage}
        alt=""
        fetchPriority="high"
        className="absolute inset-0 -z-20 h-full w-full object-cover object-left sm:object-center"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0A1628]/90 via-[#0A1628]/70 to-[#0A1628]/30" />
      {/* Phones: show the left of the photo (its printed text is on the right) and darken it behind the heading */}
      <div className="sm:hidden absolute inset-0 -z-10 bg-[#0A1628]/40" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-14 pb-24 sm:pt-20 sm:pb-32 lg:pt-28 lg:pb-40">
        <h1 className="max-w-2xl text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
          Japanese used cars, exported worldwide
        </h1>

        <p className="mt-4 max-w-xl text-base sm:text-lg text-white/80 leading-relaxed">
          Browse our stock, request an invoice, and we ship your car to your nearest port.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            to="/cars"
            className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-[#29ABE2] text-white text-sm font-bold hover:opacity-90 transition"
          >
            View Stock
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center h-12 px-8 rounded-lg border border-white/40 text-white text-sm font-semibold hover:bg-white/10 transition"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  )
}