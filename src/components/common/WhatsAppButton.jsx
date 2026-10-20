export default function WhatsAppButton() {
  const phoneNumber = "1234567890"
  const message = "Hello! I am interested in your cars. Please share details."
  const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`

  return (
    <div className="fixed bottom-6 right-6 z-50 group">
      {/* Tooltip */}
      <div className="absolute right-16 bottom-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
        <div className="bg-gray-800 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
          Chat with us on WhatsApp
          <div className="absolute right-[-5px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-800" />
        </div>
      </div>

      {/* Button */}
      <button
        onClick={() => window.open(url, "_blank")}
        aria-label="Chat with us on WhatsApp"
        className="relative w-14 h-14 bg-[#25D366] hover:bg-[#20c45c] rounded-full flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-110 active:scale-95"
      >
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25 pointer-events-none" />

        {/* Official WhatsApp logo SVG - exact brand path */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 175.216 175.552"
          className="w-8 h-8 relative z-10"
        >
          <path
            d="M87.184 0C39.17 0 0 39.17 0 87.184c0 15.169 3.932 29.896 11.444 42.89L.288 175.552l46.289-12.148A87.13 87.13 0 0 0 87.184 174.4c48.013 0 87.032-39.019 87.032-87.032S135.197 0 87.184 0"
            fill="white"
          />
          <path
            d="M87.184 159.704c-13.733 0-27.107-3.69-38.668-10.67l-2.774-1.646-28.747 7.547 7.652-28.067-1.803-2.878A72.17 72.17 0 0 1 15 87.184C15 47.456 47.456 15 87.184 15c39.728 0 72.032 32.304 72.032 72.032s-32.304 72.672-72.032 72.672"
            fill="#25D366"
          />
          <path
            d="M122.04 104.695c-1.876-.938-11.095-5.471-12.814-6.096-1.719-.625-2.97-.938-4.22.938-1.25 1.876-4.845 6.096-5.94 7.346-1.095 1.25-2.19 1.407-4.065.469-1.876-.938-7.92-2.92-15.083-9.31-5.573-4.972-9.335-11.107-10.43-12.983-1.095-1.876-.117-2.892.822-3.827.845-.84 1.876-2.19 2.814-3.284.938-1.095 1.25-1.876.625-2.97-.625-1.095-4.22-10.167-5.784-13.92-1.524-3.656-3.072-3.159-4.22-3.216-1.095-.054-2.345-.065-3.595-.065-1.25 0-3.284.469-5.003 2.345-1.72 1.876-6.565 6.409-6.565 15.63 0 9.22 6.721 18.128 7.659 19.378.938 1.25 13.22 20.19 32.037 28.315 4.479 1.933 7.973 3.086 10.695 3.95 4.494 1.428 8.585 1.228 11.82.744 3.607-.538 11.095-4.534 12.658-8.912 1.563-4.377 1.563-8.127.625-8.912-.625-.625-2.345-1.094-4.22-2.032"
            fill="white"
          />
        </svg>
      </button>
    </div>
  )
}