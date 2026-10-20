import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { menuData } from './menuData'
import MegaDropdown from './MegaDropdown'
import Chevron from './Chevron'

export default function Navbar() {
  const { pathname } = useLocation()
  const [active, setActive] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileSection, setMobileSection] = useState(null)
  const timeoutRef = useRef(null)

  // Close menus whenever the page changes
  useEffect(() => {
    setMobileOpen(false)
    setMobileSection(null)
    setActive(null)
  }, [pathname])

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  const handleEnter = (label) => {
    clearTimeout(timeoutRef.current)
    setActive(label)
  }

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setActive(null), 200)
  }

  const isActive = (item) => {
    if (item.href) return pathname === item.href
    return (item.columns || []).some((col) =>
      col.links.some((l) => l.href.split('?')[0] === pathname)
    )
  }

  const linkClass = (item) =>
    `text-sm font-medium transition ${
      isActive(item) ? 'text-[#29ABE2]' : 'text-gray-700 hover:text-[#29ABE2]'
    }`

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-gray-200">

      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">

        {/* LOGO */}
        <Link to="/" className="text-lg sm:text-xl font-bold text-[#0A1628]">
          CAPTAIN TRADERS<span className="text-[#29ABE2]">.JP</span>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden lg:flex items-center gap-8">
          {menuData.map((item) => (
            <div
              key={item.label}
              className="relative"
              onMouseEnter={() => item.hasMega && handleEnter(item.label)}
              onMouseLeave={() => item.hasMega && handleLeave()}
            >
              {!item.hasMega ? (
                <Link to={item.href} className={linkClass(item)}>
                  {item.label}
                </Link>
              ) : (
                <button type="button" className={`flex items-center gap-1 ${linkClass(item)}`}>
                  {item.label}
                  <Chevron open={active === item.label} />
                </button>
              )}

              {item.hasMega && (
                <MegaDropdown
                  columns={item.columns || []}
                  visible={active === item.label}
                />
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* CTA */}
          <Link
            to="/cars"
            className="hidden sm:inline-block px-4 py-2 text-sm font-medium text-white bg-[#29ABE2] rounded-md hover:bg-[#1B7DB3] transition"
          >
            View Stock
          </Link>

          {/* HAMBURGER */}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            className="lg:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white max-h-[75vh] overflow-y-auto">
          <nav className="px-6 py-3">
            {menuData.map((item) => (
              <div key={item.label} className="border-b border-gray-50 last:border-0">
                {!item.hasMega ? (
                  <Link to={item.href} className={`block py-3 ${linkClass(item)}`}>
                    {item.label}
                  </Link>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setMobileSection(mobileSection === item.label ? null : item.label)
                      }
                      className={`w-full flex items-center justify-between py-3 ${linkClass(item)}`}
                    >
                      {item.label}
                      <Chevron open={mobileSection === item.label} />
                    </button>

                    {mobileSection === item.label && (
                      <div className="pb-3 pl-3 space-y-4">
                        {(item.columns || []).map((col) => (
                          <div key={col.heading}>
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#29ABE2] mb-2">
                              {col.heading}
                            </p>
                            <ul className="space-y-2">
                              {col.links.map((l) => (
                                <li key={l.label}>
                                  <Link
                                    to={l.href}
                                    className="text-sm text-gray-700 hover:text-[#29ABE2]"
                                  >
                                    {l.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            <Link
              to="/cars"
              className="block text-center mt-3 mb-2 px-4 py-2.5 text-sm font-medium text-white bg-[#29ABE2] rounded-md hover:bg-[#1B7DB3] transition"
            >
              View Stock
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}