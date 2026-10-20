import { Link } from 'react-router-dom'

/* ───────────────────────────────────────────────────────────
   EDIT THESE WITH THE CLIENT'S REAL DETAILS BEFORE LAUNCH
   (keep them the same as ContactPage and PurchasingPage)
─────────────────────────────────────────────────────────── */
const CONTACT = {
  email: 'info@captaintraders.jp',
  phone: '+81-6-0000-0000',
  address: 'Osaka, Japan',
  hours: 'Mon–Fri 09:00–18:00 JST',
}

const Footer = () => {
  const year = new Date().getFullYear()

  const cols = [
    {
      title: 'Stock',
      links: [
        { label: 'Browse Cars', href: '/cars' },
        { label: 'New Arrivals', href: '/cars?sort=newest' },
        { label: 'Best Deals', href: '/cars?sort=price_asc' },
      ],
    },
    {
      title: 'Buying',
      links: [
        { label: 'How to Buy', href: '/how-to-buy' },
        { label: 'Payment & Shipping', href: '/purchasing' },
        { label: 'FAQ', href: '/faq' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ],
    },
  ]

  return (
    <footer className="bg-[#0A1628] text-white">

      {/* MAIN */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">

          {/* BRAND */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#29ABE2] flex items-center justify-center font-bold">
                CT
              </div>
              <span className="text-lg font-bold tracking-tight">
                CaptainTraders<span className="text-[#29ABE2]">.JP</span>
              </span>
            </Link>

            <p className="text-sm text-white/60 leading-relaxed">
              Trusted Japanese used car exporter delivering quality vehicles worldwide.
            </p>

            <div className="mt-5 text-xs text-green-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Live inventory updated daily
            </div>
          </div>

          {/* LINKS */}
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs uppercase tracking-widest text-white/40 mb-4">
                {col.title}
              </h4>

              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.href}
                      className="text-sm text-white/70 hover:text-white transition"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* CONTACT */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-white/40 mb-4">
              Contact
            </h4>

            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="hover:text-white transition break-all"
                >
                  {CONTACT.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${CONTACT.phone.replace(/[^+\d]/g, '')}`}
                  className="hover:text-white transition"
                >
                  {CONTACT.phone}
                </a>
              </li>
              <li>{CONTACT.address}</li>
              <li className="text-white/50 text-xs">{CONTACT.hours}</li>
            </ul>
          </div>

        </div>

        {/* TRUST STRIP */}
        <div className="mt-14 border-t border-white/10 pt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">

          <div>
            <p className="text-sm font-semibold">Verified Japanese Auctions</p>
            <p className="text-xs text-white/50">Inspection reports included</p>
          </div>

          <div>
            <p className="text-sm font-semibold">Global Shipping Network</p>
            <p className="text-xs text-white/50">Worldwide export</p>
          </div>

          <div>
            <p className="text-sm font-semibold">Secure Transactions</p>
            <p className="text-xs text-white/50">Safe international payments</p>
          </div>

        </div>

      </div>

      {/* BOTTOM BAR */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-white/40">

          <p>© {year} CaptainTraders.JP — All rights reserved</p>

          <div className="flex items-center gap-4">
            <span>{CONTACT.address}</span>
            <span>•</span>
            <span>Worldwide Export</span>
          </div>

        </div>
      </div>

    </footer>
  )
}

export default Footer