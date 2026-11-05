import { useState } from 'react'

const MAKES = [
  'Toyota', 'Honda', 'Nissan', 'Mazda', 'Mitsubishi',
  'Subaru', 'Suzuki', 'Lexus', 'Daihatsu', 'Isuzu',
]

function MakeCard({ name, onSelect }) {
  const [failed, setFailed] = useState(false)

  return (
    <button
      type="button"
      onClick={() => onSelect(name)}
      className="group bg-white border border-gray-100 hover:border-[#29ABE2] hover:shadow-md rounded-xl p-2.5 sm:p-3 min-h-[88px] flex flex-col items-center justify-center gap-2 transition-all"
    >
      <div className="h-10 sm:h-12 w-full flex items-center justify-center">
        {failed ? (
          <span className="w-10 h-10 rounded-full bg-[#29ABE2]/10 text-[#29ABE2] font-bold text-lg flex items-center justify-center">
            {name[0]}
          </span>
        ) : (
          <img
            src={`/makes/${name.toLowerCase()}.png`}
            alt={`${name} logo`}
            loading="lazy"
            onError={() => setFailed(true)}
            className="max-h-full max-w-full object-contain"
          />
        )}
      </div>
      <span className="text-[11px] sm:text-xs font-semibold text-gray-700 group-hover:text-[#1B7DB3] truncate max-w-full">
        {name}
      </span>
    </button>
  )
}

export default function MakeGrid({ onSelect }) {
  return (
    <section>
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Search by Make</h2>
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-2.5 sm:gap-3">
        {MAKES.map((m) => (
          <MakeCard key={m} name={m} onSelect={onSelect} />
        ))}
      </div>
    </section>
  )
}