export default function Modal({ isOpen, title, children, onClose, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel' }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-[#0A1628]/50 flex items-center justify-center z-[70] p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-2xl p-5 sm:p-6 max-w-md w-full">
        <h2 className="text-lg font-bold mb-3 text-[#0A1628]">{title}</h2>
        <div className="mb-5">{children}</div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="h-10 px-4 rounded-lg bg-[#29ABE2] text-sm font-semibold text-white hover:bg-[#1B7DB3] transition"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}