import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function FAQPage() {
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(null)

  const categories = [
    {
      title: 'Buying',
      faqs: [
        { q: 'Do I need to visit Japan?', a: 'No. Everything is handled remotely.' },
        { q: 'Can I choose cars?', a: 'Yes, from stock or auctions.' },
      ],
    },
    {
      title: 'Shipping',
      faqs: [
        { q: 'How long shipping takes?', a: '2–8 weeks depending on destination.' },
        { q: 'Can I track shipment?', a: 'Yes, full tracking is provided.' },
      ],
    },
  ]

  const current = categories[active]

  return (
    <div className="min-h-screen bg-gray-50 pt-20">

      {/* HEADER */}
      <div className="bg-navy text-white py-14 text-center">
        <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
        <p className="text-white/60 mt-2">
          Everything about buying Japanese cars
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 flex gap-8">

        {/* SIDEBAR */}
        <div className="w-64 bg-white border rounded-xl">
          {categories.map((c, i) => (
            <button
              key={c.title}
              onClick={() => {
                setActive(i)
                setOpen(null)
              }}
              className={`w-full text-left px-4 py-3 border-b text-sm
                ${active === i ? 'bg-blue-50 text-blue-600 font-semibold' : 'hover:bg-gray-50'}
              `}
            >
              {c.title}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="flex-1 space-y-4">

          {current.faqs.map((f, i) => (
            <div key={i} className="bg-white border rounded-lg">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex justify-between px-5 py-4 text-left"
              >
                <span className="font-medium">{f.q}</span>
                <ArrowRight className={`transition ${open === i ? 'rotate-90' : ''}`} />
              </button>

              {open === i && (
                <div className="px-5 pb-4 text-gray-600 text-sm">
                  {f.a}
                </div>
              )}
            </div>
          ))}

          <div className="mt-6 bg-blue-50 p-5 rounded-xl flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Still need help?</h3>
              <p className="text-sm text-gray-600">Contact our team anytime</p>
            </div>
            <Link to="/contact" className="bg-blue-600 text-white px-4 py-2 rounded-lg">
              Contact
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}