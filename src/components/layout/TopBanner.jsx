import { useEffect, useState } from 'react'
import { Mail, Phone, Clock } from 'lucide-react'

/* ───────────────────────────────────────────────────────────
   EDIT THESE WITH THE CLIENT'S REAL DETAILS BEFORE LAUNCH
   (keep them the same as Footer, ContactPage and PurchasingPage)
─────────────────────────────────────────────────────────── */
const CONTACT = {
  email: 'info@captaintraders.jp',
  phone: '+81-6-0000-0000',
}

const getJapanTime = () =>
  new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  })

export default function TopBanner() {
  const [time, setTime] = useState(getJapanTime())

  useEffect(() => {
    const id = setInterval(() => setTime(getJapanTime()), 30000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="bg-[#29ABE2] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4 text-xs sm:text-[13px]">

        <p className="truncate font-medium">
          Welcome to Captain Traders JP
          <span className="hidden sm:inline text-white/80"> — Japanese Used Cars For Sale</span>
        </p>

        <div className="flex items-center gap-5 shrink-0">
          <span className="hidden lg:flex items-center gap-1.5 text-white/90">
            <Clock size={13} />
            Japan time {time}
          </span>

          <a
            href={`mailto:${CONTACT.email}`}
            className="hidden md:flex items-center gap-1.5 hover:underline"
          >
            <Mail size={13} />
            {CONTACT.email}
          </a>

          <a
            href={`tel:${CONTACT.phone.replace(/[^+\d]/g, '')}`}
            className="flex items-center gap-1.5 font-semibold hover:underline"
          >
            <Phone size={13} />
            {CONTACT.phone}
          </a>
        </div>
      </div>
    </div>
  )
}