import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Landmark, Copy, Check, X, ShieldAlert, FileText } from 'lucide-react'
import { useNotification } from '../context/NotificationContext'
import { CONTACT, BANK_DETAILS, hasBankDetails } from '../constants/siteConfig'
import { ORDER_TERMS } from '../constants/stockOptions'

const PAYMENT_POINTS = [
  {
    title: 'Payment method',
    text: 'We accept payment by telegraphic transfer (T/T) to our bank account shown on your invoice.',
  },
  {
    title: 'Payment terms',
    text: 'The full amount must be paid before shipping starts. We arrange the shipping once our bank confirms that your full payment has arrived.',
  },
  {
    title: 'Currency',
    text: 'Payment is made in US dollars as shown on the invoice. If you want to pay in another currency, contact us after you receive your invoice and we will send you a revised invoice.',
  },
  {
    title: 'Proof of payment',
    text: 'After you pay, send us a copy of the payment with your invoice number or the vehicle stock number by email. We will tell you as soon as the payment is confirmed in our account.',
  },
  {
    title: 'Bank details',
    text: 'Our bank details are printed on your proforma invoice. Always check them with us before you send money.',
  },
]

const SHIPPING_POINTS = [
  'We arrange the shipping to your nearest port after your full payment is confirmed.',
  'The price on each car page is the FOB price. Use the Total Price Calculator to see the price with shipping, insurance and inspection to your port.',
  'When the vessel reaches your port, you are responsible for customs clearance, duties, registration and collecting the vehicle.',
  'Please check the import rules of your country for the vehicle before you buy.',
]

export default function PurchasingPage() {
  const [showBankModal, setShowBankModal] = useState(false)

  return (
    <div className="min-h-screen bg-[#F5F9FF]">

      {/* HERO */}
      <div className="bg-gradient-to-r from-[#29ABE2] to-[#1B7DB3] py-12 sm:py-14 px-4 text-center text-white">
        <h1 className="text-3xl md:text-4xl font-extrabold">Payment & Shipping</h1>
        <p className="text-white/85 mt-3 text-base md:text-lg">
          How payment works and how your vehicle reaches you
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-12 space-y-8 sm:space-y-10">

        {/* SECURITY NOTICE */}
        <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5">
          <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Security notice</p>
            <p className="text-sm text-amber-700 mt-1">
              Payment must be made by telegraphic transfer to the bank account written on your
              invoice. Before you send money, confirm the bank details with us by email or phone.
            </p>
          </div>
        </div>

        {/* PAYMENT */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">About Payments</h2>

          <div className="divide-y divide-gray-100">
            {PAYMENT_POINTS.map((p, i) => (
              <div key={p.title} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                <span className="w-8 h-8 shrink-0 rounded-full bg-[#29ABE2] text-white text-sm font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-800">{p.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">{p.text}</p>
                </div>
              </div>
            ))}
          </div>

          {hasBankDetails && (
            <button
              onClick={() => setShowBankModal(true)}
              className="mt-8 inline-flex items-center gap-2 bg-[#29ABE2] hover:bg-[#1B7DB3] text-white font-bold py-2.5 px-6 sm:px-8 rounded-lg transition"
            >
              <Landmark size={18} />
              View Bank Details
            </button>
          )}
        </section>

        {/* SHIPPING */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-5">Shipping & Delivery</h2>
          <ul className="space-y-3">
            {SHIPPING_POINTS.map((t) => (
              <li key={t} className="flex items-start gap-3 text-sm text-gray-600 leading-relaxed">
                <span className="text-[#29ABE2] font-bold mt-0.5">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </section>

        {/* TERMS */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sm:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#29ABE2]/10 flex items-center justify-center shrink-0">
              <FileText size={20} className="text-[#29ABE2]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Vehicle Purchase Agreement</h2>
          </div>

          <div className="space-y-3">
            {ORDER_TERMS.map((t, i) => (
              <p key={t.title} className="text-sm text-gray-600 leading-relaxed">
                <b className="text-gray-800">{String.fromCharCode(65 + i)}. {t.title}.</b> {t.body}
              </p>
            ))}
          </div>
        </section>

        {/* CALL TO ACTION */}
        <div className="text-center bg-white rounded-xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-800">Questions about payment or shipping?</h2>
          <p className="text-gray-500 text-sm mt-2">
            Read the FAQ or send us a message. Business hours: {CONTACT.hours}.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <Link
              to="/faq?v=3"
              className="bg-white border border-[#29ABE2] text-[#1B7DB3] hover:bg-blue-50 font-semibold px-8 py-3 rounded-lg transition"
            >
              Payment FAQ
            </Link>
            <Link
              to="/contact"
              className="bg-[#29ABE2] hover:bg-[#1B7DB3] text-white font-semibold px-8 py-3 rounded-lg transition"
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

          <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Verify before you pay</p>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                These details must match the bank details on your proforma invoice. If anything
                is different, contact us before you send money.
              </p>
            </div>
          </div>

          <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
            {BANK_DETAILS.map((detail) => {
              const copied = copiedKey === detail.label
              return (
                <div key={detail.label} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
                      {detail.label}
                    </p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5 break-words">
                      {detail.value}
                    </p>
                  </div>

                  <button
                    onClick={() => copyText(detail.label, detail.value, `${detail.label} copied!`)}
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

          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-800">After you transfer</p>
            <p className="text-xs text-gray-600 mt-1">
              Email a copy of the payment to{' '}
              <a href={`mailto:${CONTACT.email}`} className="text-[#1B7DB3] font-semibold hover:underline">
                {CONTACT.email}
              </a>{' '}
              with:
            </p>
            <ul className="text-xs text-gray-600 space-y-1 mt-2 ml-4 list-disc">
              <li>Your invoice number or the vehicle stock number</li>
              <li>The amount you transferred</li>
              <li>Your full name</li>
            </ul>
          </div>

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