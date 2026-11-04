import { Link } from 'react-router-dom'

const STEPS = [
  { title: 'Choose your vehicle', text: 'Browse our stock and pick the car you like.' },
  { title: 'Free invoice / order', text: 'Send an inquiry or order and get your proforma invoice.' },
  { title: 'Complete the payment', text: 'Pay by telegraphic transfer (T/T) in USD.' },
  { title: 'Shipping', text: 'We ship your vehicle to your nearest port.' },
  { title: 'Receive your vehicle', text: 'Clear customs and collect your car.' },
]

export default function BuySteps() {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">How To Buy</h2>
          <p className="text-sm text-gray-400 mt-0.5">Five simple steps from our stock to your door</p>
        </div>
        <Link to="/how-to-buy" className="text-sm text-[#29ABE2] hover:underline font-medium">
          Learn more 
        </Link>
      </div>

      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex lg:flex-col items-start gap-3">
            <span className="w-9 h-9 shrink-0 rounded-full bg-[#29ABE2] text-white font-bold text-sm flex items-center justify-center">
              {i + 1}
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-800">{s.title}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}