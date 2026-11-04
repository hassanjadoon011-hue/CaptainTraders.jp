import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { CONTACT } from '../constants/siteConfig'

// Same sections as the real site. /faq?v=3 opens "Payment".
const CATEGORIES = [
  {
    title: 'General',
    faqs: [
      {
        q: 'What do you sell?',
        a: 'We export Japanese used vehicles: cars, vans, pickups, trucks, buses and heavy machinery. You can browse everything we have in stock on the Stock page.',
      },
      {
        q: 'Do I need to visit Japan?',
        a: 'No. You can choose your vehicle, get your invoice and pay online. We arrange the shipping to your nearest port.',
      },
      {
        q: 'Where are the vehicles?',
        a: 'Each vehicle page shows the location (yard) where the vehicle is now in Japan.',
      },
      {
        q: 'What does FOB price mean?',
        a: 'FOB is the price of the vehicle loaded on the ship in Japan. It does not include shipping, insurance, or import duties and taxes in your country.',
      },
      {
        q: 'What is the total price (CIF)?',
        a: 'It is the FOB price plus the shipping cost to your port. If you choose them, marine insurance and inspection are added. You can see it with the Total Price Calculator on every vehicle page.',
      },
    ],
  },
  {
    title: 'Buying vehicles',
    faqs: [
      {
        q: 'How do I order a vehicle?',
        a: 'Open the vehicle page, check the total price with the calculator, then fill in the form at the bottom of the page. Send an inquiry if you have questions, or place an order if you are ready. We email you a proforma invoice.',
      },
      {
        q: 'How long do you hold my order?',
        a: 'We hold your order for 48 hours after you confirm it. If we do not receive your payment in that time, the order is cancelled automatically and the vehicle can be sold to someone else. If you need more time, ask us to extend it.',
      },
      {
        q: 'What is the condition of the vehicles?',
        a: 'Vehicles are sold as they are. Please check the photos and specifications on the vehicle page carefully before you order. If you need more details or photos, send us an inquiry.',
      },
      {
        q: 'Is the vehicle still available?',
        a: 'Sold vehicles are marked as sold, and our stock list shows only vehicles that are available. A vehicle can still be sold to another buyer before your payment is received.',
      },
      {
        q: 'Can I check the import rules of my country?',
        a: 'Yes, and you should do this before buying. Every country has its own rules about vehicle age, steering side and other requirements. You are responsible for following the import regulations of your country.',
      },
    ],
  },
  {
    title: 'Payment',
    faqs: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept payment by telegraphic transfer (T/T) to our bank account.',
      },
      {
        q: 'What are the payment terms?',
        a: 'The full amount of the vehicle must be paid before shipping starts. We arrange the shipping once our bank confirms that your full payment has arrived.',
      },
      {
        q: 'What currency should I pay in?',
        a: 'Payment is made in US dollars as shown on your invoice. If you prefer another currency, contact us after you receive your invoice and we will send you a revised invoice.',
      },
      {
        q: 'How will you know I have paid?',
        a: 'After you pay, send us a copy of the payment with your invoice number or the vehicle stock number by email. When the payment is confirmed in our account, our sales staff will tell you.',
      },
      {
        q: 'Where can I find your bank details?',
        a: 'Our bank details are written on your proforma invoice. Always check them with us before you send money.',
      },
    ],
  },
  {
    title: 'Shipping',
    faqs: [
      {
        q: 'Who arranges the shipping?',
        a: 'We do. After your full payment is confirmed, we arrange the shipping of your vehicle to your nearest port.',
      },
      {
        q: 'How long does shipping take?',
        a: 'It depends on your destination and the ship schedule. We will tell you the expected shipping dates when we send your invoice.',
      },
      {
        q: 'Who pays customs and import duties?',
        a: 'You do. When the vessel arrives at your port, you are responsible for customs clearance, any duties and fees, registration, and collecting the vehicle.',
      },
      {
        q: 'Can I add marine insurance?',
        a: 'Yes. Choose "Marine insurance: Yes" in the Total Price Calculator on the vehicle page and the cost will be added to your total.',
      },
    ],
  },
  {
    title: 'Inquiry',
    faqs: [
      {
        q: 'How can I contact you?',
        a: `You can send an inquiry from any vehicle page, use the Contact page, or email us at ${CONTACT.email}.`,
      },
      {
        q: 'What are your business hours?',
        a: `${CONTACT.hours}. Messages sent outside these hours are answered on the next working day.`,
      },
      {
        q: 'Which email address should I use?',
        a: 'Please use the same email address every time you contact us. It helps us find your order quickly and avoids confusion.',
      },
      {
        q: 'Can you find a vehicle that is not in your stock?',
        a: 'Send us a message with the make, model, year and your budget. We will let you know what we can do.',
      },
    ],
  },
]

export default function FAQPage() {
  const [params, setParams] = useSearchParams()
  const [open, setOpen] = useState(0)

  const active = Math.min(CATEGORIES.length, Math.max(1, Number(params.get('v')) || 1)) - 1
  const current = CATEGORIES[active]

  useEffect(() => { setOpen(0) }, [active])

  const choose = (i) => setParams(i === 0 ? {} : { v: String(i + 1) })

  return (
    <div className="min-h-screen bg-[#F5F9FF]">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-[#29ABE2] to-[#1B7DB3] text-white py-12 sm:py-14 px-4 text-center">
        <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
        <p className="text-white/80 mt-2">Everything about buying Japanese vehicles</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col lg:flex-row gap-6 lg:gap-8">

        {/* CATEGORIES (tabs on phones, list on laptops) */}
        <nav aria-label="FAQ sections" className="lg:w-64 lg:shrink-0">
          <div className="flex lg:flex-col gap-2 lg:gap-0 overflow-x-auto lg:overflow-visible lg:bg-white lg:border lg:border-gray-100 lg:rounded-xl lg:overflow-hidden pb-1 lg:pb-0">
            {CATEGORIES.map((c, i) => (
              <button
                key={c.title}
                onClick={() => choose(i)}
                aria-current={active === i ? 'true' : undefined}
                className={`shrink-0 text-left px-4 py-2.5 lg:py-3 text-sm rounded-full lg:rounded-none border lg:border-0 lg:border-b border-gray-200 lg:border-gray-100 transition whitespace-nowrap
                  ${active === i
                    ? 'bg-[#29ABE2] lg:bg-blue-50 text-white lg:text-[#1B7DB3] font-semibold border-[#29ABE2]'
                    : 'bg-white text-gray-600 hover:bg-gray-50'}
                `}
              >
                {c.title}
              </button>
            ))}
          </div>
        </nav>

        {/* QUESTIONS */}
        <div className="flex-1 min-w-0 space-y-3">
          <h2 className="text-lg font-bold text-gray-800 mb-1">{current.title}</h2>

          {current.faqs.map((f, i) => {
            const isOpen = open === i
            return (
              <div key={f.q} className="bg-white border border-gray-100 rounded-xl shadow-sm">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 px-4 sm:px-5 py-4 text-left"
                >
                  <span className="font-medium text-gray-800">{f.q}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-[#29ABE2] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-4 text-gray-600 text-sm leading-relaxed">
                    {f.a}
                  </div>
                )}
              </div>
            )
          })}

          <div className="mt-6 bg-blue-50 border border-blue-100 p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-800">Still need help?</h3>
              <p className="text-sm text-gray-600">Contact our team during business hours.</p>
            </div>
            <Link
              to="/contact"
              className="bg-[#29ABE2] hover:bg-[#1B7DB3] text-white text-center font-semibold px-6 py-2.5 rounded-lg transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}