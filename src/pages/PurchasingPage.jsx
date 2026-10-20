import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Landmark, Copy, Check, X, ShieldAlert } from 'lucide-react'
import { useNotification } from "../context/NotificationContext";

/* ───────────────────────────────────────────────────────────
   EDIT THESE WITH THE CLIENT'S REAL DETAILS BEFORE LAUNCH
─────────────────────────────────────────────────────────── */
const CONTACT = {
  email: 'info@captaintraders.jp',
  phone: '+81-6-0000-0000',
}

const BANK_DETAILS = [
  { label: 'Bank Name', value: 'Japan Bank Corporation' },
  { label: 'Account Name', value: 'Captain Traders JP' },
  { label: 'Account Number', value: '1234567890' },
  { label: 'SWIFT Code', value: 'JBCOJPJT' },
  { label: 'Branch', value: 'Tokyo Main Branch' },
  { label: 'Bank Address', value: '1-2-3 Chiyoda, Tokyo, Japan' },
]

const STEPS = [
  {
    number: 1,
    title: 'Browse & Select',
    description: 'Browse our collection of Japanese used cars and select the vehicle you like.',
    details: [
      'View detailed specifications and images',
      'Compare prices and conditions',
      'Check vehicle history reports',
      'Read customer reviews',
    ],
  },
  {
    number: 2,
    title: 'Make Inquiry',
    description: 'Send an inquiry for the car you are interested in.',
    details: [
      'Fill out the inquiry form',
      'Provide your contact information',
      'Our team responds within 24 hours',
      'Get detailed information via email or phone',
    ],
  },
  {
    number: 3,
    title: 'Arrange Inspection',
    description: 'Arrange a video or physical inspection of the vehicle.',
    details: [
      'Schedule inspection via video call',
      'Request detailed inspection report',
      'Get 360-degree vehicle views',
      'Ask our experts any questions',
    ],
  },
  {
    number: 4,
    title: 'Documentation',
    description: 'We prepare all necessary shipping and customs documentation.',
    details: [
      'Vehicle registration documents',
      'Export declaration forms',
      'Insurance documentation',
      'Shipping arrangements',
    ],
  },
  {
    number: 5,
    title: 'Payment',
    description: 'Make payment via telegraphic transfer to our bank account.',
    details: [
      'View bank details securely',
      'Receive payment confirmation within 2 hours',
      'Invoice will be issued',
      'Payment processing assured',
    ],
  },
  {
    number: 6,
    title: 'Shipping',
    description: 'Your vehicle is shipped directly to your location.',
    details: [
      'Container shipping to your country',
      'Tracking information provided',
      'Estimated delivery 30-45 days',
      'Insurance coverage included',
    ],
  },
]

const PAYMENT_METHODS = [
  'Telegraphic Transfer (T/T)',
  'Bank Transfer (International)',
  'Wire Transfer',
  'Letter of Credit (L/C)',
]

const SECURITY_FEATURES = [
  'Verified Bank Details',
  'Secured Transactions',
  'Money Back Guarantee',
  'Certified Vehicles',
]

const FAQS = [
  {
    q: 'What payment methods do you accept?',
    a: 'We accept telegraphic transfer, bank wire transfer, and letter of credit. All payments must be made in USD or JPY.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Typical delivery time is 30-45 days from the date of payment and shipment of the vehicle.',
  },
  {
    q: 'Is insurance included?',
    a: 'Yes, comprehensive cargo insurance is included in the shipping cost to protect your vehicle during transit.',
  },
  {
    q: 'What documents will I receive?',
    a: 'You will receive original vehicle registration, customs export documents, shipping documents, and an insurance certificate.',
  },
  {
    q: 'Can I arrange inspection before payment?',
    a: 'Yes, you can arrange a video inspection or send a third-party inspector to verify the vehicle condition before making payment.',
  },
]

export default function PurchasingPage() {
  const [showBankModal, setShowBankModal] = useState(false)
  const [openFaq, setOpenFaq] = useState(0)

  return (
    <div className="min-h-screen bg-[#F5F9FF]">

      {/* ── HERO ── */}
      <div className="bg-gradient-to-r from-[#29ABE2] to-[#1B7DB3] py-14 px-4 text-center text-white">
        <h1 className="text-3xl md:text-4xl font-extrabold">How to Purchase</h1>
        <p className="text-white/85 mt-3 text-base md:text-lg">
          A simple 6-step process to buy your Japanese car with confidence
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">

        {/* ── PROCESS STEPS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 shrink-0 bg-[#29ABE2] text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {step.number}
                </div>
                <h3 className="text-lg font-bold text-gray-800 ml-4">{step.title}</h3>
              </div>
              <p className="text-gray-600 mb-4 text-sm">{step.description}</p>
              <ul className="space-y-2">
                {step.details.map((detail) => (
                  <li key={detail} className="text-sm text-gray-700 flex items-start">
                    <span className="text-[#29ABE2] mr-2">✓</span>
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── PAYMENT & SECURITY ── */}
        <div className="bg-gradient-to-r from-[#29ABE2] to-[#1B7DB3] text-white rounded-xl p-6 md:p-8 shadow-lg mb-12">
          <h2 className="text-2xl font-bold mb-6">Payment & Security</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold mb-3 text-lg">Payment Methods</h3>
              <ul className="space-y-2">
                {PAYMENT_METHODS.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span>✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-3 text-lg">Security Features</h3>
              <ul className="space-y-2">
                {SECURITY_FEATURES.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span>✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <button
            onClick={() => setShowBankModal(true)}
            className="mt-8 inline-flex items-center gap-2 bg-white text-[#1B7DB3] hover:bg-blue-50 font-bold py-2.5 px-8 rounded-lg transition"
          >
            <Landmark size={18} />
            View Bank Details & Payment Info
          </button>
        </div>

        {/* ── FAQ ── */}
        <div className="bg-white rounded-xl p-6 md:p-8 border border-gray-100 shadow-sm mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Frequently Asked Questions</h2>

          <div className="divide-y divide-gray-100">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <div key={faq.q} className="py-4">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 text-left"
                  >
                    <span className="font-semibold text-gray-800">{faq.q}</span>
                    <span className="text-[#29ABE2] text-xl leading-none shrink-0">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && <p className="text-gray-600 mt-3 text-sm">{faq.a}</p>}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── CALL TO ACTION ── */}
        <div className="text-center bg-white rounded-xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-800">Ready to find your car?</h2>
          <p className="text-gray-500 text-sm mt-2">
            Browse our inventory or talk to our team. We reply within 24 hours.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <Link
              to="/cars"
              className="bg-[#29ABE2] hover:bg-[#1B7DB3] text-white font-semibold px-8 py-3 rounded-lg transition"
            >
              Browse Inventory
            </Link>
            <Link
              to="/contact"
              className="bg-white border border-[#29ABE2] text-[#1B7DB3] hover:bg-blue-50 font-semibold px-8 py-3 rounded-lg transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>

      {showBankModal && <BankDetailsModal onClose={() => setShowBankModal(false)} />}
    </div>
  )
}

function BankDetailsModal({ onClose }) {
  const { addNotification } = useNotification()
  const [copiedKey, setCopiedKey] = useState(null)

  // Close on Escape, and stop the page behind from scrolling
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  const copyText = async (key, text, message) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      addNotification(message, 'success', 2000)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch {
      addNotification('Could not copy. Please copy it manually.', 'error', 2500)
    }
  }

  const copyAll = () =>
    copyText(
      'all',
      BANK_DETAILS.map((d) => `${d.label}: ${d.value}`).join('\n'),
      'All bank details copied!'
    )

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Bank transfer details"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#29ABE2]/10 flex items-center justify-center">
              <Landmark size={20} className="text-[#29ABE2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 leading-tight">Bank Transfer Details</h2>
              <p className="text-xs text-gray-400">Telegraphic transfer (T/T)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="px-6 py-5 overflow-y-auto space-y-5">

          {/* SECURITY NOTICE */}
          <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Verify before you pay</p>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                Always confirm these bank details with our team by phone or email before sending
                money. Fraudulent bank details may be shared with you.
              </p>
            </div>
          </div>

          {/* DETAILS */}
          <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
            {BANK_DETAILS.map((detail) => {
              const copied = copiedKey === detail.label
              return (
                <div
                  key={detail.label}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
                      {detail.label}
                    </p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5 break-words">
                      {detail.value}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      copyText(detail.label, detail.value, `${detail.label} copied!`)
                    }
                    className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                      copied
                        ? 'bg-green-50 border-green-200 text-green-600'
                        : 'bg-white border-gray-200 text-[#1B7DB3] hover:bg-blue-50'
                    }`}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )
            })}
          </div>

          <button
            onClick={copyAll}
            className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#1B7DB3] border border-[#29ABE2] hover:bg-blue-50 py-2.5 rounded-lg transition"
          >
            {copiedKey === 'all' ? <Check size={16} /> : <Copy size={16} />}
            {copiedKey === 'all' ? 'All details copied' : 'Copy all details'}
          </button>

          {/* AFTER PAYMENT */}
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-800">After you transfer</p>
            <p className="text-xs text-gray-600 mt-1">
              Email the following to{' '}
              <a href={`mailto:${CONTACT.email}`} className="text-[#1B7DB3] font-semibold hover:underline">
                {CONTACT.email}
              </a>
              :
            </p>
            <ul className="text-xs text-gray-600 space-y-1 mt-2 ml-4 list-disc">
              <li>Transaction receipt / proof of payment</li>
              <li>Amount transferred</li>
              <li>Vehicle ID or model</li>
              <li>Your full name and contact details</li>
            </ul>
          </div>

          {/* HELP */}
          <p className="text-xs text-gray-500 text-center">
            Need help? Call{' '}
            <a
              href={`tel:${CONTACT.phone.replace(/[^+\d]/g, '')}`}
              className="font-semibold text-gray-700 hover:underline"
            >
              {CONTACT.phone}
            </a>
          </p>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-[#29ABE2] hover:bg-[#1B7DB3] text-white font-semibold py-2.5 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}