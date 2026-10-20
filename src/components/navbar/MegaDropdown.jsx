import { Link } from 'react-router-dom'

const MegaDropdown = ({ columns = [], visible }) => {
  if (!visible) return null

  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 z-50">

      <div className="flex justify-center">
        <div className="w-3 h-3 bg-white border-l border-t border-gray-200 rotate-45 -mb-1.5 relative z-10" />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-2xl min-w-max overflow-hidden">
        <div className="flex divide-x divide-gray-100">

          {columns.map((col) => (
            <div key={col.heading} className="px-6 py-5 min-w-[180px]">

              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#29ABE2] mb-3">
                {col.heading}
              </p>

              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-[13.5px] text-gray-700 hover:text-[#29ABE2] transition"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>

            </div>
          ))}

        </div>
      </div>
    </div>
  )
}

export default MegaDropdown